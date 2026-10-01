const fs = require('fs');
const path = '/Volumes/Drive/Projects/BitBucket/infi-commerce/frontend/src/components/core/modules/index.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace all standard imports with dynamic imports
content = content.replace(/import (\w+) from '(\.\/[\w\/]+)';/g, "const $1 = dynamic(() => import('$2'));");

// Add next/dynamic import if not present
if (!content.includes("import dynamic")) {
    content = content.replace("/**\n * Module Registry", "import dynamic from 'next/dynamic';\n\n/**\n * Module Registry");
}

fs.writeFileSync(path, content);
console.log('Done');
