// ============================================================================
// APP LOGIC: LANDING PAGE CHÚC MỪNG 20-10 PHONG CÁCH 9X
// Đã tối ưu hóa Animation 60/120fps mượt mà (translate3d + OffscreenCanvas)
// Luồng 3 bước:
//   1. Hỏi bạn tên là gì?
//   2. Chỉ ở Bước 2: Hỏi "Đạt đẹp trai không?" (Hiển thị tên + câu trả lời xoay vòng quanh page)
//   3. Mở thiệp hồng 9x & 30 lời chúc ngọt ngào, dài dòng (Không nhắc tên Đạt)
// ============================================================================

(function () {
  // Trạng thái người dùng
  const state = {
    currentStep: 1,
    friendName: "",
    selectedAnswer: "Đạt đẹp trai vô địch vũ trụ, 10 điểm không có nhưng!",
    currentWishIndex: 0,
    dodgeCount: 0,
    isReverseSpin: false,
    isTurboSpin: false,
    isHoveringOrbitCard: false
  };

  // Trạng thái vật lý vòng xoay mượt mà (Smooth Flywheel Physics)
  const orbitPhysics = {
    outerAngle: 0,
    innerAngle: 0,
    currentAngularVel: 0.42, // rad/sec
    baseAngularVel: 0.42,
    turboAngularVel: 1.35,
    cards: [],
    pills: []
  };

  // Danh sách 8 câu trả lời xoay vòng quanh page ở Bước 2
  const ORBIT_ANSWERS_TEMPLATES = [
    "Đạt đẹp trai vô địch vũ trụ! 💖",
    "Đạt đẹp trai 1000 điểm không có nhưng! ✨",
    "Đạt đẹp trai nghiêng nước nghiêng thành! 🌹",
    "Đạt đẹp trai chuẩn nam thần 9x! 👑",
    "Đạt đẹp trai hết phần thiên hạ! 😍",
    "Nhìn Đạt đẹp trai là thấy mùa xuân! 🌸",
    "Đạt vừa đẹp trai vừa ga lăng số 1! 💎",
    "Đạt đẹp trai đỉnh của chóp luôn! 🔥"
  ];

  // Các câu trêu chọc khi bấm/chạm vào nút "Không đẹp trai" ở Bước 2
  const DODGE_FUNNY_MESSAGES = [
    "Ơ kìa {name} ơi, tay nhanh hơn mắt rồi! Đạt đẹp trai thế cơ mà! 😜",
    "Đừng dối lòng nữa {name} à, lương tâm không cho phép bấm nút này đâu! 😂",
    "Ú òa! Nút 'Không' đã tự động xoay vòng chạy trốn rồi! 🌀",
    "Bấm nhầm rồi mỹ nhân {name} ơi, nút 'Đạt đẹp trai' ở ngay bên trên kìa! 💖",
    "Hệ thống chống nói dối 9x phát hiện {name} đang định bấm sai sự thật! 🌹",
    "Thôi đừng đuổi theo nút này nữa {name} ơi, chọn câu trả lời phía trên để mở quà lẹ nè! 🎁"
  ];

  // Danh sách Quà Ảo Lầy Lội 9x ở Bước 3 (Không nhắc tên Đạt)
  const FUNNY_GIFTS_9X = [
    "🧋 01 Ly Trà Sữa Không Đường, Không Đá, Không Trân Châu, Không Trà, Không Sữa (Tặng tinh thần là chính, chúc {name} uống bằng niềm tin vẫn ngon miệng!)",
    "👑 01 Vương Miện Nữ Hoàng Sắc Đẹp 20-10 Bằng Kim Cương Ảo Lấp Lánh (Dành riêng cho {name} đội suốt 365 ngày!)",
    "💐 999 Đóa Hoa Hồng Đỏ 9x Bằng Kỹ Thuật Số — Không bao giờ héo, không tốn tiền mua bình cắm, ngắm lúc nào cũng tươi!",
    "📢 01 Tràng Pháo Tay Khen {name} Xinh Đẹp Kéo Dài 60 Giây (Bốp bốp bốp! Xuất sắc quá người đẹp ơi!)",
    "🍀 01 Bùa May Mắn 'Ăn Cả Thế Giới Vẫn Chuẩn Dáng Ngọc Ngà' có hiệu lực suốt 365 ngày tới!",
    "💳 01 Tấm Séc Tinh Thần Trị Giá 10 Tỷ Nụ Cười — Rút tiền mặt tại Ngân Hàng Niềm Vui bất cứ khi nào {name} thấy buồn!",
    "🎤 01 Bản Nhạc Huyền Thoại 9x 'Trú Mưa - HKT' Đang Phát Vang Lừng Chúc Mừng {name} Ngay Lúc Này!"
  ];

  // DOM Elements
  const step1Section = document.getElementById("step1Section");
  const step2Section = document.getElementById("step2Section");
  const step3Section = document.getElementById("step3Section");

  const stepDot1 = document.getElementById("stepDot1");
  const stepDot2 = document.getElementById("stepDot2");
  const stepDot3 = document.getElementById("stepDot3");
  const stepLine1 = document.getElementById("stepLine1");
  const stepLine2 = document.getElementById("stepLine2");

  const step1Form = document.getElementById("step1Form");
  const friendNameInput = document.getElementById("friendNameInput");
  const step1Error = document.getElementById("step1Error");

  const pageOrbitContainer = document.getElementById("pageOrbitContainer");
  const orbitRing = document.getElementById("orbitRing");
  const wheelOrbitTrack = document.getElementById("wheelOrbitTrack");

  const step2DisplayName = document.getElementById("step2DisplayName");
  const boardUserName = document.getElementById("boardUserName");
  const boardCurrentAnswer = document.getElementById("boardCurrentAnswer");
  const customAnswerInput = document.getElementById("customAnswerInput");
  const applyCustomAnswerBtn = document.getElementById("applyCustomAnswerBtn");
  const btnAnswerNo = document.getElementById("btnAnswerNo");
  const dodgeFunnyMsg = document.getElementById("dodgeFunnyMsg");

  const toggleSpinDirectionBtn = document.getElementById("toggleSpinDirectionBtn");
  const boostSpinSpeedBtn = document.getElementById("boostSpinSpeedBtn");
  const backToStep1Btn = document.getElementById("backToStep1Btn");

  const spinCelebrationOverlay = document.getElementById("spinCelebrationOverlay");
  const spinUserName = document.getElementById("spinUserName");
  const spinVerdictText = document.getElementById("spinVerdictText");

  const step3CertName = document.getElementById("step3CertName");
  const step3CertAnswer = document.getElementById("step3CertAnswer");
  const step3HeroName = document.getElementById("step3HeroName");
  const letterDearName = document.getElementById("letterDearName");
  const currentWishTag = document.getElementById("currentWishTag");
  const currentWishCounter = document.getElementById("currentWishCounter");
  const currentWishTitle = document.getElementById("currentWishTitle");
  const currentWishContent = document.getElementById("currentWishContent");

  const prevWishBtn = document.getElementById("prevWishBtn");
  const nextWishBtn = document.getElementById("nextWishBtn");
  const randomWishBtn = document.getElementById("randomWishBtn");
  const viewAllWishesBtn = document.getElementById("viewAllWishesBtn");
  const copyWishBtn = document.getElementById("copyWishBtn");
  const spinGiftBtn = document.getElementById("spinGiftBtn");
  const fireworkBurstBtn = document.getElementById("fireworkBurstBtn");
  const funnyGiftBox = document.getElementById("funnyGiftBox");
  const funnyGiftContent = document.getElementById("funnyGiftContent");

  const replayStep2Btn = document.getElementById("replayStep2Btn");
  const restartAllBtn = document.getElementById("restartAllBtn");

  // Modals
  const allWishesModal = document.getElementById("allWishesModal");
  const closeAllWishesModalBtn = document.getElementById("closeAllWishesModalBtn");
  const modalRecipientName = document.getElementById("modalRecipientName");
  const searchWishInput = document.getElementById("searchWishInput");
  const allWishesList = document.getElementById("allWishesList");

  const qrModal = document.getElementById("qrModal");
  const openQrModalBtn = document.getElementById("openQrModalBtn");
  const closeQrModalBtn = document.getElementById("closeQrModalBtn");
  const qrCodeImg = document.getElementById("qrCodeImg");
  const qrUrlInput = document.getElementById("qrUrlInput");
  const updateQrBtn = document.getElementById("updateQrBtn");

  const toast9x = document.getElementById("toast9x");

  // ==========================================================================
  // 1. ĐIỀU KHIỂN NHẠC NỀN 9X (TRÚ MƯA - NHÓM HKT)
  // ==========================================================================
  const musicToggleBtn = document.getElementById("musicToggleBtn");
  const musicNextBtn = document.getElementById("musicNextBtn");

  musicToggleBtn.addEventListener("click", () => {
    window.audio9x.toggleMusic();
  });

  musicNextBtn.addEventListener("click", () => {
    window.audio9x.replayFromStart();
  });

  function ensureMusicStarted() {
    if (!window.audio9x.userPaused) {
      window.audio9x.startMusic();
    }
  }

  // ==========================================================================
  // 2. BƯỚC 1: NHẬP TÊN CỦA BẠN
  // ==========================================================================
  document.querySelectorAll(".chip-9x").forEach((chip) => {
    chip.addEventListener("click", () => {
      ensureMusicStarted();
      window.audio9x.playClick();
      const suffix = chip.getAttribute("data-suffix") || "";
      const cur = friendNameInput.value.trim();
      if (!cur) {
        friendNameInput.value = suffix.trim();
      } else if (!cur.includes(suffix.trim())) {
        friendNameInput.value = cur + suffix;
      }
      friendNameInput.focus();
    });
  });

  step1Form.addEventListener("submit", (e) => {
    e.preventDefault();
    ensureMusicStarted();
    const rawName = friendNameInput.value.trim();
    if (!rawName) {
      step1Error.classList.remove("hidden");
      window.audio9x.playDodge();
      friendNameInput.focus();
      return;
    }
    step1Error.classList.add("hidden");
    state.friendName = rawName;
    window.audio9x.playClick();
    burstFlowers(28);
    goToStep(2);
  });

  // ==========================================================================
  // 3. BƯỚC 2: HỎI "ĐẠT ĐẸP TRAI KHÔNG?" & VÒNG XOAY MƯỢT MÀ QUANH PAGE
  // ==========================================================================
  function renderStep2OrbitAndBoard() {
    const name = state.friendName || "Mỹ Nhân";
    step2DisplayName.textContent = name;
    boardUserName.textContent = name;
    boardCurrentAnswer.textContent = `💖 "${name}: ${state.selectedAnswer}"`;

    // Cập nhật tên trong 4 viên thuốc xoay ở trung tâm card
    orbitPhysics.pills = Array.from(wheelOrbitTrack.querySelectorAll(".wheel-pill"));
    orbitPhysics.pills.forEach((el) => {
      const dyn = el.querySelector(".dyn-name");
      if (dyn) dyn.textContent = name;
    });

    // Tạo 8 thẻ xoay vòng quanh toàn bộ page (#orbitRing)
    orbitRing.innerHTML = "";
    orbitPhysics.cards = [];

    ORBIT_ANSWERS_TEMPLATES.forEach((ansText, idx) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "orbit-card";
      card.innerHTML = `🌹 <span class="orbit-name">${escapeHtml(name)}</span>: ${escapeHtml(ansText)}`;
      card.title = "Bấm để chốt câu trả lời này!";

      let isHovered = false;
      card.addEventListener("mouseenter", () => {
        isHovered = true;
        state.isHoveringOrbitCard = true;
        updateLiveAnswerPreview(ansText);
      });

      card.addEventListener("mouseleave", () => {
        isHovered = false;
        state.isHoveringOrbitCard = false;
      });

      card.addEventListener("click", () => {
        confirmStep2Answer(ansText);
      });

      orbitRing.appendChild(card);
      orbitPhysics.cards.push({
        el: card,
        index: idx,
        getHovered: () => isHovered
      });
    });
  }

  // Hàm cập nhật vị trí vòng xoay 60/120fps bằng translate3d (không gây reflow, không giật khi đổi tốc độ/chiều)
  function updateOrbitPositions(dt) {
    if (state.currentStep !== 2) return;

    const dir = state.isReverseSpin ? -1 : 1;
    let targetSpeed = state.isTurboSpin
      ? orbitPhysics.turboAngularVel
      : orbitPhysics.baseAngularVel;

    if (state.isHoveringOrbitCard) {
      targetSpeed *= 0.22; // Làm chậm mượt mà khi người dùng rê chuột vào đọc câu trả lời
    }

    const desiredVel = targetSpeed * dir;
    // Nội suy vận tốc mượt mà (smooth damping)
    orbitPhysics.currentAngularVel +=
      (desiredVel - orbitPhysics.currentAngularVel) * Math.min(1, dt * 6.5);

    orbitPhysics.outerAngle += orbitPhysics.currentAngularVel * dt;
    orbitPhysics.innerAngle += orbitPhysics.currentAngularVel * 1.45 * dt;

    // Bán kính elip vòng ngoài quanh page
    const rxOuter = Math.min(window.innerWidth * 0.43, 455);
    const ryOuter = Math.min(window.innerHeight * 0.41, 355);
    const totalCards = orbitPhysics.cards.length;

    for (let i = 0; i < totalCards; i++) {
      const item = orbitPhysics.cards[i];
      const angle = orbitPhysics.outerAngle + (i / totalCards) * Math.PI * 2;
      const x = Math.cos(angle) * rxOuter;
      const y = Math.sin(angle) * ryOuter;
      const scale = item.getHovered() ? 1.12 : 1;
      item.el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0) scale(${scale})`;
    }

    // Bán kính elip vòng trong ngay giữa card Bước 2
    const isMobile = window.innerWidth <= 640;
    const rxInner = isMobile ? 132 : 196;
    const ryInner = isMobile ? 82 : 90;
    const totalPills = orbitPhysics.pills.length;

    for (let j = 0; j < totalPills; j++) {
      const pillEl = orbitPhysics.pills[j];
      const angle = orbitPhysics.innerAngle + (j / totalPills) * Math.PI * 2;
      const px = Math.cos(angle) * rxInner;
      const py = Math.sin(angle) * ryInner;
      pillEl.style.transform = `translate3d(calc(-50% + ${px.toFixed(1)}px), calc(-50% + ${py.toFixed(1)}px), 0)`;
    }
  }

  function updateLiveAnswerPreview(answerText) {
    state.selectedAnswer = answerText;
    boardCurrentAnswer.textContent = `💖 "${state.friendName}: ${answerText}"`;
  }

  // Các nút chọn câu trả lời ở Bước 2
  document.querySelectorAll(".btn-answer-yes").forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      const ans = btn.getAttribute("data-answer");
      if (ans) updateLiveAnswerPreview(ans);
    });
    btn.addEventListener("click", () => {
      const ans = btn.getAttribute("data-answer") || "Đạt đẹp trai vô địch vũ trụ!";
      confirmStep2Answer(ans);
    });
  });

  // Khi người dùng tự gõ câu trả lời ở Bước 2
  customAnswerInput.addEventListener("input", () => {
    const val = customAnswerInput.value.trim();
    if (val) {
      updateLiveAnswerPreview(val);
      if (orbitPhysics.cards.length > 0) {
        orbitPhysics.cards[0].el.innerHTML = `🌟 <span class="orbit-name">${escapeHtml(state.friendName)}</span>: ${escapeHtml(val)}`;
      }
    }
  });

  applyCustomAnswerBtn.addEventListener("click", () => {
    const val = customAnswerInput.value.trim();
    if (!val) {
      customAnswerInput.focus();
      showToast("💌 Hãy gõ câu trả lời hoặc bấm chọn nút phía trên nhé!");
      return;
    }
    confirmStep2Answer(val);
  });

  // Nút điều khiển đảo chiều xoay & tăng tốc xoay vòng trên page
  toggleSpinDirectionBtn.addEventListener("click", () => {
    window.audio9x.playClick();
    state.isReverseSpin = !state.isReverseSpin;
  });

  boostSpinSpeedBtn.addEventListener("click", () => {
    window.audio9x.playSpin();
    state.isTurboSpin = !state.isTurboSpin;
    boostSpinSpeedBtn.textContent = state.isTurboSpin ? "🐢 Xoay dịu dàng" : "⚡ Xoay tít mù";
  });

  // Nút "Không đẹp trai" chạy trốn & xoay vòng lầy lội ở Bước 2
  function dodgeNoButton(e) {
    if (e) e.preventDefault();
    state.dodgeCount += 1;
    window.audio9x.playDodge();

    const msgTemplate = DODGE_FUNNY_MESSAGES[(state.dodgeCount - 1) % DODGE_FUNNY_MESSAGES.length];
    dodgeFunnyMsg.textContent = msgTemplate.replace(/\{name\}/g, state.friendName || "Bạn");
    dodgeFunnyMsg.classList.remove("hidden");

    if (state.dodgeCount >= 5) {
      btnAnswerNo.textContent = "😍 Thôi thú nhận: Đạt đẹp trai xỉu lên xỉu xuống!";
      btnAnswerNo.style.background = "linear-gradient(90deg, #ff4081, #d81b60)";
      btnAnswerNo.style.color = "#fff";
      btnAnswerNo.style.border = "2px solid #ffd700";
      btnAnswerNo.style.transform = "translate3d(0, 0, 0) rotate(0deg) scale(1.05)";
      btnAnswerNo.onclick = () => {
        confirmStep2Answer("Đạt đẹp trai xỉu lên xỉu xuống, không thể chối từ!");
      };
      return;
    }

    const randomX = (Math.random() - 0.5) * 220;
    const randomY = (Math.random() - 0.5) * 85;
    const randomDeg = (Math.random() - 0.5) * 40 + state.dodgeCount * 360;
    btnAnswerNo.style.transform = `translate3d(${randomX.toFixed(0)}px, ${randomY.toFixed(0)}px, 0) rotate(${randomDeg.toFixed(0)}deg)`;
  }

  btnAnswerNo.addEventListener("mouseenter", () => {
    if (state.dodgeCount < 5) dodgeNoButton();
  });
  btnAnswerNo.addEventListener("touchstart", (e) => {
    if (state.dodgeCount < 5) dodgeNoButton(e);
  });
  btnAnswerNo.addEventListener("click", (e) => {
    if (state.dodgeCount < 5) dodgeNoButton(e);
  });

  backToStep1Btn.addEventListener("click", () => {
    window.audio9x.playClick();
    goToStep(1);
  });

  // Khi chốt câu trả lời ở Bước 2 -> Xoay vòng câu trả lời trên page rồi mở sang Bước 3
  function confirmStep2Answer(answerText) {
    state.selectedAnswer = answerText;
    updateLiveAnswerPreview(answerText);
    window.audio9x.playSpin();
    burstFlowers(45);

    spinUserName.textContent = `Mỹ nhân ${state.friendName}`;
    spinVerdictText.textContent = `"${state.selectedAnswer}"`;
    spinCelebrationOverlay.classList.remove("hidden");

    setTimeout(() => {
      window.audio9x.playFanfare();
      burstFlowers(55);
      spinCelebrationOverlay.classList.add("hidden");
      state.currentWishIndex = Math.floor(Math.random() * window.WISHES_20_10.length);
      goToStep(3);
    }, 1700);
  }

  // ==========================================================================
  // 4. BƯỚC 3: HIỂN THỊ 30 LỜI CHÚC NGỌT NGÀO, DÀI DÒNG (KHÔNG NHẮC TÊN ĐẠT)
  // ==========================================================================
  function formatWishText(rawText) {
    const name = state.friendName || "Bạn";
    return rawText.replace(/\{name\}/g, name);
  }

  function renderCurrentWish() {
    const wishes = window.WISHES_20_10;
    const wish = wishes[state.currentWishIndex];
    const name = state.friendName || "Người Đẹp";

    step3CertName.textContent = name.toUpperCase();
    step3CertAnswer.textContent = `"Chúc ${name} ngày 20-10 ngập tràn hoa tươi, niềm vui và hạnh phúc!"`;
    step3HeroName.textContent = name;
    letterDearName.textContent = name;

    currentWishTag.textContent = wish.tag;
    currentWishCounter.textContent = `Lời chúc ${String(wish.id).padStart(2, "0")} / ${wishes.length}`;
    currentWishTitle.textContent = wish.title;
    currentWishContent.textContent = formatWishText(wish.content);

    const letterCard = document.getElementById("wishLetterCard");
    letterCard.classList.remove("wish-transition");
    void letterCard.offsetWidth;
    letterCard.classList.add("wish-transition");
  }

  prevWishBtn.addEventListener("click", () => {
    window.audio9x.playClick();
    const total = window.WISHES_20_10.length;
    state.currentWishIndex = (state.currentWishIndex - 1 + total) % total;
    renderCurrentWish();
  });

  nextWishBtn.addEventListener("click", () => {
    window.audio9x.playClick();
    const total = window.WISHES_20_10.length;
    state.currentWishIndex = (state.currentWishIndex + 1) % total;
    renderCurrentWish();
  });

  randomWishBtn.addEventListener("click", () => {
    window.audio9x.playClick();
    burstFlowers(22);
    const total = window.WISHES_20_10.length;
    let nextIdx = Math.floor(Math.random() * total);
    if (nextIdx === state.currentWishIndex) {
      nextIdx = (nextIdx + 1) % total;
    }
    state.currentWishIndex = nextIdx;
    renderCurrentWish();
  });

  copyWishBtn.addEventListener("click", () => {
    window.audio9x.playClick();
    const wish = window.WISHES_20_10[state.currentWishIndex];
    const fullText = `🌹 ${wish.title} 🌹\n\nGửi ${state.friendName} thân mến,\n${formatWishText(wish.content)}\n\n💖 Chúc mừng ngày Phụ nữ Việt Nam 20-10!`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullText).then(() => {
        showToast("✨ Đã copy lời chúc ngọt ngào vào bộ nhớ tạm!");
      });
    } else {
      showToast("✨ Đã sẵn sàng chia sẻ lời chúc!");
    }
  });

  spinGiftBtn.addEventListener("click", () => {
    window.audio9x.playFanfare();
    burstFlowers(30);
    const rawGift = FUNNY_GIFTS_9X[Math.floor(Math.random() * FUNNY_GIFTS_9X.length)];
    funnyGiftContent.textContent = rawGift.replace(/\{name\}/g, state.friendName || "Bạn");
    funnyGiftBox.classList.remove("hidden");
  });

  fireworkBurstBtn.addEventListener("click", () => {
    window.audio9x.playFanfare();
    burstFlowers(65);
    showToast(`🌹 Ngàn đóa hoa tươi chúc mừng 20-10 ${state.friendName}! 💖`);
  });

  replayStep2Btn.addEventListener("click", () => {
    window.audio9x.playClick();
    goToStep(2);
  });

  restartAllBtn.addEventListener("click", () => {
    window.audio9x.playClick();
    goToStep(1);
  });

  // ==========================================================================
  // 5. MODAL XEM TRỌN BỘ 30 LỜI CHÚC NGỌT NGÀO
  // ==========================================================================
  function renderAllWishesModal(keyword = "") {
    modalRecipientName.textContent = state.friendName || "Bạn";
    allWishesList.innerHTML = "";
    const kw = keyword.trim().toLowerCase();

    window.WISHES_20_10.forEach((wish, idx) => {
      const personalizedContent = formatWishText(wish.content);
      if (
        kw &&
        !wish.title.toLowerCase().includes(kw) &&
        !personalizedContent.toLowerCase().includes(kw) &&
        !wish.tag.toLowerCase().includes(kw)
      ) {
        return;
      }

      const item = document.createElement("div");
      item.className = "wish-item-card";
      item.innerHTML = `
        <div class="wish-item-header">
          <span class="wish-item-title">${escapeHtml(wish.title)}</span>
          <span class="wish-badge">${escapeHtml(wish.tag)}</span>
        </div>
        <p class="wish-item-body">${escapeHtml(personalizedContent)}</p>
        <button type="button" class="retro-btn-sm select-wish-btn" data-idx="${idx}">
          💌 Chọn hiển thị lời chúc #${String(wish.id).padStart(2, "0")} này
        </button>
      `;

      item.querySelector(".select-wish-btn").addEventListener("click", () => {
        window.audio9x.playClick();
        state.currentWishIndex = idx;
        renderCurrentWish();
        allWishesModal.classList.add("hidden");
      });

      allWishesList.appendChild(item);
    });
  }

  viewAllWishesBtn.addEventListener("click", () => {
    window.audio9x.playClick();
    searchWishInput.value = "";
    renderAllWishesModal("");
    allWishesModal.classList.remove("hidden");
  });

  searchWishInput.addEventListener("input", () => {
    renderAllWishesModal(searchWishInput.value);
  });

  closeAllWishesModalBtn.addEventListener("click", () => {
    allWishesModal.classList.add("hidden");
  });

  allWishesModal.addEventListener("click", (e) => {
    if (e.target === allWishesModal) allWishesModal.classList.add("hidden");
  });

  // ==========================================================================
  // 6. MODAL MÃ QR 20-10 ĐỂ BẠN BÈ QUÉT MỞ TRANG
  // ==========================================================================
  function getDefaultQrUrl() {
    if (window.location.protocol.startsWith("http")) {
      return window.location.origin + window.location.pathname;
    }
    return "https://duonghuudat-aithucchien.github.io/20-10/";
  }

  function updateQrImage(url) {
    const cleanUrl = (url || getDefaultQrUrl()).trim();
    const encoded = encodeURIComponent(cleanUrl);
    qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&color=880e4f&bgcolor=fff5f8&margin=8&data=${encoded}`;
  }

  openQrModalBtn.addEventListener("click", () => {
    window.audio9x.playClick();
    if (!qrUrlInput.value) {
      qrUrlInput.value = getDefaultQrUrl();
    }
    updateQrImage(qrUrlInput.value);
    qrModal.classList.remove("hidden");
  });

  updateQrBtn.addEventListener("click", () => {
    window.audio9x.playClick();
    updateQrImage(qrUrlInput.value);
    showToast("📱 Đã cập nhật mã QR 20-10!");
  });

  closeQrModalBtn.addEventListener("click", () => {
    qrModal.classList.add("hidden");
  });

  qrModal.addEventListener("click", (e) => {
    if (e.target === qrModal) qrModal.classList.add("hidden");
  });

  // ==========================================================================
  // 7. ĐIỀU HƯỚNG GIỮA 3 BƯỚC
  // ==========================================================================
  function goToStep(stepNumber) {
    state.currentStep = stepNumber;
    step1Section.classList.toggle("hidden", stepNumber !== 1);
    step2Section.classList.toggle("hidden", stepNumber !== 2);
    step3Section.classList.toggle("hidden", stepNumber !== 3);

    // Chỉ bật Vòng xoay quanh toàn bộ page ở Bước 2
    pageOrbitContainer.classList.toggle("hidden", stepNumber !== 2);

    // Cập nhật thanh tiến trình
    stepDot1.classList.toggle("active", stepNumber === 1);
    stepDot1.classList.toggle("completed", stepNumber > 1);
    stepLine1.classList.toggle("active", stepNumber >= 2);

    stepDot2.classList.toggle("active", stepNumber === 2);
    stepDot2.classList.toggle("completed", stepNumber > 2);
    stepLine2.classList.toggle("active", stepNumber >= 3);

    stepDot3.classList.toggle("active", stepNumber === 3);

    if (stepNumber === 2) {
      state.dodgeCount = 0;
      state.isHoveringOrbitCard = false;
      btnAnswerNo.textContent = "😜 Không đẹp trai lắm đâu...";
      btnAnswerNo.style.transform = "translate3d(0, 0, 0)";
      btnAnswerNo.style.background = "";
      btnAnswerNo.style.color = "";
      btnAnswerNo.onclick = null;
      dodgeFunnyMsg.classList.add("hidden");
      renderStep2OrbitAndBoard();
    } else if (stepNumber === 3) {
      renderCurrentWish();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ==========================================================================
  // 8. CANVAS MƯA HOA TƯƠI SIÊU MƯỢT (OFFSCREEN SPRITE CACHE + DELTA TIME)
  // ==========================================================================
  const canvas = document.getElementById("flowerCanvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  let cw = (canvas.width = window.innerWidth);
  let ch = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    cw = canvas.width = window.innerWidth;
    ch = canvas.height = window.innerHeight;
  });

  const FLOWER_SYMBOLS = ["🌹", "🌺", "🌷", "🌸", "💐", "💖", "✨"];
  const spriteCache = {};

  // Vẽ sẵn từng emoji hoa ra canvas nhỏ trong bộ nhớ để drawImage siêu nhanh 120fps
  function initFlowerSprites() {
    const spriteSize = 64;
    FLOWER_SYMBOLS.forEach((sym) => {
      const off = document.createElement("canvas");
      off.width = spriteSize;
      off.height = spriteSize;
      const octx = off.getContext("2d");
      octx.font = "44px sans-serif";
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillText(sym, spriteSize / 2, spriteSize / 2);
      spriteCache[sym] = off;
    });
  }
  initFlowerSprites();

  const petals = [];
  const burstParticles = [];

  function createPetal(randomY = false) {
    return {
      x: Math.random() * cw,
      y: randomY ? Math.random() * ch : -35,
      size: 18 + Math.random() * 16,
      speedY: 52 + Math.random() * 68, // px/sec
      speedX: (Math.random() - 0.5) * 45, // px/sec
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 1.4, // rad/sec
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 1.5 + Math.random() * 1.8,
      symbol: FLOWER_SYMBOLS[Math.floor(Math.random() * FLOWER_SYMBOLS.length)]
    };
  }

  for (let i = 0; i < 32; i++) {
    petals.push(createPetal(true));
  }

  function burstFlowers(count = 35) {
    const centerX = cw / 2;
    const centerY = ch / 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 160 + Math.random() * 440; // px/sec
      burstParticles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 130,
        gravity: 520, // px/sec^2
        alpha: 1,
        size: 22 + Math.random() * 18,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 4,
        symbol: FLOWER_SYMBOLS[Math.floor(Math.random() * FLOWER_SYMBOLS.length)]
      });
    }
  }

  let lastFrameTime = performance.now();

  function masterAnimationLoop(now) {
    // Delta time tính bằng giây (giới hạn tối đa 0.05s khi chuyển tab để không bị nhảy bước)
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    // 1. Cập nhật vòng xoay Bước 2 mượt mà
    updateOrbitPositions(dt);

    // 2. Vẽ mưa hoa tươi & pháo hoa trên Canvas
    ctx.clearRect(0, 0, cw, ch);

    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.y += p.speedY * dt;
      p.wobble += p.wobbleSpeed * dt;
      p.x += (p.speedX + Math.sin(p.wobble) * 32) * dt;
      p.rotation += p.rotSpeed * dt;

      if (p.y > ch + 35) {
        p.y = -30;
        p.x = Math.random() * cw;
      }
      if (p.x > cw + 35) p.x = -25;
      if (p.x < -35) p.x = cw + 25;

      const sprite = spriteCache[p.symbol];
      if (sprite) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.drawImage(sprite, -p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    }

    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const b = burstParticles[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += b.gravity * dt;
      b.rotation += b.rotSpeed * dt;
      b.alpha -= 0.78 * dt;

      if (b.alpha <= 0) {
        burstParticles.splice(i, 1);
        continue;
      }

      const sprite = spriteCache[b.symbol];
      if (sprite) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, b.alpha);
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation);
        ctx.drawImage(sprite, -b.size / 2, -b.size / 2, b.size, b.size);
        ctx.restore();
      }
    }

    requestAnimationFrame(masterAnimationLoop);
  }
  requestAnimationFrame(masterAnimationLoop);

  // ==========================================================================
  // TIỆN ÍCH CHUNG
  // ==========================================================================
  let toastTimer = null;
  function showToast(msg) {
    toast9x.textContent = msg;
    toast9x.classList.remove("hidden");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast9x.classList.add("hidden");
    }, 2800);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
