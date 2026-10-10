import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import { useSpring, animated, SpringValue } from '@react-spring/three';
import { Sparkles, Trail, shaderMaterial, Sky, useTexture, Html } from '@react-three/drei';
import { calculateRound, useGameStore } from '../store/gameStore';
import type { ElementType } from '../store/gameStore';
import * as THREE from 'three';
import { audioManager } from '../utils/audioManager';

// ─────────────────────────────────────────────
// HELPERS

// @ts-ignore
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Tiny hook: oscillates a value using sin wave */
// @ts-ignore
function useOscillator(speed = 1, offset = 0) {
    const t = useRef(offset);
    useFrame((_, delta) => { t.current += delta * speed; });
    return t;
}

// ─────────────────────────────────────────────
// SHOCKWAVE – flat ring that expands on impact
// ─────────────────────────────────────────────
const Shockwave = ({ position, color, active, delay = 0 }: {
    position: [number, number, number];
    color: string;
    active: boolean;
    delay?: number;
}) => {
    const { scale, opacity } = useSpring({
        from: { scale: 0.1, opacity: 0.8 },
        to: active ? { scale: 10, opacity: 0 } : { scale: 0.1, opacity: 0 },
        config: { duration: 1800 },
        delay,
        reset: active,
    }) as any;

    return (
        <animated.mesh position={position} rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
            <ringGeometry args={[0.9, 1.2, 64]} />
            <animated.meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
            />
        </animated.mesh>
    );
};

// Second thinner ring slightly behind
const ShockwavePair = ({ position, color, active, delay = 0 }: any) => (
    <group>
        <Shockwave position={position} color={color} active={active} delay={delay} />
        <Shockwave position={position} color={color} active={active} delay={delay + 120} />
        <Shockwave position={position} color={color} active={active} delay={delay + 240} />
    </group>
);

// ─────────────────────────────────────────────
// IMPACT FLASH – bright sphere that fades
// ─────────────────────────────────────────────
const ImpactFlash = ({ position, color, active, delay = 0 }: any) => {
    const { scale, opacity, lightIntensity } = useSpring({
        from: { scale: 0, opacity: 1, lightIntensity: 0 },
        to: active
            ? [
                { scale: 5, opacity: 1, lightIntensity: 40, config: { duration: 150 } },
                { scale: 8, opacity: 0, lightIntensity: 0, config: { duration: 1200 } },
            ]
            : { scale: 0, opacity: 0, lightIntensity: 0 },
        delay,
        reset: active,
    }) as any;

    return (
        <animated.group position={position}>
            <animated.mesh scale={scale}>
                <sphereGeometry args={[1, 16, 16]} />
                <animated.meshBasicMaterial
                    color={color}
                    transparent
                    opacity={opacity}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </animated.mesh>
            <animated.pointLight color={color} intensity={lightIntensity} distance={20} />
        </animated.group>
    );
};

// ─────────────────────────────────────────────
// ELEMENT VISUALS (projectile core)
// ─────────────────────────────────────────────
const getElementConfig = (element: ElementType) => {
    const configs: Record<ElementType | 'default', { color: string; emissive: string; lightColor: string; trailColor: string }> = {
        fire: { color: '#ff4400', emissive: '#ff2200', lightColor: '#ff4400', trailColor: '#ff6600' },
        water: { color: '#0088ff', emissive: '#0066cc', lightColor: '#0088ff', trailColor: '#00ccff' },
        earth: { color: '#8b5a2b', emissive: '#6b3a0b', lightColor: '#b45309', trailColor: '#a0522d' },
        wind: { color: '#ccffcc', emissive: '#aaffaa', lightColor: '#ffffff', trailColor: '#e0ffe0' },
        light: { color: '#ffffaa', emissive: '#ffffff', lightColor: '#ffffaa', trailColor: '#ffffff' },
        dark: { color: '#4b0082', emissive: '#6600cc', lightColor: '#7e22ce', trailColor: '#9b30ff' },
        default: { color: '#ffffff', emissive: '#ffffff', lightColor: '#ffffff', trailColor: '#ffffff' },
    };
    return configs[element] ?? configs.default;
};

const getElementVisuals = (element: ElementType) => {
    switch (element) {
        case 'fire':
            return (
                <group>
                    <mesh>
                        <octahedronGeometry args={[0.45, 0]} />
                        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={6} transparent opacity={0.7} blending={THREE.AdditiveBlending} />
                    </mesh>
                    <mesh>
                        <sphereGeometry args={[0.28, 16, 16]} />
                        <meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={4} />
                    </mesh>
                    {/* Inner corona */}
                    <mesh>
                        <sphereGeometry args={[0.6, 16, 16]} />
                        <meshBasicMaterial color="#ff2200" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
                    </mesh>
                    <Sparkles count={60} scale={1.5} size={8} speed={3} color="#ff3300" />
                    <pointLight distance={12} intensity={12} color="#ff4400" />
                </group>
            );
        case 'water':
            return (
                <group>
                    <mesh>
                        <icosahedronGeometry args={[0.38, 1]} />
                        <meshStandardMaterial color="#0088ff" emissive="#0066cc" emissiveIntensity={4} transparent opacity={0.85} />
                    </mesh>
                    <mesh>
                        <sphereGeometry args={[0.55, 16, 16]} />
                        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
                    </mesh>
                    {/* Bubble halo */}
                    <mesh>
                        <sphereGeometry args={[0.65, 16, 16]} />
                        <meshBasicMaterial color="#0044ff" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} />
                    </mesh>
                    <Sparkles count={50} scale={1.8} size={5} speed={1.5} color="#00aaff" />
                    <pointLight distance={10} intensity={8} color="#0088ff" />
                </group>
            );
        case 'earth':
            return (
                <group>
                    <mesh>
                        <dodecahedronGeometry args={[0.55, 0]} />
                        <meshStandardMaterial color="#8b5a2b" roughness={1} />
                    </mesh>
                    <mesh scale={1.25}>
                        <icosahedronGeometry args={[0.55, 0]} />
                        <meshStandardMaterial color="#228b22" opacity={0.3} transparent blending={THREE.AdditiveBlending} />
                    </mesh>
                    <Sparkles count={30} scale={2} size={6} speed={0.6} color="#8b4513" />
                    <pointLight distance={10} intensity={7} color="#8b5a2b" />
                </group>
            );
        case 'wind':
            return (
                <group>
                    {[1, 2, 3].map(i => (
                        <mesh key={i} rotation={[Math.PI / 4 + (i * Math.PI) / 3, i * 0.5, 0]} scale={i * 0.4}>
                            <sphereGeometry args={[0.55, 16, 16]} />
                            <meshStandardMaterial color="#ffffff" emissive="#ccffcc" emissiveIntensity={2} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
                        </mesh>
                    ))}
                    <Sparkles count={70} scale={2.5} size={6} speed={5} color="#ffffff" />
                    <pointLight distance={10} intensity={6} color="#ffffff" />
                </group>
            );
        case 'light':
            return (
                <group>
                    <mesh>
                        <octahedronGeometry args={[0.55, 0]} />
                        <meshStandardMaterial color="#ffffaa" emissive="#ffffff" emissiveIntensity={10} />
                    </mesh>
                    <mesh scale={1.4}>
                        <octahedronGeometry args={[0.55, 0]} />
                        <meshStandardMaterial color="#ffffaa" emissive="#ffffff" emissiveIntensity={4} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
                    </mesh>
                    <Sparkles count={80} scale={2.5} size={6} speed={1.5} color="#ffff00" />
                    <pointLight distance={18} intensity={16} color="#ffffaa" />
                </group>
            );
        case 'dark':
            return (
                <group>
                    <mesh>
                        <sphereGeometry args={[0.45, 32, 32]} />
                        <meshStandardMaterial color="#000000" roughness={0} metalness={1} />
                    </mesh>
                    <mesh>
                        <icosahedronGeometry args={[0.6, 1]} />
                        <meshStandardMaterial color="#4b0082" emissive="#6600cc" emissiveIntensity={6} transparent opacity={0.5} blending={THREE.AdditiveBlending} />
                    </mesh>
                    {/* Void shroud */}
                    <mesh scale={1.35}>
                        <sphereGeometry args={[0.7, 32, 32]} />
                        <meshBasicMaterial color="#2f004f" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
                    </mesh>
                    <Sparkles count={120} scale={3} size={7} speed={2.5} color="#8a2be2" />
                    <pointLight distance={14} intensity={10} color="#4b0082" />
                </group>
            );
        default:
            return (
                <mesh>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" />
                </mesh>
            );
    }
};

// ─────────────────────────────────────────────
// CAMERA SHAKE
// ─────────────────────────────────────────────
const CameraShake = ({ trigger, intensity = 0.15, duration = 400 }: {
    trigger: boolean;
    intensity?: number;
    duration?: number;
}) => {
    const { camera } = useThree();
    const shakeRef = useRef({ active: false, elapsed: 0, duration, intensity, origin: new THREE.Vector3() });

    useEffect(() => {
        if (trigger) {
            shakeRef.current.active = true;
            shakeRef.current.elapsed = 0;
            shakeRef.current.origin.copy(camera.position);
        }
    }, [trigger]);

    useFrame((_, delta) => {
        const s = shakeRef.current;
        if (!s.active) return;
        s.elapsed += delta * 1000;
        const progress = s.elapsed / s.duration;
        if (progress >= 1) {
            s.active = false;
            camera.position.copy(s.origin);
            return;
        }
        const decay = 1 - progress;
        const amp = s.intensity * decay;
        camera.position.x = s.origin.x + (Math.random() - 0.5) * amp;
        camera.position.y = s.origin.y + (Math.random() - 0.5) * amp;
    });

    return null;
};

