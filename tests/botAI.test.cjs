// node tests/botAI.test.cjs: real combat/store, deterministic public-view decisions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const priorLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, filename);
const game = require('../src/store/gameStore.ts');
const ai = require('../src/store/botAI.ts');
require.extensions['.ts'] = priorLoader;
const rules = { cards: game.ALL_CARDS, cost: game.getCardManaCost, calculateRound: game.calculateRound };
const card = (power, skill = 'none', element = 'fire') => ({ id: `${power}-${skill}-${element}`, power, skill, element, image: 'test' });
const view = (changes = {}) => ({ hand: [card(40)], opponentHandCount: 2, botHP: 100, playerHP: 100,
    botMana: 3, playerMana: 3, botPoisonTurns: 0, playerPoisonTurns: 0, botSilenced: false, playerSilenced: false,
    activeField: null, turnCount: 1, memory: ai.createBotMemory(), ...changes });
const decide = (state, opponents) => ai.chooseBotPlay(state, opponents ? { ...rules, cards: opponents } : rules, () => 0);
let groups = 0;
const test = (name, fn) => { fn(); groups++; console.log('PASS ' + name); };

test('affordability respects free cards, eight-mana Swap, silence and pass', () => {
    const hand = [card(100, 'soul_swap'), card(90, 'no_mana')];
    assert.equal(decide(view({ hand, botMana: 0 })).index, 1);
    assert.equal(decide(view({ hand, botMana: 0, botSilenced: true })), null);
    assert.equal(decide(view({ hand: [hand[0]], botMana: 7 })), null);
    assert.equal(decide(view({ hand: [hand[0]], botMana: 8 })).index, 0);
    assert.equal(decide(view({ hand: [hand[0]], botMana: 4, botSilenced: true })).index, 0);
});

test('public pool honors rarity consumption, independent hands and hidden discard uncertainty', () => {
    const own = game.ALL_CARDS.find(c => c.power < 50);
    let state = view({ hand: [own], playerMana: 10 });
    assert(ai.estimateOpponent(state, rules).some(p => p.card.id === own.id));
    const rare = game.ALL_CARDS.find(c => c.power >= 80 && c.power < 95);
    state.memory = ai.observeBotPass(state.memory);
    const before = ai.estimateOpponent(state, rules);
    assert(before.some(p => p.card.power >= 95));
    assert(before.some(p => p.card.power < 50));
    state.memory = ai.observeBotReveal(state.memory, rare, 1, null);
    assert(!ai.estimateOpponent(state, rules).some(p => p.card.power >= 80 && p.card.power < 95));
    assert.equal(state.memory.hiddenDiscards, 1);
    const exhausted = { ...state.memory, quota: { ssr: 0, rare: 0, uncommon: 0, normal: 0 } };
    assert.deepEqual(ai.estimateOpponent({ ...state, memory: exhausted }, rules), []);
    assert.equal(decide({ ...state, memory: exhausted }).index, 0);
});

test('revealed tendencies stay smoothed and survive uncertain swapped hand origins', () => {
    let memory = ai.createBotMemory();
    memory = ai.observeBotReveal(memory, card(80, 'none', 'water'), 1, 'water');
    memory = ai.observeBotReveal(memory, card(50, 'none', 'water'), 2, 'water');
    const repeated = ai.observeBotReveal(memory, card(100, 'none', 'dark'), 2, null);
    assert.equal(repeated, memory);
    const swapped = ai.observeBotSwap(memory, 2);
    assert.equal(swapped.observations, 2);
    assert.equal(swapped.powerTotal, 130);
    assert.equal(swapped.fieldUses, 2);
    assert.equal(ai.observeBotSwap(swapped, 2), swapped);
    const pool = ai.estimateOpponent(view({ memory: swapped, playerMana: 10 }), rules);
    for (const element of ['fire', 'water', 'earth', 'wind', 'light', 'dark']) {
        assert(pool.some(item => item.card.element === element && item.weight > 0));
    }
    const rawPrior = ai.estimateOpponent(view({ memory: swapped, playerMana: 10 }), rules, false);
    const neutralHistory = { ...swapped, observations: 0, powerTotal: 0, elementCounts: {}, fieldUses: 0 };
    assert.deepEqual(rawPrior, ai.estimateOpponent(view({ memory: neutralHistory, playerMana: 10 }), rules, false));
});

