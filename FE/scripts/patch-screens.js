const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) replaceInDir(full);
    else if (dirent.name.endsWith('.ts')) {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes('React.ComponentRef')) {
        content = content.replace(/React\.ComponentRef/g, 'React.ElementRef');
        fs.writeFileSync(full, content, 'utf8');
      }
    }
  });
}

const fabricDir = path.resolve(__dirname, '../node_modules/react-native-screens/src/fabric');
replaceInDir(fabricDir);
console.log('Successfully patched react-native-screens for Fabric Codegen');