// ─────────────────────────────────────────────
// ELEMENTAL IMPACT BURST (at hit location)
// ─────────────────────────────────────────────
const FireImpact = ({ position, active }: any) => {
    const delay = 0;
    return (
        <group position={position}>
            <ImpactFlash position={[0, 0, 0]} color="#ff4400" active={active} delay={delay} />
            <ShockwavePair position={[0, 0.1, 0]} color="#ff6600" active={active} delay={delay} />
            {/* Ember burst upward */}
            {active && (
                <Sparkles count={200} scale={[3, 5, 3]} size={10} speed={10} color="#ff3300" noise={3} position={[0, 2, 0]} />
            )}
            {active && (
                <Sparkles count={80} scale={[4, 2, 4]} size={6} speed={6} color="#ffaa00" noise={2} position={[0, 0.5, 0]} />
            )}
        </group>
    );
};

const WaterImpact = ({ position, active }: any) => (
    <group position={position}>
        <ImpactFlash position={[0, 0, 0]} color="#0088ff" active={active} />
        <ShockwavePair position={[0, 0.1, 0]} color="#00ccff" active={active} />
        {active && <Sparkles count={150} scale={[4, 4, 4]} size={8} speed={6} color="#60a5fa" noise={2} position={[0, 1.5, 0]} />}
        {active && <Sparkles count={80} scale={[5, 2, 5]} size={4} speed={3} color="#93c5fd" noise={1} position={[0, 0.3, 0]} />}
    </group>
);

const EarthImpact = ({ position, active }: any) => {
    const { spread } = useSpring({
        from: { spread: 0 },
        to: active ? { spread: 3.5 } : { spread: 0 },
        config: { mass: 2, tension: 80, friction: 10 },
        reset: active,
    }) as any;

    const rocks = useMemo(() => {
        return [...Array(15)].map(() => ({
            angle: Math.random() * Math.PI * 2,
            size: 0.2 + Math.random() * 0.35,
            dist: 0.6 + Math.random() * 0.3,
            yOff: Math.sin(Math.random() * 1.3) * 0.6,
            rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number]
        }));
    }, []);

    return (
        <group position={position}>
            <ImpactFlash position={[0, 0, 0]} color="#b45309" active={active} />
            <ShockwavePair position={[0, 0.05, 0]} color="#92400e" active={active} />
            {rocks.map((rock, _i) => (
                <animated.mesh
                    key={_i}
                    position-x={spread.to((s: number) => Math.cos(rock.angle) * s * rock.dist)}
                    position-z={spread.to((s: number) => Math.sin(rock.angle) * s * rock.dist)}
                    position-y={spread.to((s: number) => Math.max(0, s * 0.35 + rock.yOff))}
                    rotation={rock.rot}
                >
                    <dodecahedronGeometry args={[rock.size, 0]} />
                    <meshStandardMaterial color="#7c4a1e" roughness={1} />
                </animated.mesh>
            ))}
            {active && <Sparkles count={150} scale={[5, 2.5, 5]} size={10} speed={1} color="#654321" opacity={0.8} position={[0, 0.5, 0]} />}
        </group>
    );
};

const WindImpact = ({ position, active }: any) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, delta) => { if (ref.current && active) ref.current.rotation.y += delta * 25; });
    return (
        <group position={position} ref={ref}>
            <ImpactFlash position={[0, 0, 0]} color="#bae6fd" active={active} />
            <ShockwavePair position={[0, 0.1, 0]} color="#e0f7ff" active={active} />
            {active && <Sparkles count={250} scale={[5, 8, 5]} size={5} speed={12} color="#ffffff" opacity={0.7} noise={4} position={[0, 3, 0]} />}
        </group>
    );
};

const LightImpact = ({ position, active }: any) => (
    <group position={position}>
        <ImpactFlash position={[0, 0, 0]} color="#fef08a" active={active} />
        <ShockwavePair position={[0, 0.1, 0]} color="#ffffff" active={active} />
        {/* God ray column */}
        {active && (
            <mesh position={[0, 6, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 14, 32]} />
                <meshBasicMaterial color="#fef9c3" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
        )}
        {active && <Sparkles count={200} scale={[4, 12, 4]} size={8} speed={2} color="#ffffff" opacity={0.9} position={[0, 5, 0]} />}
        {active && <Sparkles count={80} scale={5} size={20} speed={1} color="#fef08a" opacity={1} position={[0, 1, 0]} />}
    </group>
);

const DarkImpact = ({ position, active }: any) => (
    <group position={position}>
        <ImpactFlash position={[0, 0, 0]} color="#7e22ce" active={active} />
        <ShockwavePair position={[0, 0.1, 0]} color="#4b0082" active={active} />
        {/* Void collapse – pulls inward */}
        {active && <Sparkles count={200} scale={[3.5, 3.5, 3.5]} size={18} speed={0.4} color="#1e1b4b" opacity={0.9} noise={4} position={[0, 1.5, 0]} />}
        {active && <Sparkles count={120} scale={[4.5, 4.5, 4.5]} size={22} speed={0.25} color="#4c1d95" opacity={0.7} noise={3} position={[0, 1, 0]} />}
        {active && <Sparkles count={80} scale={[2.5, 6, 2.5]} size={12} speed={1.2} color="#7e22ce" opacity={0.6} noise={2} position={[0, 2.5, 0]} />}
    </group>
);

const ElementalImpact = ({ element, position, active }: { element: ElementType; position: [number, number, number]; active: boolean }) => {
    if (!active) return null;
    return (
        <group>
            {element === 'fire' && <FireImpact position={position} active={active} />}
            {element === 'water' && <WaterImpact position={position} active={active} />}
            {element === 'earth' && <EarthImpact position={position} active={active} />}
            {element === 'wind' && <WindImpact position={position} active={active} />}
            {element === 'light' && <LightImpact position={position} active={active} />}
            {element === 'dark' && <DarkImpact position={position} active={active} />}
        </group>
    );
};

