import { Canvas } from '@react-three/fiber';
import { useState, useEffect } from 'react';
import { OrbitControls, Float, Sparkles, Stars } from '@react-three/drei';
import Card3D from './Card3D';
import Effects3D, { DustRing, ElementalReveal, WeatherField, BackgroundEnvironment } from './Effects3D';
import { useGameStore, getCardRarity, getCardManaCost } from '../store/gameStore';
import type { CardData, ElementType } from '../store/gameStore';

import { useSpring, animated } from '@react-spring/three';

const Hand = ({ isPlayer, cards, selectedIdx, onSelect, isDealing = false, deckPosition }: { isPlayer: boolean, cards: CardData[], selectedIdx?: number | null, onSelect?: (i: number) => void, isDealing?: boolean, deckPosition: [number, number, number] }) => {
    const startX = -((cards.length - 1) * 2.5) / 2;
    // The group is positioned at [0, 4, 5] for player and [0, 4, -5] for bot.
    // To make cards start at the *world* center [0, 0, 0], we offset them in the opposite direction.
    // Player group pos: [0, 4, 5], rotation: [-0.2, 0, 0].

    // Using a simpler approach: if dealing, the target position from the Card3D's perspective needs to counter the parent group translation.
    // Instead of complex math, we pass the group offset to Card3D to let it compute world 0.
    const groupPos = [0, isPlayer ? 4 : 4, isPlayer ? 5 : -5];

    return (
        <group position={groupPos as [number, number, number]} rotation={[isPlayer ? -0.2 : 0.2, 0, 0]}>
            {cards.map((card: CardData, i: number) => {
                const isSelected = selectedIdx === i;
                // dealIndex dictates rendering order for the stack height.
                return (
                    <Card3D
                        key={`${isPlayer ? 'p' : 'b'}-${card.id}-${i}`}
                        imageUrl={card.image}
                        position={[startX + i * 2.5, isSelected ? 1 : 0, isSelected ? -1 : 0]}
                        rotation={[0, 0, 0]}
                        isFlipped={isPlayer} // bot cards face down
                        isSelectable={isPlayer}
                        isSelected={isSelected}
                        onClick={() => isPlayer && onSelect && onSelect(i)}
                        onRightClick={() => useGameStore.getState().setDetailCard(card)}
                        isDealing={isDealing}
                        dealIndex={i}
                        deckPosition={deckPosition}
                        parentGroupOffset={groupPos as [number, number, number]}
                        rarity={card.rarity || getCardRarity(card.power)}
                        manaCost={getCardManaCost(card)}
                        skill={card.skill}
                    />
                );
            })}
        </group>
    );
};

