const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, 'src', 'store', 'gameStore.ts');
let storeStr = fs.readFileSync(storePath, 'utf8');

const objArrMatch = storeStr.match(/const ALL_CARDS: CardData\[\] = \[\s+([\s\S]*?)\s+\];/);
if(!objArrMatch) process.exit(1);

const cards = [];
const lines = objArrMatch[1].split('\n');
for(const l of lines) {
    const idMatch = l.match(/id:\s*'(\d+)'/);
    const powerMatch = l.match(/power:\s*(\d+)/);
    const rarityMatch = l.match(/rarity:\s*'([a-z]+)'/);
    if(powerMatch) {
       const power = parseInt(powerMatch[1]);
       const explicitRarity = rarityMatch ? rarityMatch[1] : null;
       
       let calcRarity = 'normal';
       if (power >= 95) calcRarity = 'ssr';
       else if (power >= 80) calcRarity = 'rare';
       else if (power >= 50) calcRarity = 'uncommon';
       
       const effective = explicitRarity || calcRarity;
       cards.push(effective);
    }
}

const map = { ssr: 0, rare: 0, uncommon: 0, normal: 0 };
for(const c of cards) {
    if(map[c] !== undefined) map[c]++;
    else console.log('Unknown rarity:', c);
}

console.log('Pool counts:', map);
