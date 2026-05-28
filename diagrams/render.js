const fs = require('fs');
const path = require('path');
const encoder = require('plantuml-encoder');

const srcDir = path.join(__dirname, 'src');
const outDir = path.join(__dirname, 'out');
const server = 'https://www.plantuml.com/plantuml/png/';

(async () => {
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.puml')).sort();
  for (const file of files) {
    const full = path.join(srcDir, file);
    const text = fs.readFileSync(full, 'utf8');
    const encoded = encoder.encode(text);
    const url = server + encoded;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed ${file}: ${res.status} ${res.statusText}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const outName = file.replace(/\.puml$/i, '.png');
    fs.writeFileSync(path.join(outDir, outName), buf);
    console.log(`Rendered ${outName}`);
  }
})();
