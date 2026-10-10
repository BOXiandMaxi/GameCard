import type { CardData, ElementType, Rarity, RoundInput, RoundResult } from './gameStore';

const elements: ElementType[] = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];
const rarity = (card: CardData): Rarity => card.rarity ||
    (card.power >= 95 ? 'ssr' : card.power >= 80 ? 'rare' : card.power >= 50 ? 'uncommon' : 'normal');
const initialQuota = (): Record<Rarity, number> => ({ ssr: 1, rare: 1, uncommon: 2, normal: 1 });

export interface BotMemory {
    quota: Record<Rarity, number>;
    revealedIds: string[];
    hiddenDiscards: number;
    observations: number;
    elementCounts: Partial<Record<ElementType, number>>;
    powerTotal: number;
    fieldUses: number;
    lastRevealTurn: number;
    lastSwapTurn: number;
    broadPool: boolean;
}
export const createBotMemory = (): BotMemory => ({ quota: initialQuota(), revealedIds: [], hiddenDiscards: 0,
    observations: 0, elementCounts: {}, powerTotal: 0, fieldUses: 0,
    lastRevealTurn: -1, lastSwapTurn: -1, broadPool: false });

// Called only after both cards become public; never when selecting face-down cards.
export const observeBotReveal = (memory: BotMemory, card: CardData, turn: number, field: ElementType | null): BotMemory => {
    if (memory.lastRevealTurn === turn) return memory;
    return { ...memory, lastRevealTurn: turn, revealedIds: [...memory.revealedIds, card.id],
        quota: { ...memory.quota, [rarity(card)]: Math.max(0, memory.quota[rarity(card)] - 1) },
        observations: memory.observations + 1, powerTotal: memory.powerTotal + card.power,
        fieldUses: memory.fieldUses + Number(card.element === field),
        elementCounts: { ...memory.elementCounts, [card.element]: (memory.elementCounts[card.element] || 0) + 1 } };
};
export const observeBotPass = (memory: BotMemory): BotMemory => ({ ...memory, hiddenDiscards: memory.hiddenDiscards + 1 });
// The new opponent hand's origins are uncertain after a swap. Keep behavioral history,
// but stop using the previous hand's exclusions or initial rarity guarantees.
export const observeBotSwap = (memory: BotMemory, turn: number): BotMemory => memory.lastSwapTurn === turn ? memory :
    { ...memory, lastSwapTurn: turn, revealedIds: [], hiddenDiscards: 0, quota: initialQuota(), broadPool: true };

export interface BotPublicView {
    hand: readonly CardData[];
    opponentHandCount: number;
    botHP: number;
    playerHP: number;
    botMana: number;
    playerMana: number;
    botPoisonTurns: number;
    playerPoisonTurns: number;
    botSilenced: boolean;
    playerSilenced: boolean;
    activeField: ElementType | null;
    turnCount: number;
    memory: BotMemory;
}
export interface BotRules {
    cards: readonly CardData[];
    cost: (card: CardData, silenced?: boolean) => number;
    calculateRound: (input: RoundInput) => RoundResult;
}
export interface OpponentPossibility { card: CardData; weight: number }

export const estimateOpponent = (view: BotPublicView, rules: BotRules, modelChoice = true): OpponentPossibility[] => {
    const memory = view.memory;
    const pools: Record<Rarity, number> = { normal: 0, uncommon: 0, rare: 0, ssr: 0 };
    const unseen = rules.cards.filter(card => !memory.revealedIds.includes(card.id));
    unseen.forEach(card => pools[rarity(card)]++);
    // Secret random discards are exchangeable: they reduce expected counts of ALL
    // rarities proportionally, never reveal which rarity/card vanished.
    const quotaTotal = Object.values(memory.quota).reduce((sum, n) => sum + n, 0);
    const survival = quotaTotal ? Math.max(0.01, (quotaTotal - memory.hiddenDiscards) / quotaTotal) : 1;
    const possibilities = unseen.filter(card => rules.cost(card, view.playerSilenced) <= view.playerMana)
        .map(card => {
            const prior = memory.broadPool ? 1 / Math.max(1, unseen.length) :
                memory.quota[rarity(card)] * survival / Math.max(1, pools[rarity(card)]);
            // Strong smoothing keeps every feasible hypothesis possible after only a
            // few observations. The model learns tendencies, not a secret hand.
            const elementPreference = ((memory.elementCounts[card.element] || 0) + 2) / (memory.observations + 12) * 6;
            const powerPreference = memory.observations ?
                1 + (memory.powerTotal / memory.observations - 60) * (card.power - 60) / 10000 : 1;
            const fieldPreference = card.element === view.activeField ?
                1 + memory.fieldUses / (memory.observations + 4) * 0.4 : 1;
            return { card, weight: prior * (modelChoice ?
                elementPreference * Math.max(0.7, powerPreference) * fieldPreference : 1) };
        }).filter(item => item.weight > 0);
    const total = possibilities.reduce((sum, item) => sum + item.weight, 0);
    return possibilities.map(item => ({ ...item, weight: item.weight / total }));
};

