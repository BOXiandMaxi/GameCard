import { useGameStore } from '../store/gameStore';
import { Settings, Play, BookOpen } from 'lucide-react';
import React from 'react';
import AncientButton from './AncientButton';
import { audioManager } from '../utils/audioManager';

export default function MainMenu() {
    const setAppState = useGameStore(state => state.setAppState);
    const toggleSettings = useGameStore(state => state.toggleSettings);
    const toggleCollection = useGameStore(state => state.toggleCollection);
    const initGame = useGameStore(state => state.initGame);

    const handleStartGame = () => {
        audioManager.init();
        initGame();
        setAppState('playing');
    };

    // Cobweb SVG Component
    const Cobweb = ({ className }: { className?: string }) => (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3">
            <path d="M0,0 L100,0 L100,100 Z" fill="rgba(0,0,0,0.1)" stroke="none" />
            <path d="M0,0 L100,100 M0,0 L100,50 M0,0 L50,100 M0,0 L100,25 M0,0 L25,100" />
            <path d="M20,0 Q20,20 0,20 M40,0 Q40,40 0,40 M60,0 Q60,60 0,60 M80,0 Q80,80 0,80 M100,0 Q100,100 0,100" />
            <path d="M0,50 Q20,50 20,40 Q40,40 40,30 Q60,30 60,20 Q80,20 80,10" strokeDasharray="2,2" />
        </svg>
    );

    // Scary Ghost Spider SVG with randomized actions
    const GhostSpider = () => {
        const [animClass, setAnimClass] = React.useState('');

        React.useEffect(() => {
            let timeout1: ReturnType<typeof setTimeout>;
            let timeout2: ReturnType<typeof setTimeout>;

            const triggerSpider = () => {
                const animations = [
                    { name: 'animate-[spider-scurry_16s_ease-in-out]', duration: 16000 },
                    { name: 'animate-[spider-drop_10s_ease-in-out]', duration: 10000 },
                    { name: 'animate-[spider-crawl-top_15s_linear]', duration: 15000 },
                    { name: 'animate-[spider-scurry-reverse_12s_ease-in-out]', duration: 12000 }
                ];

                const rand = animations[Math.floor(Math.random() * animations.length)];
                setAnimClass(rand.name);

                // Wait for the animation to finish
                timeout1 = setTimeout(() => {
                    setAnimClass('');
                    // Random delay between 4s and 10s before next spawn
                    timeout2 = setTimeout(triggerSpider, Math.random() * 6000 + 4000);
                }, rand.duration);
            };

            // Start first spider after a brief delay
            timeout2 = setTimeout(triggerSpider, 2000);

            return () => {
                clearTimeout(timeout1);
                clearTimeout(timeout2);
            };
        }, []);

        return (
            <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
                <div className={`absolute left-0 top-0 w-80 h-80 text-stone-950 blur-[2px] opacity-0 mix-blend-multiply drop-shadow-2xl ${animClass}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                        {/* Body */}
                        <ellipse cx="256" cy="280" rx="45" ry="80" />
                        {/* Head */}
                        <circle cx="256" cy="170" r="35" />
                        {/* Fangs */}
                        <path d="M245 135 L235 90 L250 110 Z" />
                        <path d="M267 135 L277 90 L262 110 Z" />
                        {/* Legs (left) */}
                        <g className="origin-[256px_280px] animate-[wiggle1_0.1s_ease-in-out_infinite_alternate]">
                            <path d="M226 170 Q130 130 90 60" stroke="currentColor" strokeWidth="18" fill="none" strokeLinecap="round" />
                        </g>
                        <g className="origin-[256px_280px] animate-[wiggle2_0.1s_ease-in-out_infinite_alternate]">
                            <path d="M216 200 Q70 190 30 130" stroke="currentColor" strokeWidth="20" fill="none" strokeLinecap="round" />
                        </g>
                        <g className="origin-[256px_280px] animate-[wiggle1_0.1s_ease-in-out_infinite_alternate]">
                            <path d="M216 250 Q100 320 60 420" stroke="currentColor" strokeWidth="20" fill="none" strokeLinecap="round" />
                        </g>
                        <g className="origin-[256px_280px] animate-[wiggle2_0.1s_ease-in-out_infinite_alternate]">
                            <path d="M226 310 Q150 370 110 490" stroke="currentColor" strokeWidth="18" fill="none" strokeLinecap="round" />
                        </g>
                        {/* Legs (right) */}
                        <g className="origin-[256px_280px] animate-[wiggle2_0.1s_ease-in-out_infinite_alternate]">
                            <path d="M286 170 Q382 130 422 60" stroke="currentColor" strokeWidth="18" fill="none" strokeLinecap="round" />
                        </g>
                        <g className="origin-[256px_280px] animate-[wiggle1_0.1s_ease-in-out_infinite_alternate]">
                            <path d="M296 200 Q442 190 482 130" stroke="currentColor" strokeWidth="20" fill="none" strokeLinecap="round" />
                        </g>
                        <g className="origin-[256px_280px] animate-[wiggle2_0.1s_ease-in-out_infinite_alternate]">
                            <path d="M296 250 Q412 320 452 420" stroke="currentColor" strokeWidth="20" fill="none" strokeLinecap="round" />
                        </g>
                        <g className="origin-[256px_280px] animate-[wiggle1_0.1s_ease-in-out_infinite_alternate]">
                            <path d="M286 310 Q362 370 402 490" stroke="currentColor" strokeWidth="18" fill="none" strokeLinecap="round" />
                        </g>
                    </svg>
                </div>
            </div>
        );
    };

    const GhostBat = () => {
        const [batAnim, setBatAnim] = React.useState('');

        React.useEffect(() => {
            let t1: ReturnType<typeof setTimeout>;
            let t2: ReturnType<typeof setTimeout>;

            const spawnBat = () => {
                const anims = [
                    { name: 'animate-[bat-fly-1_8s_linear]', duration: 8000 },
                    { name: 'animate-[bat-fly-2_10s_linear]', duration: 10000 }
                ];
                const rand = anims[Math.floor(Math.random() * anims.length)];
                setBatAnim(rand.name);

                t1 = setTimeout(() => {
                    setBatAnim('');
                    t2 = setTimeout(spawnBat, Math.random() * 5000 + 5000);
                }, rand.duration);
            };

            t2 = setTimeout(spawnBat, Math.random() * 3000);
            return () => { clearTimeout(t1); clearTimeout(t2); }
        }, []);

        return (
            <div className="absolute inset-0 pointer-events-none z-[90] overflow-hidden">
                <div className={`absolute left-0 top-0 w-32 h-32 text-stone-900 blur-[1px] opacity-0 mix-blend-multiply drop-shadow-xl ${batAnim}`}>
                    <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full animate-[bat-flap_0.15s_ease-in-out_infinite_alternate] origin-[50%_50%]">
                        <path d="M50 40 C30 20 10 30 0 50 C10 40 25 45 35 55 C45 65 50 80 50 80 C50 80 55 65 65 55 C75 45 90 40 100 50 C90 30 70 20 50 40 Z" />
                    </svg>
                </div>
            </div>
        )
    };

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-stone-950 overflow-hidden" style={{ fontFamily: '"Cinzel", serif' }}>
            <GhostSpider />
            <GhostBat />
            {/* Background Texture & Color */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-amber-950/40 to-stone-950" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stucco.png')] opacity-30 mix-blend-overlay" />

                {/* Floating Mystic Cards (Card Game Vibe) */}
                <div className="absolute top-[20%] left-[10%] w-28 h-40 border-2 border-amber-700/40 rounded-xl rotate-[-15deg] bg-stone-900/60 shadow-2xl animate-[float_6s_ease-in-out_infinite] backdrop-blur-md flex justify-center items-center">
                    <span className="text-4xl opacity-20 text-amber-500">𓁿</span>
                </div>
                <div className="absolute bottom-[10%] right-[10%] w-32 h-44 border-2 border-amber-700/40 rounded-xl -rotate-[20deg] bg-stone-900/60 shadow-2xl animate-[float_8s_ease-in-out_infinite_reverse] backdrop-blur-md flex justify-center items-center">
                    <span className="text-5xl opacity-20 text-amber-500">𓋹</span>
                </div>
                <div className="absolute top-[25%] right-[20%] w-24 h-36 border-2 border-stone-600/30 rounded-xl rotate-[25deg] bg-stone-900/40 shadow-[0_0_50px_rgba(245,158,11,0.1)] animate-[float_7s_ease-in-out_infinite] backdrop-blur-sm flex justify-center items-center">
                    <span className="text-5xl opacity-10 text-stone-300">𓃭</span>
                </div>

                {/* Cobwebs */}
                <Cobweb className="absolute top-0 right-0 w-80 h-80 text-stone-400 rotate-90 scale-y-[-1] opacity-70 drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]" />
                <Cobweb className="absolute top-0 left-0 w-64 h-64 text-stone-400 opacity-80 drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]" />
                <Cobweb className="absolute bottom-0 left-0 w-48 h-48 text-stone-400 scale-y-[-1] opacity-60 drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]" />

                {/* Spider (SVG) Hanging from Top Left */}
                <div className="absolute top-20 left-20 text-stone-500 flex flex-col items-center animate-[floatY_10s_ease-in-out_infinite]">
                    <div className="w-[1px] h-32 bg-stone-500/30 -mt-32 drop-shadow-md"></div>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-[0_0_10px_rgba(0,0,0,1)] text-stone-900 stroke-stone-600 stroke-[0.5]">
                        <path d="M12,14 a3,4 0 1,0 0,-8 a3,4 0 1,0 0,8 M12,18 a4,5 0 1,0 0,-10 a4,5 0 1,0 0,10 M5,12 C5,10 8,8 10,8 M19,12 C19,10 16,8 14,8 M3,16 C3,13 7,10 10,10 M21,16 C21,13 17,10 14,10 M4,20 C4,16 8,13 11,13 M20,20 C20,16 16,13 13,13 M7,23 C7,19 9,16 11,15 M17,23 C17,19 15,16 13,15" stroke="currentColor" strokeWidth="1" fill="none" />
                        <circle cx="12" cy="11" r="3" fill="currentColor" />
                        <circle cx="12" cy="16" r="4" fill="currentColor" />
                    </svg>
                </div>

                {/* Ancient Hieroglyphs Background Banner */}
                <div className="absolute inset-x-0 bottom-1/4 translate-y-1/2 opacity-[0.03] text-justify text-8xl font-black text-amber-500 overflow-hidden break-words leading-none px-4" style={{ userSelect: 'none' }}>
                    𓀀 𓀁 𓀂 𓀃 𓀄 𓀅 𓀆 𓀇 𓀈 𓀉 𓀊 𓀋 𓀌 𓀍 𓀎 𓀏 𓀐 𓀑 𓀒 𓀓 𓀔 𓀕 𓀖 𓀗 𓀘 𓀙 𓀚 𓀛 𓀜 𓀝 𓀞 𓀟 𓀠 𓀡 𓀢 𓀣 𓀤 𓀥 𓀦 𓀧 𓀨 𓀩 𓀪 𓀫 𓀬 𓀭 𓀮 𓀯 𓀰 𓀱 𓀲 𓀳 𓀴 𓀵 𓀶 𓀷 𓀸 𓀹 𓀺 𓀻 𓀼 𓀽 𓀾 𓀿 𓁀 𓁁 𓁂 𓁃 𓁄 𓁅 𓁆 𓁇 𓁈 𓁉 𓁊 𓁋 𓁌 𓁍 𓁎 𓁏 𓁐 𓁑 𓁒 𓁓 𓁔 𓁕 𓁖 𓁗 𓁘 𓁙 𓁚 𓁛 𓁜 𓁝 𓁞 𓁟 𓁠 𓁡 𓁢 𓁣 𓁤 𓁥 𓁦 𓁧 𓁨 𓁩 𓁪 𓁫 𓁬 𓁭 𓁮 𓁯 𓁰 𓁱 𓁲 𓁳 𓁴 𓁵 𓁶 𓁷 𓁸 𓁹 𓁺 𓁻 𓁼 𓁽 𓁾 𓁿 𓂀
                </div>
            </div>

            {/* Glowing Divine Halo */}
            <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-600/10 blur-[150px] rounded-full pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center mt-8 drop-shadow-2xl">

                {/* Title Section */}
                <div className="text-center relative">
                    <div className="absolute -inset-10 bg-amber-500/20 blur-3xl rounded-[100px]" />
                    <h2 className="text-amber-500 font-bold tracking-[1em] uppercase text-sm mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ml-4">
                        PANTHEON OF SOULS
                    </h2>
                    <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-400 to-amber-900 tracking-widest drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)]">
                        MYTHOS
                    </h1>
                    <div className="flex justify-center items-center gap-6 mt-8">
                        <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
                        <span className="text-amber-500 text-2xl drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">𓋹</span>
                        <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
                    </div>
                </div>

                {/* Buttons Menu */}
                <div className="flex flex-col gap-10 w-full max-w-[20rem] mt-16 mb-16">
                    <AncientButton icon={Play} label="GameStart" onClick={handleStartGame} isPrimary={true} />
                    <AncientButton icon={BookOpen} label="CardView" onClick={toggleCollection} />
                    <AncientButton icon={Settings} label="Settings" onClick={toggleSettings} />
                </div>
            </div>

            {/* Sub-Footer Decorative element */}
            <div className="absolute bottom-8 flex flex-col items-center gap-2 text-stone-600 opacity-60">
                <span className="text-xl">𓃰 𓃱 𓃲 𓃳</span>
                <div className="text-xs font-bold tracking-[0.2em] font-sans">
                    v1.0.0 © 2026 Ancient Gods Studio
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@700;900&display=swap');
                
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(var(--tw-rotate)); }
                    50% { transform: translateY(-20px) rotate(calc(var(--tw-rotate) - 5deg)); }
                }
                
                @keyframes floatY {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(15px); }
                }

                @keyframes wiggle1 { 0% { transform: rotate(-10deg); } 100% { transform: rotate(15deg); } }
                @keyframes wiggle2 { 0% { transform: rotate(15deg); } 100% { transform: rotate(-10deg); } }

                @keyframes spider-scurry {
                    0%   { transform: translate(-40vw, -20vh) rotate(160deg) scale(0.8); opacity: 0; }
                    5%   { transform: translate(-10vw, 30vh) rotate(160deg) scale(0.8); opacity: 0.6; }
                    8%   { transform: translate(15vw, 45vh) rotate(140deg) scale(0.6); opacity: 0.9; }
                    12%  { transform: translate(45vw, 60vh) rotate(130deg) scale(0.6); opacity: 0.8; }
                    15%  { transform: translate(55vw, 65vh) rotate(130deg) scale(0.5); opacity: 0.9; }
                    16%  { transform: translate(50vw, 55vh) rotate(-30deg) scale(0.9); opacity: 1; }
                    18%  { transform: translate(70vw, 10vh) rotate(-30deg) scale(1); opacity: 0.9; }
                    22%  { transform: translate(120vw, -40vh) rotate(-30deg) scale(0.7); opacity: 0; }
                    100% { transform: translate(120vw, -40vh) rotate(-30deg); opacity: 0; }
                }

                @keyframes spider-drop {
                    0%   { transform: translate(50vw, -40vh) rotate(180deg) scale(0.8); opacity: 0; }
                    15%  { transform: translate(50vw, 20vh) rotate(180deg) scale(1); opacity: 0.9; }
                    30%  { transform: translate(50vw, 30vh) rotate(180deg) scale(1); opacity: 1; }
                    40%  { transform: translate(50vw, 30vh) rotate(190deg) scale(1.1); opacity: 1; }
                    50%  { transform: translate(50vw, 28vh) rotate(170deg) scale(1); opacity: 1; }
                    60%  { transform: translate(50vw, 30vh) rotate(180deg) scale(1); opacity: 1; }
                    65%  { transform: translate(50vw, 30vh) rotate(300deg) scale(1.1); opacity: 1; } /* twist */
                    85%  { transform: translate(-20vw, -30vh) rotate(300deg) scale(0.8); opacity: 0; } /* scurry up-left */
                    100% { transform: translate(-20vw, -30vh) rotate(300deg) scale(0.8); opacity: 0; }
                }

                @keyframes spider-crawl-top {
                    0%   { transform: translate(120vw, -5vh) rotate(260deg) scale(0.6); opacity: 0; }
                    10%  { transform: translate(90vw, -5vh) rotate(260deg) scale(0.6); opacity: 0.6; }
                    50%  { transform: translate(40vw, 5vh) rotate(275deg) scale(0.6); opacity: 0.8; }
                    90%  { transform: translate(-10vw, -10vh) rotate(260deg) scale(0.6); opacity: 0.6; }
                    100% { transform: translate(-30vw, -10vh) rotate(260deg) scale(0.6); opacity: 0; }
                }

                @keyframes spider-scurry-reverse {
                    0%   { transform: translate(120vw, 70vh) rotate(300deg) scale(0.8); opacity: 0; }
                    15%  { transform: translate(80vw, 50vh) rotate(300deg) scale(0.7); opacity: 0.8; }
                    30%  { transform: translate(60vw, 60vh) rotate(250deg) scale(0.9); opacity: 1; } /* twitch down */
                    40%  { transform: translate(50vw, 80vh) rotate(250deg) scale(0.9); opacity: 0.9; }
                    50%  { transform: translate(40vw, 80vh) rotate(290deg) scale(0.6); opacity: 0.8; } /* twitch left */
                    80%  { transform: translate(-20vw, 10vh) rotate(290deg) scale(0.6); opacity: 0.6; }
                    100% { transform: translate(-30vw, 0vh) rotate(290deg); opacity: 0; }
                }

                @keyframes bat-fly-1 {
                    0%   { transform: translate(-20vw, 60vh) scale(0.4) rotate(10deg); opacity: 0; }
                    10%  { transform: translate(0vw, 50vh) scale(0.5) rotate(5deg); opacity: 0.5; }
                    50%  { transform: translate(50vw, 30vh) scale(0.7) rotate(-5deg); opacity: 0.8; }
                    90%  { transform: translate(100vw, 5vh) scale(0.5) rotate(-15deg); opacity: 0.5; }
                    100% { transform: translate(120vw, -10vh) scale(0.4) rotate(-20deg); opacity: 0; }
                }

                @keyframes bat-fly-2 {
                    0%   { transform: translate(120vw, 20vh) scale(0.3) rotate(-20deg); opacity: 0; }
                    10%  { transform: translate(100vw, 15vh) scale(0.4) rotate(-10deg); opacity: 0.4; }
                    50%  { transform: translate(40vw, 40vh) scale(0.6) rotate(5deg); opacity: 0.7; }
                    90%  { transform: translate(-10vw, 60vh) scale(0.4) rotate(15deg); opacity: 0.4; }
                    100% { transform: translate(-30vw, 70vh) scale(0.3) rotate(20deg); opacity: 0; }
                }

                @keyframes bat-flap {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(-0.3); }
                }
            `}</style>
        </div>
    );
}
