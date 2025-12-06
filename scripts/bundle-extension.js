const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const EXTENSION_DIR = path.join(__dirname, '../../extension');
const OUTPUT_DIR = path.join(__dirname, '../public');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'highlight-extension.zip');

// Ensure public directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const output = fs.createWriteStream(OUTPUT_FILE);
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('✅ Extension bundled successfully to: ' + OUTPUT_FILE);
});

archive.on('error', function (err) {
    throw err;
});

archive.pipe(output);

// Append files from extension directory, putting them at the root of the zip
archive.directory(EXTENSION_DIR, false);

archive.finalize();
