const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputSvg = path.join(__dirname, '../public/favicon.svg');
const outputDir = path.join(__dirname, '../public');

async function generateFavicon() {
    const svgBuffer = fs.readFileSync(inputSvg);
    
    // Gerar favicon.ico (32x32)
    await sharp(svgBuffer)
        .resize(32, 32)
        .png()
        .toFile(path.join(outputDir, 'favicon-32.png'));
    
    // Gerar favicon 16x16
    await sharp(svgBuffer)
        .resize(16, 16)
        .png()
        .toFile(path.join(outputDir, 'favicon-16.png'));
    
    console.log('✅ Favicons gerados: favicon-16.png e favicon-32.png');
    console.log('📝 Nota: Renomeie favicon-32.png para favicon.ico ou use um conversor online');
}

generateFavicon().catch(console.error);
