import { create } from 'zustand';

export type GamePhase = 'deal' | 'select' | 'gamble_select' | 'reveal' | 'resolve' | 'evaluate' | 'gameover';

export type ElementType = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
export type Rarity = 'normal' | 'uncommon' | 'rare' | 'ssr';

export const getCardRarity = (power: number): Rarity => {
    if (power >= 95) return 'ssr';
    if (power >= 80) return 'rare';
    if (power >= 50) return 'uncommon';
    return 'normal';
};

export type SkillType = 'lifesteal' | 'reflect' | 'pierce' | 'soul_swap' | 'no_mana' | 'heal' | 'gamble' | 'field_control' | 'poison' | 'silence' | 'mimic' | 'mana_burst' | 'none';

export interface CardData {
    id: string;
    image: string;
    power: number;
    element: ElementType;
    rarity?: Rarity;
    skill?: SkillType;
}

export const getCardManaCost = (card: CardData): number => {
    if (card.skill === 'no_mana') return 0;
    if (card.skill === 'soul_swap') return 10;
    const rarity = card.rarity || getCardRarity(card.power);
    switch (rarity) {
        case 'normal': return 1;
        case 'uncommon': return 2;
        case 'rare': return 3;
        case 'ssr': return 4;
        default: return 1;
    }
};

interface GameState {
    playerHP: number;
    botHP: number;
    playerHand: CardData[];
    botHand: CardData[];
    playerSelectedCardIndex: number | null;
    botSelectedCardIndex: number | null;
    boardPlayerCard: CardData | null;
    boardBotCard: CardData | null;
    phase: GamePhase;
    animationPhase: 'none' | 'attacking' | 'clashing' | 'knockback' | 'revealing';
    roundWinner: 'player' | 'bot' | 'draw' | null;
    message: string;
    resultMessage: string;
    turnCount: number;
    activeField: ElementType | null;
    pendingField: ElementType | null;
    fieldTurns: number[];
    appState: 'menu' | 'playing';
    isSettingsOpen: boolean;
    isCollectionOpen: boolean;
    selectedDetailCard: CardData | null;

    playerMana: number;
    botMana: number;
    playerPoisonTurns: number;
    botPoisonTurns: number;
    playerSilenced: boolean;
    botSilenced: boolean;
    lastPlayerSkill: SkillType | 'none';
    lastBotSkill: SkillType | 'none';
    playerGambleGuess: ElementType | null;
    botGambleGuess: ElementType | null;

    // Actions
    initGame: () => void;
    setAppState: (state: 'menu' | 'playing') => void;
    toggleSettings: () => void;
    toggleCollection: () => void;
    setDetailCard: (card: CardData | null) => void;
    selectCard: (index: number) => void;
    playTurn: () => void;
    revealCards: () => void;
    resolveRound: () => void;
    applyPendingField: () => void;
    finishAnimation: () => void;
    selectGambleElement: (element: ElementType) => void;
    passTurn: () => void;
}

