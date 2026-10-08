const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, 'src', 'store', 'gameStore.ts');
let storeStr = fs.readFileSync(storePath, 'utf8');

// The RGB detector mistakenly tagged pure Gold (r=254, g=252, b=136) as 'ssr'
// Also, the fix_rarities.cjs tagged 1571, 5484, 9119, 9826, 9945 as 'ssr' blindly.
// We must revert these to 'rare' to replenish the rarePool.

const badIds = ['3306', '3350', '5836', '8400', '9400', '7877', '1571', '5484', '9119', '9826', '9945'];

for(const id of badIds) {
    const regex = new RegExp(`({ id: '${id}'.*? rarity:) 'ssr' }`, 'g');
    storeStr = storeStr.replace(regex, `$1 'rare' }`);
}

fs.writeFileSync(storePath, storeStr);
console.log('Restored rare cards!');
