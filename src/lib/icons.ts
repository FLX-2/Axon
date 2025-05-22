// You can use this base64 encoded icon temporarily
const iconData = `
iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAABZklEQVR4nO2XMU7DQBBFZwk3gBsgcQTKFFwAKkoKJI7ADWiQKJBS0tBwAQpKGiQOkIYT0FBxA7gBvEgr2V5vbK8dKUX+0hSZ9f7n8c7YG8JqtVqtVvt3AewBZ8Az8Ah0wE5JfQNcAVOgT9LTHFeBfZH6O8A18OUE9QK0wGZG/QYwAp5d/RdwDmwV9Q+BDxP0DhgCG4n6BrgEPk39B3AAbOf0H5igKXBSEH4MPJn6d2A/p38PvJnFD0BVIKgB7tz6CdAUBPXAm1l8BVR5/WPgw0zXFQiqgLEJeqwLygk6M0GvdUEVMDJBL3VBFXBrgu7rgipgaIKe64KAM7N4AutrQT1wY4KSL6MCjszid2AQ0H9qgpKvowJ65psf1H9hgpKvpAJ64NoEJV/KKv1SZvUnX8wqvJxm9SdfTzP6i/6QmP6iP2Wmv+xfMtNf9k8pCFr+b1kQtPzvsiCIarVarVar/V1/P9QKk0mcH+IAAAAASUVORK5CYII=
`;

// Save this to a file using Node.js fs module
const fs = require('fs');
const path = require('path');

const iconPath = path.join(__dirname, '../../src-tauri/icons');
if (!fs.existsSync(iconPath)) {
    fs.mkdirSync(iconPath, { recursive: true });
}

const buffer = Buffer.from(iconData, 'base64');
fs.writeFileSync(path.join(iconPath, 'icon.ico'), buffer);
fs.writeFileSync(path.join(iconPath, 'icon.png'), buffer);
fs.writeFileSync(path.join(iconPath, '32x32.png'), buffer);
fs.writeFileSync(path.join(iconPath, '128x128.png'), buffer);
fs.writeFileSync(path.join(iconPath, '128x128@2x.png'), buffer);
fs.writeFileSync(path.join(iconPath, 'icon.icns'), buffer); 