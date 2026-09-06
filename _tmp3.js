const fs = require('fs');
const path = require('path');
const dir = 'C:\\Users\\fabix\\Desktop\\anticheat\\assets\\_next\\static\\chunks';
const files = fs.readdirSync(dir);
// Search the bootstrapper chunk for the root mount (createRoot / hydrateRoot call sites)
for (const f of files) {
  const c = fs.readFileSync(path.join(dir, f), 'utf8');
  const i = c.search(/\.createRoot\(|hydrateRoot\(/);
  if (i > -1) {
    console.log('===', f, '===');
    console.log(c.slice(i - 400, i + 400).replace(/\n/g, '\n'));
    console.log();
  }
}