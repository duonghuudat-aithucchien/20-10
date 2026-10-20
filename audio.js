// ============================================================================
// HỆ THỐNG PHÁT NHẠC NỀN 9X (TRÚ MƯA - NHÓM HKT) + HIỆU ỨNG ÂM THANH VUI NHỘN
// ============================================================================

class Retro9xAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.songTitle = "🎵 Trú Mưa - Nhóm HKT (Huyền Thoại 9x)";

    // Khởi tạo trình phát file MP3 trong thư mục
    this.bgAudio = new Audio("Trú Mưa Nhóm HKT Official MV.mp3");
    this.bgAudio.loop = true;
    this.bgAudio.volume = 0.85;
    this.bgAudio.preload = "auto";

    // Dự phòng nếu mở từ thư mục cha mà file nằm trong ./20-10/
    this.bgAudio.addEventListener("error", () => {
      if (!this.bgAudio.src.includes("20-10/")) {
        this.bgAudio.src = "20-10/Trú Mưa Nhóm HKT Official MV.mp3";
      }
    });

    this.bgAudio.addEventListener("play", () => {
      this.isPlaying = true;
      this.updateUI();
    });

    this.bgAudio.addEventListener("pause", () => {
      this.isPlaying = false;
      this.updateUI();
    });
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  startMusic() {
    this.initContext();
    if (this.isPlaying) return;
    const playPromise = this.bgAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          this.updateUI();
        })
        .catch(() => {
          // Chờ tương tác tiếp theo của người dùng nếu trình duyệt chặn autoplay
          this.isPlaying = false;
          this.updateUI();
        });
    }
  }

  stopMusic() {
    this.bgAudio.pause();
    this.isPlaying = false;
    this.updateUI();
  }

  toggleMusic() {
    if (this.isPlaying) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isPlaying;
  }

  replayFromStart() {
    this.bgAudio.currentTime = 0;
    this.startMusic();
    this.playClick();
  }

  playTone(freq, type, startTime, duration, peakGain) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  // ==================== HIỆU ỨNG ÂM THANH (SFX) ====================
  playClick() {
    this.initContext();
    const now = this.ctx.currentTime;
    this.playTone(880, "sine", now, 0.07, 0.15);
    this.playTone(1318.5, "triangle", now + 0.04, 0.1, 0.15);
  }

  playDodge() {
    this.initContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.22);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playSpin() {
    this.initContext();
    const now = this.ctx.currentTime;
    const notes = [60, 64, 67, 72, 76, 79, 84, 88, 91, 96];
    notes.forEach((n, idx) => {
      this.playTone(this.midiToFreq(n), "triangle", now + idx * 0.055, 0.16, 0.15);
    });
  }

  playFanfare() {
    this.initContext();
    const now = this.ctx.currentTime;
    const chord = [
      { note: 72, delay: 0.0, dur: 0.15 },
      { note: 76, delay: 0.12, dur: 0.15 },
      { note: 79, delay: 0.24, dur: 0.15 },
      { note: 84, delay: 0.36, dur: 0.55 },
      { note: 79, delay: 0.55, dur: 0.15 },
      { note: 84, delay: 0.70, dur: 0.80 }
    ];
    chord.forEach((c) => {
      this.playTone(this.midiToFreq(c.note), "triangle", now + c.delay, c.dur, 0.2);
      this.playTone(this.midiToFreq(c.note - 12), "sawtooth", now + c.delay, c.dur, 0.08);
    });
  }

  updateUI() {
    const toggleBtn = document.getElementById("musicToggleBtn");
    const trackNameEl = document.getElementById("musicTrackName");
    const eqBars = document.getElementById("musicEqualizer");

    if (toggleBtn) {
      toggleBtn.innerHTML = this.isPlaying
        ? '<span>⏸️ Tạm dừng nhạc</span>'
        : '<span>▶️ Bật nhạc 9x</span>';
      toggleBtn.classList.toggle("playing", this.isPlaying);
    }
    if (trackNameEl) {
      trackNameEl.textContent = this.songTitle;
    }
    if (eqBars) {
      eqBars.classList.toggle("active", this.isPlaying);
    }
  }
}

window.audio9x = new Retro9xAudioEngine();
