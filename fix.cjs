const fs = require('fs');
const content = fs.readFileSync('src/store/gameStore.ts', 'utf8');
const lines = content.split('\n');
const dupIdx = lines.findIndex((line, index) => index > 0 && line.includes("import { create } from 'zustand';"));
if (dupIdx !== -1) {
    console.log(`Found duplicate start at line ${dupIdx}. Slicing array.`);
    const newLines = lines.slice(dupIdx);
    fs.writeFileSync('src/store/gameStore.ts', newLines.join('\n'));
} else {
    console.log("No duplicate found.");
}