export interface BotPrediction {
    botHP: number; playerHP: number; botMana: number; playerMana: number;
    botPoisonTurns: number; playerPoisonTurns: number;
    botSilenced: boolean; playerSilenced: boolean; swapped: boolean;
}
// Complete known round lifecycle, using the real game's combat function.
export const predictBotRound = (view: BotPublicView, bot: CardData, player: CardData,
    guess: ElementType | null, playerGambleSuccess: boolean, rules: BotRules): BotPrediction => {
    const ps = view.playerSilenced ? 'none' : player.skill;
    const bs = view.botSilenced ? 'none' : bot.skill;
    const swapped = (ps === 'soul_swap') !== (bs === 'soul_swap');
    let field = view.activeField;
    if (ps === 'field_control' && bs === 'field_control') field = null;
    else if (ps === 'field_control') field = player.element;
    else if (bs === 'field_control') field = bot.element;
    const round = rules.calculateRound({ playerCard: player, botCard: bot, field,
        playerSilenced: view.playerSilenced, botSilenced: view.botSilenced, botGuess: guess,
        playerGuess: playerGambleSuccess ? bot.element : null });
    let botHP = Math.min(100, (swapped ? view.playerHP : view.botHP) - round.pDirect - round.pReflected + round.bHealAmount);
    let playerHP = Math.min(100, (swapped ? view.botHP : view.playerHP) - round.bDirect - round.bReflected + round.pHealAmount);
    let botPoisonTurns = ps === 'poison' ? 3 : view.botPoisonTurns;
    let playerPoisonTurns = bs === 'poison' ? 3 : view.playerPoisonTurns;
    if (botPoisonTurns > 0) { botHP -= 10; botPoisonTurns--; }
    if (playerPoisonTurns > 0) { playerHP -= 10; playerPoisonTurns--; }
    return { botHP: Math.max(0, botHP), playerHP: Math.max(0, playerHP), botPoisonTurns, playerPoisonTurns,
        botMana: Math.min(10, view.botMana - rules.cost(bot, view.botSilenced) + 2 + Number(bs === 'mana_burst')),
        playerMana: Math.min(10, view.playerMana - rules.cost(player, view.playerSilenced) + 2 + Number(ps === 'mana_burst')),
        botSilenced: ps === 'silence', playerSilenced: bs === 'silence', swapped };
};