const Board = () => {
    const { boardPlayerCard, boardBotCard, phase, animationPhase, roundWinner } = useGameStore();

    const isRevealed = phase === 'resolve' || phase === 'evaluate' || phase === 'gameover';
    const isRevealEffectsActive = phase === 'resolve' && animationPhase === 'revealing';

    return (
        <group position={[0, 0.2, 0]}>
            {boardPlayerCard !== null && (
                <group>
                    <Card3D
                        imageUrl={boardPlayerCard.image}
                        position={[0, 0.1, 2]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        isFlipped={isRevealed}
                        isLoser={phase === 'evaluate' && (roundWinner === 'bot' || roundWinner === 'draw')}
                        rarity={boardPlayerCard.rarity || getCardRarity(boardPlayerCard.power)}
                        manaCost={getCardManaCost(boardPlayerCard)}
                        skill={boardPlayerCard.skill}
                    />
                    {phase === 'reveal' && <DustRing position={[0, 0.1, 2]} />}
                    <ElementalReveal active={isRevealEffectsActive} element={boardPlayerCard.element} position={[0, 0.1, 2]} />
                </group>
            )}
            {boardBotCard !== null && (
                <group>
                    <Card3D
                        imageUrl={boardBotCard.image}
                        position={[0, 0.1, -2]}
                        rotation={[-Math.PI / 2, 0, Math.PI]} // rotate to face player from opposite side
                        isFlipped={isRevealed}
                        isLoser={phase === 'evaluate' && (roundWinner === 'player' || roundWinner === 'draw')}
                        rarity={boardBotCard.rarity || getCardRarity(boardBotCard.power)}
                        manaCost={getCardManaCost(boardBotCard)}
                        skill={boardBotCard.skill}
                    />
                    {phase === 'reveal' && <DustRing position={[0, 0.1, -2]} />}
                    <ElementalReveal active={isRevealEffectsActive} element={boardBotCard.element} position={[0, 0.1, -2]} />
                </group>
            )}
        </group>
    );
};

export default function GameBoard() {
    const {
        playerHand, botHand, playerSelectedCardIndex, selectCard, phase, activeField
    } = useGameStore();

    const [renderField, setRenderField] = useState<ElementType | null>(null);

    useEffect(() => {
        if (activeField) {
            setRenderField(activeField);
        } else {
            const t = setTimeout(() => setRenderField(null), 2000);
            return () => clearTimeout(t);
        }
    }, [activeField]);

    const { bg, ambientIntensity, dirIntensity, pointIntensity } = useSpring({
        bg: activeField ? '#000000' : '#050a1f',
        ambientIntensity: activeField ? 0.1 : 0.5,
        dirIntensity: activeField ? 0 : 1.5,
        pointIntensity: activeField ? 0 : 1.5,
        config: { duration: 2500 }
    }) as any;

    return (
        <div className="w-full h-full relative">
            <Canvas shadows camera={{ position: [0, 8, 10], fov: 45 }}>
                {/* Dynamically shift background to pitch black when weather field is active */}
                <animated.color attach="background" args={[bg]} />

                {/* Global Lighting */}
                <animated.ambientLight intensity={ambientIntensity} />
                <animated.directionalLight castShadow position={[5, 10, 5]} intensity={dirIntensity} shadow-mapSize={[1024, 1024]} />
                <animated.pointLight position={[0, 5, 0]} intensity={pointIntensity} color="#e0e7ff" />

                {/* 3D Background Environments (Nature, Fire, Water, etc.) */}
                <BackgroundEnvironment activeField={activeField} />

                {/* Weather Field layer (particles over the board) */}
                {renderField && <WeatherField key={renderField} element={renderField} active={activeField === renderField} />}

                {/* Stars in neutral background */}
                {!activeField && <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />}

                {/* Ring Visualizer */}
                <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[9.5, 9.7, 64]} />
                    <meshBasicMaterial color={activeField ? '#ffffff' : '#fcd34d'} opacity={activeField ? 0.3 : 0.6} transparent />
                </mesh>
                <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[4.5, 4.6, 64]} />
                    <meshBasicMaterial color={activeField ? '#ffffff' : '#fcd34d'} opacity={activeField ? 0.1 : 0.3} transparent />
                </mesh>

                {/* Central God Arena */}
                <group position={[0, -0.2, 0]}>
                    {/* Main Platform */}
                    <mesh receiveShadow>
                        <cylinderGeometry args={[14, 15, 0.5, 64]} />
                        <meshStandardMaterial color="#8b4513" roughness={0.8} metalness={0.2} />
                    </mesh>

                    {/* Inner Gold Ring */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.26, 0]}>
                        <ringGeometry args={[8, 8.2, 64]} />
                        <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={1} emissive="#b45309" emissiveIntensity={0.5} />
                    </mesh>

                    {/* Outer Gold Ring */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.26, 0]}>
                        <ringGeometry args={[13.5, 13.8, 64]} />
                        <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={1} />
                    </mesh>

                    {/* Arena Sparkles */}
                    <Sparkles count={300} scale={28} size={2} speed={0.4} opacity={0.3} color="#e0e7ff" position={[0, 3, 0]} />
                </group>

                {/* Floating Ancient Pillars */}
                {[...Array(8)].map((_, i) => {
                    const angle = (i / 8) * Math.PI * 2;
                    const radius = 18;
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    return (
                        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={1.5} key={i}>
                            <mesh position={[x, 4 + Math.sin(i * 123) * 3, z]} castShadow receiveShadow>
                                <cylinderGeometry args={[0.8, 0.8, 12, 16]} />
                                <meshStandardMaterial color="#cbd5e1" roughness={0.6} metalness={0.2} />
                            </mesh>
                            {/* Gold bands on pillars */}
                            <mesh position={[x, -2 + Math.sin(i * 123) * 3, z]}>
                                <cylinderGeometry args={[1.0, 1.0, 1, 16]} />
                                <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={1} />
                            </mesh>
                            <mesh position={[x, 10 + Math.sin(i * 123) * 3, z]}>
                                <cylinderGeometry args={[1.0, 1.0, 1, 16]} />
                                <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={1} />
                            </mesh>
                        </Float>
                    )
                })}

                <Hand isPlayer={true} cards={playerHand} selectedIdx={playerSelectedCardIndex} onSelect={selectCard} isDealing={phase === 'deal'} deckPosition={[-6, 0.3, 0]} />
                <Hand isPlayer={false} cards={botHand} isDealing={phase === 'deal'} deckPosition={[6, 0.3, 0]} />
                <Board />
                <Effects3D />

                <OrbitControls
                    makeDefault
                    minPolarAngle={Math.PI / 10}
                    maxPolarAngle={Math.PI / 2.1}
                    minDistance={5}
                    maxDistance={25}
                />
            </Canvas>
        </div>
    );
}
