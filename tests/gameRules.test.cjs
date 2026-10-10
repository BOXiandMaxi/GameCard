// Run with node tests/gameRules.test.cjs. Uses installed dependencies only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(file, stubs = {}) {
    const filename = path.resolve(__dirname, '..', file);
    const out = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        fileName: file, reportDiagnostics: true,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
    });
    assert.equal(out.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, file);
    const loaded = new Module(filename, module);
    loaded.filename = filename;
    loaded.paths = Module._nodeModulePaths(path.dirname(filename));
    const base = loaded.require.bind(loaded);
    loaded.require = id => Object.hasOwn(stubs, id) ? stubs[id] : base(id);
    loaded._compile(out.outputText, filename);
    return loaded.exports;
}
const real = load('src/store/gameStore.ts');
const { calculateRound, getCardManaCost, ALL_CARDS, useGameStore: store } = real;
const originalCards = JSON.stringify(ALL_CARDS);
const card = (power, skill = 'none', element = 'fire') => ({ id: `${power}-${skill}-${element}`, image: 'test', power, skill, element });
const calc = (p, b, options = {}) => calculateRound({ playerCard: p, botCard: b, field: null, ...options });
function reset(overrides = {}) {
    store.getState().initGame();
    store.setState({ phase: 'select', playerHand: [card(40), card(40)], botHand: [card(40), card(40)],
        playerMana: 3, botMana: 3, fieldTurns: [], ...overrides });
}
function resolve(p, b, overrides = {}) {
    reset({ phase: 'resolve', boardPlayerCard: p, boardBotCard: b, ...overrides });
    store.getState().resolveRound();
    return store.getState();
}
let cases = 0;
function check(name, test) { test(); cases++; console.log('PASS ' + name); }