// ─────────────────────────────────────────────
// PROJECTILE with Trail + spinning core
// ─────────────────────────────────────────────
const Projectile = ({
    start, end, element, active, delay = 0, duration = 500, onRest
}: {
    start: [number, number, number];
    end: [number, number, number];
    element: ElementType;
    active: boolean;
    delay?: number;
    duration?: number;
    onRest?: () => void;
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const innerRef = useRef<THREE.Group>(null);
    const t = useRef(0);
    const cfg = getElementConfig(element);
    const visuals = getElementVisuals(element);

    const prevActive = useRef(active);
    const shouldReset = active && !prevActive.current;

    const { position, scale } = useSpring({
        from: { position: start, scale: [0, 0, 0] },
        to: async (next: any) => {
            if (active) {
                await next({ scale: [1, 1, 1], config: { duration: 120 } });
                await next({ position: end, config: { duration } });
                await next({ scale: [0, 0, 0], config: { duration: 100 } });
                if (onRest) onRest();
            } else {
                await next({ position: start, scale: [0, 0, 0], config: { duration: 0 } });
            }
        },
        delay,
        reset: shouldReset,
    }) as any;

    useFrame((_, delta) => {
        prevActive.current = active;
        t.current += delta;
        if (innerRef.current) {
            // Spin axis differs by element for visual variety
            switch (element) {
                case 'fire':
                    innerRef.current.rotation.y += delta * 8;
                    innerRef.current.rotation.x += delta * 3;
                    break;
                case 'water':
                    innerRef.current.rotation.z += delta * 5;
                    break;
                case 'earth':
                    innerRef.current.rotation.x += delta * 4;
                    innerRef.current.rotation.y += delta * 2;
                    break;
                case 'wind':
                    innerRef.current.rotation.y += delta * 15;
                    break;
                case 'light':
                    innerRef.current.rotation.z += delta * 6;
                    innerRef.current.rotation.x += delta * 6;
                    break;
                case 'dark':
                    innerRef.current.rotation.y -= delta * 4;
                    innerRef.current.rotation.z += delta * 2;
                    break;
            }
        }
    });

    return (
        <animated.group ref={groupRef} position={position} scale={scale}>
            {/* Trail — unmounts when inactive to prevent glitch stretching lines on reset */}
            {active ? (
                <Trail
                    width={1.8}
                    length={8}
                    color={cfg.trailColor}
                    attenuation={(t) => t * t}
                >
                    <group ref={innerRef}>
                        {visuals}
                    </group>
                </Trail>
            ) : (
                <group ref={innerRef}>
                    {visuals}
                </group>
            )}
        </animated.group>
    );
};

// ─────────────────────────────────────────────
// PLACEMENT DUST (unchanged API, improved look)
// ─────────────────────────────────────────────
export const DustRing = ({ position }: { position: [number, number, number] }) => {
    const { scale, opacity } = useSpring({
        from: { scale: 0.5, opacity: 1 },
        to: { scale: 5, opacity: 0 },
        config: { duration: 900 },
        reset: true,
    }) as any;

    return (
        <animated.group position={position}>
            <animated.mesh rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
                <ringGeometry args={[0.85, 1.2, 48]} />
                <animated.meshBasicMaterial
                    color="#94a3b8"
                    transparent
                    opacity={opacity}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </animated.mesh>
            {/* inner bright ring */}
            <animated.mesh rotation={[-Math.PI / 2, 0, 0]} scale={scale.to((s: number) => s * 0.5)}>
                <ringGeometry args={[0.9, 1.0, 48]} />
                <animated.meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={opacity}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </animated.mesh>
            <Sparkles count={60} scale={4} size={4} speed={2.5} color="#94a3b8" />
        </animated.group>
    );
};

// ─────────────────────────────────────────────
// ELEMENTAL REVEAL (enhanced)
// ─────────────────────────────────────────────

const FireReveal = ({ active }: { active: boolean }) => {
    const { scale, intensity, spread } = useSpring({
        scale: active ? 1 : 2.5,
        intensity: active ? 1 : 0,
        spread: active ? 1 : 3.5,
        config: { mass: 1, tension: 120, friction: 14 },
    }) as any;
    return (
        <animated.group scale={scale}>
            <animated.pointLight color="#ef4444" intensity={intensity.to((i: number) => i * 22)} distance={12} />
            <animated.group scale={spread}>
                <Sparkles count={180} scale={[1.5, 4, 1.5]} size={14} speed={9} color="#ef4444" opacity={1} position={[0, 1.2, 0]} noise={1} />
                <Sparkles count={120} scale={[1.2, 5, 1.2]} size={9} speed={12} color="#f97316" opacity={1} position={[0, 1.8, 0]} noise={2} />
                <Sparkles count={60} scale={[0.7, 6, 0.7]} size={7} speed={14} color="#fcd34d" opacity={1} position={[0, 2.5, 0]} noise={3} />
            </animated.group>
        </animated.group>
    );
};

const EarthReveal = ({ active }: { active: boolean }) => {
    const { scale, spread } = useSpring({
        scale: active ? 1 : 2.5,
        spread: active ? 2.8 : 8.0,
        config: { mass: 2, tension: 100, friction: 12 },
    }) as any;
    return (
        <animated.group scale={scale}>
            {[...Array(14)].map((_, i) => {
                const angle = (i / 14) * Math.PI * 2;
                const size = i % 2 === 0 ? 0.28 : 0.48;
                const dm = i % 3 === 0 ? 0.65 : 1.2;
                return (
                    <animated.mesh key={i}
                        position-x={spread.to((s: number) => Math.cos(angle) * s * dm)}
                        position-z={spread.to((s: number) => Math.sin(angle) * s * dm)}
                        position-y={spread.to((s: number) => Math.max(0.2, s * 0.45 + Math.sin(i) * 0.55))}
                        rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
                    >
                        <dodecahedronGeometry args={[size, 0]} />
                        <animated.meshStandardMaterial color="#7c4a1e" roughness={0.9} transparent opacity={scale.to((s: number) => active ? 1 : 1 - (s - 1) / 1.5)} />
                    </animated.mesh>
                );
            })}
            <Sparkles count={160} scale={spread.to((s: number) => [4.5 * (s / 2.8), 2.5 * (s / 2.8), 4.5 * (s / 2.8)])} size={11} speed={1.2} color="#654321" opacity={0.75} position={[0, 0.6, 0]} noise={1} />
            <Sparkles count={100} scale={spread.to((s: number) => [5.5 * (s / 2.8), 1.2 * (s / 2.8), 5.5 * (s / 2.8)])} size={6} speed={0.6} color="#d2691e" opacity={0.65} position={[0, 0.2, 0]} />
        </animated.group>
    );
};

const WaterReveal = ({ active }: { active: boolean }) => {
    const { scale, intensity, spread } = useSpring({
        scale: active ? 1 : 2.5,
        intensity: active ? 1 : 0,
        spread: active ? 1 : 3.5,
        config: { mass: 1, tension: 90, friction: 14 },
    }) as any;
    return (
        <animated.group scale={scale}>
            <animated.pointLight color="#3b82f6" intensity={intensity.to((i: number) => i * 18)} distance={12} />
            <animated.group scale={spread}>
                <Sparkles count={120} scale={[3.5, 5, 3.5]} size={9} speed={7} color="#60a5fa" opacity={0.95} position={[0, 1.8, 0]} noise={0.6} />
                <Sparkles count={90} scale={[4.5, 2.5, 4.5]} size={5} speed={3.5} color="#93c5fd" opacity={0.75} position={[0, 0.6, 0]} />
            </animated.group>
        </animated.group>
    );
};

const WindReveal = ({ active }: { active: boolean }) => {
    const { scale, intensity, spread } = useSpring({
        scale: active ? 1 : 2.5,
        intensity: active ? 1 : 0,
        spread: active ? 1 : 4,
        config: { mass: 1, tension: 100, friction: 10 },
    }) as any;
    const ref = useRef<THREE.Group>(null);
    useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * (active ? 22 : 40); });
    return (
        <animated.group ref={ref} scale={scale}>
            {[1.5, 2.5, 1.0].map((r, i) => (
                <animated.mesh key={i} position-y={i * 0.9 + 0.3} scale={spread.to((s: number) => r * 0.45 * s)}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <animated.meshBasicMaterial color={i === 0 ? "#e0f2fe" : i === 1 ? "#bae6fd" : "#f0f9ff"} transparent opacity={intensity.to((int: number) => (0.25 - i * 0.05) * int)} blending={THREE.AdditiveBlending} depthWrite={false} />
                </animated.mesh>
            ))}
            <animated.pointLight color="#bae6fd" intensity={intensity.to((i: number) => i * 12)} distance={10} />
            <Sparkles count={220} scale={spread.to((s: number) => [4.5 * s, 7 * s, 4.5 * s])} size={5} speed={9} color="#ffffff" opacity={0.65} noise={2.5} position={[0, 2.5, 0]} />
        </animated.group>
    );
};

const LightReveal = ({ active }: { active: boolean }) => {
    const { scale, intensity, spread } = useSpring({
        scale: active ? 1 : 2.5,
        intensity: active ? 1 : 0,
        spread: active ? 1 : 4,
        config: { mass: 1, tension: 150, friction: 20 },
    }) as any;
    return (
        <animated.group scale={scale}>
            <animated.mesh position-y={5.5} scale={spread.to((s: number) => [s, 1, s])}>
                <cylinderGeometry args={[2.5, 2.5, 13, 32]} />
                <animated.meshBasicMaterial color="#fef08a" transparent opacity={intensity.to((int: number) => 0.13 * int)} blending={THREE.AdditiveBlending} depthWrite={false} />
            </animated.mesh>
            <animated.pointLight color="#fef08a" intensity={intensity.to((i: number) => i * 25)} distance={22} />
            <Sparkles count={180} scale={spread.to((s: number) => [4.5 * s, 12 * s, 4.5 * s])} size={7} speed={2.5} color="#ffffff" opacity={0.85} position={[0, 5, 0]} />
            <Sparkles count={60} scale={spread.to((s: number) => 4.5 * s)} size={18} speed={1.2} color="#fef08a" opacity={1} position={[0, 1.2, 0]} />
        </animated.group>
    );
};

const DarkReveal = ({ active }: { active: boolean }) => {
    const { scale, intensity, spread } = useSpring({
        scale: active ? 1 : 2.5,
        intensity: active ? 1 : 0,
        spread: active ? 1 : 3.5,
        config: { mass: 2, tension: 80, friction: 15 },
    }) as any;
    return (
        <animated.group scale={scale}>
            <animated.pointLight color="#7e22ce" intensity={intensity.to((i: number) => i * 18)} distance={12} />
            <animated.group scale={spread}>
                <Sparkles count={180} scale={[3.5, 3.5, 3.5]} size={18} speed={0.55} color="#1e1b4b" opacity={0.85} noise={3.5} position={[0, 1.8, 0]} />
                <Sparkles count={120} scale={[4.5, 4.5, 4.5]} size={24} speed={0.3} color="#4c1d95" opacity={0.65} noise={2.5} position={[0, 1.2, 0]} />
                <Sparkles count={100} scale={[2.8, 6, 2.8]} size={12} speed={1.2} color="#7e22ce" opacity={0.55} noise={2} position={[0, 2.5, 0]} />
            </animated.group>
        </animated.group>
    );
};

export const ElementalReveal = ({
    element, position, active
}: { element: ElementType; position: [number, number, number]; active: boolean }) => {
    // We delay the unmount so the 'active=false' burst animation can play
    const [mounted, setMounted] = useState(active);

    useEffect(() => {
        if (active) {
            setMounted(true);
        } else {
            const timer = setTimeout(() => setMounted(false), 800);
            return () => clearTimeout(timer);
        }
    }, [active]);

    if (!mounted) return null;

    return (
        <group position={[position[0], position[1] + 0.5, position[2]]}>
            {element === 'fire' && <FireReveal active={active} />}
            {element === 'water' && <WaterReveal active={active} />}
            {element === 'earth' && <EarthReveal active={active} />}
            {element === 'wind' && <WindReveal active={active} />}
            {element === 'light' && <LightReveal active={active} />}
            {element === 'dark' && <DarkReveal active={active} />}
        </group>
    );
};

