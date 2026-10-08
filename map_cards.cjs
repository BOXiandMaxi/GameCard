const fs = require('fs');

const data = `1346 | 167 | 6 | 3
1403 | 66 | 94 | 205
1755 | 167 | 12 | 8
2005 | 1 | 152 | 54
2119 | 60 | 39 | 74
2169 | 140 | 183 | 225
2228 | 67 | 97 | 204
2581 | 66 | 94 | 205
2604 | 140 | 183 | 225
2705 | 66 | 94 | 205
2957 | 140 | 183 | 225
3284 | 1 | 155 | 56
3306 | 167 | 6 | 3
3350 | 140 | 183 | 225
3502 | 1 | 152 | 54
3805 | 60 | 39 | 74
4068 | 134 | 180 | 223
4190 | 66 | 94 | 205
4309 | 1 | 152 | 54
4331 | 66 | 94 | 205
4650 | 167 | 12 | 8
4837 | 134 | 180 | 223
4847 | 60 | 39 | 74
5268 | 140 | 183 | 225
5463 | 167 | 6 | 3
5533 | 134 | 180 | 223
5668 | 140 | 183 | 225
5788 | 66 | 94 | 205
5802 | 67 | 97 | 204
5809 | 140 | 183 | 225
5823 | 140 | 183 | 225
5836 | 167 | 12 | 8
6233 | 1 | 152 | 54
6269 | 60 | 39 | 74
6405 | 1 | 152 | 54
6414 | 140 | 183 | 225
6464 | 67 | 97 | 204
6535 | 140 | 183 | 225
6788 | 66 | 94 | 205
6997 | 134 | 180 | 223
7157 | 1 | 152 | 54
7324 | 66 | 94 | 205
7730 | 167 | 12 | 8
7785 | 66 | 94 | 205
7815 | 167 | 12 | 8
7824 | 165 | 153 | 142
7877 | 140 | 183 | 225
7917 | 167 | 12 | 8
8023 | 1 | 155 | 56
8312 | 1 | 152 | 54
8400 | 164 | 153 | 142
8579 | 134 | 180 | 223
8605 | 66 | 94 | 205
8865 | 67 | 97 | 204
8904 | 1 | 152 | 54
9013 | 167 | 12 | 8
9228 | 165 | 153 | 142
9230 | 1 | 152 | 54
9284 | 140 | 183 | 225
9331 | 1 | 152 | 54
9342 | 1 | 152 | 54
9400 | 134 | 180 | 223
9422 | 167 | 6 | 3
9706 | 66 | 94 | 205
9795 | 1 | 155 | 56`;

const lines = data.split('\n');

// Read existing ALL_CARDS to grab powers
const storeStr = fs.readFileSync('./src/store/gameStore.ts', 'utf-8');
const objArrMatch = storeStr.match(/const ALL_CARDS: CardData\[\] = \[\s+([\s\S]*?)\s+\];/)[1];
const oldLines = objArrMatch.split('\n');
const powers = {};
oldLines.forEach(l => {
    const pMatch = l.match(/power:\s*(\d+)/);
    const idMatch = l.match(/id:\s*'(\d+)'/);
    if (pMatch && idMatch) powers[idMatch[1]] = parseInt(pMatch[1]);
});


let out = `const ALL_CARDS: CardData[] = [\n`;
let i = 0;
lines.forEach(line => {
    const parts = line.split('|').map(x => x.trim());
    const id = parts[0];
    const r = parseInt(parts[1]);
    const g = parseInt(parts[2]);
    const b = parseInt(parts[3]);
    let element = '';

    if (r > 150 && b < 50) element = 'fire';
    else if (g > 130 && r < 50) element = 'earth';
    else if (r < 100 && g < 50) element = 'dark';
    else if (r < 100 && b > 180) element = 'water';
    else if (r > 100 && b >= 200) element = 'wind';
    else if (r > 150 && g > 140 && b > 130) element = 'light';
    else element = 'unknown';

    const p = powers[id] || 50;

    out += `    { id: '${id}', image: '/cards/cardfront/card${id}.png', power: ${p}, element: '${element}' }`;
    if (i < lines.length - 1) out += ',\n';
    else out += '\n';
    i++;
});
out += `];`;

fs.writeFileSync('generated_cards.txt', out);
console.log('done');
