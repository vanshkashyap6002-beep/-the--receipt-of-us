const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = __dirname;
const files = ['index.html','css/styles.css','js/config.js','js/app.js'];
for (const file of files) {
  const source = path.join(root,file);
  if(file.endsWith('.js')) new vm.Script(fs.readFileSync(source,'utf8'),{filename:file});
  const destination = path.join(root,'dist',file);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(source,destination);
}
const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
for(const [,asset] of html.matchAll(/(?:src|href)="((?:css|js)\/[^\"]+)"/g)) {
  if(!fs.existsSync(path.join(root,'dist',asset))) throw new Error(`Missing asset: ${asset}`);
}
console.log('Built The Receipt of Us: 4 static files in dist. JavaScript syntax and local entry assets verified.');