check('elements affect unequal power, all cyclic edges, light/dark neutral mutually', () => {
    for (const [own, enemy] of [['water', 'fire'], ['fire', 'earth'], ['earth', 'wind'], ['wind', 'water']]) {
        const r = calc(card(40, 'none', own), card(50, 'none', enemy));
        assert.equal(r.pp, 60); assert.equal(r.bp, 50); assert.equal(r.pDirect, 10);
    }
    for (const absolute of ['light', 'dark']) for (const basic of ['fire', 'water', 'earth', 'wind']) {
        assert.equal(calc(card(40, 'none', absolute), card(40, 'none', basic)).pp, 50);
    }
    assert.equal(calc(card(40, 'none', 'light'), card(40, 'none', 'dark')).winner, 'draw');
});
check('final tie uses direct ten each without a second elemental tiebreak', () => {
    const r = calc(card(40, 'none', 'water'), card(60));
    assert.equal(r.pp, r.bp); assert.equal(r.winner, 'draw'); assert.equal(r.pDirect, 10); assert.equal(r.bDirect, 10);
});
check('Gamble capped partial steal uses post-bonus power; dual success cancels', () => {
    const r = calc(card(17, 'gamble'), card(100), { playerGuess: 'fire' });
    assert.equal(r.pp, 47); assert.equal(r.bp, 70); assert.equal(r.pAbsorbed, 30);
    const dual = calc(card(17, 'gamble'), card(49, 'gamble', 'water'), { playerGuess: 'water', botGuess: 'fire' });
    assert.equal(dual.pp, 17); assert.equal(dual.bp, 69); assert.equal(dual.pAbsorbed, 0); assert.equal(dual.bAbsorbed, 0);
    const field = calc(card(17, 'gamble'), card(20, 'none', 'earth'), { field: 'earth', playerGuess: 'earth' });
    assert.equal(field.pAbsorbed, 22); // half of enemy 20 + field 25, rounded down
    assert.equal(calc(card(17, 'gamble'), card(100), { playerGuess: 'water' }).pp, 17);
    assert.equal(calc(card(17, 'gamble'), card(100), { playerGuess: 'fire', playerSilenced: true }).pp, 17);
});
check('No Mana power penalty, nominal silenced price, invalid/stale selection rejected', () => {
    const free = card(88, 'no_mana');
    assert.equal(getCardManaCost(free), 0); assert.equal(getCardManaCost(free, true), 3);
    assert.equal(calc(free, card(20)).pp, 73); assert.equal(calc(free, card(20), { playerSilenced: true }).pp, 88);
    assert.equal(calc(card(10, 'no_mana'), card(20)).pp, 0);
    reset({ playerHand: [free], playerMana: 0, playerSilenced: true });
    store.getState().selectCard(0); assert.equal(store.getState().playerSelectedCardIndex, null);
    for (const index of [-1, 100, 0.5]) { store.getState().selectCard(index); assert.equal(store.getState().playerSelectedCardIndex, null); }
    store.setState({ playerSelectedCardIndex: 0 }); const before = store.getState(); store.getState().playTurn(); assert.equal(store.getState(), before);
    reset({ playerHand: [free], playerMana: 0 }); store.getState().selectCard(0); store.getState().playTurn();
    assert.equal(store.getState().boardPlayerManaCost, 0); assert.equal(store.getState().phase, 'reveal');
});
check('Soul Swap price eight, active swap, silenced nominal cost and no swap', () => {
    const swap = card(100, 'soul_swap');
    assert.equal(getCardManaCost(swap), 8); assert.equal(getCardManaCost(swap, true), 4);
    const s = resolve(swap, card(100), { playerHP: 80, botHP: 40 });
    assert.equal(s.playerHP, 30); assert.equal(s.botHP, 70);
    const blocked = resolve(swap, card(100), { playerHP: 80, botHP: 40, playerSilenced: true });
    assert.equal(blocked.playerHP, 70); assert.equal(blocked.botHP, 30);
    reset({ playerHand: [swap], playerMana: 8 }); store.getState().selectCard(0); store.getState().playTurn();
    assert.equal(store.getState().playerMana, 0); assert.equal(store.getState().boardPlayerManaCost, 8);
});
check('Mimic never weakens and copies raw enemy only up to fifteen', () => {
    assert.equal(calc(card(100, 'mimic'), card(21)).pp, 100);
    assert.equal(calc(card(95, 'mimic'), card(100)).pp, 100);
    assert.equal(calc(card(20, 'mimic'), card(100)).pp, 35);
    assert.equal(calc(card(40, 'mimic'), card(45), { field: 'fire' }).pp, 70);
});
check('draw reflection simultaneous after field defense, not recursive', () => {
    const reflect = card(40, 'reflect');
    let s = resolve(reflect, reflect); assert.equal(s.playerHP, 87); assert.equal(s.botHP, 87);
    s = resolve(reflect, reflect, { activeField: 'fire' }); assert.equal(s.playerHP, 94); assert.equal(s.botHP, 94);
    assert.equal(s.roundResult.pDirect, 5); assert.equal(s.roundResult.pReflected, 1);
    s = resolve(reflect, reflect, { playerPoisonTurns: 1, botPoisonTurns: 1 });
    assert.equal(s.playerHP, 77); assert.equal(s.botHP, 77); assert.equal(s.roundResult.pReflected, 3);
});
check('Pierce retains +10 and removes opponent field buff and defense, including draw', () => {
    const r = calc(card(40, 'pierce'), card(40), { field: 'fire' });
    assert.equal(r.pp, 75); assert.equal(r.bp, 40); assert.equal(r.pDirect, 35);
    const draw = calc(card(40, 'pierce'), card(75), { field: 'fire' });
    assert.equal(draw.pDirect, 10); assert.equal(draw.bDirect, 5);
});
check('Heal loss cap thirty, low HP revive before death, draw half and winner cap', () => {
    for (const [hp, expected] of [[100, 70], [40, 10], [20, 0]]) {
        assert.equal(resolve(card(40, 'heal'), card(100), { playerHP: hp }).playerHP, expected);
    }
    assert.equal(resolve(card(40, 'heal'), card(40)).playerHP, 95);
    assert.equal(calc(card(100, 'heal'), card(20)).pHealAmount, 30);
    assert.equal(resolve(card(40, 'heal'), card(100), { playerHP: 40, playerPoisonTurns: 1 }).playerHP, 0);
    assert.equal(resolve(card(100, 'heal'), card(20), { playerHP: 100, playerPoisonTurns: 1 }).playerHP, 90);
    assert.equal(resolve(card(20), card(100, 'heal'), { botHP: 100, botPoisonTurns: 1 }).botHP, 90);
    assert.equal(calc(card(40, 'lifesteal'), card(100)).pHealAmount, 30);
});
check('Mana Burst adds one above ordinary two, capped ten', () => {
    assert.equal(resolve(card(40, 'mana_burst'), card(40), { playerMana: 0 }).playerMana, 3);
    assert.equal(resolve(card(40, 'mana_burst'), card(40), { playerMana: 9 }).playerMana, 10);
    assert.equal(resolve(card(40, 'mana_burst'), card(40), { playerMana: 0, playerSilenced: true }).playerMana, 2);
});
check('bot cannot play unaffordable Swap; no player charge; poison/turn lifecycle preserved', () => {
    reset({ playerSelectedCardIndex: 0, botHand: [card(100, 'soul_swap')], botMana: 0,
        playerPoisonTurns: 1, botSilenced: false, playerHP: 80, botHP: 50 });
    store.getState().playTurn(); const s = store.getState();
    assert.equal(s.playerHP, 70); assert.equal(s.botHP, 40); assert.equal(s.playerMana, 5); assert.equal(s.botMana, 2);
    assert.equal(s.turnCount, 2); assert.equal(s.boardBotCard, null); assert.equal(s.roundResult, null);
    assert.equal(s.boardPlayerManaCost, null); assert.equal(s.botHand.length, 0);
    reset({ playerSelectedCardIndex: 0, botHand: [card(88, 'no_mana')], botMana: 0 });
    store.getState().playTurn(); assert.equal(store.getState().boardBotManaCost, 0);
});
check('every actual card pair remains symmetric with correct guesses, statuses and field', () => {
    for (const pc of ALL_CARDS) for (const bc of ALL_CARDS) {
        const a = calculateRound({ playerCard: pc, botCard: bc, field: pc.element,
            playerSilenced: pc.power % 2 === 0, botSilenced: bc.power % 2 === 0, playerGuess: bc.element, botGuess: pc.element });
        const b = calculateRound({ playerCard: bc, botCard: pc, field: pc.element,
            playerSilenced: bc.power % 2 === 0, botSilenced: pc.power % 2 === 0, playerGuess: pc.element, botGuess: bc.element });
        assert.deepEqual([a.pp, a.bp, a.pDirect, a.bDirect, a.pReflected, a.bReflected, a.pHealAmount, a.bHealAmount],
            [b.bp, b.pp, b.bDirect, b.pDirect, b.bReflected, b.pReflected, b.bHealAmount, b.pHealAmount]);
    }
});

