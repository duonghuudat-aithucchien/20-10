// ============================================================================
// HỆ THỐNG PHÁT NHẠC NỀN 9X (TRÚ MƯA - NHÓM HKT) + HIỆU ỨNG ÂM THANH VUI NHỘN
// Sử dụng file nhac-9x.mp3 (ASCII) để tương thích 100% với GitHub Pages & Mobile
// ============================================================================

class Retro9xAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.userPaused = false;
    this.masterGain = null;
    this.songTitle = "🎵 Trú Mưa - Nhóm HKT (Huyền Thoại 9x)";

    this.bgAudio =
      document.getElementById("bgMusicElement") || new Audio("nhac-9x.mp3");
    this.bgAudio.loop = true;
    this.bgAudio.volume = 0.9;
    this.bgAudio.preload = "auto";
    this.bgAudio.muted = false;

    this.welcomeOverlay = document.getElementById("welcomeMusicOverlay");
    this.openEnvelopeBtn = document.getElementById("openEnvelopeBtn");

    // Dự phòng nếu nhac-9x.mp3 chưa tải được thì chuyển sang tên gốc
    this.bgAudio.addEventListener("error", () => {
      if (this.bgAudio.src.includes("nhac-9x.mp3")) {
        this.bgAudio.src = "Trú Mưa Nhóm HKT Official MV.mp3";
        if (!this.userPaused) this.tryAutoplayImmediate();
      }
    });

    this.bgAudio.addEventListener("playing", () => {
      this.isPlaying = true;
      this.hideWelcomeOverlay();
      this.updateUI();
    });

    this.bgAudio.addEventListener("pause", () => {
      this.isPlaying = false;
      this.updateUI();
    });

    this.setupAutoplayAndGestureUnlock();
  }

  hideWelcomeOverlay() {
    if (this.welcomeOverlay && !this.welcomeOverlay.classList.contains("hidden")) {
      this.welcomeOverlay.classList.add("closing");
      setTimeout(() => {
        this.welcomeOverlay.classList.add("hidden");
        this.welcomeOverlay.classList.remove("closing");
      }, 220);
    }
  }

  showWelcomeOverlay() {
    if (this.welcomeOverlay && !this.isPlaying && !this.userPaused) {
      this.welcomeOverlay.classList.remove("hidden");
    }
  }

  setupAutoplayAndGestureUnlock() {
    // 1. Thử phát ngay lập tức khi mở trang
    this.tryAutoplayImmediate();
    window.addEventListener("DOMContentLoaded", () => this.tryAutoplayImmediate());
    window.addEventListener("load", () => this.tryAutoplayImmediate());

    // 2. Chỉ lắng nghe các sự kiện tương tác hợp lệ của trình duyệt (click, touch, pointerdown, keydown)
    // Tuyệt đối KHÔNG dùng mousemove vì Chrome/Safari sẽ từ chối play() trong mousemove
    const validGestureEvents = [
      "pointerdown",
      "mousedown",
      "touchstart",
      "touchend",
      "keydown",
      "click"
    ];

    const unlockOnGesture = () => {
      if (this.userPaused) return;
      this.initContext();
      this.bgAudio.muted = false;
      const playPromise = this.bgAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlaying = true;
            this.hideWelcomeOverlay();
            this.updateUI();
            validGestureEvents.forEach((evt) =>
              window.removeEventListener(evt, unlockOnGesture, { capture: true })
            );
          })
          .catch(() => {});
      }
    };

    validGestureEvents.forEach((evt) => {
      window.addEventListener(evt, unlockOnGesture, { capture: true, passive: true });
    });

    if (this.openEnvelopeBtn) {
      this.openEnvelopeBtn.addEventListener("click", () => {
        this.startMusic();
        this.hideWelcomeOverlay();
      });
    }
  }

  tryAutoplayImmediate() {
    if (this.userPaused || this.isPlaying) return;
    this.bgAudio.muted = false;
    const playPromise = this.bgAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          this.hideWelcomeOverlay();
          this.updateUI();
        })
        .catch(() => {
          // Trình duyệt yêu cầu 1 cú chạm để bật tiếng -> hiển thị phong bì mở thiệp 9x
          this.showWelcomeOverlay();
        });
    }
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.45;
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
    this.userPaused = false;
    this.bgAudio.muted = false;
    const playPromise = this.bgAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          this.hideWelcomeOverlay();
          this.updateUI();
        })
        .catch(() => {
          this.isPlaying = false;
          this.updateUI();
        });
    }
  }

  stopMusic() {
    this.userPaused = true;
    this.bgAudio.pause();
    this.isPlaying = false;
    this.updateUI();
  }

  toggleMusic() {
    if (this.isPlaying && !this.bgAudio.paused) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isPlaying;
  }

  replayFromStart() {
    this.userPaused = false;
    this.bgAudio.muted = false;
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
    this.playTone(880, "sine", now, 0.07, 0.14);
    this.playTone(1318.5, "triangle", now + 0.04, 0.1, 0.14);
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

    gain.gain.setValueAtTime(0.16, now);
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
      this.playTone(this.midiToFreq(n), "triangle", now + idx * 0.055, 0.16, 0.14);
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
      this.playTone(this.midiToFreq(c.note), "triangle", now + c.delay, c.dur, 0.18);
      this.playTone(this.midiToFreq(c.note - 12), "sawtooth", now + c.delay, c.dur, 0.07);
    });
  }

  updateUI() {
    const toggleBtn = document.getElementById("musicToggleBtn");
    const trackNameEl = document.getElementById("musicTrackName");
    const eqBars = document.getElementById("musicEqualizer");

    const activelyAudible = this.isPlaying && !this.bgAudio.paused;
    if (toggleBtn) {
      toggleBtn.innerHTML = activelyAudible
        ? '<span>⏸️ Tạm dừng nhạc</span>'
        : '<span>▶️ Bật nhạc 9x</span>';
      toggleBtn.classList.toggle("playing", activelyAudible);
    }
    if (trackNameEl) {
      trackNameEl.textContent = this.songTitle;
    }
    if (eqBars) {
      eqBars.classList.toggle("active", activelyAudible);
    }
  }
}

window.audio9x = new Retro9xAudioEngine();
