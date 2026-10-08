import { useState, useRef } from 'react';
import { RoundedBox, PresentationControls, Html, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useSpring, a } from '@react-spring/three';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import type { Rarity, SkillType } from '../store/gameStore';

interface Card3DProps {
    imageUrl: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    isFlipped?: boolean; // true = face up, false = back
    isSelectable?: boolean;
    onClick?: () => void;
    onRightClick?: () => void;
    inspectMode?: boolean;
    isLoser?: boolean;
    isSelected?: boolean;
    isDealing?: boolean;
    dealIndex?: number;
    deckPosition?: [number, number, number];
    parentGroupOffset?: [number, number, number];
    rarity?: Rarity;
    manaCost?: number;
    skill?: SkillType;
}

export const getSkillInfo = (skill?: SkillType) => {
    switch (skill) {
        case 'lifesteal': return { name: 'Lifesteal (ดูดเลือด)', desc: 'ถ้าชนะ ฮีล 100% | ถ้าแพ้ ฮีล 50% ของดาเมจที่โดน', icon: '🩸', color: 'text-red-400' };
        case 'reflect': return { name: 'Reflect (สะท้อน)', desc: 'สะท้อน 30% ของดาเมจกลับไปหาศัตรู', icon: '🛡️', color: 'text-amber-700' };
        case 'pierce': return { name: 'Pierce (เจาะเกราะ)', desc: 'ทำลายบัฟสนามของศัตรู และเพิ่มพลังตัวเอง +10', icon: '💥', color: 'text-orange-400' };
        case 'soul_swap': return { name: 'Soul Swap (สลับวิญญาณ)', desc: 'สลับ HP และไพ่ทั้งหมดบนมือกับศัตรูทันที (10 มานา)', icon: '⚡', color: 'text-fuchsia-400' };
        case 'no_mana': return { name: 'No Mana (ไร้มานา)', desc: 'สามารถใช้งานการ์ดใบนี้ได้ฟรีๆ (0 มานา)', icon: '🆓', color: 'text-blue-300' };
        case 'heal': return { name: 'Heal (ฟื้นฟู)', desc: 'ฟื้นฟูเลือดคืน 100% จากดาเมจที่ทำได้หรือที่ได้รับ', icon: '💖', color: 'text-emerald-400' };
        case 'gamble': return { name: 'Gamble (ทายใจ)', desc: 'ถ้าทายธาตุถูก จะดูดพลังศัตรูมาบวกเพิ่มให้ตัวเอง', icon: '🎲', color: 'text-amber-400' };
        case 'field_control': return { name: 'Field Control (คุมพื้นที่)', desc: 'เปลี่ยนสนามเป็นธาตุตัวเองทันที ได้รับโบนัส +25', icon: '🌍', color: 'text-indigo-400' };
        case 'poison': return { name: 'Poison (พิษ)', desc: 'ศัตรูติดพิษ โดนดาเมจเทิร์นละ 10 เป็นเวลา 3 เทิร์น', icon: '☠️', color: 'text-purple-400' };
        case 'silence': return { name: 'Silence (ใบ้)', desc: 'ทำให้ศัตรูในเทิร์นหน้าสกิลใบ้ ไม่สามารถใช้สกิลได้', icon: '🤐', color: 'text-stone-400' };
        case 'mimic': return { name: 'Mimic (เลียนแบบ)', desc: 'ก๊อปปี้พลังโจมตีตั้งต้นของการ์ดที่ศัตรูลงมา', icon: '🎭', color: 'text-pink-400' };
        case 'mana_burst': return { name: 'Mana Burst (ระเบิดมานา)', desc: 'หลังจากจบการต่อสู้ จะได้รับมานาคืน 2 หน่วย', icon: '💎', color: 'text-blue-400' };
        default: return null;
    }
};

const ShatterMesh = ({ texture, progressSpring, position, rotation }: any) => {
    const materialRef = useRef<any>(null);

    useFrame(() => {
        if (materialRef.current) {
            // Read current value from spring
            materialRef.current.uProgress = progressSpring.get();
        }
    });

    return (
        <mesh position={position} rotation={rotation}>
            <planeGeometry args={[1.9, 2.9, 32, 32]} />
            {/* @ts-ignore */}
            <shatterMaterial ref={materialRef} uTexture={texture} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
    );
};

