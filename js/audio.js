export class AudioController {
    constructor(settings = {}) {
        this.ctx = null;
        this.bgmVol = (settings.bgmVol ?? 65) / 100;
        this.sfxVol = (settings.sfxVol ?? 100) / 100;
        this.haptics = settings.haptics ?? true;
        this.ducked = false;
        this.noiseBuf = null;
        this.audioEl = document.getElementById('bgm-audio');
        this.updateMediaVolume();
    }

    vibrate(pattern) {
        if (this.haptics && navigator?.vibrate) {
            try { navigator.vibrate(pattern); } catch { }
        }
    }

    init() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AC();
            const sr = this.ctx.sampleRate;
            this.noiseBuf = this.ctx.createBuffer(1, sr * 1.2, sr);
            const out = this.noiseBuf.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < out.length; i++) {
                const w = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
                b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
                b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
                out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.04;
                b6 = w * 0.115926;
            }
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.syncMusic();
    }

    setVolumes(bgmPct, sfxPct) {
        this.bgmVol = Math.max(0, Math.min(1, bgmPct / 100));
        this.sfxVol = Math.max(0, Math.min(1, sfxPct / 100));
        this.syncMusic();
    }

    updateMediaVolume() {
        if (this.audioEl) this.audioEl.volume = this.ducked ? this.bgmVol * 0.4 : this.bgmVol;
    }

    syncMusic() {
        if (!this.audioEl) return;
        this.updateMediaVolume();
        if (this.bgmVol <= 0.001) this.audioEl.pause();
        else this.audioEl.play().catch(() => { });
    }

    setMusicDucking(ducked) {
        this.ducked = ducked;
        this.updateMediaVolume();
    }

    tone(freq, type, dur, vol, endFreq = null, delay = 0) {
        if (this.sfxVol <= 0.001 || !this.ctx) return;
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
        gain.gain.setValueAtTime(vol * this.sfxVol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.01);
    }

    playTap() { this.tone(300, 'sine', 0.04, 0.10, 110); }
    playDash() { this.tone(520, 'triangle', 0.15, 0.16, 160); }
    playSlowMo() { this.tone(240, 'sine', 0.46, 0.16, 75); }
    playFail() { this.tone(140, 'sine', 0.46, 0.24, 42); }
    playUpgrade() { [392, 523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 'triangle', 0.3, 0.14, null, i * 0.055)); }
    playWin() { [293.66, 369.99, 440, 587.33].forEach((f, i) => this.tone(f, 'sine', 0.65, 0.13, null, i * 0.075)); }
    playPickup(c = 0) {
        const notes = [293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
        this.tone(notes[c % notes.length], 'sine', 0.35, 0.16);
    }

    playLaserPulse() {
        if (this.sfxVol <= 0.001 || !this.ctx || !this.noiseBuf) return;
        this.tone(115, 'sine', 0.22, 0.20, 38);
        const t = this.ctx.currentTime;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(850, t);
        filter.frequency.exponentialRampToValueAtTime(240, t + 0.2);
        filter.Q.value = 1.6;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.18 * this.sfxVol, t);
        nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.21);
        src.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.ctx.destination);
        src.start(t);
        src.stop(t + 0.22);
    }
}