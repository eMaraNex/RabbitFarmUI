// Run this script to generate icons from Lucide Rabbit icon
// Install dependencies: npm install canvas

const fs = require('fs');
const { createCanvas } = require('canvas');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Lucide Rabbit SVG path (simplified)
const rabbitSVGPath = `
  M12 2C10.34 2 9 3.34 9 5c0 1.1.6 2.05 1.5 2.6L10 9c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2l-.5-1.4c.9-.55 1.5-1.5 1.5-2.6 0-1.66-1.34-3-3-3zm-1 3c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1z
`;

// Function to create icon with rabbit symbol
function createRabbitIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background with rounded corners
    ctx.fillStyle = '#22c55e'; // Green farming theme
    ctx.fillRect(0, 0, size, size);

    // Add subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#22c55e');
    gradient.addColorStop(1, '#16a34a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Draw rabbit icon (simplified representation)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = size * 0.02;

    // Scale for different sizes
    const iconSize = size * 0.5;
    const offsetX = (size - iconSize) / 2;
    const offsetY = (size - iconSize) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(iconSize / 24, iconSize / 24);

    // Draw rabbit ears
    ctx.beginPath();
    ctx.ellipse(8, 6, 2, 6, 0, 0, 2 * Math.PI);
    ctx.ellipse(16, 6, 2, 6, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Draw rabbit head
    ctx.beginPath();
    ctx.arc(12, 12, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw rabbit body
    ctx.beginPath();
    ctx.ellipse(12, 20, 4, 6, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Draw eyes
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(10, 10, 1, 0, 2 * Math.PI);
    ctx.arc(14, 10, 1, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();

    return canvas.toBuffer('image/png');
}

// Generate all icon sizes
console.log('Generating PWA icons...');

// Create directory if it doesn't exist
if (!fs.existsSync('public/icons')) {
    fs.mkdirSync('public/icons', { recursive: true });
    console.log('Created public/icons directory');
}

sizes.forEach(size => {
    const iconBuffer = createRabbitIcon(size);
    const filename = `public/icons/icon-${size}x${size}.png`;

    fs.writeFileSync(filename, iconBuffer);
    console.log(`✓ Generated ${filename}`);
});

console.log('🎉 All icons generated successfully!');
console.log('Icons saved in: public/icons/');
console.log('You can now build and test your PWA!');