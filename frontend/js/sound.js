// ASMR Audio Synthesizer Engine using Web Audio API
// Generates soft, tactile, satisfying micro-sounds with zero external assets.
class ASMRSoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.35; // 0.0 to 1.0
        this.preset = 'glass'; // 'glass', 'soft', 'click'
        this.lastHoverTime = 0;
        
        // Lazy initialize AudioContext on first user interaction
        const initAudio = () => {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            }
            window.removeEventListener('pointerdown', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
        window.addEventListener('pointerdown', initAudio);
        window.addEventListener('keydown', initAudio);
    }
    
    ensureContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }
    
    setSettings(enabled, volumePercent, preset) {
        this.enabled = !!enabled;
        this.volume = Math.max(0, Math.min(1, (volumePercent !== undefined ? volumePercent : 60) / 100));
        if (preset) this.preset = preset;
    }
    
    // Soft glass/bubble hover tick (throttled to avoid sound spam)
    playHover() {
        if (!this.enabled || this.volume <= 0.01) return;
        const now = Date.now();
        if (now - this.lastHoverTime < 50) return;
        this.lastHoverTime = now;
        
        const ctx = this.ensureContext();
        if (!ctx) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sine';
        const freq = this.preset === 'glass' ? 1450 + Math.random() * 200 : 850 + Math.random() * 120;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.65, ctx.currentTime + 0.03);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3200, ctx.currentTime);
        
        const masterVol = this.volume * 0.22;
        gain.gain.setValueAtTime(masterVol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
    }
    
    // Satisfying tactile click / tick
    playClick() {
        if (!this.enabled || this.volume <= 0.01) return;
        const ctx = this.ensureContext();
        if (!ctx) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1050, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 0.045);
        
        const masterVol = this.volume * 0.50;
        gain.gain.setValueAtTime(masterVol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.055);
    }

    // Micro tick for slider interaction
    playSliderTick() {
        if (!this.enabled || this.volume <= 0.01) return;
        const now = Date.now();
        if (now - this.lastHoverTime < 35) return;
        this.lastHoverTime = now;

        const ctx = this.ensureContext();
        if (!ctx) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200 + this.volume * 400, ctx.currentTime);
        
        const masterVol = this.volume * 0.35;
        gain.gain.setValueAtTime(masterVol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
    }
    
    // Soft ethereal chime on app launch
    playLaunch() {
        if (!this.enabled || this.volume <= 0.01) return;
        const ctx = this.ensureContext();
        if (!ctx) return;
        
        const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
        freqs.forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.03);
            
            const masterVol = this.volume * 0.40;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime + idx * 0.03);
            gain.gain.linearRampToValueAtTime(masterVol, ctx.currentTime + idx * 0.03 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.03 + 0.35);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(ctx.currentTime + idx * 0.03);
            osc.stop(ctx.currentTime + idx * 0.03 + 0.4);
        });
    }
    
    // Magical sparkle bell on favorite toggle
    playStar() {
        if (!this.enabled || this.volume <= 0.01) return;
        const ctx = this.ensureContext();
        if (!ctx) return;
        
        const freqs = [880, 1174.66, 1760]; // A5, D6, A6
        freqs.forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.04);
            
            const masterVol = this.volume * 0.38;
            gain.gain.setValueAtTime(masterVol, ctx.currentTime + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.04 + 0.28);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(ctx.currentTime + idx * 0.04);
            osc.stop(ctx.currentTime + idx * 0.04 + 0.3);
        });
    }

    // Epic futuristic entrance chime / whoosh for Splash Screen
    playIntroTransition() {
        try {
            if (!this.enabled || this.volume <= 0.01) return;
            const ctx = this.ensureContext();
            if (!ctx) return;

            const safeVol = Math.max(0.001, (this.volume || 0.35) * 0.5);

            // 1. Futuristic rising sub-bass pulse
            const subOsc = ctx.createOscillator();
            const subGain = ctx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(65, ctx.currentTime);
            subOsc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.35);
            subGain.gain.setValueAtTime(safeVol, ctx.currentTime);
            subGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
            subOsc.connect(subGain);
            subGain.connect(ctx.destination);
            subOsc.start(ctx.currentTime);
            subOsc.stop(ctx.currentTime + 0.55);

            // 2. Crystal chord bloom (C5, G5, C6, E6)
            const chord = [523.25, 783.99, 1046.50, 1318.51];
            chord.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.05 + i * 0.04);
                const v = Math.max(0.001, (this.volume || 0.35) * 0.32);
                gain.gain.setValueAtTime(0.0001, ctx.currentTime + 0.05 + i * 0.04);
                gain.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.08 + i * 0.04);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.75 + i * 0.04);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + 0.05 + i * 0.04);
                osc.stop(ctx.currentTime + 0.85 + i * 0.04);
            });
        } catch (e) {
            console.warn('Audio transition non-critical error:', e);
        }
    }
}

window.ASMRSoundEngine = ASMRSoundEngine;
