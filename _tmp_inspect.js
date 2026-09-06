const fs = require('fs');
const h = fs.readFileSync('C:\\Users\\fabix\\Desktop\\anticheat\\assets\\dashboard.html', 'utf8');
console.log('=== tail around 400990 ===');
console.log(h.slice(400990, 400990 + 2500));
console.log('\n=== div id patterns ===');
const re = /<div[^>]*id="[^"]*"[^>]*>/g;
let m, n = 0;
while ((m = re.exec(h)) && n < 15) {
  console.log(m.index, m[0].slice(0, 120));
  n++;
}
