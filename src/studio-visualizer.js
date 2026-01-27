/**
 * Studio Visualizer - Multi-mode Engine with Reactive Particles
 */
let currentVizMode = 'bars';
let particles = [];

function setVizMode(mode) {
    currentVizMode = mode;
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = Math.random() * 0.05 + 0.02;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.speedX *= 0.95; // Friction
        this.speedY *= 0.95;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function initVisualizer(canvas, player) {
    const ctx = canvas.getContext('2d');

    function draw() {
        requestAnimationFrame(draw);
        const w = canvas.width = canvas.offsetWidth;
        const h = canvas.height = canvas.offsetHeight;
        ctx.clearRect(0, 0, w, h);

        if (!player.analyser) {
            ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
            ctx.beginPath();
            ctx.moveTo(w * 0.1, h / 2);
            ctx.lineTo(w * 0.9, h / 2);
            ctx.stroke();
            return;
        }

        const data = new Uint8Array(player.analyser.frequencyBinCount);
        player.analyser.getByteFrequencyData(data);

        // Spawn particles on Peaks
        let sum = 0;
        for (let i = 0; i < 10; i++) sum += data[i]; // Bass frequencies
        if (sum > 1800) { // Frequency threshold
            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(w / 2, h / 2, '#00f2ff'));
                particles.push(new Particle(w / 2, h / 2, '#7000ff'));
            }
        }

        if (currentVizMode === 'bars') {
            drawBars(ctx, w, h, data);
        } else if (currentVizMode === 'wave') {
            drawWave(ctx, w, h, player);
        } else if (currentVizMode === 'circular') {
            drawCircular(ctx, w, h, data);
        }

        // Draw and Update Particles
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => {
            p.update();
            p.draw(ctx);
        });

        // Draw Timer
        if (player.isPlaying && player.ctx) {
            const cur = player.ctx.currentTime - player.startTime;
            const tot = player.getDuration();
            const fmt = (t) => {
                const a = Math.max(0, t);
                return Math.floor(a / 60) + ':' + Math.floor(a % 60).toString().padStart(2, '0');
            };
            document.getElementById('timer').textContent = `${fmt(cur)} / ${fmt(tot)}`;
        }
    }

    draw();
}

function drawBars(ctx, w, h, data) {
    const bw = (w / data.length) * 2.5;
    const barSpacing = 2;

    ctx.shadowBlur = 15;
    ctx.shadowColor = 'var(--primary)';

    for (let i = 0; i < data.length; i++) {
        const bh = (data[i] / 255) * h * 0.8;
        const x = i * (bw + barSpacing);
        if (x > w) break;

        const g = ctx.createLinearGradient(0, h, 0, h - bh);
        g.addColorStop(0, '#00f2ff');
        g.addColorStop(0.5, '#7000ff');
        g.addColorStop(1, '#ff0055');

        ctx.fillStyle = g;
        if (ctx.roundRect) ctx.roundRect(x, h - bh, bw, bh, [4, 4, 0, 0]);
        else ctx.fillRect(x, h - bh, bw, bh);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

function drawWave(ctx, w, h, player) {
    const data = new Uint8Array(player.analyser.fftSize);
    player.analyser.getByteTimeDomainData(data);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00f2ff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00f2ff';

    ctx.beginPath();
    const sliceWidth = w / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128.0;
        const y = v * h / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
    }

    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawCircular(ctx, w, h, data) {
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) * 0.25;

    ctx.shadowBlur = 10;
    ctx.shadowColor = '#7000ff';

    for (let i = 0; i < data.length; i += 4) {
        const value = data[i] / 255.0;
        const angle = (i / data.length) * Math.PI * 2;
        const innerX = centerX + Math.cos(angle) * radius;
        const innerY = centerY + Math.sin(angle) * radius;
        const outerX = centerX + Math.cos(angle) * (radius + value * 100);
        const outerY = centerY + Math.sin(angle) * (radius + value * 100);

        ctx.strokeStyle = `hsl(${(i / data.length) * 360}, 100%, 60%)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
}
