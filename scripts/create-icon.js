import sharp from 'sharp';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import toIco from 'to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

    const iconPath = join(__dirname, '../src-tauri/icons');
    if (!fs.existsSync(iconPath)) {
        fs.mkdirSync(iconPath, { recursive: true });
    }

    // Create PNG files for different sizes
    const pngBuffers = await Promise.all([16, 32, 48, 64, 128, 256].map(size => 
        sharp(Buffer.from(svg))
            .resize(size, size)
            .png()
            .toBuffer()
    ));

    // Save individual PNGs
    await sharp(pngBuffers[1]).toFile(join(iconPath, '32x32.png'));
    await sharp(pngBuffers[4]).toFile(join(iconPath, '128x128.png'));
    await sharp(pngBuffers[5]).toFile(join(iconPath, 'icon.png'));
    
    // Create @2x version
    fs.copyFileSync(join(iconPath, '128x128.png'), join(iconPath, '128x128@2x.png'));
    
    // Create ICO file with multiple sizes
    const icoBuffer = await toIco(pngBuffers);
    fs.writeFileSync(join(iconPath, 'icon.ico'), icoBuffer);
    
    // Create ICNS (for macOS)
    fs.copyFileSync(join(iconPath, 'icon.png'), join(iconPath, 'icon.icns'));
}

createIcon().catch(console.error); 