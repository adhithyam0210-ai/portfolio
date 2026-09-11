const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const lines = html.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('background') || line.includes('bg-')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
