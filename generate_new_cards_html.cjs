const fs = require('fs');

const path = 'c:/Users/jtc_p/Desktop/game/cardfront';
const oldIds = ['1403', '2119', '2604', '3350', '3502', '4309', '5823', '6405', '6414', '7157', '7730', '7785', '7824', '7877', '8579', '9228'];

const files = fs.readdirSync(path).filter(f => f.endsWith('.png'));
const newFiles = files.filter(f => !oldIds.some(id => f.includes(id)));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>View New Cards</title>
    <style>
        body { display: flex; flex-wrap: wrap; gap: 20px; background: #333; color: white; }
        .card { display: flex; flex-direction: column; align-items: center; }
        img { width: 200px; height: auto; }
    </style>
</head>
<body>
    ${newFiles.map(f => `<div class="card"><img src="cardfront/${f}" /><p>${f}</p></div>`).join('\n    ')}
</body>
</html>`;

fs.writeFileSync('c:/Users/jtc_p/Desktop/game/view_new_cards.html', html);
console.log('Generated view_new_cards.html with ' + newFiles.length + ' cards.');
