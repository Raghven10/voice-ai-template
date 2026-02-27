
const fs = require('fs');
const path = 'node_modules/@livekit/agents/package.json';

try {
    const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));

    // Fix require exports
    if (pkg.exports && pkg.exports.require) {
        console.log('Old require exports:', pkg.exports.require);
        pkg.exports.require = {
            "types": "./dist/index.d.cts",
            "default": "./dist/index.cjs"
        };
        console.log('New require exports:', pkg.exports.require);
    }

    // Also fix root require if present
    if (pkg.require === "dist/index.cjs") {
        // This was correct in the file I read later? No, wait.
        // In Step 1428: "require": "dist/index.cjs" <-- this is top level, custom field?
        // Node uses "main" for CJS usually if exports not present/matched.
        // But "exports" takes precedence.
    }

    fs.writeFileSync(path, JSON.stringify(pkg, null, 2));
    console.log('Patched package.json successfully.');
} catch (e) {
    console.error('Failed to patch:', e);
}
