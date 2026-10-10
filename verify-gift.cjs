// Optional validation of an exported gift without uploading its contents.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const file=process.argv[2];
if(!file)throw new Error('Provide the path to an exported HTML gift.');
const html=fs.readFileSync(file,'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(scripts.length,2);scripts.forEach(source=>new vm.Script(source));
assert.ok(html.includes('window.RECEIPT_GIFT=true'));
assert.ok(html.includes('data:image/jpeg;base64,'));
console.log('PASS: downloaded gift has two valid inline scripts, recipient mode and embedded photographs.');
