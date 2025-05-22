const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const size = 256;
const backgroundColor = '#000000';
const textColor = '#ffffff';

async function createIcon() {
    const svg = `
        <svg width="${size}" height="${size}">
            <rect width="100%" height="100%" fill="${backgroundColor}"/>
            <text x="50%" y="50%" font-family="Arial" font-size="128" 
                  fill="${textColor}" text-anchor="middle" dominant-baseline="middle">
                AH
            </text>
        </svg>
    `;

    const iconPath = path.join(__dirname, '../src-tauri/icons');
    if (!fs.existsSync(iconPath)) {
        fs.mkdirSync(iconPath, { recursive: true });
    }

    // Create PNG files
    await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(iconPath, 'icon.png'));

    // Create different sizes
    const sizes = [32, 128, 256];
    for (const size of sizes) {
        await sharp(Buffer.from(svg))
            .resize(size, size)
            .png()
            .toFile(path.join(iconPath, `${size}x${size}.png`));
    }

    // Copy for other required files
    fs.copyFileSync(
        path.join(iconPath, '128x128.png'),
        path.join(iconPath, '128x128@2x.png')
    );
    fs.copyFileSync(
        path.join(iconPath, 'icon.png'),
        path.join(iconPath, 'icon.ico')
    );
    fs.copyFileSync(
        path.join(iconPath, 'icon.png'),
        path.join(iconPath, 'icon.icns')
    );
}

createIcon().catch(console.error); 