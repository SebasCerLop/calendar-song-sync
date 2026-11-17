const fs = require('node:fs');
const path = require('node:path');

const distDirectory = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(distDirectory, 'index.html');
const index = fs.readFileSync(indexPath, 'utf8');

const pageIndex = index
  .replace(/href="\//g, 'href="./')
  .replace(/src="\//g, 'src="./');

fs.writeFileSync(indexPath, pageIndex);
fs.writeFileSync(path.join(distDirectory, '.nojekyll'), '');
