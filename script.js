/* ============================================================================
   0. HTML 필수 요소 연결 및 초기 세팅
============================================================================ */
const board = document.getElementById('board');
const themeSwitcher = document.getElementById('themeSwitcher');
const resetBtn = document.getElementById('resetBtn');
const bgmBtn = document.getElementById('bgmBtn');
const boardEmpty = document.querySelector('.board-empty') || document.getElementById('board-empty');

// ⬅️ ➡️ 단일 사이드바 연결 (선반 시스템 대체)
const sidebarLeft = document.getElementById('sidebar-left');
const sidebarRight = document.getElementById('sidebar-right');

const STORAGE_KEY = 'fidget-board-state-v1';

// 💄 피젯 에셋 리스트 (라벨 제거 완료! 에셋 추가 시 이 배열만 수정하면 끝)
const ELEMENT_TYPES = [
  { 
    id: 'gini', 
    img: 'assets/images/gini.png', 
    color: '#ff3333', 
    soundFreqs: [200], 
    soundFiles: ['gini.mp3'] 
  },
  { 
    id: 'keycap', 
    img: 'assets/images/keycap.png', 
    color: '#ff3333', 
    soundFreqs: [320], 
    soundFiles: ['keycap.wav'] 
  },
  { 
    id: 'nail', 
    img: 'assets/images/nail.png', 
    color: '#ff3333', 
    soundFreqs: [320], 
    soundFiles: ['nail.wav'] 
  },
  { 
    id: 'glass', 
    img: 'assets/images/cup.png', 
    color: '#ff3333', 
    soundFreqs: [320], 
    soundFiles: ['glass.wav'] 
  },
  { 
    id: 'wood', 
    img: 'assets/images/wood.png', 
    color: '#ff3333', 
    soundFreqs: [320], 
    soundFiles: ['wood.wav'] 
  },
  { 
    id: 'brush', 
    img: 'assets/images/brush.png', 
    color: '#ff3333', 
    soundFreqs: [320], 
    soundFiles: ['brush.wav'] 
  },
  { 
    id: 'bubblewrap', 
    img: 'assets/images/bubblewrap.png', 
    color: '#ff3333', 
    soundFreqs: [320], 
    soundFiles: ['bubblewrap.wav'] 
  },
  { 
    id: 'button', 
    img: 'assets/images/button.png', 
    color: '#ff3333', 
    soundFreqs: [320], 
    soundFiles: ['button.wav'] 
  }
];

// 🛠️ 1. [교체 부분] % 비율 단위로 작동하도록 오프셋 강도 및 숫자 조정 (X축 확장)
const STICKER_X_OFFSETS = [-40, 40, -50, 45, -35, 50, -45, 35];
const STICKER_Y_OFFSETS = [-8, 10, -6, 8, -5, 10, -6, 8]; 

// 고유 ID 생성기 함수
function makeId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

/* ============================================================================
   1. 양옆 사이드바에 에셋 반반 자동 배정하기
============================================================================ */
function renderStickers() {
  if (sidebarLeft) sidebarLeft.innerHTML = '';
  if (sidebarRight) sidebarRight.innerHTML = '';

  ELEMENT_TYPES.forEach((type, index) => {
    const btn = document.createElement('button');
    btn.className = 'sticker-item';
    btn.type = 'button';
    
    // 🛠️ 2. [교체 부분] 'px' 단위를 '%' 비율 단위로 수정하여 주입
    btn.style.setProperty('--x-off', STICKER_X_OFFSETS[index % STICKER_X_OFFSETS.length] + '%');
    btn.style.setProperty('--y-off', STICKER_Y_OFFSETS[index % STICKER_Y_OFFSETS.length] + '%');
    
    if (type.img) {
      btn.innerHTML = `<img src="${type.img}" style="width: 100%; height: 100%; pointer-events: none;">`;
    } else {
      btn.innerHTML = `<span>${type.emoji}</span>`;
    }

    btn.addEventListener('animationend', () => btn.classList.remove('pop'));
    
    // 스티커 드래그/클릭 기능 연결
    enableStickerDrag(btn, type);

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        addItemToBoard(type.id);
        saveBoardToStorage();
      }
    });

    // 인덱스가 홀수면 왼쪽, 짝수면 오른쪽 사이드바에 자동으로 고르게 탑재
    if (index % 2 === 0) {
      if (sidebarLeft) sidebarLeft.appendChild(btn);
    } else {
      if (sidebarRight) sidebarRight.appendChild(btn);
    }
  });
}

