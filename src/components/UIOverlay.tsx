import { useEffect, useState } from 'react';
import { useGameStore, getCardManaCost } from '../store/gameStore';
import AncientButton from './AncientButton';

export default function UIOverlay() {
    const {
        playerHP, botHP, phase, message, resultMessage, activeField,
        playerMana, botMana, playerPoisonTurns, botPoisonTurns, playerSilenced, botSilenced,
        initGame, playTurn, revealCards, resolveRound, applyPendingField, selectGambleElement,
        passTurn, playerHand
    } = useGameStore();

    const canPlayAnyCard = playerHand.some(card => getCardManaCost(card) <= playerMana);
    const [showSoulSwap, setShowSoulSwap] = useState(false);

    // Initialize game on first mount
    useEffect(() => {
        initGame();
    }, [initGame]);

    // Handle game loop phases
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (phase === 'deal') {
            timeout = setTimeout(() => {
                const state = useGameStore.getState();
                if (state.phase === 'deal') {
                    useGameStore.setState({
                        phase: 'select',
                        message: 'Select a card from your hand to play!'
                    });
                }
            }, 3000); // 3 seconds total for 5 cards to finish flying to hand
        } else if (phase === 'reveal') {
            timeout = setTimeout(() => revealCards(), 1500);
        } else if (phase === 'resolve') {
            // Wait 2000ms for reveal effects to play out
            timeout = setTimeout(() => {
                const state = useGameStore.getState();
                if (state.phase === 'resolve') {
                    // Turn off reveal effects to allow them to fade out smoothly
                    useGameStore.setState({ animationPhase: 'none' });

                    // Wait 1200ms for fade out and pause, then launch attack
                    setTimeout(() => {
                        const s2 = useGameStore.getState();
                        if (s2.phase === 'resolve') {
                            useGameStore.setState({ animationPhase: 'attacking' });

                            // Calculate dynamic wait time for animations
                            let explosionWait = 2500;
                            const pCard = s2.boardPlayerCard;
                            const bCard = s2.boardBotCard;
                            const aField = s2.activeField;

                            if (pCard && bCard) {
                                const pSilenced = s2.playerSilenced;
                                const bSilenced = s2.botSilenced;

                                let pBase = pCard.power + (!pSilenced && pCard.skill === 'pierce' ? 10 : 0);
                                let bBase = bCard.power + (!bSilenced && bCard.skill === 'pierce' ? 10 : 0);
                                if (!pSilenced && pCard.skill === 'mimic') pBase = bCard.power;
                                if (!bSilenced && bCard.skill === 'mimic') bBase = pCard.power;

                                const pHasPierce = !pSilenced && pCard.skill === 'pierce';
                                const bHasPierce = !bSilenced && bCard.skill === 'pierce';

                                let pp = pBase + (pCard.element === aField && !bHasPierce ? 25 : 0);
                                let bp = bBase + (bCard.element === aField && !pHasPierce ? 25 : 0);

                                let pGambleSuccess = !pSilenced && pCard.skill === 'gamble' && s2.playerGambleGuess === bCard.element;
                                let bGambleSuccess = !bSilenced && bCard.skill === 'gamble' && s2.botGambleGuess === pCard.element;
                                let pAbsorb = pGambleSuccess ? bp : 0;
                                let bAbsorb = bGambleSuccess ? pp : 0;
                                if (pGambleSuccess) { pp += pAbsorb; bp = 0; }
                                if (bGambleSuccess) { bp += bAbsorb; pp = 0; }

                                const isCounterAttack = (pBase <= bBase && pp > bp) || (bBase <= pBase && bp > pp);
                                if (isCounterAttack) {
                                    explosionWait = 4900; // Longer wait for shield + counter sequence
                                }
                            }

                            // Wait for attack animation to hit target and explosions to play out
                            // This delays the state.resolveRound() call which triggers the loser card fly-away
                            setTimeout(() => {
                                const s3 = useGameStore.getState();
                                if (s3.phase === 'resolve') s3.resolveRound();
                            }, explosionWait);
                        }
                    }, 1200);
                }
            }, 2000);
        } else if (phase === 'evaluate') {
            timeout = setTimeout(() => {
                const state = useGameStore.getState();
                if (state.playerHP <= 0 || state.botHP <= 0 || state.playerHand.length === 0) {
                    let resultMsg = "";
                    if (state.playerHP > state.botHP) resultMsg = "คุณเป็นฝ่ายชนะ!";
                    else if (state.botHP > state.playerHP) resultMsg = "คุณเป็นฝ่ายพ่ายแพ้!";
                    else resultMsg = "ผลการต่อสู้เสมอกัน!";

                    useGameStore.setState({ phase: 'gameover', resultMessage: resultMsg, boardPlayerCard: null, boardBotCard: null });
                } else {
                    applyPendingField();
                    useGameStore.setState({
                        phase: 'select',
                        boardPlayerCard: null,
                        boardBotCard: null,
                        message: 'เลือกการ์ดใบถัดไปเพื่อเริ่มการต่อสู้'
                    });
                }
            }, 3000); // 3 seconds to read the damage message before next round
        }
        return () => clearTimeout(timeout);
    }, [phase, revealCards, resolveRound]);

    useEffect(() => {
        const state = useGameStore.getState();
        const pSkill = state.playerSilenced ? 'none' : state.boardPlayerCard?.skill;
        const bSkill = state.botSilenced ? 'none' : state.boardBotCard?.skill;
        if (phase === 'resolve' && (pSkill === 'soul_swap' || bSkill === 'soul_swap') && (pSkill !== bSkill)) {
            setShowSoulSwap(true);
            setTimeout(() => setShowSoulSwap(false), 2000);
        }
    }, [phase]);

    return (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8">
            {/* Soul Swap Visual */}
            {showSoulSwap && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="text-6xl font-black text-fuchsia-400 uppercase tracking-[0.5em] animate-pulse drop-shadow-[0_0_30px_rgba(217,70,239,1)] mix-blend-screen" style={{ textShadow: '0 0 20px #fff, 0 0 40px #d946ef' }}>
                        สลับวิญญาณ! ⚡
                    </div>
                </div>
            )}
            {/* Top Bar - Bot Stats */}
            <div className="flex justify-between items-start">
                <div className="bg-stone-900/90 backdrop-blur p-5 border-[3px] border-amber-900/60 pointer-events-auto shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_10px_20px_rgba(0,0,0,0.8)] relative rounded-sm overflow-hidden 
                before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] before:opacity-50 before:pointer-events-none">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-amber-700 drop-shadow-md mb-2 relative z-10 uppercase tracking-widest">Enemy God</h2>
                    <div className="w-72 h-6 bg-stone-950 rounded-sm overflow-hidden border-2 border-stone-800 shadow-inner relative z-10">
                        <div
                            className="h-full bg-gradient-to-r from-red-800 to-amber-600 transition-all duration-500 relative"
                            style={{ width: `${Math.max(0, (botHP / 100) * 100)}%` }}
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-stone-400 font-bold tracking-[0.2em] relative z-10">{botHP} / 100 SOULS</p>
                    <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-2 relative z-10">
                            <span className="text-blue-400 font-bold">MANA</span>
                            <div className="flex gap-1">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className={`w-3 h-3 rounded-full border border-blue-900 ${i < botMana ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-stone-800'}`}></div>
                                ))}
                            </div>
                        </div>
                        {botPoisonTurns > 0 && <span className="text-purple-500 font-bold animate-pulse text-2xl drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" title={`Poisoned (${botPoisonTurns} turns left)`}>☠️</span>}
                        {botSilenced && <span className="text-stone-400 font-bold text-2xl drop-shadow-[0_0_8px_rgba(120,113,108,0.8)]" title="Silenced">🤐</span>}
                    </div>
                </div>
            </div>

            {/* Field Indicator */}
            {activeField && phase !== 'gameover' && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-stone-900/90 backdrop-blur-md px-10 py-4 border-[3px] border-amber-900/50 shadow-[0_10px_30px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none transition-all duration-1000 z-50 rounded-sm overflow-hidden 
                before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] before:opacity-30 before:pointer-events-none">
                    <h3 className="relative z-10 text-3xl font-black text-amber-600 tracking-[0.3em] uppercase flex items-center gap-6" style={{ fontFamily: '"Cinzel Decorative", serif', textShadow: '2px 2px 4px #000' }}>
                        <span className="text-stone-500 text-xl tracking-[0.2em]">DOMAIN SEAL</span>
                        <span className={`drop-shadow-[0_0_15px_currentColor] ${activeField === 'fire' ? 'text-red-500' :
                            activeField === 'water' ? 'text-blue-400' :
                                activeField === 'earth' ? 'text-amber-500' :
                                    activeField === 'wind' ? 'text-emerald-300' :
                                        activeField === 'light' ? 'text-yellow-200' :
                                            activeField === 'dark' ? 'text-purple-400' : 'text-white'
                            }`}>
                            {activeField}
                        </span>
                    </h3>
                </div>
            )}

            {/* Center - Messages & Actions */}
            <div className="text-center flex-1 flex flex-col justify-end items-center pointer-events-none pb-12">
                {phase === 'evaluate' && (
                    <h2 className="text-4xl font-bold text-amber-500 drop-shadow-[0_2px_15px_rgba(0,0,0,1)] bg-stone-900/90 backdrop-blur-md px-12 py-6 border-[3px] border-amber-700/50 mb-8 transition-all relative overflow-hidden uppercase tracking-[0.1em] text-center
                     before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] before:opacity-50 before:pointer-events-none">
                        <span className="relative z-10" style={{ textShadow: '2px 2px 4px #000, -1px -1px 0 rgba(245,158,11,0.2)' }}>{message}</span>
                    </h2>
                )}

                {phase === 'select' && useGameStore.getState().playerSelectedCardIndex !== null && (
                    <AncientButton onClick={playTurn} label="Invoke Ritual" isPrimary={true} />
                )}

                {phase === 'select' && !canPlayAnyCard && (
                    <div className="flex flex-col items-center gap-4 pointer-events-auto mt-4">
                        <p className="text-red-500 font-bold text-lg bg-black/80 px-4 py-2 rounded-lg animate-pulse border border-red-900 shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                            Insufficient mana for all cards!
                        </p>
                        <button 
                            onClick={passTurn}
                            className="px-8 py-3 bg-red-900/90 hover:bg-red-700 border-2 border-red-500 text-white font-bold tracking-widest uppercase rounded shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:shadow-[0_0_25px_rgba(239,68,68,0.8)] transition-all"
                        >
                            Pass Turn (-10 HP)
                        </button>
                    </div>
                )}

                {phase === 'gamble_select' && (
                    <div className="bg-stone-900/95 backdrop-blur-md p-8 border-[3px] border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.5)] rounded-lg pointer-events-auto">
                        <h2 className="text-2xl font-black text-amber-500 mb-6 uppercase tracking-widest text-center" style={{ fontFamily: '"Cinzel Decorative", serif' }}>
                            Predict Enemy Element
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            {(['fire', 'water', 'earth', 'wind', 'light', 'dark'] as const).map(el => (
                                <button
                                    key={el}
                                    onClick={() => selectGambleElement(el)}
                                    className="px-6 py-4 bg-stone-800 hover:bg-stone-700 border-2 border-stone-600 hover:border-amber-500 transition-colors uppercase font-bold tracking-wider rounded text-white"
                                >
                                    {el}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Bar - Player Stats */}
            <div className="flex justify-between items-end">
                <div className="bg-stone-900/90 backdrop-blur p-5 border-[3px] border-amber-900/60 pointer-events-auto shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_10px_20px_rgba(0,0,0,0.8)] relative rounded-sm overflow-hidden 
                before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] before:opacity-50 before:pointer-events-none">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-600 drop-shadow-md mb-2 relative z-10 uppercase tracking-widest text-right">You</h2>
                    <div className="w-72 h-6 bg-stone-950 rounded-sm overflow-hidden border-2 border-stone-800 shadow-inner relative z-10">
                        <div
                            className="h-full bg-gradient-to-l from-teal-500 to-blue-800 transition-all duration-500 relative ml-auto"
                            style={{ width: `${Math.max(0, (playerHP / 100) * 100)}%` }}
                        >
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-stone-400 font-bold tracking-[0.2em] relative z-10 text-right">{playerHP} / 100 SOULS</p>
                    <div className="flex justify-end gap-4 mt-2">
                        {playerSilenced && <span className="text-stone-400 font-bold text-2xl drop-shadow-[0_0_8px_rgba(120,113,108,0.8)]" title="Silenced">🤐</span>}
                        {playerPoisonTurns > 0 && <span className="text-purple-500 font-bold animate-pulse text-2xl drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" title={`Poisoned (${playerPoisonTurns} turns left)`}>☠️</span>}
                        <div className="flex items-center gap-2 relative z-10">
                            <div className="flex gap-1">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className={`w-3 h-3 rounded-full border border-blue-900 ${i < playerMana ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-stone-800'}`}></div>
                                ))}
                            </div>
                            <span className="text-blue-400 font-bold">MANA</span>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-auto bg-stone-900/80 backdrop-blur px-6 py-4 rounded-sm text-stone-400 text-sm border-2 border-amber-900/50 shadow-xl overflow-hidden relative
                before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] before:opacity-40 before:pointer-events-none tracking-wider">
                    <p className="relative z-10 text-amber-500/80 mb-1 font-black tracking-widest">𓁿 DIVINE CONTROLS 𓁿</p>
                    <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-900/80 to-transparent mb-2 relative z-10"></div>
                    <p className="relative z-10 mt-1">👆 L-Click: Invoke Card</p>
                    <p className="relative z-10 mt-1">🖱️ Drag: Observe Realm</p>
                    <p className="relative z-10 mt-1">📜 Scroll: Focus Vision</p>
                </div>
            </div>

            {/* Game Over Screen */}
            {phase === 'gameover' && (
                <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-md pointer-events-auto flex flex-col justify-center items-center z-50">
                    <div className="relative">
                        <div className="absolute -inset-10 bg-amber-500/20 blur-[100px] rounded-full pointer-events-none" />
                        <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-600 to-amber-900 tracking-widest drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)] mb-8 relative z-10" style={{ fontFamily: '"Cinzel Decorative", serif' }}>
                            THE END
                        </h1>
                    </div>
                    <h2 className="text-5xl font-bold text-amber-500 mb-12 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(0,0,0,1)] relative z-10" style={{ textShadow: '2px 2px 4px #000' }}>{resultMessage}</h2>

                    <div className="flex gap-16 mb-16 relative z-10">
                        <div className="text-center bg-stone-900 p-8 border-[3px] border-amber-900/60 shadow-[inset_0_0_30px_rgba(0,0,0,0.9),0_15px_30px_rgba(0,0,0,0.8)] relative overflow-hidden w-64
                         before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] before:opacity-40 before:pointer-events-none rounded-[4px]">
                            <p className="text-amber-600 mb-4 uppercase tracking-[0.3em] text-sm font-bold relative z-10 drop-shadow-md">Your Souls</p>
                            <p className="text-7xl font-black text-blue-500 relative z-10 drop-shadow-lg" style={{ textShadow: '2px 2px 4px #000' }}>{playerHP}</p>
                        </div>
                        <div className="text-center bg-stone-900 p-8 border-[3px] border-amber-900/60 shadow-[inset_0_0_30px_rgba(0,0,0,0.9),0_15px_30px_rgba(0,0,0,0.8)] relative overflow-hidden w-64
                         before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] before:opacity-40 before:pointer-events-none rounded-[4px]">
                            <p className="text-amber-600 mb-4 uppercase tracking-[0.3em] text-sm font-bold relative z-10 drop-shadow-md">Enemy Souls</p>
                            <p className="text-7xl font-black text-red-600 relative z-10 drop-shadow-lg" style={{ textShadow: '2px 2px 4px #000' }}>{botHP}</p>
                        </div>
                    </div>

                    <AncientButton onClick={initGame} label="เล่นอีกครั้ง" isPrimary={true} />
                </div>
            )}
        </div>
    );
}
