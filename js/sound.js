export const soundSystem = {
    ctx: null,
    init: function() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    playTone: function(freq, type, duration, time = 0) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime + time);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + time + duration);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + time); osc.stop(this.ctx.currentTime + time + duration);
    },
    playTick: function(urgent = false) { this.init(); urgent ? this.playTone(800, 'square', 0.1) : this.playTone(400, 'sine', 0.1); },
    playCorrect: function() { this.init(); this.playTone(600, 'sine', 0.1); this.playTone(1200, 'sine', 0.2, 0.1); },
    playWrong: function() { this.init(); this.playTone(150, 'sawtooth', 0.3); },
    playGameOver: function() { this.init(); this.playTone(300, 'triangle', 0.5); this.playTone(250, 'triangle', 0.5, 0.4); this.playTone(200, 'triangle', 1.0, 0.8); },
    playWin: function() { this.init(); [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { this.playTone(freq, 'square', 0.2, i * 0.15); }); this.playTone(1046.50, 'square', 0.6, 0.6); }
};