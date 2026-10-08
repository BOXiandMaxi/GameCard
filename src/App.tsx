import GameBoard from './components/GameBoard';
import UIOverlay from './components/UIOverlay';
import MainMenu from './components/MainMenu';
import CardCollectionModal from './components/CardCollectionModal';
import SettingsModal from './components/SettingsModal';
import DetailCardModal from './components/DetailCardModal';
import { useGameStore } from './store/gameStore';

function App() {
  const appState = useGameStore(state => state.appState);

  return (
    <div className="w-full h-screen text-stone-200 bg-stone-950 relative overflow-hidden" style={{ fontFamily: '"Cinzel", serif' }}>
      {appState === 'menu' && <MainMenu />}
      
      {appState === 'playing' && (
        <>
          {/* Static Ambient Overlay for Game Background to unify 3D with 2D */}
          <div className="absolute inset-0 pointer-events-none z-0 mix-blend-overlay opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stucco.png')]" />
          <GameBoard />
          <UIOverlay />
        </>
      )}

      {/* Adding Modals universally */}
      <CardCollectionModal />
      <SettingsModal />
      <DetailCardModal />

      {/* Decorative Title Only visible in Game */}
      {appState === 'playing' && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center hidden md:block drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)]">
          <h2 className="text-amber-500 font-bold tracking-[0.8em] uppercase text-xs mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
             Mythos
          </h2>
          <h1 className="text-4xl font-black tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-400 to-amber-900 opacity-90" style={{ fontFamily: '"Cinzel Decorative", serif' }}>
            PANTHEON OF SOULS
          </h1>
        </div>
      )}
    </div>
  );
}

export default App;