// ─────────────────────────────────────────────
// AMBIENT WORLD LIGHTING during fight
// ─────────────────────────────────────────────
const AmbientFightLight = ({ element, position, active }: {
    element: ElementType;
    position: [number, number, number];
    active: boolean;
}) => {
    const cfg = getElementConfig(element);
    const { intensity } = useSpring({
        intensity: active ? 1 : 0,
        config: { duration: 300 },
    }) as any;
    return (
        <animated.pointLight
            position={position}
            color={cfg.lightColor}
            intensity={intensity.to((i: number) => i * 4)}
            distance={25}
        />
    );
};

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// SHIELD & ABSORB COMPONENTS
// ─────────────────────────────────────────────
const EnergyAbsorb = ({ active, element, position }: { active: boolean, element: ElementType, position: [number, number, number] }) => {
    const { scale, opacity } = useSpring({
        from: { scale: 3, opacity: 0 },
        to: active ? { scale: 0.2, opacity: 1 } : { scale: 3, opacity: 0 },
        config: { duration: 600 },
        reset: active
    }) as any;

    const { color } = getElementConfig(element);

    return (
        <animated.group position={position}>
            <animated.mesh scale={scale}>
                <icosahedronGeometry args={[1.5, 1]} />
                <animated.meshBasicMaterial
                    color={color}
                    transparent
                    opacity={opacity.to((o: number) => o * 0.6)}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    wireframe
                />
            </animated.mesh>
            <animated.group scale={scale}>
                <Sparkles count={80} scale={4} size={25} speed={0} color={color} opacity={opacity} noise={0} />
            </animated.group>
        </animated.group>
    );
};

const ShieldGlow = ({ active, element, position }: { active: boolean, element: ElementType, position: [number, number, number] }) => {
    const { scale, opacity } = useSpring({
        scale: active ? 1.5 : 0,
        opacity: active ? 0.8 : 0,
        config: { mass: 1, tension: 300, friction: 20 }
    }) as any;

    const { color } = getElementConfig(element);

    return (
        <animated.group position={position} scale={scale}>
            <mesh>
                <icosahedronGeometry args={[1, 2]} />
                <animated.meshStandardMaterial color={color} transparent opacity={opacity} wireframe />
            </mesh>
            <mesh scale={0.95}>
                <icosahedronGeometry args={[1, 2]} />
                <animated.meshStandardMaterial color={color} transparent opacity={opacity.to((o: number) => o * 0.3)} emissive={color} emissiveIntensity={2} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
        </animated.group>
    );
};

export default function Effects3D() {
    const { animationPhase, boardPlayerCard, boardBotCard, activeField, playerGambleGuess, botGambleGuess, playerSilenced, botSilenced, phase, roundResult } = useGameStore();
    const [combatState, setCombatState] = useState<'none' | 'attack' | 'shield' | 'counter' | 'impact'>('none');
    const [shakeActive, setShakeActive] = useState(false);

    const playerStart: [number, number, number] = [0, 1, 1.5];
    const botStart: [number, number, number] = [0, 1, -1.5];
    const centerHit: [number, number, number] = [0, 1, 0];

    useEffect(() => {
        if (animationPhase === 'attacking') {
            setCombatState('attack');
        } else if (animationPhase === 'none') {
            setCombatState('none');
            setShakeActive(false);
        }
    }, [animationPhase]);

    // Keep the completed round snapshot while next-turn Silence updates the store.
    const round = phase === 'evaluate' && roundResult ? roundResult
        : boardPlayerCard && boardBotCard ? calculateRound({
            playerCard: boardPlayerCard, botCard: boardBotCard, field: activeField,
            playerSilenced, botSilenced, playerGuess: playerGambleGuess, botGuess: botGambleGuess
        }) : null;
    const { pBase = 0, bBase = 0, pp = 0, bp = 0, pSkill = 'none', bSkill = 'none',
        pFieldBonus: pBonus = 0, bFieldBonus: bBonus = 0 } = round || {};
    const pPierce = pSkill === 'pierce';
    const bPierce = bSkill === 'pierce';
    const pReflect = (round?.pReflected || 0) > 0;
    const bReflect = (round?.bReflected || 0) > 0;
    const pLifesteal = pSkill === 'lifesteal' && (round?.pHealAmount || 0) > 0;
    const bLifesteal = bSkill === 'lifesteal' && (round?.bHealAmount || 0) > 0;
    const pHeal = pSkill === 'heal' && (round?.pHealAmount || 0) > 0;
    const bHeal = bSkill === 'heal' && (round?.bHealAmount || 0) > 0;

    // Detect if this is a counter-attack scenario
    const isCounterAttack = (pBase <= bBase && pp > bp) || (bBase <= pBase && bp > pp);
    const counterAttacker = pp > bp ? 'player' : 'bot';

    useEffect(() => {
        if (!boardPlayerCard || !boardBotCard) return;

        if (combatState === 'attack') {
            if (isCounterAttack) {
                 const firstAttackerElement = counterAttacker === 'player' ? boardBotCard.element : boardPlayerCard.element;
                 audioManager.playElementAttack(firstAttackerElement);
            } else if (pp > bp) {
                 audioManager.playElementAttack(boardPlayerCard.element);
            } else if (bp > pp) {
                 audioManager.playElementAttack(boardBotCard.element);
            } else {
                 audioManager.playElementAttack(boardPlayerCard.element);
                 audioManager.playElementAttack(boardBotCard.element);
            }
        } else if (combatState === 'counter') {
             audioManager.playCounterAttack();
             const counterElement = counterAttacker === 'player' ? boardPlayerCard.element : boardBotCard.element;
             setTimeout(() => audioManager.playElementAttack(counterElement), 150);
        }
    }, [combatState, boardPlayerCard, boardBotCard, activeField, isCounterAttack, counterAttacker, pp, bp]);

    if (combatState === 'none' || !boardPlayerCard || !boardBotCard) {
        return null;
    }

    // Animation configuration
    const pActivePhase1 = combatState === 'attack' && (pp >= bp || isCounterAttack);
    const bActivePhase1 = combatState === 'attack' && (bp >= pp || isCounterAttack);

    // In a counter attack, the weaker card attacks first
    const pAttackOrig = isCounterAttack && counterAttacker === 'bot';
    const bAttackOrig = isCounterAttack && counterAttacker === 'player';

    // Destination of the first attack
    let pEnd1 = centerHit;
    let bEnd1 = centerHit;

    if (isCounterAttack) {
        if (pAttackOrig) pEnd1 = botStart;
        if (bAttackOrig) bEnd1 = playerStart;
    } else {
        if (pp > bp) pEnd1 = botStart;
        if (bp > pp) bEnd1 = playerStart;
    }

    const duration1 = isCounterAttack ? 700 : (pp === bp ? 480 : 750);

    const handlePhase1Rest = () => {
        if (isCounterAttack) {
            setCombatState('shield');
            // Shield stays up for 1000ms then counters
            setTimeout(() => setCombatState('counter'), 1000);
        } else {
            setCombatState('impact');
            setShakeActive(true);
        }
    };

    const handlePhase2Rest = () => {
        setCombatState('impact');
        setShakeActive(true);
    };

    // Phase 2: Shield
    const showPShield = combatState === 'shield' && counterAttacker === 'player';
    const showBShield = combatState === 'shield' && counterAttacker === 'bot';

    // Phase 3: Counter-attack Projectile
    const pCounterActive = combatState === 'counter' && counterAttacker === 'player';
    const bCounterActive = combatState === 'counter' && counterAttacker === 'bot';

    // Impact location
    const pImpactPos: [number, number, number] = pp > bp ? botStart : centerHit;
    const bImpactPos: [number, number, number] = bp > pp ? playerStart : centerHit;

    // Check if the final impact is a counter attack explosion
    const isFinalCounterExplosion = combatState === 'impact' && isCounterAttack;

    return (
        <group>
            {/* Camera shake on impact */}
            <CameraShake trigger={shakeActive} intensity={0.18} duration={450} />

            {/* Ambient elemental lighting */}
            {(pActivePhase1 || pCounterActive) && (
                <AmbientFightLight
                    element={boardPlayerCard.element}
                    position={[0, 2, 0]}
                    active={true}
                />
            )}
            {(bActivePhase1 || bCounterActive) && (
                <AmbientFightLight
                    element={boardBotCard.element}
                    position={[0, 2, 0]}
                    active={true}
                />
            )}

            {/* Shield Effects */}
            <ShieldGlow active={showPShield} element={boardPlayerCard.element} position={playerStart} />
            <ShieldGlow active={showBShield} element={boardBotCard.element} position={botStart} />

            {/* Energy Absorb Effects */}
            <EnergyAbsorb active={showPShield} element={boardPlayerCard.element} position={playerStart} />
            <EnergyAbsorb active={showBShield} element={boardBotCard.element} position={botStart} />

            {/* Impact when hitting shield */}
            {showPShield && <ImpactFlash active={showPShield} position={playerStart} color={getElementConfig(boardBotCard.element).color} />}
            {showBShield && <ImpactFlash active={showBShield} position={botStart} color={getElementConfig(boardPlayerCard.element).color} />}

            {/* Skill Effect Popups */}
            {pPierce && bBonus === 0 && boardBotCard.element === activeField && (
                <Html position={[botStart[0], botStart[1] + 1.5, botStart[2]]} center>
                    <div className="text-4xl animate-bounce drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" title="Field Bonus Pierced!">🛡️💥</div>
                </Html>
            )}
            {bPierce && pBonus === 0 && boardPlayerCard.element === activeField && (
                <Html position={[playerStart[0], playerStart[1] + 1.5, playerStart[2]]} center>
                    <div className="text-4xl animate-bounce drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" title="Field Bonus Pierced!">🛡️💥</div>
                </Html>
            )}
            {combatState === 'impact' && pReflect && (
                <Html position={[playerStart[0], playerStart[1] + 2, playerStart[2]]} center>
                    <div className="text-3xl font-black text-purple-400 uppercase tracking-widest animate-[bounce_0.5s_ease-out_2] drop-shadow-[0_0_15px_rgba(168,85,247,0.9)]">
                        REFLECT! 🪞
                    </div>
                </Html>
            )}
            {combatState === 'impact' && bReflect && (
                <Html position={[botStart[0], botStart[1] + 2, botStart[2]]} center>
                    <div className="text-3xl font-black text-purple-400 uppercase tracking-widest animate-[bounce_0.5s_ease-out_2] drop-shadow-[0_0_15px_rgba(168,85,247,0.9)]">
                        REFLECT! 🪞
                    </div>
                </Html>
            )}
            {combatState === 'impact' && pLifesteal && (
                <Html position={[playerStart[0], playerStart[1] + 2, playerStart[2]]} center>
                    <div className="text-3xl font-black text-green-400 uppercase tracking-widest animate-[ping_1s_ease-out_forwards] drop-shadow-[0_0_15px_rgba(74,222,128,0.9)]">
                        + LIFESTEAL 🩸
                    </div>
                </Html>
            )}
            {combatState === 'impact' && bLifesteal && (
                <Html position={[botStart[0], botStart[1] + 2, botStart[2]]} center>
                    <div className="text-3xl font-black text-green-400 uppercase tracking-widest animate-[ping_1s_ease-out_forwards] drop-shadow-[0_0_15px_rgba(74,222,128,0.9)]">
                        + LIFESTEAL 🩸
                    </div>
                </Html>
            )}
            {combatState === 'impact' && pHeal && (
                <Html position={[playerStart[0], playerStart[1] + 2.5, playerStart[2]]} center>
                    <div className="text-3xl font-black text-emerald-400 uppercase tracking-widest animate-[ping_1s_ease-out_forwards] drop-shadow-[0_0_15px_rgba(52,211,153,0.9)]">
                        + HEAL 💖
                    </div>
                </Html>
            )}
            {combatState === 'impact' && bHeal && (
                <Html position={[botStart[0], botStart[1] + 2.5, botStart[2]]} center>
                    <div className="text-3xl font-black text-emerald-400 uppercase tracking-widest animate-[ping_1s_ease-out_forwards] drop-shadow-[0_0_15px_rgba(52,211,153,0.9)]">
                        + HEAL 💖
                    </div>
                </Html>
            )}

            {/* Phase 1: Original Attack */}
            <Projectile
                active={pActivePhase1 && (pAttackOrig || !isCounterAttack)}
                start={playerStart}
                end={pEnd1}
                element={boardPlayerCard.element}
                delay={0}
                duration={duration1}
                onRest={handlePhase1Rest}
            />

            <Projectile
                active={bActivePhase1 && (bAttackOrig || !isCounterAttack)}
                start={botStart}
                end={bEnd1}
                element={boardBotCard.element}
                delay={0}
                duration={duration1}
                onRest={handlePhase1Rest}
            />

            {/* Phase 3: Counter Attack */}
            <Projectile
                active={pCounterActive}
                start={playerStart}
                end={botStart}
                element={boardPlayerCard.element}
                delay={0}
                duration={700}
                onRest={handlePhase2Rest}
            />

            <Projectile
                active={bCounterActive}
                start={botStart}
                end={playerStart}
                element={boardBotCard.element}
                delay={0}
                duration={700}
                onRest={handlePhase2Rest}
            />

            {/* Impact effects at destination */}
            {(combatState === 'impact' && pp >= bp) && (
                <group scale={isFinalCounterExplosion ? 1.5 : 1}>
                    <ElementalImpact
                        element={boardPlayerCard.element}
                        position={pImpactPos}
                        active={true}
                    />
                </group>
            )}
            {(combatState === 'impact' && bp >= pp) && (
                <group scale={isFinalCounterExplosion ? 1.5 : 1}>
                    <ElementalImpact
                        element={boardBotCard.element}
                        position={bImpactPos}
                        active={true}
                    />
                </group>
            )}
        </group>
    );
}

