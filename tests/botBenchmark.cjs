// Optional comparison: node tests/botBenchmark.cjs [baseline-store.ts] [games-per-policy] [candidate-store.ts] [first-seed]
// Simulates the real store without animation; results are not human playtesting.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { performance } = require('node:perf_hooks');

function load(filename, cache = new Map()) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loaded = new Module(filename, module);
    loaded.filename = filename;
    loaded.paths = Module._nodeModulePaths(path.dirname(filename));
    cache.set(filename, loaded);
    const base = loaded.require.bind(loaded);
    loaded.require = id => {
        const candidate = path.resolve(path.dirname(filename), id + '.ts');
        return id.startsWith('.') && fs.existsSync(candidate) ? load(candidate, cache) : base(id);
    };
    loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText, filename);
    return loaded.exports;
}
function rng(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
        n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
        return ((n ^ n >>> 14) >>> 0) / 4294967296;
    };
}
const current = load(process.argv[4] || path.join(__dirname, '../src/store/gameStore.ts'));
const baseline = process.argv[2] ? load(process.argv[2]) : null;
const games = Number(process.argv[3] || 100);
const firstSeed = Number(process.argv[5] || 1);
if (!Number.isInteger(games) || games < 1 || !Number.isInteger(firstSeed) || firstSeed < 1) {
    throw new Error('games-per-policy and first-seed must be positive integers');
}
const elements = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];
const policies = ['random', 'strongest', 'save-early'];
const originalRandom = Math.random;
const timings = [];
function match(engine, setup, policy, seed, measure) {
    const store = engine.useGameStore;
    const random = rng(seed + 17), playerRandom = rng(seed + 31);
    Math.random = random;
    store.getState().initGame();
    store.setState({ ...setup, playerHand: [...setup.playerHand], botHand: [...setup.botHand],
        fieldTurns: [], phase: 'select' });
    let botPasses = 0, playerPasses = 0;
    for (let turns = 0; turns < 5; turns++) {
        let state = store.getState();
        if (state.phase === 'gameover' || state.playerHP <= 0 || state.botHP <= 0 || !state.playerHand.length) break;
        store.setState({ activeField: setup.fields[turns], pendingField: null, phase: 'select' });
        state = store.getState();
        const choices = state.playerHand.map((card, index) => ({ card, index }))
            .filter(({ card }) => engine.getCardManaCost(card, state.playerSilenced) <= state.playerMana);
        if (!choices.length) { playerPasses++; state.passTurn(); continue; }
        let choice;
        if (policy === 'random') choice = choices[Math.floor(playerRandom() * choices.length)];
        else {
            const score = ({ card }) => {
                const skill = state.playerSilenced ? 'none' : card.skill;
                let power = card.power + (card.element === state.activeField ? 25 : 0);
                if (skill === 'no_mana') power -= 15;
                if (skill === 'pierce') power += 10;
                return policy === 'save-early' && turns < 2 ? -power : power;
            };
            choice = choices.reduce((best, item) => score(item) > score(best) ? item : best);
        }
        state.selectCard(choice.index);
        const start = performance.now();
        store.getState().playTurn();
        if (measure) timings.push(performance.now() - start);
        state = store.getState();
        if (!state.boardBotCard) botPasses++;
        if (state.phase === 'gamble_select') state.selectGambleElement(elements[Math.floor(playerRandom() * 6)]);
        state = store.getState();
        if (state.phase === 'reveal') { state.revealCards(); store.getState().resolveRound(); }
        state = store.getState();
        if (state.phase === 'evaluate') store.setState({ phase: 'select', boardPlayerCard: null, boardBotCard: null,
            roundResult: null, playerSelectedCardIndex: null });
    }
    const state = store.getState();
    return { outcome: state.botHP > state.playerHP ? 'win' : state.botHP < state.playerHP ? 'loss' : 'draw',
        botPasses, playerPasses };
}
try {
    for (const policy of policies) {
        const totals = () => ({ win: 0, loss: 0, draw: 0, botPasses: 0, playerPasses: 0 });
        const results = { current: totals(), baseline: totals() };
        const record = (totals, result) => {
            totals[result.outcome]++;
            totals.botPasses += result.botPasses;
            totals.playerPasses += result.playerPasses;
        };
        for (let seed = firstSeed; seed < firstSeed + games; seed++) {
            const random = rng(seed);
            Math.random = random;
            current.useGameStore.getState().initGame();
            const state = current.useGameStore.getState();
            const fieldTurns = state.fieldTurns;
            const setup = { playerHand: [...state.playerHand], botHand: [...state.botHand],
                fields: Array.from({ length: 5 }, (_, i) => fieldTurns.includes(i + 1)
                    ? elements[Math.floor(random() * 6)] : null) };
            record(results.current, match(current, setup, policy, seed, true));
            if (baseline) record(results.baseline, match(baseline, setup, policy, seed, false));
        }
        console.log(JSON.stringify({ policy, games, firstSeed, ...results }));
    }
    timings.sort((a, b) => a - b);
    console.log(JSON.stringify({ decisions: timings.length,
        meanMs: timings.reduce((a, b) => a + b, 0) / timings.length,
        p95Ms: timings[Math.floor(timings.length * 0.95)], maxMs: timings.at(-1) }));
} finally { Math.random = originalRandom; }
