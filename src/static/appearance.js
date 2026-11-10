"use strict";

(() => {
  const storageKey = "calendar-song-sync-appearance";
  const themes = new Set(["sage", "ocean", "rose", "midnight"]);
  const backgrounds = new Set(["plain", "gradient", "image"]);
  const imageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
  const imagePattern = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
  const maxBytes = 1024 * 1024;
  const fileInput = document.getElementById("background-image");
  const status = document.getElementById("appearance-status");
  const imageOption = document.querySelector('input[name="background"][value="image"]');
  const removeButton = document.getElementById("remove-image");
  let appearance = {theme: "sage", background: "plain", image: ""};
  let uploadId = 0;

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("error", isError);
  }

  function apply() {
    document.documentElement.dataset.theme = appearance.theme;
    document.documentElement.dataset.background = appearance.background;
    document.documentElement.style.setProperty(
      "--custom-background",
      appearance.image ? `url("${appearance.image}")` : "none"
    );
    document.querySelector(`input[name="theme"][value="${appearance.theme}"]`).checked = true;
    document.querySelector(`input[name="background"][value="${appearance.background}"]`).checked = true;
    imageOption.disabled = !appearance.image;
    removeButton.disabled = !appearance.image;
  }

  function save(next) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (error) {
      showStatus("Could not save your appearance settings. Check browser storage or try a smaller image.", true);
      return false;
    }
    appearance = next;
    apply();
    return true;
  }

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (stored && typeof stored === "object") {
      const image = typeof stored.image === "string" && imagePattern.test(stored.image) ? stored.image : "";
      appearance = {
        theme: themes.has(stored.theme) ? stored.theme : "sage",
        background: backgrounds.has(stored.background) && (stored.background !== "image" || image)
          ? stored.background : "plain",
        image
      };
    }
  } catch (error) {
    showStatus("Saved appearance settings could not be loaded. Choose your preferences again.", true);
  }
  apply();

  document.querySelectorAll('input[name="theme"]').forEach(input => {
    input.addEventListener("change", () => {
      if (save({...appearance, theme: input.value})) showStatus("Theme saved.");
      else apply();
    });
  });
  document.querySelectorAll('input[name="background"]').forEach(input => {
    input.addEventListener("change", () => {
      if (save({...appearance, background: input.value})) showStatus("Background saved.");
      else apply();
    });
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    const id = ++uploadId;
    if (!file) return;
    if (!imageTypes.has(file.type) || file.size > maxBytes || file.size === 0) {
      showStatus("Choose a PNG, JPEG or WebP image no larger than 1 MB.", true);
      fileInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => {
      if (id === uploadId) showStatus("Could not read the image. Please try another file.", true);
    };
    reader.onload = () => {
      if (id !== uploadId) return;
      const data = reader.result;
      if (typeof data !== "string" || !imagePattern.test(data)) {
        showStatus("That file could not be used as an image.", true);
        return;
      }
      const image = new Image();
      image.onload = () => {
        if (id !== uploadId) return;
        if (save({...appearance, image: data, background: "image"})) showStatus("Background image saved in this browser.");
      };
      image.onerror = () => {
        if (id === uploadId) showStatus("That file is not a valid image. Please choose another.", true);
      };
      image.src = data;
    };
    reader.readAsDataURL(file);
    fileInput.value = "";
  });

  removeButton.addEventListener("click", () => {
    uploadId++;
    const next = {...appearance, image: "", background: appearance.background === "image" ? "plain" : appearance.background};
    if (save(next)) showStatus("Background image removed.");
  });
})();
