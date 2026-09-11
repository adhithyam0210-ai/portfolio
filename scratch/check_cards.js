const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const regex = /<div[^>]*class=["'][^"']*(?:card|box|form)[^"']*["'][^>]*>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log(match[0]);
}
