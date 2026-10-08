export default function AncientButton({ icon: Icon, label, onClick, isPrimary = false, className = '' }: any) {
    const shadowBase = isPrimary 
        ? "shadow-[inset_0_0_40px_rgba(0,0,0,0.9),0_10px_20px_rgba(0,0,0,0.8),0_12px_0_rgba(28,25,23,1)]" 
        : "shadow-[inset_0_0_30px_rgba(0,0,0,0.9),0_6px_10px_rgba(0,0,0,0.8),0_8px_0_rgba(28,25,23,1)]";
    const shadowActive = "active:shadow-[inset_0_0_40px_rgba(0,0,0,0.9),0_2px_5px_rgba(0,0,0,0.8),0_0px_0_rgba(28,25,23,1)]";
    const translateY = isPrimary ? "active:translate-y-[12px]" : "active:translate-y-[8px]";
    const padding = isPrimary ? "px-10 py-6" : "px-8 py-5";
    const border = isPrimary ? "border-[3px]" : "border-2";
    const text = isPrimary ? "text-3xl" : "text-xl";
    const iconSize = isPrimary ? "w-8 h-8" : "w-6 h-6";

    return (
        <button
            onClick={onClick}
            className={`group relative z-10 pointer-events-auto flex items-center justify-center gap-4 ${padding} ${text} ${border} bg-stone-800 border-stone-600 hover:border-amber-500 ${shadowBase} hover:bg-stone-700 ${translateY} ${shadowActive} text-amber-500 hover:text-amber-300 transition-all duration-150 uppercase tracking-[0.2em] rounded-[4px] overflow-hidden before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] before:opacity-60 before:mix-blend-overlay before:pointer-events-none ${className}`}
            style={{ fontFamily: '"Cinzel Decorative", serif' }}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-600/20 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            {Icon && <Icon className={`${iconSize} fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]`} />}
            <span className="relative z-10 font-bold" style={{ textShadow: '2px 2px 4px #000, -1px -1px 0 rgba(245,158,11,0.2)' }}>
                {label}
            </span>
        </button>
    )
}