export default function Card3D({
    imageUrl,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    isFlipped = false,
    isSelectable = false,
    onClick,
    onRightClick,
    inspectMode = false,
    isLoser = false,
    isSelected = false,
    isDealing = false,
    dealIndex = 0,
    deckPosition = [0, 0, 0],
    parentGroupOffset = [0, 0, 0],
    rarity = 'normal',
    manaCost,
    skill = 'none'
}: Card3DProps) {
    const [hovered, setHovered] = useState(false);
    const materialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

    let edgeColor = '#8b5a2b'; // normal (brown)
    if (rarity === 'uncommon') edgeColor = '#94a3b8'; // silver
    if (rarity === 'rare') edgeColor = '#fbbf24'; // gold
    if (rarity === 'ssr') edgeColor = '#fff'; // will animate

    useFrame((state) => {
        if (rarity === 'ssr' && materialRefs.current) {
            const hue = (state.clock.elapsedTime * 0.5) % 1;
            materialRefs.current.forEach(mat => {
                if (mat) mat.color.setHSL(hue, 1, 0.6);
            });
        }
    });

    // Spring animation for flipping and moving
    // Back of card is rotated Math.PI around Y axis

    // The parent group offset determines if this is the Player or Bot deck.
    const isPlayer = parentGroupOffset[2] > 0;

    // We want to avoid cards flying THROUGH other resting cards.
    // The player's deck is on the left (-X), so cards should deal rights-to-left. 
    // This means high dealIndex (slot 4, far right) deals FIRST.
    // Bot deck is on the right (+X), so deals left-to-rights (slot 0, far left deals FIRST).
    const drawOrder = isPlayer ? (4 - dealIndex) : dealIndex;

    // Inverse rotation to counter the parent Hand group's tilt (so the deck lies flat on the arena table).
    // Player Hand has -0.2 on X. Bot Hand has +0.2 on X.
    const parentRotX = isPlayer ? -0.2 : 0.2;

    // Calculate local position from absolute world Deck Position.
    // Since parent group rotates on X, moving a child down the Y/Z local axes causes an angled world vector. 
    // We MUST accurately invert the X rotation to map the world vector (W - T) perfectly onto the table.
    const dx = deckPosition[0] - parentGroupOffset[0];
    const dy = deckPosition[1] + ((4 - drawOrder) * 0.05) - parentGroupOffset[1]; // Stack height based on topological top-card
    const dz = deckPosition[2] - parentGroupOffset[2];

    const theta = -parentRotX; // Inverse rotation around X
    const cosA = Math.cos(theta);
    const sinA = Math.sin(theta);
    const localTargetY = dy * cosA - dz * sinA;
    const localTargetZ = dy * sinA + dz * cosA;

    const dealPosition = [dx, localTargetY, localTargetZ];

    const dealRotation = [Math.PI / 2 - parentRotX, 0, 0];

    const { springPos, springRot } = useSpring({
        springPos: isDealing ? dealPosition : (hovered && isSelectable && !inspectMode && !isLoser) ? [position[0], position[1] + 0.5, position[2] + 0.2] : position,
        springRot: isDealing ? dealRotation : isFlipped ? rotation : [rotation[0], Math.PI, rotation[2]],
        delay: isDealing ? 0 : drawOrder * 120,
        config: { mass: 1, tension: 170, friction: 20 }
    });

    const { shatterProgress } = useSpring({
        shatterProgress: isLoser ? 1 : 0,
        delay: isLoser ? 500 : 0,
        config: { duration: 2500 } // Slower shatter animation
    });

    const frontTexture = useLoader(THREE.TextureLoader, imageUrl);
    const backTexture = useLoader(THREE.TextureLoader, '/cards/cardback/card_back.png');

    // Fix orientation mapping on plane geometries depending on how the image is drawn
    frontTexture.colorSpace = THREE.SRGBColorSpace;
    backTexture.colorSpace = THREE.SRGBColorSpace;

    const cardContent = (
        //@ts-ignore - Spring types sometimes have issues with three elements
        <a.group
            position={springPos as any}
            rotation={springRot as any}
            onClick={(e: any) => {
                if (isSelectable) {
                    e.stopPropagation();
                    onClick?.();
                }
            }}
            onContextMenu={(e: any) => {
                e.stopPropagation();
                e.preventDefault();
                onRightClick?.();
            }}
            onPointerOver={(e: any) => {
                if (isSelectable) {
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }
            }}
            onPointerOut={() => {
                if (isSelectable) {
                    setHovered(false);
                    document.body.style.cursor = 'default';
                }
            }}
        >
            {/* The main card body (box) - fades out during shatter */}
            <RoundedBox args={[2, 3, 0.1]} radius={0.05} smoothness={4} castShadow receiveShadow>
                {/* @ts-ignore - spring opacity */}
                <a.meshStandardMaterial ref={(el: any) => materialRefs.current[0] = el} attach="material-0" color={edgeColor} transparent opacity={shatterProgress.to((p: number) => 1 - p)} /> {/* Right */}
                {/* @ts-ignore */}
                <a.meshStandardMaterial ref={(el: any) => materialRefs.current[1] = el} attach="material-1" color={edgeColor} transparent opacity={shatterProgress.to((p: number) => 1 - p)} /> {/* Left */}
                {/* @ts-ignore */}
                <a.meshStandardMaterial ref={(el: any) => materialRefs.current[2] = el} attach="material-2" color={edgeColor} transparent opacity={shatterProgress.to((p: number) => 1 - p)} /> {/* Top */}
                {/* @ts-ignore */}
                <a.meshStandardMaterial ref={(el: any) => materialRefs.current[3] = el} attach="material-3" color={edgeColor} transparent opacity={shatterProgress.to((p: number) => 1 - p)} /> {/* Bottom */}
                {/* @ts-ignore */}
                <a.meshStandardMaterial attach="material-4" color="#f8fafc" transparent opacity={shatterProgress.to((p: number) => 1 - p)} /> {/* Front */}
                {/* @ts-ignore */}
                <a.meshStandardMaterial attach="material-5" color="#0f172a" transparent opacity={shatterProgress.to((p: number) => 1 - p)} /> {/* Back */}
            </RoundedBox>

            {/* Front Image Mesh */}
            {isLoser ? (
                <ShatterMesh texture={frontTexture} progressSpring={shatterProgress} position={[0, 0, 0.051]} rotation={[0, 0, 0]} />
            ) : (
                <group position={[0, 0, 0.051]}>
                    <mesh>
                        <planeGeometry args={[1.9, 2.9]} />
                        <meshBasicMaterial map={frontTexture} />
                    </mesh>
                    {manaCost !== undefined && (
                        <Html position={[0.7, 1.25, 0.01]} center transform distanceFactor={2.5}>
                            <div className="bg-blue-900/90 border-2 border-blue-400 rounded-full w-8 h-8 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                                <span className="text-white font-black text-lg drop-shadow-md">{manaCost}</span>
                            </div>
                        </Html>
                    )}
                    {skill && skill !== 'none' && (() => {
                        const info = getSkillInfo(skill);
                        if (!info) return null;
                        return (
                            <Html position={[-0.7, 1.25, 0.01]} center transform distanceFactor={2.5}>
                                <div className="bg-stone-900/90 border-2 border-amber-600/80 rounded-full w-8 h-8 flex items-center justify-center shadow-[0_0_15px_rgba(217,119,6,0.6)]">
                                    <span className="text-base drop-shadow-md leading-none">{info.icon}</span>
                                </div>
                            </Html>
                        );
                    })()}
                </group>
            )}

            {/* Back Image Mesh */}
            {isLoser ? (
                <ShatterMesh texture={backTexture} progressSpring={shatterProgress} position={[0, 0, -0.051]} rotation={[0, Math.PI, 0]} />
            ) : (
                <mesh position={[0, 0, -0.051]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[1.9, 2.9]} />
                    <meshBasicMaterial map={backTexture} />
                </mesh>
            )}

            {/* Selection Glow and Rarity Vfx */}
            {isSelected && rarity !== 'ssr' && (
                <group position={[0, 0, -0.1]}>
                    <pointLight intensity={5} color={edgeColor} distance={6} />
                    <Sparkles count={60} scale={3.5} size={5} speed={3} color={edgeColor} />
                </group>
            )}

            {/* SSR always has rainbow sparkles even when not selected (but more when selected) */}
            {rarity === 'ssr' && (
                <group position={[0, 0, -0.1]}>
                    {isSelected && <pointLight intensity={6} color="#ffffff" distance={6} />}
                    <Sparkles count={isSelected ? 100 : 30} scale={3.5} size={isSelected ? 6 : 4} speed={isSelected ? 5 : 2} color={hovered || isSelected ? "#ff00ff" : "#00ffff"} />
                    <Sparkles count={isSelected ? 50 : 20} scale={4} size={3} speed={isSelected ? 4 : 1} color="#ffff00" />
                </group>
            )}
            
            {/* Hover Tooltip (Html) */}
            {hovered && isSelectable && skill && skill !== 'none' && (
                <Html position={[0, 2.2, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
                    <div className="bg-stone-900/95 backdrop-blur-md border-[2px] border-amber-600/80 rounded-lg p-4 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(245,158,11,0.2)] w-72 transform -translate-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none rounded-lg"></div>
                        {(() => {
                            const info = getSkillInfo(skill);
                            if (!info) return null;
                            return (
                                <div className="relative z-10 flex flex-col gap-2">
                                    <div className="flex items-center gap-3 border-b border-stone-700/50 pb-2">
                                        <span className="text-2xl filter drop-shadow-md">{info.icon}</span>
                                        <h3 className={`font-black text-lg tracking-wider ${info.color} drop-shadow-sm`} style={{ fontFamily: '"Cinzel Decorative", serif' }}>
                                            {info.name}
                                        </h3>
                                    </div>
                                    <p className="text-stone-300 text-sm leading-relaxed font-semibold">
                                        {info.desc}
                                    </p>
                                </div>
                            );
                        })()}
                    </div>
                </Html>
            )}
        </a.group>
    );

    if (inspectMode) {
        return (
            <PresentationControls
                global={false} // Spin globally or by dragging the model
                cursor={true} // Whether to toggle cursor style on drag
                snap={true} // Snap-back to center (can also be a spring config)
                speed={1} // Speed factor
                zoom={1} // Zoom factor when half the polar-max is reached
                rotation={[0, 0, 0]} // Default rotation
                polar={[-Math.PI / 4, Math.PI / 4]} // Vertical limits
                azimuth={[-Infinity, Infinity]} // Horizontal limits
                config={{ mass: 1, tension: 170, friction: 26 }} // Spring config
            >
                {cardContent}
            </PresentationControls>
        );
    }

    return cardContent;
}
