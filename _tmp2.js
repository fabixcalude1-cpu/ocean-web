const fs = require('fs');
const body = fs.readFileSync('C:\\Users\\fabix\\Desktop\\anticheat\\assets\\dashboard.html', 'utf8');
const b = body.indexOf('<body');
console.log('<body at', b);
const bs = body.indexOf('>', b) + 1;
console.log('=== first 2500 chars after <body> ===');
console.log(body.slice(bs, bs + 2500));
