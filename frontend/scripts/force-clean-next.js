const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = path.resolve(__dirname, '..', '.next');


(async () => {

  try {
    if (fs.existsSync(target)) {
      // Try Node.js fs.rm first (fastest)
      try {
        await fs.promises.rm(target, { recursive: true, force: true });
        console.log('Removed .next');
      } catch (err) {
        // Fallback to shell rm -rf for stubborn turbopack cache files
        console.warn('fs.rm failed, falling back to rm -rf:', err.message);
        execSync(`rm -rf "${target}"`, { stdio: 'pipe' });
        console.log('Removed .next (via rm -rf)');
      }
    } else {
      console.log('.next not found');
    }
  } catch (err) {
    console.error('Failed to remove .next:', err);
    process.exit(1);
  }
})();
