import type { ElementType } from '../store/gameStore';

class AudioManager {
    private ctx: AudioContext | null = null;
    private isInitialized = false;

    public init() {
        if (this.isInitialized) return;
        
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.isInitialized = true;
            
            // Resume context if it's suspended (autoplay policy)
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        } catch (e) {
            console.error('Web Audio API is not supported in this browser.', e);
        }
    }

    public isReady() {
        return this.isInitialized && this.ctx && this.ctx.state === 'running';
    }

    // A helper to create a short noise burst (useful for fire, wind, impacts)
    private createNoiseBuffer(duration: number) {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    public playElementAttack(element: ElementType) {
        if (!this.ctx) return;
        
        // Ensure state is running
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const t = this.ctx.currentTime;
        
        switch (element) {
            case 'fire': {
                // Noise burst for explosion
                const buffer = this.createNoiseBuffer(0.5);
                if (!buffer) return;
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                
                // Lowpass filter to make it sound like a deep rumble/explosion
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, t);
                filter.frequency.exponentialRampToValueAtTime(100, t + 0.4);
                
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(1, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
                
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                
                noise.start(t);
                break;
            }
            case 'water': {
                // Sine sweep up (bubble sound)
                const osc = this.ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, t);
                osc.frequency.exponentialRampToValueAtTime(800, t + 0.2);
                
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.8, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.start(t);
                osc.stop(t + 0.3);
                break;
            }
            case 'earth': {
                // Low frequency kick / thud
                const osc = this.ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
                
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(1, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.start(t);
                osc.stop(t + 0.4);
                break;
            }
            case 'wind': {
                // White noise with sweeping bandpass (whoosh)
                const buffer = this.createNoiseBuffer(0.6);
                if (!buffer) return;
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.Q.value = 1.5;
                filter.frequency.setValueAtTime(400, t);
                filter.frequency.exponentialRampToValueAtTime(2000, t + 0.3);
                filter.frequency.exponentialRampToValueAtTime(400, t + 0.6);
                
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.6, t + 0.2);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.6);
                
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                
                noise.start(t);
                break;
            }
            case 'light': {
                // High-pitched chime (multiple oscillators)
                const playChime = (freq: number, delay: number) => {
                    if (!this.ctx) return;
                    const osc = this.ctx.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    
                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(0.3, t + delay);
                    gain.gain.exponentialRampToValueAtTime(0.01, t + delay + 0.5);
                    
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    
                    osc.start(t + delay);
                    osc.stop(t + delay + 0.5);
                };
                playChime(1200, 0);
                playChime(1600, 0.05);
                playChime(2400, 0.1);
                break;
            }
            case 'dark': {
                // Low pitched dissonance (zap/drone)
                const playDrone = (freq: number) => {
                    if (!this.ctx) return;
                    const osc = this.ctx.createOscillator();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, t);
                    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.4);
                    
                    const filter = this.ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(1000, t);
                    filter.frequency.exponentialRampToValueAtTime(200, t + 0.4);
                    
                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(0.4, t);
                    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
                    
                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);
                    
                    osc.start(t);
                    osc.stop(t + 0.4);
                };
                playDrone(100);
                playDrone(105); // slight detune for dissonance
                break;
            }
        }
    }

    public playCounterAttack() {
        if (!this.ctx) return;
        
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const t = this.ctx.currentTime;
        
        // Sharp metallic ping/zap
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(2000, t + 0.05);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 500;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(t);
        osc.stop(t + 0.2);
    }
}

// Export a singleton instance
export const audioManager = new AudioManager();