// At most four remaining cards: exhaustively plan affordable play orders. Forced
// passes lose HP and discard a uniformly random card, never a chosen weak card.
export const planBotHand = (hand: readonly CardData[], mana: number, silenced: boolean, turns: number,
    rules: BotRules, memo = new Map<string, number>()): number => {
    if (!hand.length || turns <= 0) return 0;
    const key = `${hand.map(card => card.id).sort().join(',')}|${mana}|${silenced}|${turns}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    let best = -Infinity;
    hand.forEach((card, index) => {
        const cost = rules.cost(card, silenced);
        if (cost > mana) return;
        const active = silenced ? 'none' : card.skill;
        const power = Math.max(0, card.power - Number(active === 'no_mana') * 15) + Number(active === 'pierce') * 10;
        const nextMana = Math.min(10, mana - cost + 2 + Number(active === 'mana_burst'));
        const rest = hand.filter((_, position) => position !== index);
        best = Math.max(best, power + 0.9 * planBotHand(rest, nextMana, false, turns - 1, rules, memo));
    });
    if (best === -Infinity) best = -10 + 0.9 * hand.reduce((sum, _, index) => sum +
        planBotHand(hand.filter((_, position) => position !== index), Math.min(10, mana + 2), false,
            turns - 1, rules, memo), 0) / hand.length;
    memo.set(key, best);
    return best;
};

// Generate a small deterministic set of plausible whole received hands. Cards are
// drawn without replacement with public rarity bounds, never from hidden state.
const swappedHandValue = (view: BotPublicView, played: CardData, result: BotPrediction, turns: number,
    rules: BotRules, memo: Map<string, number>): number => {
    const memory = { ...view.memory, revealedIds: [...view.memory.revealedIds, played.id],
        quota: { ...view.memory.quota, [rarity(played)]: Math.max(0, view.memory.quota[rarity(played)] - 1) } };
    // Tendencies bias which card is PLAYED, not which cards remain in a hand.
    const pool = estimateOpponent({ ...view, memory, playerMana: 10, playerSilenced: false }, rules, false);
    const count = Math.max(0, view.opponentHandCount - 1);
    if (!count || !pool.length) return 0;
    let value = 0;
    for (let scenario = 0; scenario < 8; scenario++) {
        let remaining = [...pool];
        const quota = { ...memory.quota };
        const hand: CardData[] = [];
        for (let slot = 0; slot < count; slot++) {
            const feasible = remaining.filter(item => memory.broadPool || quota[rarity(item.card)] > 0);
            const total = feasible.reduce((sum, item) => sum + item.weight, 0);
            if (!total) break;
            const quantile = ((scenario + 0.5) / 8 + slot * 0.381966) % 1;
            let threshold = quantile * total;
            let selected = feasible[feasible.length - 1];
            for (const item of feasible) {
                threshold -= item.weight;
                if (threshold <= 0) { selected = item; break; }
            }
            hand.push(selected.card);
            quota[rarity(selected.card)]--;
            remaining = remaining.filter(item => item.card.id !== selected.card.id);
        }
        value += planBotHand(hand, result.botMana, result.botSilenced, turns, rules, memo) / 8;
    }
    return value;
};

const scorePrediction = (view: BotPublicView, botIndex: number, result: BotPrediction,
    opponent: CardData, rules: BotRules, memo: Map<string, number>): number => {
    const margin = result.botHP - result.playerHP;
    const terminal = result.botHP <= 0 || result.playerHP <= 0 || view.turnCount >= 5 ||
        view.hand.length <= 1 || view.opponentHandCount <= 1;
    if (terminal) return Math.sign(margin) * 1000 + margin;
    const turnsLeft = Math.min(5 - view.turnCount, view.hand.length - 1, view.opponentHandCount - 1);
    const poisonValue = 7 * (Math.min(turnsLeft, result.playerPoisonTurns) - Math.min(turnsLeft, result.botPoisonTurns));
    let future: number;
    if (result.swapped) {
        // Received cards are unknown until the swap happens. Estimate using public
        // possibilities instead of reading the player's remaining hand.
        const cacheKey = `swap:${opponent.id}|${result.botMana}|${result.botSilenced}|${turnsLeft}`;
        future = memo.get(cacheKey) ?? swappedHandValue(view, opponent, result, turnsLeft, rules, memo);
        memo.set(cacheKey, future);
    } else {
        future = planBotHand(view.hand.filter((_, index) => index !== botIndex), result.botMana, result.botSilenced, turnsLeft, rules, memo);
    }
    const survivalRisk = Math.max(0, 25 - result.botHP) * 0.5;
    return margin + poisonValue + future * 1.0 + Number(result.playerSilenced) * 3 -
        Number(result.botSilenced) * 3 - survivalRisk;
};

export interface BotChoice { index: number; guess: ElementType | null; score: number }
export const chooseBotPlay = (view: BotPublicView, rules: BotRules, rng: () => number = Math.random): BotChoice | null => {
    const choices = view.hand.map((card, index) => ({ card, index }))
        .filter(({ card }) => rules.cost(card, view.botSilenced) <= view.botMana);
    if (!choices.length) return null;
    const opponents = estimateOpponent(view, rules);
    const evaluated: BotChoice[] = [];
    const memo = new Map<string, number>();
    for (const { card, index } of choices) {
        const guesses: (ElementType | null)[] = !view.botSilenced && card.skill === 'gamble' ? elements : [null];
        for (const guess of guesses) {
            let score = 0;
            for (const opponent of opponents) {
                const playerGamble = !view.playerSilenced && opponent.card.skill === 'gamble';
                const failure = predictBotRound(view, card, opponent.card, guess, false, rules);
                let utility = scorePrediction(view, index, failure, opponent.card, rules, memo);
                if (playerGamble) {
                    const success = predictBotRound(view, card, opponent.card, guess, true, rules);
                    utility = utility * 5 / 6 + scorePrediction(view, index, success, opponent.card, rules, memo) / 6;
                }
                score += opponent.weight * utility;
            }
            // If public inference says the opponent has no affordable card, their
            // forced pass discards random cards; choosing a specific card has no effect.
            evaluated.push({ index, guess, score });
        }
    }
    const best = Math.max(...evaluated.map(choice => choice.score));
    const tied = evaluated.filter(choice => best - choice.score <= 0.05);
    return tied[Math.min(tied.length - 1, Math.floor(Math.max(0, rng()) * tied.length))];
};
