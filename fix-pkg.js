const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('ATS-server/package.json', 'utf8').replace(/<<<<<<< HEAD[\s\S]*?=======/g, '').replace(/>>>>>>> origin\/Rishu/g, ''));
fs.writeFileSync('ATS-server/package.json', JSON.stringify(pkg, null, 2));
