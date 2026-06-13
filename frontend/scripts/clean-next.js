const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '..', '.next');

(async () => {
  try {
    if (fs.existsSync(target)) {
      await fs.promises.rm(target, { recursive: true, force: true });
      console.log('Removed .next');
    } else {
      console.log('.next not found');
    }
  } catch (err) {
    console.error('Failed to remove .next:', err);
    process.exit(1);
  }
})();
