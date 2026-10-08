import { useGameStore, ALL_CARDS, getCardRarity, getCardManaCost } from '../store/gameStore';
import { getSkillInfo } from './Card3D';
import { X } from 'lucide-react';

export default function CardCollectionModal() {
    const isCollectionOpen = useGameStore(state => state.isCollectionOpen);
    const toggleCollection = useGameStore(state => state.toggleCollection);
    const setDetailCard = useGameStore(state => state.setDetailCard);

    if (!isCollectionOpen) return null;

    return (
        <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8" style={{ fontFamily: '"Cinzel", serif' }}>
            {/* Modal Container */}
            <div className="bg-stone-950 border-[3px] border-amber-900/60 w-full max-w-7xl max-h-[90vh] rounded-sm flex flex-col shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_0_100px_rgba(0,0,0,1)] z-50 overflow-hidden relative animate-in fade-in drop-shadow-2xl" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/concrete-wall.png')", backgroundBlendMode: 'multiply' }}>

                {/* Header */}
                <div className="flex justify-between items-center mb-8 pb-4 border-b-[3px] border-amber-900/60 shrink-0 relative p-8 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                    <div className="absolute -inset-4 bg-amber-500/5 blur-3xl rounded-full" />
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-500 to-amber-700 tracking-[0.2em] py-2 drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)] relative z-10" style={{ fontFamily: '"Cinzel Decorative", serif' }}>
                        SACRED LIBRARY
                    </h1>
                    <button
                        onClick={toggleCollection}
                        className="relative z-50 pointer-events-auto text-amber-500 hover:text-amber-300 bg-stone-800 border-[3px] border-stone-600 hover:border-amber-500 hover:bg-stone-700 p-3 rounded-[4px] shadow-[inset_0_0_15px_rgba(0,0,0,0.9),0_5px_10px_rgba(0,0,0,0.8)] active:translate-y-1 transition-all cursor-pointer before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] before:opacity-60 before:mix-blend-overlay before:pointer-events-none overflow-hidden"
                    >
                        <X className="w-8 h-8 relative z-10 drop-shadow-md" />
                    </button>
                </div>

            {/* Grid Container */}
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-8">
                    {ALL_CARDS.map(card => {
                        const effectiveRarity = card.rarity || getCardRarity(card.power);
                        const manaCost = getCardManaCost(card);
                        const skillInfo = card.skill && card.skill !== 'none' ? getSkillInfo(card.skill) : null;

                        let borderColor = 'border-stone-700';
                        if (effectiveRarity === 'uncommon') borderColor = 'border-amber-800/80';
                        if (effectiveRarity === 'rare') borderColor = 'border-amber-600';
                        if (effectiveRarity === 'ssr') borderColor = 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]';

                        return (
                            <div 
                                key={card.id}
                                onClick={() => setDetailCard(card)}
                                className={`relative rounded-xl overflow-hidden cursor-pointer group border-2 ${borderColor} transition-all hover:scale-105 hover:z-10 shadow-xl bg-stone-900/90 flex flex-col`}
                            >
                                {/* Card Artwork - completely clear without any blocking overlays on element or title */}
                                <div className="w-full relative overflow-hidden bg-stone-950">
                                    <img 
                                        src={card.image} 
                                        alt={`Card ${card.id}`} 
                                        className="w-full h-auto object-contain drop-shadow-lg opacity-95 group-hover:opacity-100 transition-opacity" 
                                    />
                                </div>
                                
                                {/* Footer Info Bar: Summon Mana Orb & Skill Badge (No redundant power number, no blocking of art) */}
                                <div className="px-2.5 py-2 bg-stone-950/95 border-t border-amber-900/50 flex items-center justify-between gap-1.5 font-sans">
                                    {/* ลูกแก้วการอัญเชิญ (Summon Orb) */}
                                    <div 
                                        className="flex items-center gap-1.5 shrink-0" 
                                        title={`ลูกแก้วอัญเชิญ: ${manaCost} มานา`}
                                    >
                                        <div className="bg-blue-950 border-2 border-blue-400 rounded-full w-7 h-7 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                                            <span className="text-white font-black text-xs drop-shadow-md">{manaCost}</span>
                                        </div>
                                        <span className="text-blue-300 font-bold text-[11px] uppercase tracking-wider hidden lg:inline">มานา</span>
                                    </div>

                                    {/* ไอคอนและชื่อสกิล (Skill Badge) */}
                                    {skillInfo && (
                                        <div 
                                            className="flex items-center gap-1 bg-stone-900/90 border border-stone-700/80 px-2 py-1 rounded shadow-sm overflow-hidden"
                                            title={skillInfo.desc}
                                        >
                                            <span className="text-sm leading-none shrink-0">{skillInfo.icon}</span>
                                            <span className={`text-[11px] font-bold ${skillInfo.color} truncate max-w-[80px]`}>
                                                {skillInfo.name.split(' ')[0]}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Custom scrollbar styling block just for this modal */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(28, 25, 23, 0.8);
                    border-radius: 5px;
                    border: 1px solid rgba(120, 53, 15, 0.2);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(180, 83, 9, 0.4);
                    border-radius: 5px;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(217, 119, 6, 0.8);
                }
            `}</style>
            </div>
        </div>
    );
}