/* ============================================================================
   2. 스티커 드래그 및 클릭 설치 기능
============================================================================ */
function enableStickerDrag(btn, type) {
  btn.addEventListener('click', () => {
    btn.classList.add('pop');
    addItemToBoard(type.id);
    saveBoardToStorage();
  });
  
  let ghost = null;
  let isDragging = false;
  
  btn.addEventListener('pointerdown', (e) => {
    isDragging = true;
    btn.setPointerCapture(e.pointerId);
  });
  
  btn.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    
    if (!ghost) {
      ghost = document.createElement('div');
      ghost.className = 'drag-ghost';
      ghost.innerHTML = type.img 
        ? `<img src="${type.img}" style="width:100%; height:100%; object-fit:contain;">`
        : `<span class="item-emoji">${type.emoji}</span>`;
      document.body.appendChild(ghost);
    }
    
    ghost.style.left = (e.clientX - 42) + 'px';
    ghost.style.top = (e.clientY - 42) + 'px';
  });
  
  btn.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    btn.releasePointerCapture(e.pointerId);
    
    if (ghost) {
      const boardRect = board.getBoundingClientRect();
      if (
        e.clientX >= boardRect.left &&
        e.clientX <= boardRect.right &&
        e.clientY >= boardRect.top &&
        e.clientY <= boardRect.bottom
      ) {
        const x = e.clientX - boardRect.left - 60; 
        const y = e.clientY - boardRect.top - 60;
        addItemToBoard(type.id, x, y);
        saveBoardToStorage();
      }
      ghost.remove();
      ghost = null;
    }
  });
}

/* ============================================================================
   3. 보드에 새 피젯 요소 실시간 추가하기
============================================================================ */
function addItemToBoard(typeId, savedX = null, savedY = null, savedId = null) {
  const type = ELEMENT_TYPES.find((t) => t.id === typeId);
  if (!type) return;

  const el = document.createElement('div');
  el.className = 'fidget-item';
  el.dataset.type = type.id;
  el.dataset.id = savedId || makeId();
  el.style.setProperty('--item-color', type.color);
  el.tabIndex = 0;

  if (type.img) {
    el.innerHTML = `
      <img src="${type.img}" class="item-emoji" style="width:100%; height:100%; object-fit:contain;">
      <button class="delete-btn" type="button" title="삭제">✕</button>
    `;
  } else {
    el.innerHTML = `
      <span class="item-emoji">${type.emoji}</span>
      <button class="delete-btn" type="button" title="삭제">✕</button>
    `;
  }

  board.appendChild(el);

  let x = savedX;
  let y = savedY;
  if (x === null || y === null) {
    const maxX = Math.max(board.clientWidth - 120, 10);
    const maxY = Math.max(board.clientHeight - 120, 10);
    x = Math.floor(Math.random() * maxX);
    y = Math.floor(Math.random() * maxY);
  }
  el.style.left = x + 'px';
  el.style.top = y + 'px';

  enableDrag(el);

  el.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    el.remove();
    updateEmptyMessage();
    saveBoardToStorage();
  });

  el.addEventListener('animationend', () => el.classList.remove('pop'));

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerPopEffect(el);
      playSound(el.dataset.type, getPanForElement(el));
    }
  });

  updateEmptyMessage();
}

/* ============================================================================
   4. 보드판 위 피젯 드래그(이동) 기능
============================================================================ */
function enableDrag(el) {
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;

  el.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('delete-btn')) return;

    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    origLeft = el.offsetLeft;
    origTop = el.offsetTop;

    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    el.classList.remove('pop');
    el.classList.add('pressed'); 
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
    if (!moved) return;

    let newLeft = origLeft + dx;
    let newTop = origTop + dy;

    newLeft = Math.max(0, Math.min(newLeft, board.clientWidth - el.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, board.clientHeight - el.offsetHeight));

    el.style.left = newLeft + 'px';
    el.style.top = newTop + 'px';
  });

  el.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('dragging');
    el.classList.remove('pressed');
    triggerPopEffect(el); 

    if (!moved) {
      playSound(el.dataset.type, getPanForElement(el));
    }
    saveBoardToStorage();
  });
}

