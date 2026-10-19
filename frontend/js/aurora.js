// Aurora Borealis & Canvas Background Engine for Vibe Code Launcher
class AuroraEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.time = 0;
        this.animId = null;
        this.isAnimating = true;
        this.reducedMotion = false;
        
        // Color variation palettes
        this.palettes = {
            classic: [
                { r: 0, g: 245, b: 212 },   // Vibrant turquoise
                { r: 16, g: 185, b: 129 },  // Emerald green
                { r: 59, g: 130, b: 246 },  // Royal blue
                { r: 139, g: 92, b: 246 }   // Purple
            ],
            violet: [
                { r: 168, g: 85, b: 247 },  // Violet
                { r: 99, g: 102, b: 241 },  // Indigo
                { r: 236, g: 72, b: 153 },  // Pink
                { r: 59, g: 130, b: 246 }   // Blue
            ],
            cyan: [
                { r: 6, g: 182, b: 212 },   // Cyan
                { r: 14, g: 165, b: 233 },  // Sky
                { r: 20, g: 184, b: 166 },  // Teal
                { r: 56, g: 189, b: 248 }   // Light blue
            ],
            emerald: [
                { r: 16, g: 185, b: 129 },  // Emerald
                { r: 52, g: 211, b: 153 },  // Mint
                { r: 5, g: 150, b: 105 },   // Dark emerald
                { r: 6, g: 95, b: 70 }      // Deep green
            ],
            rose: [
                { r: 244, g: 63, b: 94 },   // Rose
                { r: 236, g: 72, b: 153 },  // Pink
                { r: 217, g: 70, b: 239 },  // Fuchsia
                { r: 139, g: 92, b: 246 }   // Purple
            ]
        };
        
        this.currentPaletteKey = 'classic';
        this.stars = [];
        this.mountains = [];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initStars();
        this.initMountains();
    }
    
    resize() {
        if (!this.canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = this.canvas.parentElement.clientWidth || window.innerWidth;
        this.height = this.canvas.parentElement.clientHeight || window.innerHeight;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.initStars();
        this.initMountains();
    }
    
    initStars() {
        this.stars = [];
        const count = Math.floor((this.width * this.height) / 4500);
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.75),
                radius: Math.random() * 1.2 + 0.3,
                baseAlpha: Math.random() * 0.6 + 0.2,
                twinkleSpeed: Math.random() * 0.03 + 0.008,
                phase: Math.random() * Math.PI * 2
            });
        }
        
        // Floating luminous stardust particles
        this.particles = [];
        for (let i = 0; i < 45; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.85),
                vx: (Math.random() - 0.5) * 0.3,
                vy: -Math.random() * 0.35 - 0.12,
                radius: Math.random() * 1.8 + 0.8,
                colorIndex: i % 4,
                baseAlpha: Math.random() * 0.5 + 0.25
            });
        }
    }
    
    initMountains() {
        // Multi-layered jagged mountain horizon
        this.mountains = [];
        const layers = [
            { yBase: 0.82, peakVariance: 90, segments: 18, color: '#05070e' },
            { yBase: 0.88, peakVariance: 60, segments: 24, color: '#03050a' },
            { yBase: 0.93, peakVariance: 35, segments: 30, color: '#020306' }
        ];
        
        for (const l of layers) {
            const points = [];
            const step = this.width / l.segments;
            for (let i = 0; i <= l.segments + 1; i++) {
                const x = i * step;
                const seed = Math.sin(i * 1.8) * Math.cos(i * 0.9);
                const y = (this.height * l.yBase) - Math.abs(seed) * l.peakVariance;
                points.push({ x, y });
            }
            this.mountains.push({ points, color: l.color });
        }
    }
    
    setPalette(key) {
        if (this.palettes[key]) {
            this.currentPaletteKey = key;
        }
    }
    
    setAnimations(enabled) {
        this.isAnimating = enabled;
        if (!enabled) {
            this.draw();
        }
    }
    
    setReducedMotion(reduced) {
        this.reducedMotion = reduced;
    }
    
    start() {
        if (this.animId) cancelAnimationFrame(this.animId);
        const loop = () => {
            if (this.isAnimating && !this.reducedMotion) {
                this.time += 0.007;
            }
            this.draw();
            this.animId = requestAnimationFrame(loop);
        };
        loop();
    }
    
    stop() {
        if (this.animId) cancelAnimationFrame(this.animId);
    }
    
    draw() {
        const { ctx, width, height, time } = this;
        if (!ctx || width === 0 || height === 0) return;
        
        ctx.clearRect(0, 0, width, height);
        
        // Deep sky background gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#04060d');
        skyGrad.addColorStop(0.5, '#070b18');
        skyGrad.addColorStop(0.85, '#0a1024');
        skyGrad.addColorStop(1, '#050812');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);
        
        // Twinkling stars
        for (const star of this.stars) {
            const alpha = star.baseAlpha + Math.sin(time * 30 * star.twinkleSpeed + star.phase) * 0.25;
            ctx.fillStyle = `rgba(226, 232, 255, ${Math.max(0.1, Math.min(1, alpha))})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Aurora ribbons
        const palette = this.palettes[this.currentPaletteKey] || this.palettes.classic;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        const ribbonCount = 4;
        for (let r = 0; r < ribbonCount; r++) {
            const color = palette[r % palette.length];
            const tOffset = time + (r * 1.35);
            const yCenter = height * (0.28 + r * 0.12);
            
            ctx.beginPath();
            ctx.moveTo(0, height);
            
            const steps = 40;
            const dx = width / steps;
            
            // Upper wave boundary
            for (let i = 0; i <= steps; i++) {
                const x = i * dx;
                const nx = i / steps;
                
                // Multi-frequency harmonic wave
                const wave1 = Math.sin(nx * 4 + tOffset * 0.8) * (height * 0.08);
                const wave2 = Math.cos(nx * 7 - tOffset * 1.1) * (height * 0.04);
                const wave3 = Math.sin(nx * 2 + tOffset * 0.5) * (height * 0.06);
                const curtainFold = Math.sin(nx * 14 + tOffset * 1.4) * (height * 0.02);
                
                const y = yCenter + wave1 + wave2 + wave3 + curtainFold;
                if (i === 0) {
                    ctx.lineTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            // Bottom boundary
            ctx.lineTo(width, height);
            ctx.closePath();
            
            // Vertical aurora gradient with realistic atmospheric falloff
            const grad = ctx.createLinearGradient(0, yCenter - 120, 0, yCenter + 220);
            grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
            grad.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, 0.38)`);
            grad.addColorStop(0.65, `rgba(${color.r}, ${color.g}, ${color.b}, 0.18)`);
            grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
            
            ctx.fillStyle = grad;
            ctx.fill();
        }

        // Floating stardust particles with gentle glow
        if (this.particles) {
            for (const p of this.particles) {
                if (this.isAnimating && !this.reducedMotion) {
                    p.x += p.vx;
                    p.y += p.vy;
                    if (p.y < 0) p.y = height * 0.85;
                    if (p.x < 0) p.x = width;
                    if (p.x > width) p.x = 0;
                }
                const color = palette[p.colorIndex % palette.length];
                const pAlpha = p.baseAlpha + Math.sin(time * 5 + p.x) * 0.2;
                ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.max(0.1, pAlpha)})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
        
        // Mountain silhouettes
        for (const m of this.mountains) {
            ctx.fillStyle = m.color;
            ctx.beginPath();
            ctx.moveTo(0, height);
            for (const pt of m.points) {
                ctx.lineTo(pt.x, pt.y);
            }
            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fill();
        }
        
        // Subtle water/lake reflection line at bottom
        const lakeGrad = ctx.createLinearGradient(0, height * 0.94, 0, height);
        lakeGrad.addColorStop(0, 'rgba(8, 14, 28, 0.4)');
        lakeGrad.addColorStop(1, 'rgba(3, 5, 10, 0.95)');
        ctx.fillStyle = lakeGrad;
        ctx.fillRect(0, height * 0.94, width, height * 0.06);
    }
}

window.AuroraEngine = AuroraEngine;
