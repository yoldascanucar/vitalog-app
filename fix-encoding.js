const fs = require('fs');
const path = '.env.local';

try {
    // Read as UTF-16 Little Endian (common Windows encoding for 'Unicode')
    const content = fs.readFileSync(path, 'utf16le');

    // Check if it looks right (has 'NEXT_PUBLIC')
    if (content.includes('NEXT_PUBLIC')) {
        // Write back as UTF-8
        fs.writeFileSync(path, content, 'utf8');
        console.log('Successfully converted .env.local from UTF-16LE to UTF-8');
    } else {
        console.log('Content did not look like UTF-16LE or was already broken. Aborting to be safe.');
        // Fallback: try reading as utf8 and see if it has null bytes
        const raw = fs.readFileSync(path);
        if (raw.indexOf(0x00) !== -1) {
            console.log('Detected null bytes, forcing rewrite assuming UTF-16LE structure.');
            // Strip BOM if present (first 2 bytes)
            const clean = raw.toString('utf16le').replace(/^\uFEFF/, '');
            fs.writeFileSync(path, clean, 'utf8');
            console.log('Forced conversion completed.');
        }
    }
} catch (e) {
    console.error('Error fixing encoding:', e);
}