function triggerPopEffect(el) {
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

function getPanForElement(el) {
  const boardRect = board.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  if (boardRect.width === 0) return 0;

  const elCenterX = elRect.left + elRect.width / 2;
  const relative = (elCenterX - boardRect.left) / boardRect.width;
  const pan = relative * 2 - 1;

  return Math.max(-1, Math.min(1, pan));
}

/* ============================================================================
   5. 사운드 시스템 (다중 오디오 & 패닝)
============================================================================ */
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playFallbackBeep(freq, panValue) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();

  osc.type = 'sine';
  osc.frequency.value = freq;
  panner.pan.value = panValue;

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  osc.connect(gain);
  gain.connect(panner);
  panner.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.25);
}

function playSound(typeId, panValue = 0) {
  const type = ELEMENT_TYPES.find((t) => t.id === typeId);
  if (!type) return;

  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();

  const panner = ctx.createStereoPanner();
  panner.pan.value = panValue;
  panner.connect(ctx.destination);

  const files = type.soundFiles || [type.soundFile]; 
  const randomFile = files[Math.floor(Math.random() * files.length)];

  const freqs = type.soundFreqs || [type.soundFreq];
  const randomFreq = freqs[Math.floor(Math.random() * freqs.length)];

  const audio = new Audio(`assets/sounds/${randomFile}`);
  let playedRealFile = false;

  try {
    const sourceNode = ctx.createMediaElementSource(audio);
    sourceNode.connect(panner);
  } catch (err) {
    playFallbackBeep(randomFreq, panValue);
    return;
  }

  audio.addEventListener('error', () => {
    if (!playedRealFile) playFallbackBeep(randomFreq, panValue);
  });

  audio.play()
    .then(() => { playedRealFile = true; })
    .catch(() => playFallbackBeep(randomFreq, panValue));
}

function updateEmptyMessage() {
  const hasItems = board ? board.querySelectorAll('.fidget-item').length > 0 : false;
  if (boardEmpty) boardEmpty.style.display = hasItems ? 'none' : 'block';
}

/* ============================================================================
   6. 로컬 스토리지 데이터 저장 / 불러오기
============================================================================ */
function saveBoardToStorage() {
  try {
    const items = [...board.querySelectorAll('.fidget-item')].map((el) => ({
      id: el.dataset.id,
      type: el.dataset.type,
      x: el.offsetLeft,
      y: el.offsetTop,
    }));
    const currentTheme = document.body.getAttribute('data-theme') || 'arcade';
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, theme: currentTheme }));
  } catch (err) {
    console.warn('저장 실패:', err);
  }
}

function loadBoardFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    
    if (data.theme) {
      document.body.setAttribute('data-theme', data.theme);
      if (themeSwitcher) {
        themeSwitcher.querySelectorAll('.theme-dot').forEach(d => {
          if (d.dataset.themeChoice === data.theme) {
            d.classList.add('active');
          } else {
            d.classList.remove('active');
          }
        });
      }
    }

    (data.items || []).forEach((item) => {
      addItemToBoard(item.type, item.x, item.y, item.id);
    });
  } catch (err) {
    console.warn('불러오기 실패:', err);
  }
}

function clearBoardStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) { }
}

/* ============================================================================
   7. 버튼 클릭 이벤트 연결 구역
============================================================================ */
if (themeSwitcher) {
  themeSwitcher.addEventListener('click', (e) => {
    const dot = e.target.closest('.theme-dot');
    if (!dot) return;

    themeSwitcher.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');

    const choice = dot.dataset.themeChoice;
    document.body.setAttribute('data-theme', choice);
    
    saveBoardToStorage();
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    board.querySelectorAll('.fidget-item').forEach((el) => el.remove());
    updateEmptyMessage();
    clearBoardStorage();
  });
}

let bgmAudio = null;
let bgmOn = false;

if (bgmBtn) {
  bgmBtn.addEventListener('click', () => {
    if (!bgmAudio) {
      bgmAudio = new Audio('assets/sounds/bgm.aac');
      bgmAudio.loop = true;
      bgmAudio.volume = 0.05;
    }

    if (bgmOn) {
      bgmAudio.pause();
      bgmOn = false;
      bgmBtn.textContent = '🔈';
      bgmBtn.classList.remove('on');
    } else {
      bgmAudio.play().catch(() => {
        console.warn('bgm.mp3 파일을 찾을 수 없습니다.');
      });
      bgmOn = true;
      bgmBtn.textContent = '🔊';
      bgmBtn.classList.add('on');
    }
  });
}

/* ============================================================================
   8. 초기 구동 실행
============================================================================ */
renderStickers();
loadBoardFromStorage();
updateEmptyMessage();
