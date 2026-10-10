import { useGameStore, getCardRarity, getCardManaCost } from '../store/gameStore';
import { getSkillInfo } from './Card3D';
import { X } from 'lucide-react';

export default function DetailCardModal() {
    const { selectedDetailCard, detailCardContext, playerSilenced, botSilenced, setDetailCard } = useGameStore();

    if (!selectedDetailCard) return null;

    const { id, image, power, element, rarity, skill } = selectedDetailCard;
    const effectiveRarity = rarity || getCardRarity(power);
    const silenced = detailCardContext?.kind === 'playerHand' ? playerSilenced
        : detailCardContext?.kind === 'botHand' ? botSilenced : false;
    const manaCost = detailCardContext?.manaCost ?? getCardManaCost(selectedDetailCard, silenced);
    const skillInfo = getSkillInfo(skill);

    // Styling logic based on element
    let elementColor = 'text-stone-300';
    let bgGlow = 'rgba(214,211,209,0.2)';
    
    switch (element) {
        case 'fire': elementColor = 'text-red-500'; bgGlow = 'rgba(220, 38, 38, 0.4)'; break;
        case 'water': elementColor = 'text-blue-400'; bgGlow = 'rgba(59, 130, 246, 0.4)'; break;
        case 'earth': elementColor = 'text-amber-500'; bgGlow = 'rgba(217, 119, 6, 0.4)'; break;
        case 'wind': elementColor = 'text-emerald-400'; bgGlow = 'rgba(16, 185, 129, 0.4)'; break;
        case 'light': elementColor = 'text-yellow-400'; bgGlow = 'rgba(250, 204, 21, 0.5)'; break;
        case 'dark': elementColor = 'text-purple-500'; bgGlow = 'rgba(147, 51, 234, 0.4)'; break;
    }

    // Border and Glow logic based on rarity
    const isSSR = effectiveRarity === 'ssr';
    let rarityColor = 'text-stone-400';
    let borderColor = 'border-stone-700/80';
    let rarityLabel = 'MORTAL';

    if (effectiveRarity === 'uncommon') { rarityColor = 'text-amber-700'; borderColor = 'border-amber-900/80'; rarityLabel = 'AWAKENED'; }
    if (effectiveRarity === 'rare') { rarityColor = 'text-amber-500'; borderColor = 'border-amber-700/80'; rarityLabel = 'DIVINE'; }
    if (isSSR) { rarityColor = 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]'; borderColor = 'border-yellow-500/80'; rarityLabel = 'MYTHIC'; }

    return (
        <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-xl z-[110] flex items-center justify-center p-4" style={{ fontFamily: '"Cinzel", serif' }}>
            
            {/* Main Modal Box */}
            <div 
                className="bg-stone-900 border-[3px] border-amber-800/60 w-full max-w-5xl rounded-sm flex flex-col md:flex-row gap-10 p-8 shadow-[inset_0_0_100px_rgba(0,0,0,0.8),0_0_100px_rgba(245,158,11,0.15)] relative animate-in zoom-in-95 duration-300 z-50 overflow-hidden" 
                style={{ 
                    backgroundImage: "url('https://www.transparenttextures.com/patterns/concrete-wall.png')", 
                    backgroundBlendMode: 'multiply',
                    borderColor: isSSR ? 'rgba(250, 204, 21, 0.6)' : 'rgba(180, 83, 9, 0.4)',
                    boxShadow: isSSR ? `0 0 50px ${bgGlow}, inset 0 0 20px rgba(250, 204, 21, 0.2)` : `0 0 30px ${bgGlow}`
                }}
            >
                {/* Background Hieroglyphs inside Modal */}
                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none opacity-[0.02]">
                    <div className="absolute inset-0 flex flex-wrap content-start text-5xl text-amber-500 break-words leading-none p-4 tracking-widest gap-2">
                        𓀀 𓀁 𓀂 𓀃 𓀄 𓀅 𓀆 𓀇 𓀈 𓀉 𓀊 𓀋 𓀌 𓀍 𓀎 𓀏 𓀐 𓀑 𓀒 𓀓
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setDetailCard(null)}
                    className="absolute top-6 right-6 text-stone-400 hover:text-amber-400 bg-stone-800/80 border-2 border-stone-700 hover:bg-stone-700 hover:border-amber-600 p-3 rounded-full z-50 cursor-pointer shadow-lg hover:shadow-amber-500/30 transition-all pointer-events-auto"
                >
                    <X className="w-8 h-8" />
                </button>

                {/* Left Side: Card Image */}
                <div className="w-full md:w-1/2 flex justify-center items-center shrink-0 relative z-10">
                    <div 
                        className={`relative rounded-xl overflow-hidden ${borderColor} border-4 transition-transform hover:scale-105 duration-500 bg-stone-950`}
                        style={{
                            boxShadow: isSSR ? '0 0 40px rgba(250, 204, 21, 0.3)' : '0 10px 30px rgba(0,0,0,0.8)',
                            maxHeight: '600px'
                        }}
                    >
                        <img 
                            src={image} 
                            alt={`Card ${id}`} 
                            className="w-full h-auto object-contain"
                        />
                        {/* Shimmer Effect for SSR */}
                        {isSSR && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-200/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                        )}
                    </div>
                </div>

                {/* Right Side: Details */}
                <div className="w-full md:w-1/2 flex flex-col justify-center text-left space-y-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4 font-sans">
                            <span className={`px-4 py-1.5 rounded-sm text-xs font-black tracking-[0.2em] bg-stone-950 border ${borderColor} ${rarityColor}`}>
                                {rarityLabel}
                            </span>
                            <span className={`px-4 py-1.5 rounded-sm text-xs font-black tracking-[0.2em] bg-stone-950 border border-stone-800 uppercase ${elementColor}`}>
                                {element}
                            </span>
                        </div>
                        <h2 className={`text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-stone-200 to-stone-500 uppercase tracking-wider ${isSSR ? 'from-yellow-200 to-amber-600 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]' : ''}`}>
                            Relic #{id}
                        </h2>
                    </div>

                    <div className="py-6 border-y border-amber-900/40 relative">
                        {/* Decorative element line */}
                        <div className="absolute top-0 left-0 w-16 h-[2px] bg-amber-600/50" />
                        <div className="absolute bottom-0 right-0 w-16 h-[2px] bg-amber-600/50" />
                        
                        <p className="text-amber-700/80 text-sm uppercase font-black tracking-[0.3em] mb-2 font-sans">Divine Power</p>
                        <div className="flex items-baseline gap-2 font-sans">
                            <span className={`text-7xl font-black ${isSSR ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-stone-300 drop-shadow-md'}`}>
                                {power}
                            </span>
                            <span className="text-stone-600 text-2xl font-bold tracking-widest">/ 100</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center py-4 border-b border-amber-900/40">
                        <div>
                            <p className="text-amber-700/80 text-sm uppercase font-black tracking-[0.3em] mb-1 font-sans">Cost</p>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-black text-blue-400 drop-shadow-md">{manaCost}</span>
                                <span className="text-blue-900 font-bold tracking-widest uppercase">Mana</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-amber-700/80 text-sm uppercase font-black tracking-[0.3em] mb-1 font-sans">Skill</p>
                            {skillInfo ? (
                                <div className="flex items-center justify-end gap-2">
                                    <span className="text-2xl drop-shadow-md">{skillInfo.icon}</span>
                                    <span className={`text-lg font-black ${skillInfo.color} drop-shadow-md tracking-wider`}>
                                        {skillInfo.name}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xl font-black text-stone-500 drop-shadow-md uppercase tracking-wider">None</span>
                            )}
                        </div>
                    </div>

                    {skillInfo && (
                        <div className="bg-stone-950/80 border border-amber-800/60 p-4 rounded-lg shadow-inner">
                            <p className="text-amber-500 font-bold text-sm mb-1 font-sans flex items-center gap-2">
                                <span>{skillInfo.icon}</span>
                                <span>{skillInfo.name}</span>
                            </p>
                            <p className="text-stone-300 text-sm font-sans leading-relaxed">
                                {skillInfo.desc}
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <p className="text-stone-400 text-lg leading-relaxed font-sans font-medium">
                            This relic harnesses the ancient soul of <span className={`font-black uppercase tracking-widest ${elementColor}`}>{element}</span>. 
                            {power > 90 
                                ? ' It is a legendary force to be reckoned with on the battlefield, capable of altering fate itself.' 
                                : ' It provides reliable strength from the ancients to overpower mortal foes.'}
                        </p>
                        
                        {isSSR && (
                            <div className="bg-amber-950/40 border border-amber-700/50 p-4 rounded-lg relative overflow-hidden mt-6">
                                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
                                <p className="text-yellow-500/90 text-sm font-sans pl-2 flex items-center">
                                    <span className="font-black text-2xl mr-3 leading-none opacity-80">𓋹</span>
                                    <span><strong className="tracking-widest uppercase">Mythic Resonance:</strong> Overwhelming advantage in elemental clashes.</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Tailwind Shimmer animation just for this component */}
            <style>
                {`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                `}
            </style>
        </div>
    );
}