export const ALL_CARDS: CardData[] = [
    { id: '1346', image: '/cards/cardfront/card1346.png', power: 19, element: 'fire', skill: 'pierce' },
    { id: '1403', image: '/cards/cardfront/card1403.png', power: 100, element: 'water', skill: 'silence' },
    { id: '1755', image: '/cards/cardfront/card1755.png', power: 18, element: 'fire', skill: 'field_control' },
    { id: '2005', image: '/cards/cardfront/card2005.png', power: 100, element: 'earth', skill: 'mana_burst' },
    { id: '2119', image: '/cards/cardfront/card2119.png', power: 98, element: 'dark', skill: 'mimic' },
    { id: '2169', image: '/cards/cardfront/card2169.png', power: 45, element: 'wind', skill: 'mana_burst' },
    { id: '2228', image: '/cards/cardfront/card2228.png', power: 82, element: 'water', skill: 'heal' },
    { id: '2581', image: '/cards/cardfront/card2581.png', power: 99, element: 'water', skill: 'mana_burst' },
    { id: '2604', image: '/cards/cardfront/card2604.png', power: 97, element: 'wind', skill: 'field_control' },
    { id: '2705', image: '/cards/cardfront/card2705.png', power: 43, element: 'water', skill: 'poison' },
    { id: '2957', image: '/cards/cardfront/card2957.png', power: 98, element: 'wind', skill: 'silence' },
    { id: '3284', image: '/cards/cardfront/card3284.png', power: 36, element: 'earth', skill: 'mana_burst' },
    { id: '3306', image: '/cards/cardfront/card3306.png', power: 93, element: 'fire', skill: 'field_control' },
    { id: '3350', image: '/cards/cardfront/card3350.png', power: 89, element: 'wind', skill: 'mana_burst' },
    { id: '3502', image: '/cards/cardfront/card3502.png', power: 49, element: 'earth', skill: 'reflect' },
    { id: '3805', image: '/cards/cardfront/card3805.png', power: 100, element: 'dark', skill: 'gamble' },
    { id: '4068', image: '/cards/cardfront/card4068.png', power: 37, element: 'wind', skill: 'pierce' },
    { id: '4190', image: '/cards/cardfront/card4190.png', power: 98, element: 'water', skill: 'mana_burst' },
    { id: '4309', image: '/cards/cardfront/card4309.png', power: 69, element: 'earth', skill: 'heal' },
    { id: '4331', image: '/cards/cardfront/card4331.png', power: 99, element: 'water', skill: 'mimic' },
    { id: '4650', image: '/cards/cardfront/card4650.png', power: 58, element: 'fire', skill: 'lifesteal' },
    { id: '4837', image: '/cards/cardfront/card4837.png', power: 64, element: 'wind', skill: 'pierce' },
    { id: '4847', image: '/cards/cardfront/card4847.png', power: 99, element: 'dark', skill: 'field_control' },
    { id: '5268', image: '/cards/cardfront/card5268.png', power: 100, element: 'wind', skill: 'pierce' },
    { id: '5463', image: '/cards/cardfront/card5463.png', power: 54, element: 'fire', skill: 'lifesteal' },
    { id: '5533', image: '/cards/cardfront/card5533.png', power: 99, element: 'wind', skill: 'mana_burst' },
    { id: '5668', image: '/cards/cardfront/card5668.png', power: 96, element: 'wind', skill: 'reflect' },
    { id: '5788', image: '/cards/cardfront/card5788.png', power: 97, element: 'water', skill: 'mana_burst' },
    { id: '5802', image: '/cards/cardfront/card5802.png', power: 68, element: 'water', skill: 'silence' },
    { id: '5809', image: '/cards/cardfront/card5809.png', power: 99, element: 'wind', skill: 'gamble' },
    { id: '5823', image: '/cards/cardfront/card5823.png', power: 34, element: 'wind', skill: 'reflect' },
    { id: '5836', image: '/cards/cardfront/card5836.png', power: 82, element: 'fire', skill: 'lifesteal' },
    { id: '6233', image: '/cards/cardfront/card6233.png', power: 58, element: 'earth', skill: 'heal' },
    { id: '6269', image: '/cards/cardfront/card6269.png', power: 98, element: 'dark', skill: 'poison' },
    { id: '6405', image: '/cards/cardfront/card6405.png', power: 100, element: 'earth', skill: 'reflect' },
    { id: '6414', image: '/cards/cardfront/card6414.png', power: 95, element: 'wind', skill: 'mimic' },
    { id: '6464', image: '/cards/cardfront/card6464.png', power: 67, element: 'water', skill: 'pierce' },
    { id: '6535', image: '/cards/cardfront/card6535.png', power: 45, element: 'wind', skill: 'gamble' },
    { id: '6788', image: '/cards/cardfront/card6788.png', power: 66, element: 'water', skill: 'lifesteal' },
    { id: '6997', image: '/cards/cardfront/card6997.png', power: 49, element: 'wind', skill: 'reflect' },
    { id: '7157', image: '/cards/cardfront/card7157.png', power: 38, element: 'earth', skill: 'poison' },
    { id: '7324', image: '/cards/cardfront/card7324.png', power: 23, element: 'water', skill: 'reflect' },
    { id: '7730', image: '/cards/cardfront/card7730.png', power: 98, element: 'fire', skill: 'mana_burst' },
    { id: '7785', image: '/cards/cardfront/card7785.png', power: 100, element: 'water', skill: 'mimic' },
    { id: '7815', image: '/cards/cardfront/card7815.png', power: 47, element: 'fire', skill: 'reflect' },
    { id: '7824', image: '/cards/cardfront/card7824.png', power: 100, element: 'light', skill: 'field_control' },
    { id: '7877', image: '/cards/cardfront/card7877.png', power: 79, element: 'wind', skill: 'mana_burst' },
    { id: '7917', image: '/cards/cardfront/card7917.png', power: 100, element: 'fire', skill: 'field_control' },
    { id: '8023', image: '/cards/cardfront/card8023.png', power: 68, element: 'earth', skill: 'no_mana' },
    { id: '8312', image: '/cards/cardfront/card8312.png', power: 45, element: 'earth', skill: 'reflect' },
    { id: '8400', image: '/cards/cardfront/card8400.png', power: 88, element: 'light', skill: 'pierce' },
    { id: '8579', image: '/cards/cardfront/card8579.png', power: 96, element: 'wind', skill: 'silence' },
    { id: '8605', image: '/cards/cardfront/card8605.png', power: 66, element: 'water', skill: 'lifesteal' },
    { id: '8865', image: '/cards/cardfront/card8865.png', power: 100, element: 'water', skill: 'mana_burst' },
    { id: '8904', image: '/cards/cardfront/card8904.png', power: 99, element: 'earth', skill: 'heal' },
    { id: '9013', image: '/cards/cardfront/card9013.png', power: 96, element: 'fire', skill: 'field_control' },
    { id: '9228', image: '/cards/cardfront/card9228.png', power: 100, element: 'light', skill: 'reflect' },
    { id: '9230', image: '/cards/cardfront/card9230.png', power: 99, element: 'earth', skill: 'mimic' },
    { id: '9284', image: '/cards/cardfront/card9284.png', power: 97, element: 'wind', skill: 'mana_burst' },
    { id: '9331', image: '/cards/cardfront/card9331.png', power: 99, element: 'earth', skill: 'mana_burst' },
    { id: '9342', image: '/cards/cardfront/card9342.png', power: 100, element: 'earth', skill: 'soul_swap' },
    { id: '9400', image: '/cards/cardfront/card9400.png', power: 82, element: 'wind', skill: 'mana_burst' },
    { id: '9422', image: '/cards/cardfront/card9422.png', power: 100, element: 'fire', skill: 'gamble' },
    { id: '9706', image: '/cards/cardfront/card9706.png', power: 49, element: 'water', skill: 'gamble' },
    { id: '9795', image: '/cards/cardfront/card9795.png', power: 40, element: 'earth', skill: 'heal' },
    { id: '1161', image: '/cards/cardfront/card1161.png', power: 62, element: 'earth', skill: 'mana_burst' },
    { id: '1498', image: '/cards/cardfront/card1498.png', power: 17, element: 'fire', skill: 'gamble' },
    { id: '1571', image: '/cards/cardfront/card1571.png', power: 86, element: 'light', skill: 'mana_burst' },
    { id: '1613', image: '/cards/cardfront/card1613.png', power: 25, element: 'fire', skill: 'field_control' },
    { id: '2196', image: '/cards/cardfront/card2196.png', power: 21, element: 'water', skill: 'reflect' },
    { id: '4112', image: '/cards/cardfront/card4112.png', power: 67, element: 'water', skill: 'no_mana' },
    { id: '4268', image: '/cards/cardfront/card4268.png', power: 57, element: 'water', skill: 'reflect' },
    { id: '4544', image: '/cards/cardfront/card4544.png', power: 100, element: 'dark', skill: 'mana_burst' },
    { id: '4610', image: '/cards/cardfront/card4610.png', power: 67, element: 'water', skill: 'no_mana' },
    { id: '5484', image: '/cards/cardfront/card5484.png', power: 85, element: 'dark', skill: 'soul_swap' },
    { id: '6426', image: '/cards/cardfront/card6426.png', power: 68, element: 'wind', skill: 'pierce' },
    { id: '6768', image: '/cards/cardfront/card6768.png', power: 98, element: 'dark', skill: 'field_control' },
    { id: '9119', image: '/cards/cardfront/card9119.png', power: 88, element: 'fire', skill: 'no_mana' },
    { id: '9826', image: '/cards/cardfront/card9826.png', power: 82, element: 'light', skill: 'gamble' },
    { id: '9945', image: '/cards/cardfront/card9945.png', power: 88, element: 'water', skill: 'lifesteal' }
];

