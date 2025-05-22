const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createIcons() {
    const sizes = [16, 32, 48, 64, 128, 256];
    const pngBuffers = await Promise.all(
        sizes.map(size => 
            sharp(path.join(__dirname, '../src/assets/icon.png'))
                .resize(size, size)
                .toBuffer()
        )
    );

    const ico = await toIco(pngBuffers);
    
    const iconPath = path.join(__dirname, '../src-tauri/icons');
    if (!fs.existsSync(iconPath)) {
        fs.mkdirSync(iconPath, { recursive: true });
    }

    fs.writeFileSync(path.join(iconPath, 'icon.ico'), ico);
    fs.writeFileSync(path.join(iconPath, 'icon.png'), pngBuffers[pngBuffers.length - 1]);
    
    // Create other required sizes
    fs.writeFileSync(path.join(iconPath, '32x32.png'), pngBuffers[1]);
    fs.writeFileSync(path.join(iconPath, '128x128.png'), pngBuffers[4]);
    fs.writeFileSync(path.join(iconPath, '128x128@2x.png'), pngBuffers[5]);
    fs.writeFileSync(path.join(iconPath, 'icon.icns'), pngBuffers[5]);
}

createIcons().catch(console.error); 