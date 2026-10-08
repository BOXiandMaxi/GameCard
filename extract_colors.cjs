const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp') || require('jimp');

const cardsDir = path.join(__dirname, 'public', 'cards', 'cardfront');
const cardFiles = fs.readdirSync(cardsDir).filter(f => f.startsWith('card') && f.endsWith('.png'));

function getElement(r, g, b) {
    if (r > 200 && g > 200 && b > 200) return 'light';
    if (r > 200 && g > 150 && b < 100) return 'light'; // golden
    if (r > 150 && b > 150 && g < 100) return 'dark'; // purple
    if (r < 100 && g < 100 && b < 100) return 'dark';
    if (b > r && b > g + 20) return 'water';
    if (g > r + 30 && b > r + 30) return 'wind'; // cyan
    if (g > r && g > b) return 'earth';
    if (r > b + 50 && r > g + 20) return 'fire';

    // Fallbacks
    if (r > 180 && g > 180) return 'light'; // yellow
    return 'earth';
}

async function extractAll() {
    const results = {};
    console.log(`Found ${cardFiles.length} cards. Extracting by color...`);

    for (const file of cardFiles) {
        const id = file.replace('card', '').replace('.png', '');
        const imagePath = path.join(cardsDir, file);

        try {
            // Depending on jimp version
            const image = require('jimp').read ? await require('jimp').read(imagePath) : await Jimp.read(imagePath);

            let r = 0, g = 0, b = 0, count = 0;

            for (let x = 30; x < 50; x++) {
                for (let y = 30; y < 50; y++) {
                    const hex = image.getPixelColor(x, y);
                    // RGBA bitshift
                    const pr = (hex >> 24) & 255;
                    const pg = (hex >> 16) & 255;
                    const pb = (hex >> 8) & 255;
                    r += pr;
                    g += pg;
                    b += pb;
                    count++;
                }
            }

            r /= count; g /= count; b /= count;
            const element = getElement(r, g, b);
            results[id] = element;
        } catch (e) {
            console.error(`Error on ${file}:`, e.message);
            results[id] = 'unknown';
        }
    }

    fs.writeFileSync(path.join(__dirname, 'elements_color.json'), JSON.stringify(results, null, 2));
    console.log('Done! Wrote to elements_color.json');
}

extractAll();
