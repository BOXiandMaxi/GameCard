const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp') || require('jimp');

const cardsDir = path.join(__dirname, 'public', 'cards', 'cardfront');
const cardFiles = fs.readdirSync(cardsDir).filter(f => f.startsWith('card') && f.endsWith('.png'));

async function checkColors() {
    console.log("Card | R | G | B");
    for (const file of cardFiles) {
        const id = file.replace('card', '').replace('.png', '');
        const imagePath = path.join(cardsDir, file);
        try {
            const image = require('jimp').read ? await require('jimp').read(imagePath) : await Jimp.read(imagePath);
            let r = 0, g = 0, b = 0, count = 0;
            for (let x = 30; x < 50; x++) {
                for (let y = 30; y < 50; y++) {
                    const hex = image.getPixelColor(x, y);
                    r += (hex >> 24) & 255;
                    g += (hex >> 16) & 255;
                    b += (hex >> 8) & 255;
                    count++;
                }
            }
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            console.log(`${id} | ${r} | ${g} | ${b}`);
        } catch (e) { }
    }
}
checkColors();