// ─── CUSTOM SHADER: Volumetric Ring Pulse ──────────────────────────────────
const RingPulseMaterial = shaderMaterial(
    { uTime: 0, uColor: new THREE.Color("#ff3300"), uOpacity: 1.0 },
    // vertex
    `varying vec2 vUv;
   void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
    // fragment
    `uniform float uTime;
   uniform vec3 uColor;
   uniform float uOpacity;
   varying vec2 vUv;
   void main() {
     vec2 center = vUv - 0.5;
     float dist = length(center);
     float ring = abs(dist - 0.4);
     float pulse = sin(uTime * 3.0 + dist * 20.0) * 0.5 + 0.5;
     float alpha = smoothstep(0.05, 0.0, ring) * pulse * uOpacity;
     gl_FragColor = vec4(uColor, alpha);
   }`
);

const VortexMaterial = shaderMaterial(
    { uTime: 0, uColor: new THREE.Color("#00aaff"), uOpacity: 1.0 },
    `varying vec2 vUv;
   void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
    `uniform float uTime;
   uniform vec3 uColor;
   uniform float uOpacity;
   varying vec2 vUv;
   void main() {
     vec2 p = vUv - 0.5;
     float angle = atan(p.y, p.x) + uTime * 2.0;
     float dist = length(p);
     float spiral = sin(angle * 6.0 - dist * 20.0 + uTime * 4.0) * 0.5 + 0.5;
     float fade = smoothstep(0.5, 0.05, dist);
     float alpha = spiral * fade * uOpacity;
     gl_FragColor = vec4(uColor, alpha);
   }`
);

export const ShatterMaterial = shaderMaterial(
    { uProgress: 0, uTexture: null, uColor: new THREE.Color("#ffffff") },
    // Vertex Shader
    `varying vec2 vUv;
     uniform float uProgress;
     void main() {
       vUv = uv;
       vec3 pos = position;
       if (uProgress > 0.0) {
           // Create a pseudo-random value per vertex using its uv
           float noiseX = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
           float noiseY = fract(sin(dot(uv, vec2(39.346, 11.135))) * 43758.5453);
           
           // Push outward and slightly random x/y based on progress
           pos.x += (noiseX - 0.5) * uProgress * 2.5;
           pos.y += (noiseY - 0.5) * uProgress * 2.5;
           pos.z += (noiseX - 0.5) * uProgress * 2.0;
       }
       gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
     }`,
    // Fragment Shader
    `varying vec2 vUv;
     uniform float uProgress;
     uniform sampler2D uTexture;
     uniform vec3 uColor;
     void main() {
       vec4 texColor = texture2D(uTexture, vUv);
       
       // Create a blocky noise for glass shards
       vec2 grid = floor(vUv * 12.0) / 12.0;
       float noise = fract(sin(dot(grid, vec2(12.9898, 78.233))) * 43758.5453);
       
       // Add bright crack lines
       float crackNoise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
       float cracks = step(0.9, crackNoise);
       
       vec3 finalColor = mix(texColor.rgb, uColor * 2.0, cracks * (uProgress > 0.0 ? 1.0 : 0.0));
       
       float alpha = texColor.a;
       
       // As progress goes from 0 to 1, discard pixels with noise < progress
       if (uProgress > 0.0) {
           float dissolveThreshold = uProgress * 1.2; // slight multiplier to disappear fully
           if (noise < dissolveThreshold) discard;
       }
       
       gl_FragColor = vec4(finalColor, alpha);
     }`
);