// Inspect actual component props and callbacks; only browser/3D runtime is mocked.
const useGameStore = () => store.getState(); useGameStore.getState = store.getState; useGameStore.setState = store.setState;
const bindings = { ...real, useGameStore };
function Card3D() {} const empty = () => null;
const hooks = { useState: v => [v, empty], useEffect: empty };
const spring = { useSpring: () => ({}), animated: new Proxy({}, { get: (_, key) => `animated-${String(key)}` }) };
const GameBoard = load('src/components/GameBoard.tsx', {
    react: hooks, '@react-three/fiber': { Canvas: empty }, '@react-three/drei': { OrbitControls: empty, Float: empty, Sparkles: empty, Stars: empty },
    '@react-spring/three': spring, './Card3D': { __esModule: true, default: Card3D },
    './Effects3D': { __esModule: true, default: empty, DustRing: empty, ElementalReveal: empty, WeatherField: empty, BackgroundEnvironment: empty },
    '../store/gameStore': bindings
}).default;
const Modal = load('src/components/DetailCardModal.tsx', { '../store/gameStore': bindings,
    './Card3D': { getSkillInfo: () => null }, 'lucide-react': { X: empty } }).default;
function find(tree, predicate) {
    const result = []; function walk(n) { if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) return n.forEach(walk); if (predicate(n)) result.push(n); walk(n.props?.children); }
    walk(tree); return result;
}
const modalCost = () => find(Modal(), n => n.type === 'span' && n.props.className === 'text-3xl font-black text-blue-400 drop-shadow-md')[0].props.children;
check('hidden bot callbacks and current hand/paid board prices throughout every phase', () => {
    const free = card(88, 'no_mana');
    for (const phase of ['deal', 'select', 'gamble_select', 'reveal', 'resolve', 'evaluate', 'gameover']) {
        reset({ phase, playerHand: [free], botHand: [free], playerSilenced: true, botSilenced: true,
            boardPlayerCard: free, boardBotCard: free, boardPlayerManaCost: 0, boardBotManaCost: 3 });
        const tree = GameBoard(), hands = find(tree, n => n.type?.name === 'Hand');
        const pHand = find(hands[0].type(hands[0].props), n => n.type === Card3D)[0];
        const bHand = find(hands[1].type(hands[1].props), n => n.type === Card3D)[0];
        assert.equal(pHand.props.manaCost, 3); assert.equal(bHand.props.onRightClick, undefined);
        pHand.props.onRightClick(); assert.equal(modalCost(), 3);
        store.setState({ playerSilenced: false }); assert.equal(modalCost(), 0);
        const board = find(tree, n => n.type?.name === 'Board')[0];
        const boardCards = find(board.type(board.props), n => n.type === Card3D);
        assert.equal(boardCards[0].props.manaCost, 0); boardCards[0].props.onRightClick(); assert.equal(modalCost(), 0);
        const visible = ['resolve', 'evaluate', 'gameover'].includes(phase);
        assert.equal(typeof boardCards[1].props.onRightClick, visible ? 'function' : 'undefined');
        if (visible) { boardCards[1].props.onRightClick(); assert.equal(store.getState().selectedDetailCard, free); assert.equal(modalCost(), 3); }
        pHand.props.onClick(); assert.equal(store.getState().playerSelectedCardIndex, phase === 'select' ? 0 : null);
    }
    store.setState({ playerSilenced: true }); store.getState().setDetailCard(free); assert.equal(modalCost(), 0);
    assert.equal(store.getState().detailCardContext, null); // catalog does not infer ownership from ID/object
    store.getState().setDetailCard(null); assert.equal(Modal(), null);
});
check('UI affordability, death after complete round, and board snapshots cleared', () => {
    const effects = [], hooksWithEffects = { ...hooks, useEffect: fn => effects.push(fn) };
    const Overlay = load('src/components/UIOverlay.tsx', { react: hooksWithEffects, '../store/gameStore': bindings,
        './AncientButton': { __esModule: true, default: empty } }).default;
    reset({ playerHand: [card(88, 'no_mana')], playerMana: 0, playerSilenced: true });
    let tree = Overlay(); assert(find(tree, n => n.type === 'button' && n.props.onClick === store.getState().passTurn).length > 0);
    const oldTimer = global.setTimeout;
    try {
        const timers = []; global.setTimeout = fn => { timers.push(fn); return 0; };
        for (const hp of [40, 20]) {
            resolve(card(40, 'heal'), card(100), { playerHP: hp }); effects.length = 0; Overlay(); effects[1](); timers.shift()();
            assert.equal(store.getState().phase, hp === 40 ? 'select' : 'gameover');
            assert.equal(store.getState().boardPlayerCard, null); assert.equal(store.getState().roundResult, null);
            assert.equal(store.getState().boardPlayerManaCost, null);
        }
    } finally { global.setTimeout = oldTimer; }
});
assert.equal(ALL_CARDS.length, 80);
assert.equal(JSON.stringify(ALL_CARDS), originalCards);
console.log(`${cases} groups passed, including 6,400 mirrored card pairs; no browser/WebGL claims.`);
