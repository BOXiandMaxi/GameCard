const fs = require('fs');
const path = require('path');
const tesseract = require('tesseract.js');
const { Jimp } = require('jimp');

const cardsDir = path.join(__dirname, 'public', 'cards', 'cardfront');
const cardFiles = fs.readdirSync(cardsDir).filter(f => f.startsWith('card') && f.endsWith('.png'));

async function extractAll() {
    const results = [];
    console.log(`Found ${cardFiles.length} cards. Starting extraction with cropping...`);

    const worker = await tesseract.createWorker('eng');

    for (const file of cardFiles) {
        const id = file.replace('card', '').replace('.png', '');
        const imagePath = path.join(cardsDir, file);

        try {
            // Load with Jimp
            const image = await Jimp.read(imagePath);
            const w = image.bitmap.width;
            const h = image.bitmap.height;

            // The text "Power: Earth 100" or similar is at the bottom right/center
            // Let's crop the bottom 15%
            const cropH = Math.floor(h * 0.15);
            const cropY = h - cropH;

            image.crop({ x: 0, y: cropY, w, h: cropH });

            // Greyscale and increase contrast to help OCR
            image.greyscale();
            image.contrast(0.5);

            const buffer = await image.getBuffer('image/png');

            const { data: { text } } = await worker.recognize(buffer);
            const lowerText = text.toLowerCase();

            let element = 'unknown';
            if (lowerText.includes('fire')) element = 'fire';
            else if (lowerText.includes('water')) element = 'water';
            else if (lowerText.includes('earth')) element = 'earth';
            else if (lowerText.includes('wind')) element = 'wind';
            else if (lowerText.includes('light')) element = 'light';
            else if (lowerText.includes('dark')) element = 'dark';

            console.log(`Card ${id}: matched element '${element}' from text: "${text.trim()}"`);
            results.push({ id, element });
        } catch (e) {
            console.error(`Error on ${file}:`, e.message);
            results.push({ id, element: 'unknown' });
        }
    }

    await worker.terminate();

    fs.writeFileSync(path.join(__dirname, 'elements_output.json'), JSON.stringify(results, null, 2));
    console.log('Done! Wrote to elements_output.json');
}

extractAll();
