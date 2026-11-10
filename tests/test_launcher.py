import asyncio
from unittest import TestCase
from unittest.mock import AsyncMock, patch

import uvicorn

from launcher.start_app import APP_URL, AppServer


class LauncherTests(TestCase):
    def test_browser_opens_after_startup(self):
        server = AppServer(uvicorn.Config("src.main:app"))
        server.started = True
        with patch.object(uvicorn.Server, "startup", new_callable=AsyncMock):
            with patch("launcher.start_app.webbrowser.open", return_value=True) as browser:
                asyncio.run(server.startup())

        browser.assert_called_once_with(APP_URL)

    def test_browser_is_not_opened_if_startup_fails(self):
        server = AppServer(uvicorn.Config("src.main:app"))
        with patch.object(uvicorn.Server, "startup", new_callable=AsyncMock):
            with patch("launcher.start_app.webbrowser.open") as browser:
                asyncio.run(server.startup())

        browser.assert_not_called()

    def test_browser_failure_reports_manual_url(self):
        server = AppServer(uvicorn.Config("src.main:app"))
        server.started = True
        with patch.object(uvicorn.Server, "startup", new_callable=AsyncMock):
            with patch("launcher.start_app.webbrowser.open", return_value=False):
                with patch("sys.stderr") as stderr:
                    asyncio.run(server.startup())

        self.assertIn(APP_URL, "".join(call.args[0] for call in stderr.write.call_args_list))