test('low HP healing and Soul Swap beat plain power when they preserve victory', () => {
    const enemy = card(60, 'none', 'dark');
    assert.equal(decide(view({ hand: [card(75, 'none', 'dark'), card(70, 'heal', 'dark')],
        botHP: 15, playerHP: 30, turnCount: 5 }), [enemy]).index, 1);
    assert.equal(decide(view({ hand: [card(100, 'soul_swap', 'dark'), card(100, 'none', 'dark')],
        botHP: 10, playerHP: 90, botMana: 8 }), [enemy]).index, 0);
});

test('poison values remaining ticks, final turn does not hoard high power', () => {
    const enemy = card(40, 'none', 'dark');
    const hand = [card(45, 'none', 'dark'), card(40, 'poison', 'dark')];
    assert.equal(decide(view({ hand }), [enemy]).index, 1);
    assert.equal(decide(view({ hand: [card(40), card(90)], turnCount: 5, botMana: 4 }), [card(40)]).index, 1);
    const poison = ai.predictBotRound(view(), card(40, 'poison'), enemy, null, false, rules);
    assert.equal(poison.playerPoisonTurns, 2);
    const shortHorizon = [card(51, 'none', 'dark'), card(40, 'poison', 'dark')];
    assert.equal(decide(view({ hand: shortHorizon }), [enemy]).index, 1);
    assert.equal(decide(view({ hand: shortHorizon, turnCount: 5 }), [enemy]).index, 0);
});

test('field control, Pierce and cyclic counter use actual matchup utility', () => {
    const enemy = card(45, 'none', 'earth');
    assert.equal(decide(view({ hand: [card(40, 'none', 'water'), card(40, 'none', 'fire')], turnCount: 5 }), [enemy]).index, 1);
    assert.equal(decide(view({ hand: [card(40, 'none', 'water'), card(40, 'field_control', 'water')], turnCount: 5,
        activeField: 'earth' }), [enemy]).index, 1);
    assert.equal(decide(view({ hand: [card(50, 'none', 'dark'), card(50, 'pierce', 'dark')], turnCount: 5,
        activeField: 'earth' }), [enemy]).index, 1);
});

test('mana reservation counts next silence and penalizes a forced pass', () => {
    const future = card(100, 'soul_swap', 'dark');
    const state = view({ hand: [card(40, 'mana_burst', 'dark'), card(40, 'none', 'dark'), future], botMana: 7 });
    assert.equal(decide(state, [card(40, 'none', 'dark')]).index, 0);
    const silenced = ai.predictBotRound(state, state.hand[0], card(40, 'silence'), null, false, rules);
    assert.equal(silenced.botSilenced, true);
    assert.equal(silenced.botMana, 9);
    assert.equal(decide(view({ hand: [card(60, 'none', 'dark'), card(60, 'mana_burst', 'dark'),
        card(100, 'none', 'dark')], botMana: 3 }), [card(60, 'none', 'dark')]).index, 1);
});

test('remaining-hand planner follows mana order and averages forced random discards', () => {
    const weak = card(40), strong = card(100);
    assert.equal(ai.planBotHand([weak, strong], 0, false, 2, rules), -10 + 0.9 * (40 - 10) / 2);
    assert.equal(ai.planBotHand([strong], 3, false, 1, rules), -10);
    assert.equal(ai.planBotHand([card(100, 'no_mana')], 0, false, 1, rules), 85);
    assert.equal(ai.planBotHand([card(100, 'no_mana')], 0, true, 1, rules), -10);
    assert.equal(ai.planBotHand([card(60, 'mana_burst'), strong], 3, false, 2, rules), 60 + 0.9 * 100);
    assert.equal(ai.planBotHand([card(60), strong], 3, false, 2, rules), 60 - 0.9 * 10);
    assert.equal(ai.planBotHand([card(10, 'no_mana'), strong], 1, true, 2, rules), 10 - 0.9 * 10);
    assert.equal(ai.planBotHand([weak, strong], 10, false, 0, rules), 0);
});

test('Gamble guesses exploit public likelihood only and dual Gamble branches cancel', () => {
    const state = view({ hand: [card(40, 'gamble')], turnCount: 5 });
    assert.equal(decide(state, [card(40, 'none', 'water')]).guess, 'water');
    const predicted = ai.predictBotRound(state, card(40, 'gamble'), card(40, 'gamble', 'water'), 'water', true, rules);
    const failed = ai.predictBotRound(state, card(40, 'gamble'), card(40, 'gamble', 'water'), 'water', false, rules);
    assert(predicted.botHP < failed.botHP);
});

