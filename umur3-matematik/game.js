/* Jom Kira! — permainan matematik awal untuk kanak-kanak umur 3 tahun. */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const ROUNDS = 5;
  const NUM = ['kosong', 'satu', 'dua', 'tiga', 'empat', 'lima'];

  // ---------- Bantuan ----------
  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rand(arr.length)];
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // Pilih item rawak yang tak sama dengan pusingan sebelum ini.
  function pickFresh(arr, key) {
    const choices = arr.filter((x) => x !== state.last[key]);
    const x = pick(choices.length ? choices : arr);
    state.last[key] = x;
    return x;
  }
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ---------- Bunyi ----------
  let actx = null;
  function tone(freq, at, dur, type = 'triangle', vol = 0.18) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime + at;
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t);
      o.stop(t + dur);
    } catch (e) { /* tiada audio */ }
  }
  const sfx = {
    tap() { tone(700, 0, 0.09); },
    good() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.2)); },
    soft() { tone(330, 0, 0.16, 'sine', 0.14); tone(262, 0.13, 0.22, 'sine', 0.12); },
    win() { [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.25)); },
  };

  // ---------- Suara (Web Speech API) ----------
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /^ms/i.test(v.lang)) || vs.find((v) => /^id/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
  function say(text) {
    if (!('speechSynthesis' in window)) return Promise.resolve();
    speechSynthesis.cancel();
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      const u = new SpeechSynthesisUtterance(text);
      u.lang = voice ? voice.lang : 'ms-MY';
      if (voice) u.voice = voice;
      u.rate = 0.9;
      u.pitch = 1.15;
      u.onend = finish;
      u.onerror = finish;
      speechSynthesis.speak(u);
      // Sesetengah pelayar tak pernah panggil onend.
      setTimeout(finish, 800 + text.length * 85);
    });
  }

  // ---------- Kesan konfeti ----------
  function burst(n = 18) {
    const fx = $('#fx');
    for (let i = 0; i < n; i++) {
      const c = el('span', 'confetti', pick(['⭐', '🎉', '✨', '🎈', '💛']));
      c.style.left = rand(100) + 'vw';
      c.style.animationDuration = 1.4 + Math.random() * 1.2 + 's';
      c.style.animationDelay = Math.random() * 0.3 + 's';
      fx.appendChild(c);
      setTimeout(() => c.remove(), 3000);
    }
  }

  // ---------- Simpanan (bintang di menu) ----------
  function loadDone() {
    try { return JSON.parse(localStorage.getItem('jomkira-done') || '{}'); } catch (e) { return {}; }
  }
  function saveDone(id) {
    try {
      const d = loadDone();
      d[id] = true;
      localStorage.setItem('jomkira-done', JSON.stringify(d));
    } catch (e) { /* abaikan */ }
  }

  // ---------- Grafik SVG ----------
  const SHAPES = {
    bulat: '<circle cx="50" cy="50" r="40"/>',
    'segi empat': '<rect x="12" y="12" width="76" height="76" rx="6"/>',
    'segi tiga': '<polygon points="50,9 93,88 7,88" stroke-linejoin="round"/>',
    bintang: '<polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38" stroke-linejoin="round"/>',
  };
  const PALETTE = ['#ef5350', '#42a5f5', '#66bb6a', '#ffca28', '#ab47bc', '#ff7043'];
  function shapeSvg(name, fill, hole) {
    const style = hole
      ? 'fill="#ece4f5" stroke="#9e8cb8" stroke-width="5" stroke-dasharray="10 7"'
      : `fill="${fill}" stroke="rgba(0,0,0,.18)" stroke-width="4"`;
    return `<svg viewBox="0 0 100 100"><g ${style}>${SHAPES[name]}</g></svg>`;
  }

  const COLORS = [
    { n: 'merah', c: '#e53935' },
    { n: 'biru', c: '#1e88e5' },
    { n: 'kuning', c: '#fdd835' },
    { n: 'hijau', c: '#43a047' },
  ];
  function ballSvg(c) {
    return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="${c}" stroke="rgba(0,0,0,.15)" stroke-width="3"/>
      <ellipse cx="36" cy="34" rx="11" ry="7" fill="#fff" opacity=".55"/></svg>`;
  }
  function basketSvg(c, withBall) {
    const ball = withBall ? `<circle cx="50" cy="40" r="20" fill="${withBall}" stroke="rgba(0,0,0,.15)" stroke-width="2"/>` : '';
    return `<svg viewBox="0 0 100 100">
      <path d="M22 44 Q50 6 78 44" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
      ${ball}
      <path d="M8 44 H92 L80 92 H20 Z" fill="${c}" stroke="rgba(0,0,0,.2)" stroke-width="3" stroke-linejoin="round"/>
      <path d="M14 60 H86 M18 76 H82" stroke="rgba(0,0,0,.18)" stroke-width="3"/>
      <path d="M36 44 L38 92 M64 44 L62 92" stroke="rgba(0,0,0,.18)" stroke-width="3"/></svg>`;
  }

  // ---------- Data ----------
  const FRUITS = [
    { e: '🍎', n: 'epal' }, { e: '🍌', n: 'pisang' }, { e: '🍊', n: 'oren' },
    { e: '🍓', n: 'strawberi' }, { e: '🍇', n: 'anggur' }, { e: '🥭', n: 'mangga' },
  ];
  const ANIMALS = [
    { e: '🐘', n: 'gajah' }, { e: '🐱', n: 'kucing' }, { e: '🐟', n: 'ikan' },
    { e: '🐰', n: 'arnab' }, { e: '🐻', n: 'beruang' }, { e: '🐔', n: 'ayam' },
    { e: '🐢', n: 'kura-kura' },
  ];
  const PAIRS = [
    [{ e: '🍎', n: 'epal' }, { e: '🍌', n: 'pisang' }],
    [{ e: '⭐', n: 'bintang' }, { e: '🌙', n: 'bulan' }],
    [{ e: '🐱', n: 'kucing' }, { e: '🐶', n: 'anjing' }],
    [{ e: '🔴', n: 'merah' }, { e: '🔵', n: 'biru' }],
    [{ e: '🚗', n: 'kereta' }, { e: '🚌', n: 'bas' }],
    [{ e: '☀️', n: 'matahari' }, { e: '☁️', n: 'awan' }],
  ];

  // ---------- Permainan ----------
  const GAMES = {
    kira: {
      title: 'Kira Buah', icon: '🍎', color: '#ffcdd2',
      plan: () => shuffle([1, 2, 3, 4, 5]),
      round(stage, r) {
        const n = state.plan[r];
        const f = pickFresh(FRUITS, 'fruit');
        setPrompt(`Jom kira ${f.n}! Ketik setiap satu.`);
        const row = el('div', 'row');
        const tok = state.token;
        let count = 0;
        for (let i = 0; i < n; i++) {
          const b = el('button', 'fruit', f.e);
          b.setAttribute('aria-label', f.n);
          b.addEventListener('click', () => {
            if (state.busy || b.classList.contains('counted')) return;
            count++;
            b.classList.add('counted');
            b.appendChild(el('span', 'badge', String(count)));
            sfx.tap();
            if (count === n) {
              state.busy = true;
              say(NUM[count]).then(() => {
                if (!alive(tok, r)) return;
                stage.appendChild(el('div', 'big-number', String(n)));
                roundDone(`Ada ${NUM[n]} ${f.n}!`);
              });
            } else {
              say(NUM[count]);
            }
          });
          row.appendChild(b);
        }
        stage.appendChild(row);
      },
    },

    bentuk: {
      title: 'Padan Bentuk', icon: '🔺', color: '#d1c4e9',
      round(stage) {
        const names = Object.keys(SHAPES);
        const target = pickFresh(names, 'shape');
        const options = shuffle([target, ...shuffle(names.filter((s) => s !== target)).slice(0, 2)]);
        const colors = shuffle(PALETTE);
        setPrompt('Cari bentuk yang sama!');
        const hole = el('div', 'target', shapeSvg(target, null, true));
        const row = el('div', 'row');
        options.forEach((name, i) => {
          const b = el('button', 'choice', shapeSvg(name, colors[i]));
          b.setAttribute('aria-label', name);
          b.addEventListener('click', () => {
            if (state.busy) return;
            if (name === target) {
              hole.innerHTML = shapeSvg(name, colors[i]);
              hole.classList.add('filled');
              b.style.visibility = 'hidden';
              roundDone(`${name}! Betul!`);
            } else {
              wrong(b);
            }
          });
          row.appendChild(b);
        });
        stage.append(hole, row);
      },
    },

    warna: {
      title: 'Asing Warna', icon: '🎨', color: '#c8e6c9',
      round(stage) {
        const target = pickFresh(COLORS, 'color');
        const options = shuffle([target, ...shuffle(COLORS.filter((c) => c !== target)).slice(0, 2)]);
        setPrompt('Masukkan bola dalam bakul yang sama warna!');
        const ball = el('div', 'target ball', ballSvg(target.c));
        const row = el('div', 'row');
        options.forEach((col) => {
          const b = el('button', 'choice basket', basketSvg(col.c));
          b.setAttribute('aria-label', 'bakul ' + col.n);
          b.addEventListener('click', () => {
            if (state.busy) return;
            if (col === target) {
              ball.classList.add('gone');
              b.innerHTML = basketSvg(col.c, col.c);
              b.classList.add('got');
              roundDone(`${col.n}! Bagus!`);
            } else {
              wrong(b);
            }
          });
          row.appendChild(b);
        });
        stage.append(ball, row);
      },
    },

    saiz: {
      title: 'Besar & Kecil', icon: '🐘', color: '#bbdefb',
      plan: () => shuffle(['BESAR', 'KECIL', 'BESAR', 'KECIL', pick(['BESAR', 'KECIL'])]),
      round(stage, r) {
        const ask = state.plan[r];
        const a = pickFresh(ANIMALS, 'animal');
        setPrompt(`Ketik ${a.n} yang ${ask}!`);
        const row = el('div', 'row');
        shuffle(['BESAR', 'KECIL']).forEach((size) => {
          const b = el('button', 'animal ' + (size === 'BESAR' ? 'big' : 'small'), a.e);
          b.setAttribute('aria-label', `${a.n} ${size.toLowerCase()}`);
          b.addEventListener('click', () => {
            if (state.busy) return;
            if (size === ask) {
              b.classList.add('right');
              roundDone(`Ya! ${a.n} ${size.toLowerCase()}!`);
            } else {
              wrong(b);
            }
          });
          row.appendChild(b);
        });
        stage.appendChild(row);
      },
    },

    corak: {
      title: 'Sambung Corak', icon: '🔴', color: '#ffe0b2',
      round(stage, r) {
        const [A, B] = shuffle(pickFresh(PAIRS, 'pair'));
        const shown = r % 2 === 0 ? 5 : 4; // 5 → jawapan B, 4 → jawapan A
        const seq = Array.from({ length: shown + 1 }, (_, i) => (i % 2 === 0 ? A : B));
        const answer = seq[shown];

        const strip = el('div', 'pattern');
        const cells = seq.slice(0, shown).map((x) => {
          const c = el('div', 'cell', x.e);
          strip.appendChild(c);
          return c;
        });
        const blank = el('div', 'cell blank', '?');
        strip.appendChild(blank);

        const names = seq.slice(0, shown).map((x) => x.n).join(', ');
        setPrompt('Apa seterusnya?', `${names}... apa seterusnya?`);

        const row = el('div', 'row');
        shuffle([A, B]).forEach((x) => {
          const b = el('button', 'choice emoji', x.e);
          b.setAttribute('aria-label', x.n);
          b.addEventListener('click', () => {
            if (state.busy) return;
            if (x === answer) {
              blank.textContent = x.e;
              blank.classList.add('filled');
              cells.forEach((c, i) => setTimeout(() => c.classList.add('lit'), i * 120));
              roundDone(seq.map((s) => s.n).join(', ') + '!');
            } else {
              wrong(b);
            }
          });
          row.appendChild(b);
        });
        stage.append(strip, row);
      },
    },
  };

  // ---------- Enjin ----------
  let state = { id: null, round: 0, busy: false, token: 0, plan: null, last: {}, prompt: '' };

  // Pastikan panggilan tertunda tak jalan selepas pemain keluar atau pusingan bertukar.
  function alive(tok, r) {
    return state.token === tok && state.round === r && $('#play').classList.contains('active');
  }

  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  }

  function setPrompt(text, spoken) {
    $('#prompt').textContent = text;
    state.prompt = spoken || text;
    say(state.prompt);
  }

  function renderStars(popIndex) {
    const s = $('#stars');
    s.innerHTML = '';
    for (let i = 0; i < ROUNDS; i++) {
      const cls = i < state.round ? (i === popIndex ? 'pop' : '') : 'off';
      s.appendChild(el('span', cls, '⭐'));
    }
  }

  function startGame(id) {
    const g = GAMES[id];
    state = { id, round: 0, busy: false, token: state.token + 1, plan: g.plan ? g.plan() : null, last: {}, prompt: '' };
    show('play');
    renderStars();
    nextRound();
  }

  function nextRound() {
    if (state.round >= ROUNDS) return finish();
    state.busy = false;
    const stage = $('#stage');
    stage.innerHTML = '';
    GAMES[state.id].round(stage, state.round);
  }

  function roundDone(msg) {
    state.busy = true;
    const token = state.token;
    state.round++;
    renderStars(state.round - 1);
    sfx.good();
    burst(10);
    say(msg).then(() => {
      setTimeout(() => {
        if (state.token === token && $('#play').classList.contains('active')) nextRound();
      }, 500);
    });
  }

  function wrong(btn) {
    sfx.soft();
    btn.classList.remove('shake');
    void btn.offsetWidth; // mulakan semula animasi
    btn.classList.add('shake');
    say('Cuba lagi!');
  }

  function finish() {
    saveDone(state.id);
    show('win');
    sfx.win();
    burst(40);
    say('Hebat! Kamu dapat lima bintang!');
  }

  function goHome() {
    state.token++;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    buildMenu();
    show('home');
  }

  function buildMenu() {
    const menu = $('#menu');
    const done = loadDone();
    menu.innerHTML = '';
    Object.entries(GAMES).forEach(([id, g]) => {
      const t = el('button', 'tile', `<span class="icon">${g.icon}</span><span>${g.title}</span>`);
      t.style.setProperty('--tile', g.color);
      if (done[id]) t.appendChild(el('span', 'done', '⭐'));
      t.addEventListener('click', () => { sfx.tap(); startGame(id); });
      menu.appendChild(t);
    });
  }

  $('#btn-home').addEventListener('click', goHome);
  $('#btn-menu').addEventListener('click', goHome);
  $('#btn-say').addEventListener('click', () => say(state.prompt));
  $('#btn-again').addEventListener('click', () => startGame(state.id));

  buildMenu();
})();