const generateHand = () => {
    const deck = [...ALL_CARDS];

    // Categorize using the true visual rarity (explicit override OR power-based)
    const getEffectiveRarity = (c: CardData) => c.rarity || getCardRarity(c.power);
    const ssrPool = deck.filter(c => getEffectiveRarity(c) === 'ssr');
    const rarePool = deck.filter(c => getEffectiveRarity(c) === 'rare');
    const uncommonPool = deck.filter(c => getEffectiveRarity(c) === 'uncommon');
    const normalPool = deck.filter(c => getEffectiveRarity(c) === 'normal');

    // Shuffle helper
    const shuffleArray = (arr: any[]) => {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    };

    const finalHand = [
        ...shuffleArray(ssrPool).slice(0, 1),
        ...shuffleArray(rarePool).slice(0, 1),
        ...shuffleArray(uncommonPool).slice(0, 2),
        ...shuffleArray(normalPool).slice(0, 1),
    ];

    // Shuffle the final 5 cards so the order is random in hand
    return shuffleArray(finalHand);
};

export const useGameStore = create<GameState>((set, get) => ({
    playerHP: 100,
    botHP: 100,
    playerHand: [],
    botHand: [],
    playerSelectedCardIndex: null,
    botSelectedCardIndex: null,
    boardPlayerCard: null,
    boardBotCard: null,
    phase: 'deal',
    animationPhase: 'none',
    roundWinner: null,
    message: 'Welcome to Card Battle! Dealing...',
    resultMessage: '',
    turnCount: 1,
    activeField: null,
    pendingField: null,
    fieldTurns: [],
    appState: 'menu',
    isSettingsOpen: false,
    isCollectionOpen: false,
    selectedDetailCard: null,

    playerMana: 3,
    botMana: 3,
    playerPoisonTurns: 0,
    botPoisonTurns: 0,
    playerSilenced: false,
    botSilenced: false,
    lastPlayerSkill: 'none',
    lastBotSkill: 'none',
    playerGambleGuess: null,
    botGambleGuess: null,

    setAppState: (state) => set({ appState: state }),
    toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
    toggleCollection: () => set((state) => ({ isCollectionOpen: !state.isCollectionOpen })),
    setDetailCard: (card) => set({ selectedDetailCard: card }),

    initGame: () => {
        // Pick 2 random unique turns between 2 and 5
        const possibleTurns = [2, 3, 4, 5];
        const shuffledTurns = possibleTurns.sort(() => 0.5 - Math.random());
        const selectedTurns = [shuffledTurns[0], shuffledTurns[1]].sort();

        set({
            playerHP: 100,
            botHP: 100,
            playerHand: generateHand(),
            botHand: generateHand(),
            playerSelectedCardIndex: null,
            botSelectedCardIndex: null,
            boardPlayerCard: null,
            boardBotCard: null,
            phase: 'deal',
            animationPhase: 'none',
            roundWinner: null,
            message: 'Dealing cards...',
            resultMessage: '',
            turnCount: 1,
            activeField: null,
            pendingField: null,
            fieldTurns: selectedTurns,
            playerMana: 3,
            botMana: 3,
            playerPoisonTurns: 0,
            botPoisonTurns: 0,
            playerSilenced: false,
            botSilenced: false,
            lastPlayerSkill: 'none',
            lastBotSkill: 'none',
            playerGambleGuess: null,
            botGambleGuess: null,
        });
    },

    selectCard: (index: number) => {
        const state = get();
        if (state.phase !== 'select') return;
        
        const card = state.playerHand[index];
        if (getCardManaCost(card) > state.playerMana) {
            // Cannot afford this card
            return;
        }

        set({ playerSelectedCardIndex: index, message: 'Card selected. Waiting for battle...', boardPlayerCard: null });
    },

    passTurn: () => {
        const state = get();
        if (state.phase !== 'select') return;

        // Player takes 10 penalty damage
        const newPlayerHP = Math.max(0, state.playerHP - 10);
        
        // Randomly discard 1 card from player and 1 from bot to keep hand sizes in sync for the remaining turns
        const newPlayerHand = [...state.playerHand];
        if (newPlayerHand.length > 0) {
            newPlayerHand.splice(Math.floor(Math.random() * newPlayerHand.length), 1);
        }

        const newBotHand = [...state.botHand];
        if (newBotHand.length > 0) {
            newBotHand.splice(Math.floor(Math.random() * newBotHand.length), 1);
        }

        // Apply Poison ticks if any
        let newPPoison = state.playerPoisonTurns;
        let finalPlayerHP = newPlayerHP;
        if (newPPoison > 0) {
            finalPlayerHP = Math.max(0, finalPlayerHP - 10);
            newPPoison--;
        }
        let newBPoison = state.botPoisonTurns;
        let finalBotHP = state.botHP;
        if (newBPoison > 0) {
            finalBotHP = Math.max(0, finalBotHP - 10);
            newBPoison--;
        }

        // Regen mana
        const newPlayerMana = Math.min(10, state.playerMana + 2);
        const newBotMana = Math.min(10, state.botMana + 2);

        // Turn management
        let nextTurn = state.turnCount + 1;
        let isGameOver = false;
        let resultMsg = "";

        if (nextTurn > 5 || finalPlayerHP <= 0 || finalBotHP <= 0) {
            isGameOver = true;
            if (finalPlayerHP > finalBotHP) resultMsg = "คุณเป็นฝ่ายชนะ!";
            else if (finalBotHP > finalPlayerHP) resultMsg = "คุณเป็นฝ่ายพ่ายแพ้!";
            else resultMsg = "ผลการต่อสู้เสมอกัน!";
        }

        // Natural field resets to null unless next turn is a designated field turn
        let nextField: ElementType | null = null;
        if (!isGameOver && state.fieldTurns.includes(nextTurn)) {
            const elements: ElementType[] = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];
            nextField = elements[Math.floor(Math.random() * elements.length)];
        }

        set({
            playerHand: newPlayerHand,
            botHand: newBotHand,
            playerHP: Math.min(100, finalPlayerHP),
            botHP: Math.min(100, finalBotHP),
            playerMana: newPlayerMana,
            botMana: newBotMana,
            playerPoisonTurns: newPPoison,
            botPoisonTurns: newBPoison,
            playerSilenced: false,
            botSilenced: false,
            turnCount: nextTurn,
            phase: isGameOver ? 'gameover' : 'select',
            resultMessage: resultMsg,
            activeField: nextField,
            message: 'ผู้เล่นข้ามเทิร์น! เสีย HP บทลงโทษ 10 หน่วย และสุ่มทิ้งการ์ด 1 ใบ',
        });
    },

    playTurn: () => {
        const { phase, playerSelectedCardIndex, playerHand, botHand, activeField, turnCount, botMana, playerSilenced, botSilenced } = get();
        if (phase !== 'select' || playerSelectedCardIndex === null) return;

        // Bot AI Selection - must be able to afford the card's mana cost
        const affordableChoices = botHand
            .map((card, index) => ({ card, index }))
            .filter(item => getCardManaCost(item.card) <= botMana);

        let botIndex = 0;
        let botPasses = false;

        if (affordableChoices.length > 0) {
            let bestScore = -Infinity;
            affordableChoices.forEach(({ card, index }) => {
                let score = card.power; // Base score is power

                // 1. Field Advantage (Massive Bonus)
                if (activeField && card.element === activeField) {
                    score += 30; // Highly prioritize playing field-buffed cards
                }

                // 2. Absolute Elements (Secondary Priority)
                if (card.element === 'light' || card.element === 'dark') {
                    score += 5; // Light/Dark have flat advantages in neutral matchups
                }

                // 3. Unpredictability Variance
                score += Math.random() * 15;

                // 4. Early Game Strategy (Save high power cards)
                if (turnCount <= 2 && card.power >= 80) {
                    if (Math.random() < 0.75) {
                        score -= 60;
                    }
                } else if (turnCount >= 4) {
                    if (card.power >= 80) {
                        score += 20;
                    }
                }

                // 5. Bluffing / Mixing it up
                if (Math.random() < 0.15) {
                    score += (100 - card.power) * 0.5;
                }

                if (score > bestScore) {
                    bestScore = score;
                    botIndex = index;
                }
            });
        } else {
            // Bot cannot afford any card: must discard a random card and take pass penalty
            botPasses = true;
            botIndex = Math.floor(Math.random() * botHand.length);
        }

        const playerCard = playerHand[playerSelectedCardIndex];
        const botCard = botHand[botIndex];

        // Deduct Mana immediately upon playing
        const pManaCost = getCardManaCost(playerCard);
        const bManaCost = getCardManaCost(botCard);
        
        let newPlayerMana = get().playerMana;
        let newBotMana = get().botMana;

        if (newPlayerMana >= pManaCost) newPlayerMana -= pManaCost;
        if (!botPasses && newBotMana >= bManaCost) newBotMana -= bManaCost;

        // Remove from hand
        const newPlayerHand = [...playerHand];
        newPlayerHand.splice(playerSelectedCardIndex, 1);

        const newBotHand = [...botHand];
        newBotHand.splice(botIndex, 1);

        // Only player with active (unsilenced) gamble skill triggers gamble_select modal
        let nextPhase: GamePhase = 'reveal';
        if (playerCard.skill === 'gamble' && !playerSilenced) {
            nextPhase = 'gamble_select';
        }

        // If bot has active gamble, bot guesses autonomously without prompting player
        let nextBotGamble: ElementType | null = null;
        if (botCard.skill === 'gamble' && !botSilenced) {
            const elements: ElementType[] = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];
            nextBotGamble = elements[Math.floor(Math.random() * elements.length)];
        }

        set({
            playerHand: newPlayerHand,
            botHand: newBotHand,
            playerMana: newPlayerMana,
            botMana: newBotMana,
            playerSelectedCardIndex: null,
            botSelectedCardIndex: null,
            boardPlayerCard: playerCard,
            boardBotCard: botCard,
            phase: nextPhase,
            botGambleGuess: nextBotGamble,
            animationPhase: 'none',
            message: nextPhase === 'gamble_select' ? 'สกิลทายใจทำงาน! โปรดเลือกธาตุของศัตรู' : 'วางการ์ดลงบนสนาม! กำลังเปิดเผย...',
        });
    },

    selectGambleElement: (element: ElementType) => {
        set({ playerGambleGuess: element, phase: 'reveal', message: 'เลือกธาตุแล้ว! กำลังเปิดเผยการ์ด...' });
    },

    revealCards: () => {
        const state = get();
        let newActiveField = state.activeField;

        const pSkill = state.playerSilenced ? 'none' : state.boardPlayerCard?.skill;
        const bSkill = state.botSilenced ? 'none' : state.boardBotCard?.skill;

        if (pSkill === 'field_control' && bSkill === 'field_control') {
            newActiveField = null;
        } else if (pSkill === 'field_control') {
            newActiveField = state.boardPlayerCard!.element;
        } else if (bSkill === 'field_control') {
            newActiveField = state.boardBotCard!.element;
        }

        set({ phase: 'resolve', animationPhase: 'revealing', activeField: newActiveField });
    },

    finishAnimation: () => {
        set({ animationPhase: 'none' });
    },

    resolveRound: () => {
        const state = get();
        const { boardPlayerCard, boardBotCard } = state;
        if (!boardPlayerCard || !boardBotCard) return;

        // Make copies of cards to mutate for this round's calculation
        let pc = { ...boardPlayerCard };
        let bc = { ...boardBotCard };

        let turnMsg = "";
        let newPlayerHP = state.playerHP;
        let newBotHP = state.botHP;
        let newPlayerMana = state.playerMana;
        let newBotMana = state.botMana;

        // Check if currently silenced (silence blocks card skills from activating this round)
        let pSkill = state.playerSilenced ? 'none' : (pc.skill || 'none');
        let bSkill = state.botSilenced ? 'none' : (bc.skill || 'none');

        if (state.playerSilenced) {
            turnMsg += "ผู้เล่นถูกใบ้ ไม่สามารถใช้สกิลได้! ";
        }
        if (state.botSilenced) {
            turnMsg += "ศัตรูถูกใบ้ ไม่สามารถใช้สกิลได้! ";
        }

        let nextPlayerHand = state.playerHand;
        let nextBotHand = state.botHand;

        // Soul Swap
        if (pSkill === 'soul_swap' && bSkill === 'soul_swap') {
            turnMsg += "ทั้งสองฝ่ายใช้สลับวิญญาณพร้อมกัน ผลลัพธ์จึงหักล้าง! ";
        } else if (pSkill === 'soul_swap') {
            const tempHP = newPlayerHP;
            newPlayerHP = newBotHP;
            newBotHP = tempHP;
            nextPlayerHand = state.botHand;
            nextBotHand = state.playerHand;
            turnMsg += "ผู้เล่นใช้สลับวิญญาณ! สลับเลือดและการ์ดบนมือทั้งหมด! ";
        } else if (bSkill === 'soul_swap') {
            const tempHP = newPlayerHP;
            newPlayerHP = newBotHP;
            newBotHP = tempHP;
            nextPlayerHand = state.botHand;
            nextBotHand = state.playerHand;
            turnMsg += "ศัตรูใช้สลับวิญญาณ! สลับเลือดและการ์ดบนมือทั้งหมด! ";
        }

        // Field Control
        let currentField = state.activeField;
        if (pSkill === 'field_control' && bSkill === 'field_control') {
            turnMsg += "สนามพลังปะทะกันจนสลายไปสู่ความว่างเปล่า! ";
        } else if (pSkill === 'field_control') {
            turnMsg += `สนามเปลี่ยนเป็นธาตุ ${currentField?.toUpperCase()}! `;
        } else if (bSkill === 'field_control') {
            turnMsg += `ศัตรูเปลี่ยนสนามเป็นธาตุ ${currentField?.toUpperCase()}! `;
        }

        // Silence Application for NEXT turn (lasts exactly 1 turn)
        const nextPlayerSilenced = (bSkill === 'silence');
        const nextBotSilenced = (pSkill === 'silence');

        if (nextBotSilenced) turnMsg += "สกิลใบ้ทำงาน! ศัตรูจะถูกใบ้ในเทิร์นถัดไป ";
        if (nextPlayerSilenced) turnMsg += "สกิลใบ้ทำงาน! ผู้เล่นจะถูกใบ้ในเทิร์นถัดไป ";

        // Store skills for next turn
        const lastPlayerSkill = pSkill;
        const lastBotSkill = bSkill;

        // Calculate Pre-Clash Power
        let pp = pc.power;
        let bp = bc.power;

        // Mimic Power: copies opponent's card base power
        if (pSkill === 'mimic') {
            pp = bc.power;
            turnMsg += `ผู้เล่นเลียนแบบพลังการ์ดศัตรู (${bc.power})! `;
        }
        if (bSkill === 'mimic') {
            bp = pc.power;
            turnMsg += `ศัตรูเลียนแบบพลังการ์ดผู้เล่น (${pc.power})! `;
        }

        // Field Buffs
        let pHasFieldBuff = pc.element === currentField;
        let bHasFieldBuff = bc.element === currentField;

        // Pierce
        if (pSkill === 'pierce') {
            bHasFieldBuff = false; // Ignore opponent's field buff
            pp += 10;
            turnMsg += "ผู้เล่นใช้เจาะเกราะ (+10 พลัง และทะลวงสนามศัตรู)! ";
        }
        if (bSkill === 'pierce') {
            pHasFieldBuff = false; // Ignore opponent's field buff
            bp += 10;
            turnMsg += "ศัตรูใช้เจาะเกราะ (+10 พลัง และทะลวงสนามผู้เล่น)! ";
        }

        if (pHasFieldBuff) pp += 25;
        if (bHasFieldBuff) bp += 25;

        // PHASE 3: Clash & Gamble
        let pGambleSuccess = pSkill === 'gamble' && state.playerGambleGuess === bc.element;
        let bGambleSuccess = bSkill === 'gamble' && state.botGambleGuess === pc.element;

        let pAbsorbedPower = pGambleSuccess ? bp : 0;
        let bAbsorbedPower = bGambleSuccess ? pp : 0;

        if (pGambleSuccess) {
            turnMsg += "ผู้เล่นทายธาตุถูก! ดูดพลังศัตรูมาเป็น 0 ";
            pp += pAbsorbedPower;
            bp = 0;
        }
        if (bGambleSuccess) {
            turnMsg += "ศัตรูทายธาตุถูก! ดูดพลังผู้เล่นมาเป็น 0 ";
            bp += bAbsorbedPower;
            pp = 0;
        }

        // Damage Calculation
        const calcBaseDamage = (attackerP: number, defenderP: number) => Math.max(0, attackerP - defenderP);

        // Apply Field Defense: Halve incoming damage unless attacker has pierce
        const calcDamage = (baseDamage: number, defenderElement: ElementType, attackerHasPierce: boolean) => {
            if (defenderElement === currentField && !attackerHasPierce) return Math.ceil(baseDamage / 2);
            return baseDamage;
        };

        const hasAdvantage = (el1: ElementType, el2: ElementType) => {
            if (el1 === 'water' && el2 === 'fire') return true;
            if (el1 === 'wind' && el2 === 'water') return true;
            if (el1 === 'earth' && el2 === 'wind') return true;
            if (el1 === 'fire' && el2 === 'earth') return true;
            return false;
        };

        const isAbsolute = (el: ElementType) => el === 'light' || el === 'dark';

        let winner: 'player' | 'bot' | 'draw' = 'draw';
        let pDamageDealt = 0;
        let bDamageDealt = 0;

        let reason = "";

        if (pp > bp) {
            pDamageDealt = calcDamage(pp - bp, bc.element, pSkill === 'pierce');
            winner = 'player';
            reason = "ผู้เล่นมีพลังโจมตีสูงกว่า";
        } else if (bp > pp) {
            bDamageDealt = calcDamage(bp - pp, pc.element, bSkill === 'pierce');
            winner = 'bot';
            reason = "ศัตรูมีพลังโจมตีสูงกว่า";
        } else {
            // Power is equal, check elemental advantages
            if (isAbsolute(pc.element) && !isAbsolute(bc.element)) {
                pDamageDealt = calcDamage(20, bc.element, pSkill === 'pierce');
                winner = 'player';
                reason = "ผู้เล่นชนะด้วยธาตุศักดิ์สิทธิ์ (แสง/มืด)";
            } else if (isAbsolute(bc.element) && !isAbsolute(pc.element)) {
                bDamageDealt = calcDamage(20, pc.element, bSkill === 'pierce');
                winner = 'bot';
                reason = "ศัตรูชนะด้วยธาตุศักดิ์สิทธิ์ (แสง/มืด)";
            } else if (hasAdvantage(pc.element, bc.element)) {
                pDamageDealt = calcDamage(10, bc.element, pSkill === 'pierce');
                winner = 'player';
                reason = "ผู้เล่นชนะด้วยการแพ้ชนะทางธาตุ";
            } else if (hasAdvantage(bc.element, pc.element)) {
                bDamageDealt = calcDamage(10, pc.element, bSkill === 'pierce');
                winner = 'bot';
                reason = "ศัตรูชนะด้วยการแพ้ชนะทางธาตุ";
            } else {
                pDamageDealt = 10;
                bDamageDealt = 10;
                winner = 'draw';
                reason = "พลังและธาตุเสมอกัน";
            }
        }

        if (winner === 'player') turnMsg += `${reason}! ศัตรูโดนดาเมจ ${pDamageDealt} หน่วย `;
        else if (winner === 'bot') turnMsg += `${reason}! ผู้เล่นโดนดาเมจ ${bDamageDealt} หน่วย `;
        else turnMsg += `เสมอ! โดนดาเมจฝั่งละ 10 หน่วย `;

        // PHASE 4: Post-Damage Skills (Reflect, Lifesteal, Heal)
        let pFinalDamageTaken = bDamageDealt;
        let bFinalDamageTaken = pDamageDealt;

        // Reflect
        if (winner === 'bot' && pSkill === 'reflect') {
            const reflected = Math.floor(pFinalDamageTaken * 0.3);
            bFinalDamageTaken += reflected;
            turnMsg += `ผู้เล่นสะท้อนดาเมจกลับไป ${reflected} หน่วย! `;
        }
        if (winner === 'player' && bSkill === 'reflect') {
            const reflected = Math.floor(bFinalDamageTaken * 0.3);
            pFinalDamageTaken += reflected;
            turnMsg += `ศัตรูสะท้อนดาเมจกลับมา ${reflected} หน่วย! `;
        }

        // Apply final damage
        newPlayerHP -= pFinalDamageTaken;
        newBotHP -= bFinalDamageTaken;

        // Lifesteal & Heal
        if (pSkill === 'lifesteal') {
            const healAmount = winner === 'player' ? pDamageDealt : Math.floor(bDamageDealt / 2);
            newPlayerHP += healAmount;
            turnMsg += `ผู้เล่นดูดเลือดฟื้นฟู +${healAmount} HP! `;
        }
        if (bSkill === 'lifesteal') {
            const healAmount = winner === 'bot' ? bDamageDealt : Math.floor(pDamageDealt / 2);
            newBotHP += healAmount;
            turnMsg += `ศัตรูดูดเลือดฟื้นฟู +${healAmount} HP! `;
        }

        if (pSkill === 'heal') {
            const healAmount = winner === 'player' ? pDamageDealt : bDamageDealt;
            newPlayerHP += healAmount;
            turnMsg += `ผู้เล่นฟื้นฟูพลังชีวิต +${healAmount} HP! `;
        }
        if (bSkill === 'heal') {
            const healAmount = winner === 'bot' ? bDamageDealt : pDamageDealt;
            newBotHP += healAmount;
            turnMsg += `ศัตรูฟื้นฟูพลังชีวิต +${healAmount} HP! `;
        }

        // Mana Burst
        if (pSkill === 'mana_burst') {
            newPlayerMana += 2;
            turnMsg += "สกิลระเบิดมานาทำงาน! ผู้เล่นได้รับมานาเพิ่ม 2 หน่วย ";
        }
        if (bSkill === 'mana_burst') {
            newBotMana += 2;
            turnMsg += "สกิลระเบิดมานาทำงาน! ศัตรูได้รับมานาเพิ่ม 2 หน่วย ";
        }

        // PHASE 5: End Turn (Poison, State Cleanup)
        let newPPoison = state.playerPoisonTurns;
        let newBPoison = state.botPoisonTurns;

        if (pSkill === 'poison') {
            newBPoison = 3;
            turnMsg += "ผู้เล่นใช้สกิลพิษ! ศัตรูติดพิษเป็นเวลา 3 เทิร์น ";
        }
        if (bSkill === 'poison') {
            newPPoison = 3;
            turnMsg += "ศัตรูใช้สกิลพิษ! ผู้เล่นติดพิษเป็นเวลา 3 เทิร์น ";
        }

        if (newPPoison > 0) {
            newPlayerHP -= 10;
            newPPoison--;
            turnMsg += "ผู้เล่นโดนดาเมจพิษ 10 หน่วย! ";
        }
        if (newBPoison > 0) {
            newBotHP -= 10;
            newBPoison--;
            turnMsg += "ศัตรูโดนดาเมจพิษ 10 หน่วย! ";
        }

        const nextTurn = state.turnCount + 1;
        newPlayerMana = Math.min(10, newPlayerMana + 2); // Cap at 10
        newBotMana = Math.min(10, newBotMana + 2);

        // Random Field generation for the NEXT turn
        let nextField: ElementType | null = null;
        if (state.fieldTurns.includes(nextTurn)) {
            const elements: ElementType[] = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];
            nextField = elements[Math.floor(Math.random() * elements.length)];
        }

        set({
            playerHP: Math.min(100, Math.max(0, newPlayerHP)),
            botHP: Math.min(100, Math.max(0, newBotHP)),
            message: turnMsg,
            phase: 'evaluate',
            animationPhase: 'none',
            roundWinner: winner,
            turnCount: nextTurn,
            activeField: currentField, // Update immediately for field_control
            pendingField: nextField, // Applied next turn if random generated
            
            playerMana: newPlayerMana,
            botMana: newBotMana,
            playerPoisonTurns: newPPoison,
            botPoisonTurns: newBPoison,
            playerSilenced: nextPlayerSilenced,
            botSilenced: nextBotSilenced,
            lastPlayerSkill,
            lastBotSkill,
            playerHand: nextPlayerHand,
            botHand: nextBotHand,
        });
    },

    applyPendingField: () => {
        const { pendingField } = get();
        set({ activeField: pendingField });
    }
}));
