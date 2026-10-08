import { useGameStore } from '../store/gameStore';
import { X, Volume2, Monitor } from 'lucide-react';
import AncientButton from './AncientButton';

export default function SettingsModal() {
    const { isSettingsOpen, toggleSettings } = useGameStore();

    if (!isSettingsOpen) return null;

    return (
        <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" style={{ fontFamily: '"Cinzel", serif' }}>
            <div className="bg-stone-900 border-[3px] border-amber-900/60 rounded-sm p-8 w-full max-w-lg shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_0_50px_rgba(180,83,9,0.4)] relative animate-in fade-in zoom-in duration-200" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/concrete-wall.png')", backgroundBlendMode: 'multiply' }}>
                {/* Close Button */}
                <button
                    onClick={toggleSettings}
                    className="absolute top-6 right-6 text-stone-500 hover:text-amber-400 hover:bg-stone-700 bg-stone-800/80 p-3 rounded-full border border-stone-600/50 cursor-pointer z-50 shadow-lg hover:shadow-amber-500/30 transition-all pointer-events-auto"
                >
                    <X className="w-8 h-8" />
                </button>

                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-700 mb-8 border-b-2 border-amber-900/50 pb-4 text-center tracking-[0.2em] drop-shadow-md">
                    RITUAL SETTINGS
                </h2>

                <div className="space-y-8">
                    {/* Audio Settings Mock */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-amber-600 font-bold text-xl border-b border-stone-800 pb-2">
                            <Volume2 className="w-6 h-6" />
                            <h3 className="tracking-widest">Sounds of the Ancients</h3>
                        </div>
                        <div className="space-y-4 px-4 font-sans">
                            <div>
                                <div className="flex justify-between text-sm text-stone-400 mb-1 font-bold tracking-wide uppercase">
                                    <span>Master Echo</span>
                                    <span className="text-amber-500">80%</span>
                                </div>
                                <input type="range" className="w-full accent-amber-600" defaultValue={80} />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm text-stone-400 mb-1 font-bold tracking-wide uppercase">
                                    <span>Hymns (Music)</span>
                                    <span className="text-amber-500">60%</span>
                                </div>
                                <input type="range" className="w-full accent-amber-600" defaultValue={60} />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm text-stone-400 mb-1 font-bold tracking-wide uppercase">
                                    <span>Clash (SFX)</span>
                                    <span className="text-amber-500">100%</span>
                                </div>
                                <input type="range" className="w-full accent-amber-600" defaultValue={100} />
                            </div>
                        </div>
                    </div>

                    {/* Display Settings Mock */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-amber-600 font-bold text-xl border-b border-stone-800 pb-2">
                            <Monitor className="w-6 h-6" />
                            <h3 className="tracking-widest">Visions (Display)</h3>
                        </div>
                        <div className="flex gap-4 px-4 font-sans">
                            <label className="flex items-center gap-3 text-stone-300 font-bold tracking-wide uppercase cursor-pointer">
                                <input type="checkbox" className="accent-amber-500 w-5 h-5 rounded-sm" defaultChecked />
                                <span>Divine Quality Graphics</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-amber-900/50 flex justify-center">
                    <AncientButton onClick={toggleSettings} label="Seal Pact" />
                </div>
            </div>
        </div>
    );
}