const LightningMaterial = shaderMaterial(
    { uTime: 0, uColor: new THREE.Color("#ffffff"), uOpacity: 1.0 },
    `varying vec2 vUv;
   void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
    `uniform float uTime;
   uniform vec3 uColor;
   uniform float uOpacity;
   varying vec2 vUv;
   float hash(float n) { return fract(sin(n) * 43758.5453); }
   void main() {
     vec2 p = vUv;
     float flicker = step(0.7, sin(uTime * 30.0 + hash(floor(uTime * 10.0)) * 100.0));
     float bolt = smoothstep(0.48, 0.5, abs(p.x - 0.5 + sin(p.y * 20.0 + uTime * 5.0) * 0.03));
     float glow = smoothstep(0.45, 0.5, abs(p.x - 0.5 + sin(p.y * 20.0 + uTime * 5.0) * 0.03));
     float alpha = (1.0 - bolt) * flicker * uOpacity;
     gl_FragColor = vec4(uColor + vec3(glow * 0.5), alpha);
   }`
);

extend({ RingPulseMaterial, VortexMaterial, LightningMaterial, ShatterMaterial });

// ─── ANIMATED SHADER PLANE ────────────────────────────────────────────────
export const ShaderPlane = ({ material: MatType, color, opacity, position, rotation, scale, speed = 1 }: any) => {
    const matRef = useRef<any>(null);
    useFrame(({ clock }) => {
        if (matRef.current) matRef.current.uTime = clock.getElapsedTime() * speed;
    });
    return (
        <mesh position={position} rotation={rotation} scale={scale}>
            <planeGeometry args={[1, 1, 1, 1]} />
            <MatType ref={matRef} uColor={new THREE.Color(color)} uOpacity={opacity} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
    );
};

// ─── ORBITING EMBERS ─────────────────────────────────────────────────────
const OrbitingOrbs = ({ count = 8, radius = 6, color, glowColor, yOffset = 2, speed = 1 }: any) => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (groupRef.current) groupRef.current.rotation.y = clock.getElapsedTime() * speed;
    });
    const orbs = useMemo(() =>
        Array.from({ length: count }, (_, i) => ({
            angle: (i / count) * Math.PI * 2,
            r: radius + Math.sin(i * 1.3) * 1.5,
            y: yOffset + Math.cos(i * 0.9) * 2,
            size: 0.15 + Math.random() * 0.25,
        })), [count, radius, yOffset]);

    return (
        <group ref={groupRef}>
            {orbs.map((orb, i) => (
                <mesh key={i} position={[Math.cos(orb.angle) * orb.r, orb.y, Math.sin(orb.angle) * orb.r]}>
                    <sphereGeometry args={[orb.size, 8, 8]} />
                    <meshStandardMaterial color={color} emissive={glowColor} emissiveIntensity={5} transparent opacity={0.9} />
                </mesh>
            ))}
        </group>
    );
};

// ─── RISING COLUMN ───────────────────────────────────────────────────────
const RisingColumn = ({ color, radius = 1.5, height = 20 }: any) => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (meshRef.current && meshRef.current.material instanceof THREE.MeshStandardMaterial) {
            meshRef.current.material.emissiveIntensity = 2 + Math.sin(clock.getElapsedTime() * 3) * 1.5;
        }
    });
    return (
        <mesh ref={meshRef} position={[0, height / 2 - 2, 0]}>
            <cylinderGeometry args={[radius * 0.2, radius, height, 16, 1, true]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={3}
                transparent
                opacity={0.15}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
};

// ─── GROUND CRACK RING ────────────────────────────────────────────────────
const GroundRing = ({ color, innerRadius = 3, outerRadius = 5 }: any) => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (meshRef.current) {
            const s = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
            meshRef.current.scale.set(s, 1, s);
            if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
                meshRef.current.material.emissiveIntensity = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.8;
            }
        }
    });
    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
            <ringGeometry args={[innerRadius, outerRadius, 64]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.6} depthWrite={false} />
        </mesh>
    );
};

// ─── SHOCKWAVE RINGS ─────────────────────────────────────────────────────
const ShockwaveRings = ({ color, count = 3 }: any) => {
    const groupRef = useRef<THREE.Group>(null);
    const rings = useMemo(() => Array.from({ length: count }, (_, i) => ({ offset: (i / count) * 3 })), [count]);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        groupRef.current.children.forEach((child: any, i) => {
            const t = ((clock.getElapsedTime() * 0.5 + rings[i].offset) % 3) / 3;
            const s = t * 15 + 1;
            child.scale.set(s, 1, s);
            if (child.material) {
                child.material.opacity = (1 - t) * 0.5;
            }
        });
    });

    return (
        <group ref={groupRef}>
            {rings.map((_, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                    <ringGeometry args={[0.9, 1, 64]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.5} depthWrite={false} />
                </mesh>
            ))}
        </group>
    );
};

// ─── TORNADO CONE ─────────────────────────────────────────────────────────
export const TornadoCone = ({ color }: any) => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (meshRef.current) meshRef.current.rotation.y = clock.getElapsedTime() * 6;
    });
    return (
        <mesh ref={meshRef} position={[0, 5, 0]}>
            <coneGeometry args={[4, 14, 32, 1, true]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.12} wireframe side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
    );
};

// ─── CRYSTAL SHARDS ────────────────────────────────────────────────────────
const CrystalShards = ({ color, glowColor, count = 12 }: any) => {
    const groupRef = useRef<THREE.Group>(null);
    const shards = useMemo(() =>
        Array.from({ length: count }, () => ({
            x: (Math.random() - 0.5) * 12,
            z: (Math.random() - 0.5) * 12,
            h: 1 + Math.random() * 4,
            rotY: Math.random() * Math.PI,
            tilt: (Math.random() - 0.5) * 0.4,
        })), [count]);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        groupRef.current.children.forEach((child: any, i) => {
            child.position.y = Math.sin(clock.getElapsedTime() * 0.8 + i * 0.5) * 0.3;
            if (child.children[0] && child.children[0].material) {
                child.children[0].material.emissiveIntensity = 2 + Math.sin(clock.getElapsedTime() * 2 + i) * 1.5;
            }
        });
    });

    return (
        <group ref={groupRef}>
            {shards.map((s, i) => (
                <group key={i} position={[s.x, 0, s.z]} rotation={[s.tilt, s.rotY, s.tilt * 0.5]}>
                    <mesh>
                        <coneGeometry args={[0.3, s.h, 6]} />
                        <meshStandardMaterial color={color} emissive={glowColor} emissiveIntensity={2} transparent opacity={0.8} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};

// ─── DARK TENTACLES ────────────────────────────────────────────────────────
const DarkTentacles = ({ count = 8 }: any) => {
    const groupRef = useRef<THREE.Group>(null);
    const tentacles = useMemo(() =>
        Array.from({ length: count }, (_, i) => ({
            angle: (i / count) * Math.PI * 2,
            speed: 0.5 + Math.random() * 0.5,
            phase: Math.random() * Math.PI * 2,
        })), [count]);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        groupRef.current.children.forEach((child: any, i) => {
            const t = tentacles[i];
            const wave = Math.sin(clock.getElapsedTime() * t.speed + t.phase) * 0.5;
            child.rotation.z = wave;
            child.rotation.x = wave * 0.3;
        });
    });

    return (
        <group ref={groupRef}>
            {tentacles.map((t, i) => (
                <mesh key={i}
                    position={[Math.cos(t.angle) * 5, 1, Math.sin(t.angle) * 5]}
                    rotation={[0, t.angle, -0.3]}
                >
                    <cylinderGeometry args={[0.05, 0.3, 8, 8, 4, true]} />
                    <meshStandardMaterial color="#1a0033" emissive="#6600ff" emissiveIntensity={3} transparent opacity={0.7} />
                </mesh>
            ))}
        </group>
    );
};

// ─── LIGHT ANGEL WINGS ─────────────────────────────────────────────────────
const HolyBeams = ({ count = 12 }: any) => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        groupRef.current.children.forEach((child: any, i) => {
            if (child.material) {
                child.material.opacity = 0.05 + Math.abs(Math.sin(clock.getElapsedTime() * 1.5 + i * 0.4)) * 0.2;
            }
        });
    });
    return (
        <group ref={groupRef}>
            {Array.from({ length: count }, (_, i) => {
                const angle = (i / count) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(angle) * 3, 8, Math.sin(angle) * 3]} rotation={[0.3, angle, 0]}>
                        <cylinderGeometry args={[0.05, 0.5, 20, 6, 1, true]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffdd88" emissiveIntensity={8} transparent opacity={0.1} depthWrite={false} />
                    </mesh>
                );
            })}
        </group>
    );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────
export const WeatherField = ({ element, active = true }: { element: ElementType | null, active?: boolean }) => {
    const { pos } = useSpring({
        from: { pos: [0, -30, 0] },
        to: { pos: active ? [0, 0, 0] : [0, -30, 0] },
        config: { mass: 5, tension: 40, friction: 35 },
    }) as any;

    if (!element) return null;

    let content = null;
    switch (element) {
        // ═══════════════════════════════════════════════════
        // 🔥 FIRE — Smoldering Ashfield
        // ═══════════════════════════════════════════════════
        case "fire":
            content = (
                <group>
                    {/* Core lights */}
                    <ambientLight intensity={1.2} color="#ff2200" />
                    <pointLight position={[0, 0, 0]} intensity={120} color="#ff4400" distance={40} decay={2} />
                    <pointLight position={[0, 8, 0]} intensity={60} color="#ff8800" distance={35} decay={2} />
                    <pointLight position={[4, 3, 4]} intensity={40} color="#ffaa00" distance={20} decay={2} />
                    <pointLight position={[-4, 3, -4]} intensity={40} color="#ff2200" distance={20} decay={2} />

                    {/* Lava ground ring */}
                    <GroundRing color="#ff3300" innerRadius={2} outerRadius={6} />
                    <ShockwaveRings color="#ff5500" count={2} />

                    {/* Rising fire column */}
                    <RisingColumn color="#ff4400" radius={2} height={25} />

                    {/* Orbiting fire orbs - Slower */}
                    <OrbitingOrbs count={4} radius={5} color="#ff3300" glowColor="#ff8800" yOffset={3} speed={0.4} />
                    <OrbitingOrbs count={6} radius={8} color="#ff6600" glowColor="#ffaa00" yOffset={5} speed={-0.2} />

                    {/* Dense ember layers - Much slower and fewer */}
                    <Sparkles count={300} scale={[10, 15, 10]} size={12} speed={1.5} opacity={0.8} color="#ff2200" position={[0, 3, 0]} noise={1} />
                    {/* Mid flame body */}
                    <Sparkles count={200} scale={[18, 20, 18]} size={10} speed={1.0} opacity={0.7} color="#ff6600" position={[0, 5, 0]} noise={0.5} />
                    {/* Outer slow ash */}
                    <Sparkles count={250} scale={[30, 15, 30]} size={6} speed={0.5} opacity={0.5} color="#ffaa33" position={[0, 8, 0]} noise={2} />
                    {/* Giant slow embers */}
                    <Sparkles count={40} scale={[12, 25, 12]} size={20} speed={0.8} opacity={0.6} color="#ffffff" position={[0, 6, 0]} />
                </group>
            );
            break;

        // ═══════════════════════════════════════════════════
        // 💧 WATER — Still Deep Sea
        // ═══════════════════════════════════════════════════
        case "water":
            content = (
                <group>
                    <ambientLight intensity={0.8} color="#003366" />
                    <pointLight position={[0, 0, 0]} intensity={80} color="#0088ff" distance={40} decay={2} />
                    <pointLight position={[0, 10, 0]} intensity={50} color="#00ddff" distance={35} decay={2} />
                    <pointLight position={[-5, 2, 5]} intensity={30} color="#004488" distance={25} decay={2} />
                    <pointLight position={[5, 2, -5]} intensity={30} color="#0066cc" distance={25} decay={2} />

                    {/* Ground vortex */}
                    <GroundRing color="#0055ff" innerRadius={2} outerRadius={6} />
                    <ShockwaveRings color="#00aaff" count={2} />

                    {/* Orbiting water droplets - very slow */}
                    <OrbitingOrbs count={6} radius={6} color="#0088ff" glowColor="#00eeff" yOffset={4} speed={0.3} />
                    <OrbitingOrbs count={8} radius={10} color="#00aaff" glowColor="#ffffff" yOffset={8} speed={-0.15} />

                    {/* Deep sea bubbles - slow rise */}
                    <Sparkles count={250} scale={[12, 20, 12]} size={12} speed={0.5} opacity={0.8} color="#00ccff" position={[0, 5, 0]} noise={1.5} />
                    {/* Ambient mist */}
                    <Sparkles count={150} scale={[30, 15, 30]} size={25} speed={0.2} opacity={0.3} color="#aaddff" position={[0, 6, 0]} noise={2} />
                    {/* Plankton shimmer */}
                    <Sparkles count={300} scale={[25, 8, 25]} size={6} speed={0.1} opacity={0.6} color="#88eeff" position={[0, 2, 0]} />
                </group>
            );
            break;

        // ═══════════════════════════════════════════════════
        // 🌍 EARTH — Peaceful Ruins
        // ═══════════════════════════════════════════════════
        case "earth":
            content = (
                <group>
                    <ambientLight intensity={1.0} color="#7a4500" />
                    <directionalLight position={[10, 15, 5]} intensity={4} color="#d4883a" />
                    <pointLight position={[0, 0, 0]} intensity={60} color="#c86400" distance={35} decay={2} />
                    <pointLight position={[-6, 2, -6]} intensity={40} color="#8b4513" distance={25} decay={2} />
                    <pointLight position={[6, 2, 6]} intensity={40} color="#ff8800" distance={25} decay={2} />

                    {/* Magma ground cracks - static */}
                    <GroundRing color="#8b4513" innerRadius={4} outerRadius={7} />

                    {/* Rising crystal shards - few and slow */}
                    <CrystalShards color="#8b5a2b" glowColor="#cc8800" count={8} />

                    {/* Orbiting boulders - heavy and very slow */}
                    <OrbitingOrbs count={4} radius={7} color="#5c3317" glowColor="#ff4400" yOffset={3} speed={0.15} />

                    {/* Heavy floating dust - near motionless */}
                    <Sparkles count={200} scale={[20, 10, 20]} size={25} speed={0.1} opacity={0.6} color="#5c4033" position={[0, 3, 0]} noise={0.2} />
                    {/* Ambient sand */}
                    <Sparkles count={300} scale={[35, 15, 35]} size={10} speed={0.2} opacity={0.5} color="#c8a060" position={[0, 5, 0]} noise={1} />
                    {/* Rare floating rocks */}
                    <Sparkles count={60} scale={[15, 12, 15]} size={35} speed={0.3} opacity={1.0} color="#3d2b1f" position={[0, 4, 0]} />
                </group>
            );
            break;

        // ═══════════════════════════════════════════════════
        // 🌪️ WIND — Silent Zephyr
        // ═══════════════════════════════════════════════════
        case "wind":
            content = (
                <group>
                    <ambientLight intensity={1.3} color="#88ffcc" />
                    <directionalLight position={[-15, 8, 0]} intensity={5} color="#ccffee" />
                    <pointLight position={[0, 5, 0]} intensity={40} color="#aaffcc" distance={40} decay={2} />
                    <pointLight position={[-8, 3, 0]} intensity={20} color="#ffffff" distance={30} decay={2} />
                    <pointLight position={[8, 3, 0]} intensity={20} color="#ccffdd" distance={30} decay={2} />

                    {/* Ground spin */}
                    <ShockwaveRings color="#88ffaa" count={3} />
                    <GroundRing color="#44ffaa" innerRadius={2} outerRadius={5} />

                    {/* Orbiting wind orbs - moderate speed */}
                    <OrbitingOrbs count={6} radius={4} color="#aaffcc" glowColor="#ffffff" yOffset={3} speed={1.5} />
                    <OrbitingOrbs count={8} radius={7} color="#88ffdd" glowColor="#ccffee" yOffset={6} speed={-1.0} />

                    {/* Inner dust devil - lowered speed */}
                    <Sparkles count={300} scale={[12, 14, 12]} size={8} speed={3} opacity={0.6} color="#ccffee" position={[0, 4, 0]} noise={1.5} />
                    {/* Wide gust stream */}
                    <Sparkles count={400} scale={[40, 18, 40]} size={6} speed={2.5} opacity={0.5} color="#e0ffe0" position={[0, 5, 0]} noise={1} />
                    {/* High altitude clouds - very slow */}
                    <Sparkles count={150} scale={[35, 12, 35]} size={25} speed={0.5} opacity={0.2} color="#ffffff" position={[0, 10, 0]} noise={0.5} />
                    {/* Slow floating leaves/debris */}
                    <Sparkles count={100} scale={[25, 20, 25]} size={12} speed={1.2} opacity={0.7} color="#aaffcc" position={[0, 4, 0]} noise={2} />
                </group>
            );
            break;

        // ═══════════════════════════════════════════════════
        // 🌑 DARK — Creeping Shadows
        // ═══════════════════════════════════════════════════
        case "dark":
            content = (
                <group>
                    <ambientLight intensity={0.4} color="#2a004a" />
                    <pointLight position={[0, 0, 0]} intensity={60} color="#5500bb" distance={40} decay={2} />
                    <pointLight position={[0, 8, 0]} intensity={40} color="#8800ff" distance={35} decay={2} />
                    <pointLight position={[5, 3, -5]} intensity={25} color="#330066" distance={20} decay={2} />
                    <pointLight position={[-5, 3, 5]} intensity={25} color="#440088" distance={20} decay={2} />

                    {/* Void ground */}
                    <GroundRing color="#2a0044" innerRadius={3} outerRadius={6} />
                    <GroundRing color="#440088" innerRadius={6} outerRadius={9} />
                    <ShockwaveRings color="#7700cc" count={2} />

                    {/* Dark tentacles reaching up - Slow pulse */}
                    <DarkTentacles count={6} />

                    {/* Orbiting void orbs - drifting */}
                    <OrbitingOrbs count={5} radius={5} color="#220033" glowColor="#8800ff" yOffset={3} speed={-0.4} />
                    <OrbitingOrbs count={8} radius={8} color="#330055" glowColor="#aa00ff" yOffset={6} speed={0.3} />

                    {/* Black void core - ultra slow */}
                    <Sparkles count={250} scale={[12, 14, 12]} size={30} speed={0.1} opacity={0.8} color="#000000" position={[0, 4, 0]} noise={0.2} />
                    {/* Dark matter cloud */}
                    <Sparkles count={200} scale={[25, 18, 25]} size={20} speed={0.2} opacity={0.6} color="#1a0033" position={[0, 5, 0]} noise={0.5} />
                    {/* Purple soul sparks - rare and slow */}
                    <Sparkles count={150} scale={[28, 22, 28]} size={12} speed={0.4} opacity={0.7} color="#aa00ff" position={[0, 6, 0]} noise={1} />
                    {/* Outer shadow mist */}
                    <Sparkles count={100} scale={[40, 20, 40]} size={25} speed={0.15} opacity={0.3} color="#330044" position={[0, 4, 0]} noise={0.3} />
                </group>
            );
            break;

        // ═══════════════════════════════════════════════════
        // ☀️ LIGHT — Holy Sanctuary
        // ═══════════════════════════════════════════════════
        case "light":
            content = (
                <group>
                    <ambientLight intensity={1.5} color="#fffaf0" />
                    <directionalLight position={[0, 25, 0]} intensity={4} color="#fff5cc" />
                    <pointLight position={[0, 3, 0]} intensity={60} color="#ffffff" distance={50} decay={2} />
                    <pointLight position={[0, 12, 0]} intensity={40} color="#ffeeaa" distance={40} decay={2} />
                    <pointLight position={[6, 5, 6]} intensity={25} color="#ffddaa" distance={25} decay={2} />
                    <pointLight position={[-6, 5, -6]} intensity={25} color="#ffffcc" distance={25} decay={2} />

                    {/* Holy ground */}
                    <GroundRing color="#ffee88" innerRadius={4} outerRadius={7} />
                    <ShockwaveRings color="#ffdd44" count={2} />

                    {/* Angel beams - Fewer */}
                    <HolyBeams count={8} />

                    {/* Orbiting holy orbs - Gentle rotation */}
                    <OrbitingOrbs count={6} radius={5} color="#ffffff" glowColor="#ffeeaa" yOffset={4} speed={0.6} />
                    <OrbitingOrbs count={10} radius={9} color="#ffddaa" glowColor="#ffffff" yOffset={8} speed={-0.3} />

                    {/* Blinding core - softer */}
                    <Sparkles count={200} scale={[10, 12, 10]} size={15} speed={0.8} opacity={0.7} color="#ffffff" position={[0, 4, 0]} />
                    {/* Golden aura - slow float */}
                    <Sparkles count={300} scale={[25, 20, 25]} size={12} speed={0.5} opacity={0.6} color="#ffdd00" position={[0, 6, 0]} />
                    {/* Holy mist */}
                    <Sparkles count={250} scale={[38, 18, 38]} size={25} speed={0.2} opacity={0.4} color="#ffffcc" position={[0, 5, 0]} />
                    {/* Ethereal wisps - Large and slow */}
                    <Sparkles count={100} scale={[15, 10, 15]} size={35} speed={0.3} opacity={0.3} color="#ffffff" position={[0, 12, 0]} />
                </group>
            );
            break;

        default:
            return null;
    }

    return (
        <animated.group position={pos}>
            {content}
        </animated.group>
    );
};

// ─────────────────────────────────────────────
// BACKGROUND ENVIRONMENTS (Surrounding the board)
// ─────────────────────────────────────────────

const bgUrls = {
    nature: '/backgrounds/nature_bg.png',
    fire: '/backgrounds/fire_bg.png',
    water: '/backgrounds/water_bg.png',
    earth: '/backgrounds/earth_bg.png',
    wind: '/backgrounds/wind_bg.png',
    dark: '/backgrounds/dark_bg.png',
    light: '/backgrounds/light_bg.png',
};

// Preload textures to prevent frame drops
Object.values(bgUrls).forEach(url => useTexture.preload(url));

const PanoramaSphere = ({ url, opacity }: { url: string, opacity: SpringValue<number> | number }) => {
    const texture = useTexture(url);
    return (
        <animated.mesh scale={[120, 120, 120]}>
            <sphereGeometry args={[1, 64, 64]} />
            {/* @ts-ignore */}
            <animated.meshBasicMaterial
                map={texture}
                transparent
                opacity={opacity}
                side={THREE.BackSide}
                toneMapped={false}
            />
        </animated.mesh>
    );
};

const NatureBackground = ({ active }: { active: boolean }) => {
    const { opacity } = useSpring({ opacity: active ? 1 : 0, config: { duration: 2500 } }) as any;
    if (!active && opacity.get() === 0) return null;
    return (
        <group position={[0, -2, 0]}>
            <PanoramaSphere url={bgUrls.nature} opacity={opacity} />
            <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} turbidity={5} rayleigh={1.2} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 20, 10]} intensity={1.5} color="#fff1e0" />
            <fog attach="fog" args={['#e0f7fa', 20, 80]} />
        </group>
    );
};

const FireBackground = ({ active }: { active: boolean }) => {
    const { opacity } = useSpring({ opacity: active ? 1 : 0, config: { duration: 2500 } }) as any;
    if (!active && opacity.get() === 0) return null;
    return (
        <group position={[0, -2, 0]}>
            <PanoramaSphere url={bgUrls.fire} opacity={opacity} />
            <fog attach="fog" args={['#3a0a0a', 15, 60]} />
            <ambientLight intensity={0.1} color="#ff0000" />
            <pointLight position={[0, -5, -30]} intensity={50} color="#ff4400" distance={100} />
            <Sparkles count={500} scale={[120, 40, 120]} size={15} speed={0.4} color="#ffaa00" opacity={0.8} position={[0, 10, -20]} noise={1} />
        </group>
    );
};

const WaterBackground = ({ active }: { active: boolean }) => {
    const { opacity } = useSpring({ opacity: active ? 1 : 0, config: { duration: 2500 } }) as any;
    if (!active && opacity.get() === 0) return null;
    return (
        <group position={[0, -2, 0]}>
            <PanoramaSphere url={bgUrls.water} opacity={opacity} />
            <fog attach="fog" args={['#001133', 10, 50]} />
            <ambientLight intensity={0.2} color="#0044ff" />
            <directionalLight position={[0, 20, -20]} intensity={1} color="#aaaaff" />
            <Sparkles count={200} scale={[100, 20, 100]} size={10} speed={0.2} color="#88ffff" opacity={0.4} position={[0, 5, -20]} />
        </group>
    );
};

const EarthBackground = ({ active }: { active: boolean }) => {
    const { opacity } = useSpring({ opacity: active ? 1 : 0, config: { duration: 2500 } }) as any;
    if (!active && opacity.get() === 0) return null;
    return (
        <group position={[0, -2, 0]}>
            <PanoramaSphere url={bgUrls.earth} opacity={opacity} />
            <fog attach="fog" args={['#4a3a2a', 15, 70]} />
            <ambientLight intensity={0.3} color="#aa8866" />
            <directionalLight position={[-10, 20, -10]} intensity={1.5} color="#ffddaa" castShadow />
            <Sparkles count={400} scale={[150, 30, 150]} size={8} speed={0.8} color="#ccaa88" opacity={0.5} position={[0, 5, -20]} noise={2} />
        </group>
    );
};

const WindBackground = ({ active }: { active: boolean }) => {
    const { opacity } = useSpring({ opacity: active ? 1 : 0, config: { duration: 2500 } }) as any;
    if (!active && opacity.get() === 0) return null;
    return (
        <group position={[0, -2, 0]}>
            <PanoramaSphere url={bgUrls.wind} opacity={opacity} />
            <Sky distance={450000} sunPosition={[0, 10, -10]} inclination={0.49} azimuth={0.25} rayleigh={0.5} />
            <fog attach="fog" args={['#e0f7fa', 30, 100]} />
            <ambientLight intensity={0.5} color="#ffffff" />
            <Sparkles count={300} scale={[150, 40, 150]} size={20} speed={8} color="#ffffff" opacity={0.4} position={[0, 0, -20]} noise={3} />
        </group>
    );
};

const DarkBackground = ({ active }: { active: boolean }) => {
    const { opacity } = useSpring({ opacity: active ? 1 : 0, config: { duration: 2500 } }) as any;
    if (!active && opacity.get() === 0) return null;
    return (
        <group position={[0, -2, 0]}>
            <PanoramaSphere url={bgUrls.dark} opacity={opacity} />
            <fog attach="fog" args={['#0a001a', 5, 40]} />
            <ambientLight intensity={0.05} color="#220044" />
            <pointLight position={[0, 10, -30]} intensity={20} color="#440088" />
            <Sparkles count={300} scale={[100, 60, 100]} size={15} speed={0.1} color="#6600cc" opacity={0.6} position={[0, 10, -20]} noise={0.5} />
        </group>
    );
};

const LightBackground = ({ active }: { active: boolean }) => {
    const { opacity } = useSpring({ opacity: active ? 1 : 0, config: { duration: 2500 } }) as any;
    if (!active && opacity.get() === 0) return null;
    return (
        <group position={[0, -2, 0]}>
            <PanoramaSphere url={bgUrls.light} opacity={opacity} />
            <fog attach="fog" args={['#fff8e7', 20, 80]} />
            <ambientLight intensity={0.8} color="#ffffff" />
            <directionalLight position={[0, 30, -10]} intensity={2} color="#ffebb3" />
            <Sparkles count={200} scale={[100, 50, 100]} size={25} speed={0.3} color="#ffffff" opacity={0.8} position={[0, 10, -20]} />
        </group>
    );
};

export const BackgroundEnvironment = ({ activeField }: { activeField: ElementType | null }) => {
    return (
        <group>
            {/* When no field is active, show the Nature background */}
            <NatureBackground active={activeField === null} />
            <FireBackground active={activeField === 'fire'} />
            <WaterBackground active={activeField === 'water'} />
            <EarthBackground active={activeField === 'earth'} />
            <WindBackground active={activeField === 'wind'} />
            <DarkBackground active={activeField === 'dark'} />
            <LightBackground active={activeField === 'light'} />
        </group>
    );
};