test('face-down selection, guesses and future fields never alter bot decision', () => {
    const store = game.useGameStore;
    const run = (playerHand, selection, guess, pendingField, fieldTurns) => {
        store.getState().initGame();
        store.setState({ phase: 'select', botHand: [card(49, 'gamble'), card(75, 'heal', 'water'), card(40)],
            playerHand, playerSelectedCardIndex: selection, playerGambleGuess: guess, pendingField, fieldTurns,
            botMana: 3, playerMana: 3, activeField: 'water' });
        const before = store.getState().botMemory;
        const oldRandom = Math.random; Math.random = () => 0.3;
        try { store.getState().playTurn(); } finally { Math.random = oldRandom; }
        assert.equal(store.getState().botMemory, before);
        return [store.getState().boardBotCard.id, store.getState().botGambleGuess];
    };
    assert.deepEqual(run([card(10), card(70)], 0, 'fire', 'earth', [2, 3]),
        run([card(79, 'poison', 'dark'), card(20)], 1, 'dark', 'light', [4, 5]));
});

test('reveal/pass/new-game/single dual and silenced Swap memory lifecycle', () => {
    const store = game.useGameStore;
    const reset = (p, b, extra = {}) => {
        store.getState().initGame();
        store.setState({ phase: 'reveal', boardPlayerCard: p, boardBotCard: b, playerHand: [card(20)],
            botHand: [card(30)], fieldTurns: [], ...extra });
    };
    reset(card(40), card(50));
    assert.equal(store.getState().botMemory.observations, 0);
    store.getState().revealCards(); store.getState().revealCards();
    assert.equal(store.getState().botMemory.observations, 1);
    reset(card(100, 'soul_swap'), card(50));
    store.getState().revealCards(); store.getState().resolveRound();
    assert.equal(store.getState().botMemory.broadPool, true);
    assert.equal(store.getState().botMemory.observations, 1);
    assert.equal(store.getState().botMemory.revealedIds.length, 0);
    reset(card(100, 'soul_swap'), card(100, 'soul_swap'));
    store.getState().revealCards(); store.getState().resolveRound();
    assert.equal(store.getState().botMemory.broadPool, false);
    reset(card(100, 'soul_swap'), card(50), { playerSilenced: true });
    store.getState().revealCards(); store.getState().resolveRound();
    assert.equal(store.getState().botMemory.broadPool, false);
    store.setState({ phase: 'select' }); store.getState().passTurn();
    assert.equal(store.getState().botMemory.hiddenDiscards, 1);
    store.getState().initGame(); assert.deepEqual(store.getState().botMemory, ai.createBotMemory());
});

test('predictions match real reveal+resolution for every skill/status pair', () => {
    const skills = ['none', 'heal', 'lifesteal', 'reflect', 'pierce', 'soul_swap', 'no_mana', 'gamble',
        'field_control', 'poison', 'silence', 'mimic', 'mana_burst'];
    for (const ps of skills) for (const bs of skills) for (const silenced of [false, true]) {
        const p = card(80, ps, 'water'), b = card(85, bs, 'fire');
        const state = view({ hand: [b, card(30)], botHP: 20, playerHP: 95, botMana: 10, playerMana: 10,
            playerPoisonTurns: 1, botPoisonTurns: 2, botSilenced: silenced, playerSilenced: silenced, activeField: 'water' });
        const predicted = ai.predictBotRound(state, b, p, 'water', true, rules);
        const store = game.useGameStore;
        store.getState().initGame();
        store.setState({ ...state, phase: 'reveal', boardPlayerCard: p, boardBotCard: b, botHand: state.hand.slice(1),
            playerHand: [card(30)], botMana: state.botMana - rules.cost(b, silenced),
            playerMana: state.playerMana - rules.cost(p, silenced), playerGambleGuess: b.element,
            botGambleGuess: 'water', fieldTurns: [] });
        store.getState().revealCards(); store.getState().resolveRound();
        for (const key of ['botHP', 'playerHP', 'botMana', 'playerMana', 'botPoisonTurns', 'playerPoisonTurns', 'botSilenced', 'playerSilenced']) {
            assert.equal(store.getState()[key], predicted[key], `${ps}/${bs}/${silenced}/${key}`);
        }
    }
});
console.log(`${groups} bot groups passed, including 338 complete lifecycle comparisons.`);
