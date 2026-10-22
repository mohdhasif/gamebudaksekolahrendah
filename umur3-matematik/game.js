/* Jom Kira! — permainan matematik awal untuk kanak-kanak umur 3 tahun (Phaser 3). */
(function () {
  'use strict';

  // Kawasan reka bentuk (potret). Skrin yang lebih lebar/tinggi cuma menambah latar.
  const W = 720;
  const H = 1280;
  const GROUND = H - 150;
  const ROUNDS = 5;
  const FONT = '"Baloo 2", "Comic Sans MS", system-ui, sans-serif';
  const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  const INK = '#4a3b2a';
  const ACCENT = 0xff7043;
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
  function pickFresh(scene, arr, key) {
    const choices = arr.filter((x) => x !== scene.last[key]);
    const x = pick(choices.length ? choices : arr);
    scene.last[key] = x;
    return x;
  }
  function spread(n, a, b) {
    if (n === 1) return [(a + b) / 2];
    return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
  }
  const darker = (c, pct = 22) => Phaser.Display.Color.ValueToColor(c).darken(pct).color;

  // ---------- Bunyi ----------
  let actx = null;
  function tone(freq, at, dur, type = 'triangle', vol = 0.18) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
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
    pop() { tone(500, 0, 0.06); tone(900, 0.05, 0.08); },
    good() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.2)); },
    soft() { tone(330, 0, 0.16, 'sine', 0.14); tone(262, 0.13, 0.22, 'sine', 0.12); },
    win() { [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.25)); },
    toot() { tone(440, 0, 0.25, 'square', 0.08); tone(554, 0.28, 0.35, 'square', 0.08); },
    chug() { for (let i = 0; i < 6; i++) tone(120, i * 0.14, 0.08, 'sawtooth', 0.05); },
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
  // iOS hanya benarkan suara & audio selepas sentuhan pertama.
  document.addEventListener('pointerdown', () => {
    tone(1, 0, 0.01, 'sine', 0.0001);
    if ('speechSynthesis' in window) speechSynthesis.speak(new SpeechSynthesisUtterance(' '));
  }, { once: true });

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
    [{ e: '🌸', n: 'bunga' }, { e: '🍃', n: 'daun' }],
    [{ e: '☀️', n: 'matahari' }, { e: '☁️', n: 'awan' }],
  ];
  const COLORS = [
    { n: 'merah', c: 0xe53935 },
    { n: 'biru', c: 0x1e88e5 },
    { n: 'kuning', c: 0xfdd835 },
    { n: 'hijau', c: 0x43a047 },
  ];
  const SHAPE_NAMES = ['bulat', 'segi empat', 'segi tiga', 'bintang'];
  const PALETTE = [0xef5350, 0x42a5f5, 0x66bb6a, 0xffca28, 0xab47bc, 0xff7043];
  const WAGON_COLORS = [0x4fc3f7, 0xffb74d, 0x81c784, 0xf06292, 0xba68c8];

  const GAMES = [
    { key: 'Kira', title: 'Kira Buah', icon: '🍎', color: 0xffcdd2, sky: [0x8fd8ff, 0xe3f6ff] },
    { key: 'Bentuk', title: 'Padan Bentuk', icon: '🔺', color: 0xd1c4e9, sky: [0xc5b3f2, 0xf4efff] },
    { key: 'Warna', title: 'Asing Warna', icon: '🎨', color: 0xc8e6c9, sky: [0x9fe0c9, 0xeefbf3] },
    { key: 'Saiz', title: 'Besar & Kecil', icon: '🐘', color: 0xbbdefb, sky: [0x7ec8f5, 0xe1f3ff] },
    { key: 'Corak', title: 'Sambung Corak', icon: '🚂', color: 0xffe0b2, sky: [0xffcf8a, 0xfff4e0] },
  ];

  // ---------- Lukisan ----------
  function txt(scene, x, y, s, size, opts) {
    return scene.add.text(x, y, s, Object.assign({
      fontFamily: FONT, fontSize: size + 'px', fontStyle: '800', color: INK, align: 'center',
    }, opts)).setOrigin(0.5);
  }
  function emoji(scene, x, y, e, size) {
    return scene.add.text(x, y, e, {
      fontFamily: EMOJI_FONT, fontSize: size + 'px', padding: { x: 6, y: Math.round(size * 0.15) },
    }).setOrigin(0.5);
  }
  function starPoints(cx, cy, R, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r : R;
      pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
    }
    return pts;
  }
  function drawShape(g, name, s, fill, stroke, lw) {
    const h = s / 2;
    const tri = [{ x: 0, y: -h }, { x: h, y: h * 0.85 }, { x: -h, y: h * 0.85 }];
    g.fillStyle(fill, 1);
    g.lineStyle(lw, stroke, 1);
    if (name === 'bulat') { g.fillCircle(0, 0, h); g.strokeCircle(0, 0, h); }
    if (name === 'segi empat') { g.fillRoundedRect(-h, -h, s, s, 14); g.strokeRoundedRect(-h, -h, s, s, 14); }
    if (name === 'segi tiga') { g.fillPoints(tri, true); g.strokePoints(tri, true, true); }
    if (name === 'bintang') {
      const pts = starPoints(0, 0, h * 1.08, h * 0.45);
      g.fillPoints(pts, true);
      g.strokePoints(pts, true, true);
    }
  }
  function drawCard(g, w, h, fill = 0xffffff) {
    g.fillStyle(0x000000, 0.14).fillRoundedRect(-w / 2, -h / 2 + 10, w, h, 34);
    g.fillStyle(fill, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 34);
  }
  function drawBall(g, c, r) {
    g.fillStyle(c, 1).fillCircle(0, 0, r);
    g.lineStyle(5, darker(c), 1).strokeCircle(0, 0, r);
    g.fillStyle(0xffffff, 0.55).fillEllipse(-r * 0.32, -r * 0.36, r * 0.55, r * 0.34);
  }
  function drawBasket(g, c) {
    const d = darker(c);
    g.lineStyle(14, d, 1);
    g.beginPath();
    g.arc(0, -40, 72, Math.PI, 0, false);
    g.strokePath();
    g.fillStyle(c, 1).fillPoints([{ x: -96, y: -40 }, { x: 96, y: -40 }, { x: 78, y: 72 }, { x: -78, y: 72 }], true);
    g.lineStyle(4, d, 0.55);
    g.lineBetween(-88, 0, 88, 0);
    g.lineBetween(-82, 36, 82, 36);
    g.lineBetween(-32, -40, -26, 72);
    g.lineBetween(32, -40, 26, 72);
    g.fillStyle(d, 1).fillRoundedRect(-104, -54, 208, 26, 12);
  }
  function drawCat(g) {
    const fur = 0xffa94d;
    const dark = 0xe07b1f;
    g.fillStyle(fur).fillTriangle(40, 92, 62, 18, 104, 66);
    g.fillTriangle(116, 66, 158, 18, 180, 92);
    g.fillStyle(0xffc1d0).fillTriangle(56, 80, 66, 38, 92, 66);
    g.fillTriangle(128, 66, 154, 38, 164, 80);
    g.fillStyle(fur).fillCircle(110, 120, 84);
    g.lineStyle(6, dark).strokeCircle(110, 120, 84);
    g.lineStyle(7, dark);
    g.lineBetween(110, 40, 110, 62);
    g.lineBetween(90, 44, 94, 64);
    g.lineBetween(130, 44, 126, 64);
    g.fillStyle(0xffffff).fillCircle(80, 112, 20).fillCircle(140, 112, 20);
    g.fillStyle(0x3b2a1a).fillCircle(83, 115, 12).fillCircle(143, 115, 12);
    g.fillStyle(0xffffff).fillCircle(78, 109, 5).fillCircle(138, 109, 5);
    g.fillStyle(0xff8fab, 0.6).fillCircle(58, 146, 13).fillCircle(162, 146, 13);
    g.fillStyle(0xff6f91, 1).fillTriangle(100, 136, 120, 136, 110, 147);
    g.lineStyle(5, 0x3b2a1a);
    g.beginPath(); g.arc(100, 150, 10, 0, Math.PI, false); g.strokePath();
    g.beginPath(); g.arc(120, 150, 10, 0, Math.PI, false); g.strokePath();
    g.lineStyle(3, 0x3b2a1a, 0.7);
    g.lineBetween(20, 132, 66, 140); g.lineBetween(22, 156, 66, 150);
    g.lineBetween(200, 132, 154, 140); g.lineBetween(198, 156, 154, 150);
  }
  function drawTrainEngine(g) {
    // Menghadap ke kiri: cerobong di kiri, kabin di kanan.
    g.fillStyle(0x3b3b3b).fillRect(14, -128, 30, 44);
    g.fillStyle(0x222222).fillRoundedRect(8, -138, 42, 14, 5);
    g.fillStyle(0xe53935).fillRoundedRect(0, -88, 100, 88, 14);
    g.fillStyle(0xc62828).fillRoundedRect(62, -142, 72, 142, 12);
    g.fillStyle(0x6d4c41).fillRoundedRect(54, -156, 88, 20, 8);
    g.fillStyle(0xbbe6ff).fillRoundedRect(78, -124, 42, 40, 8);
    g.fillStyle(0xffeb3b).fillCircle(10, -48, 10);
    g.fillStyle(0x333333).fillCircle(30, 6, 20).fillCircle(102, 6, 20);
    g.fillStyle(0x9e9e9e).fillCircle(30, 6, 8).fillCircle(102, 6, 8);
  }
  function drawWagon(g, c, w, blank) {
    g.fillStyle(blank ? 0xffffff : c, blank ? 0.7 : 1).fillRoundedRect(0, -88, w, 88, 14);
    g.lineStyle(5, blank ? 0xbdbdbd : darker(c), 1).strokeRoundedRect(0, -88, w, 88, 14);
    g.fillStyle(0x333333).fillCircle(22, 6, 15).fillCircle(w - 22, 6, 15);
    g.fillStyle(0x9e9e9e).fillCircle(22, 6, 6).fillCircle(w - 22, 6, 6);
    g.fillStyle(0x555555).fillRect(-8, -24, 10, 8);
  }

  function drawSky(scene, top, bottom, grass = true) {
    const g = scene.add.graphics().setDepth(-10);
    const x0 = -900;
    const w = W + 1800;
    const steps = 24;
    const c1 = Phaser.Display.Color.ValueToColor(top);
    const c2 = Phaser.Display.Color.ValueToColor(bottom);
    g.fillStyle(top).fillRect(x0, -1200, w, 1200);
    for (let i = 0; i < steps; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(c1, c2, steps - 1, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
      g.fillRect(x0, (H * i) / steps, w, H / steps + 1);
    }
    g.fillStyle(bottom).fillRect(x0, H, w, 1200);
    if (grass) {
      g.fillStyle(0x8bd17c).fillRect(x0, GROUND, w, 1400);
      g.fillStyle(0x6fbf60).fillRect(x0, GROUND, w, 18);
      for (let x = x0; x < x0 + w; x += 46) g.fillStyle(0x7cc96d).fillTriangle(x, GROUND + 18, x + 12, GROUND - 14, x + 24, GROUND + 18);
    }
    for (let i = 0; i < 3; i++) {
      const cl = scene.add.graphics({ x: 80 + i * 260 + rand(60), y: 380 + rand(260) }).setDepth(-9).setAlpha(0.85);
      cl.fillStyle(0xffffff).fillCircle(0, 0, 38).fillCircle(42, -14, 48).fillCircle(88, 0, 36).fillRect(0, 0, 88, 36);
      scene.tweens.add({ targets: cl, x: cl.x + 60, duration: 6000 + rand(3000), yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  // Kekalkan kawasan reka bentuk di tengah skrin walau apa pun saiz skrin.
  function fitCamera(scene) {
    // Kamera adegan yang dimulakan semula dicipta dengan saiz asas, jadi besarkan ikut kanvas.
    const f = () => {
      const cam = scene.cameras.main;
      cam.setSize(scene.sys.game.canvas.width, scene.sys.game.canvas.height);
      cam.centerOn(W / 2, H / 2);
    };
    f();
    scene.scale.on('resize', f);
    scene.events.once('shutdown', () => scene.scale.off('resize', f));
  }

  function button(scene, x, y, w, h, fill, label, size, onTap) {
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    const r = Math.min(36, h / 2);
    g.fillStyle(0x000000, 0.15).fillRoundedRect(-w / 2, -h / 2 + 8, w, h, r);
    g.fillStyle(fill, 1).fillRoundedRect(-w / 2, -h / 2, w, h, r);
    c.add(g);
    if (label != null) c.add(txt(scene, 0, 0, label, size, { fontFamily: FONT + ',' + EMOJI_FONT }));
    c.setSize(w, h).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => {
      scene.tweens.add({ targets: c, scale: 0.92, duration: 70, yoyo: true });
      onTap();
    });
    return c;
  }

  function addMascot(scene, x, y, s) {
    const m = scene.add.image(x, y, 'cat').setScale(s).setDepth(5);
    m.baseY = y;
    scene.tweens.add({ targets: m, scaleY: s * 1.05, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    m.cheer = () => {
      m.y = m.baseY;
      scene.tweens.add({ targets: m, y: m.baseY - 60, duration: 200, yoyo: true, repeat: 1, ease: 'Quad.out' });
    };
    m.oops = () => {
      scene.tweens.add({ targets: m, angle: { from: -10, to: 10 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => m.setAngle(0) });
    };
    return m;
  }

  function wobble(scene, obj) {
    scene.tweens.add({ targets: obj, angle: { from: -12, to: 12 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => obj.setAngle(0) });
  }

  function burst(scene, x, y, n = 14) {
    const e = scene.add.particles(x, y, 'star', {
      speed: { min: 260, max: 620 }, angle: { min: 200, max: 340 }, scale: { start: 0.8, end: 0.1 },
      rotate: { min: 0, max: 360 }, lifespan: 900, gravityY: 900, emitting: false,
    }).setDepth(50);
    e.explode(n);
    scene.time.delayedCall(1300, () => e.destroy());
  }

  // Objek yang boleh diketik ATAU diseret ke sasaran (anak 3 tahun lebih mudah mengetik).
  function dragChoice(scene, obj, opts) {
    obj.home = { x: obj.x, y: obj.y };
    obj.setInteractive({ draggable: true, useHandCursor: true });
    obj.on('pointerdown', () => { obj.dragged = false; });
    obj.on('pointerup', () => { if (!obj.dragged && !scene.busy) opts.onTap(); });
    obj.on('dragstart', () => {
      if (scene.busy) return;
      obj.dragged = true;
      obj.setDepth(20).setScale(1.08);
      scene.tweens.killTweensOf(obj);
    });
    obj.on('drag', (p, x, y) => { if (obj.dragged && !scene.busy) obj.setPosition(x, y); });
    obj.on('dragend', () => {
      if (!obj.dragged || scene.busy) return;
      obj.setScale(1);
      const t = opts.targets().find((t) => Phaser.Math.Distance.Between(obj.x, obj.y, t.x, t.y) < t.r);
      if (t) opts.onDrop(t);
      else goHomeTween(scene, obj);
    });
  }
  function goHomeTween(scene, obj, then) {
    scene.tweens.add({ targets: obj, x: obj.home.x, y: obj.home.y, duration: 260, ease: 'Back.out', onComplete: then });
  }

  // ---------- Adegan: Boot ----------
  class Boot extends Phaser.Scene {
    constructor() { super('Boot'); }
    create() {
      const g = this.make.graphics({ add: false });
      const pts = starPoints(36, 36, 33, 15);
      g.fillStyle(0xffd23f).fillPoints(pts, true);
      g.lineStyle(4, 0xe6a800).strokePoints(pts, true, true);
      g.generateTexture('star', 72, 72);
      g.clear();
      drawCat(g);
      g.generateTexture('cat', 220, 214);
      g.destroy();
      this.scene.start('Menu');
    }
  }

  // ---------- Adegan: Menu ----------
  class Menu extends Phaser.Scene {
    constructor() { super('Menu'); }
    create() {
      drawSky(this, 0xffe082, 0xfff8e1);
      fitCamera(this);
      const title = txt(this, W / 2, 130, 'Jom Kira!', 124, { color: '#ff7043', stroke: '#ffffff', strokeThickness: 16 });
      this.tweens.add({ targets: title, y: 115, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      txt(this, W / 2, 238, 'Matematik untuk adik umur 3 tahun', 36);

      const done = loadDone();
      const spots = [[190, 440], [530, 440], [190, 700], [530, 700], [360, 960]];
      GAMES.forEach((g, i) => {
        const [x, y] = spots[i];
        const tile = button(this, x, y, 310, 230, g.color, null, 0, () => {
          sfx.tap();
          say(g.title);
          this.scene.start(g.key);
        });
        tile.add(emoji(this, 0, -30, g.icon, 104));
        tile.add(txt(this, 0, 74, g.title, 40));
        if (done[g.key]) tile.add(emoji(this, 118, -84, '⭐', 48));
        tile.setScale(0);
        this.tweens.add({ targets: tile, scale: 1, duration: 420, delay: 120 + i * 90, ease: 'Back.out' });
      });

      addMascot(this, 610, 1180, 0.55);
      button(this, 300, 1185, 420, 92, 0xffffff, '👩‍🏫 Nota ibu bapa', 34, () => this.showNote());
    }
    showNote() {
      const c = this.add.container(0, 0).setDepth(100);
      const dim = this.add.rectangle(W / 2, H / 2, W + 1800, H + 2400, 0x000000, 0.45).setInteractive();
      const panel = this.add.graphics();
      drawCard(panel, 660, 900);
      panel.setPosition(W / 2, H / 2);
      const body = this.add.text(W / 2 - 290, H / 2 - 400, [
        'Untuk ibu bapa & cikgu',
        '',
        'Setiap permainan ada 5 pusingan dan mengajar satu kemahiran sahaja, ikut bidang Perkembangan Awal Matematik dan Pemikiran Logik (Kurikulum PERMATA Negara):',
        '',
        '🍎 Kira Buah: membilang objek 1 hingga 5',
        '🔺 Padan Bentuk: bulat, segi empat, segi tiga, bintang',
        '🎨 Asing Warna: mengelas ikut warna',
        '🐘 Besar & Kecil: membanding saiz',
        '🚂 Sambung Corak: corak AB (cabaran)',
        '',
        'Tiada markah kalah. Duduk bersama anak, sebut semula perkataan yang didengar, dan hadkan 10 hingga 15 minit satu sesi.',
      ].join('\n'), {
        fontFamily: 'system-ui, sans-serif', fontSize: '28px', color: INK, wordWrap: { width: 580, useAdvancedWrap: true }, lineSpacing: 6,
      });
      const close = button(this, W / 2, H / 2 + 370, 300, 100, ACCENT, 'Tutup', 44, () => c.destroy());
      c.add([dim, panel, body, close]);
    }
  }

  // ---------- Adegan asas permainan ----------
  let TOKEN = 0;
  class Play extends Phaser.Scene {
    init() {
      this.info = GAMES.find((g) => g.key === this.scene.key);
      this.round = 0;
      this.busy = false;
      this.last = {};
      this.objs = [];
    }
    create() {
      drawSky(this, this.info.sky[0], this.info.sky[1]);
      fitCamera(this);
      this.input.dragDistanceThreshold = 16;

      button(this, 80, 80, 110, 110, 0xffffff, '🏠', 54, () => this.goHome()).setDepth(30);
      button(this, W - 80, 80, 110, 110, 0xffffff, '🔊', 54, () => say(this.spoken)).setDepth(30);
      this.stars = [];
      for (let i = 0; i < ROUNDS; i++) {
        this.stars.push(this.add.image(W / 2 + (i - 2) * 78, 80, 'star').setTint(0x9e9e9e).setAlpha(0.35).setDepth(30));
      }

      this.mascot = addMascot(this, 100, 250, 0.72);
      const b = this.add.graphics().setDepth(4);
      b.fillStyle(0x000000, 0.12).fillRoundedRect(205, 180, 490, 160, 36);
      b.fillStyle(0xffffff, 1).fillRoundedRect(200, 170, 490, 160, 36);
      b.fillTriangle(204, 228, 170, 262, 204, 282);
      this.promptText = txt(this, 445, 250, '', 42, { wordWrap: { width: 440, useAdvancedWrap: true } }).setDepth(5);

      if (this.setup) this.setup();
      this.nextRound();
    }
    track(o) { this.objs.push(o); return o; }
    clearRound() {
      this.objs.forEach((o) => { this.tweens.killTweensOf(o); o.destroy(); });
      this.objs = [];
    }
    setPrompt(text, spoken) {
      const t = this.promptText;
      t.setText(text).setFontSize(42);
      for (let s = 40; t.height > 150 && s >= 28; s -= 2) t.setFontSize(s);
      this.tweens.add({ targets: t, scale: { from: 0.7, to: 1 }, duration: 300, ease: 'Back.out' });
      this.spoken = spoken || text;
      say(this.spoken);
    }
    // Jalankan fn selepas promise, hanya jika pemain masih dalam pusingan yang sama.
    later(promise, fn) {
      const t = this.token;
      promise.then(() => { if (this.token === t && this.scene.isActive()) fn(); });
    }
    nextRound() {
      if (this.round >= ROUNDS) return this.finish();
      this.token = ++TOKEN;
      this.busy = false;
      this.clearRound();
      this.buildRound(this.round);
    }
    roundDone(msg, x = W / 2, y = 700) {
      this.busy = true;
      const star = this.stars[this.round];
      star.clearTint().setAlpha(1);
      this.tweens.add({ targets: star, scale: { from: 2, to: 1 }, duration: 500, ease: 'Back.out' });
      this.round++;
      sfx.good();
      this.mascot.cheer();
      burst(this, x, y);
      this.later(say(msg), () => this.time.delayedCall(500, () => this.nextRound()));
    }
    wrong(obj) {
      sfx.soft();
      if (obj) wobble(this, obj);
      this.mascot.oops();
      say('Cuba lagi!');
    }
    finish() {
      saveDone(this.info.key);
      this.scene.start('Win', { key: this.info.key });
    }
    goHome() {
      TOKEN++;
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      this.scene.start('Menu');
    }
  }

  // 🍎 Kira Buah: buah jatuh dari pokok, ketik setiap satu sambil membilang.
  class Kira extends Play {
    constructor() { super('Kira'); }
    setup() {
      this.plan = shuffle([1, 2, 3, 4, 5]);
      this.physics.world.setBounds(0, -600, W, GROUND + 600);
      const t = this.add.graphics().setDepth(-5);
      t.fillStyle(0x8d5a3b).fillRoundedRect(320, 560, 80, GROUND - 540, 20);
      t.fillStyle(0x5cb85c).fillCircle(360, 540, 200).fillCircle(190, 590, 130).fillCircle(530, 590, 130);
      t.fillStyle(0x6cc56c).fillCircle(300, 480, 90).fillCircle(450, 520, 80);
    }
    buildRound(r) {
      const n = this.plan[r];
      const f = pickFresh(this, FRUITS, 'fruit');
      this.setPrompt(`Jom kira ${f.n}!\nKetik setiap satu.`, `Jom kira ${f.n}! Ketik setiap satu.`);
      let count = 0;
      this.fruits = [];
      spread(n, 130, 590).forEach((x, i) => {
        const fr = this.track(emoji(this, x + rand(30) - 15, 520 + rand(80) - 40, f.e, 110));
        fr.setScale(0).setDepth(6);
        this.fruits.push(fr);
        this.tweens.add({ targets: fr, scale: 1, duration: 300, delay: i * 150, ease: 'Back.out' });
        this.time.delayedCall(700 + i * 260, () => {
          if (!fr.active) return;
          this.physics.add.existing(fr);
          fr.body.setGravityY(1600).setBounce(0.45).setCollideWorldBounds(true);
        });
        fr.setInteractive({ useHandCursor: true });
        fr.on('pointerdown', () => {
          if (this.busy || fr.counted) return;
          fr.counted = true;
          count++;
          sfx.pop();
          const g = this.add.graphics();
          g.fillStyle(ACCENT).fillCircle(0, 0, 36);
          g.lineStyle(5, 0xffffff).strokeCircle(0, 0, 36);
          fr.badge = this.track(this.add.container(fr.x, fr.y, [g, txt(this, 0, 2, String(count), 48, { color: '#ffffff' })]).setDepth(7));
          this.tweens.add({ targets: fr.badge, scale: { from: 0, to: 1 }, duration: 300, ease: 'Back.out' });
          if (count === n) {
            this.busy = true;
            this.later(say(NUM[count]), () => {
              const big = this.track(txt(this, W / 2, 760, String(n), 280, { color: '#ff7043', stroke: '#ffffff', strokeThickness: 16 }).setDepth(8));
              this.tweens.add({ targets: big, scale: { from: 0, to: 1 }, duration: 500, ease: 'Back.out' });
              this.roundDone(`Ada ${NUM[n]} ${f.n}!`, W / 2, 760);
            });
          } else {
            say(NUM[count]);
          }
        });
      });
    }
    update() {
      (this.fruits || []).forEach((fr) => { if (fr.badge && fr.active) fr.badge.setPosition(fr.x + 46, fr.y - 60); });
    }
  }

  // 🔺 Padan Bentuk: ketik atau seret bentuk ke dalam lubang yang sama.
  class Bentuk extends Play {
    constructor() { super('Bentuk'); }
    buildRound() {
      const target = pickFresh(this, SHAPE_NAMES, 'shape');
      const opts = shuffle([target, ...shuffle(SHAPE_NAMES.filter((s) => s !== target)).slice(0, 2)]);
      const cols = shuffle(PALETTE);
      this.setPrompt('Cari bentuk yang sama!');
      const HX = W / 2;
      const HY = 650;
      const hole = this.track(this.add.graphics({ x: HX, y: HY }));
      drawShape(hole, target, 280, 0xece4f5, 0x9e8cb8, 10);
      this.tweens.add({ targets: hole, alpha: 0.55, duration: 700, yoyo: true, repeat: -1 });

      opts.forEach((name, i) => {
        const c = this.track(this.add.container([150, 360, 570][i], 1010));
        const card = this.add.graphics();
        drawCard(card, 190, 190);
        const shape = this.add.graphics();
        drawShape(shape, name, 130, cols[i], darker(cols[i]), 6);
        c.add([card, shape]).setSize(190, 190);
        c.setScale(0);
        this.tweens.add({ targets: c, scale: 1, duration: 350, delay: 200 + i * 100, ease: 'Back.out' });
        const choose = () => {
          if (this.busy) return;
          if (name === target) {
            this.busy = true;
            c.disableInteractive();
            card.setVisible(false);
            this.tweens.killTweensOf(hole);
            hole.setAlpha(1);
            this.tweens.add({
              targets: c, x: HX, y: HY, scale: 280 / 130, duration: 380, ease: 'Back.out',
              onComplete: () => this.roundDone(`${name}! Betul!`, HX, HY),
            });
          } else {
            goHomeTween(this, c, () => this.wrong(c));
          }
        };
        dragChoice(this, c, { onTap: choose, onDrop: choose, targets: () => [{ x: HX, y: HY, r: 170 }] });
      });
    }
  }

  // 🎨 Asing Warna: seret bola ke bakul yang sama warna, atau ketik bakulnya.
  class Warna extends Play {
    constructor() { super('Warna'); }
    buildRound() {
      const target = pickFresh(this, COLORS, 'color');
      const opts = shuffle([target, ...shuffle(COLORS.filter((c) => c !== target)).slice(0, 2)]);
      this.setPrompt('Masukkan bola dalam bakul yang sama warna!');

      const baskets = opts.map((col, i) => {
        const b = this.track(this.add.container([150, 360, 570][i], 1010).setDepth(3));
        const g = this.add.graphics();
        drawBasket(g, col.c);
        b.add(g).setSize(220, 220).setInteractive({ useHandCursor: true });
        b.col = col;
        b.on('pointerdown', () => choose(b));
        return b;
      });

      const ball = this.track(this.add.container(W / 2, 620).setDepth(4));
      const bg = this.add.graphics();
      drawBall(bg, target.c, 95);
      ball.add(bg).setSize(200, 200);
      this.tweens.add({ targets: ball, y: 590, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

      const choose = (b) => {
        if (this.busy) return;
        if (b.col === target) {
          this.busy = true;
          this.tweens.killTweensOf(ball);
          ball.disableInteractive().setDepth(2);
          this.tweens.add({ targets: ball, x: b.x, y: b.y - 50, scale: 0.55, duration: 420, ease: 'Quad.in',
            onComplete: () => {
              this.tweens.add({ targets: b, scaleY: { from: 0.85, to: 1 }, duration: 300, ease: 'Back.out' });
              this.roundDone(`${b.col.n}! Bagus!`, b.x, b.y - 60);
            } });
        } else {
          goHomeTween(this, ball, () => this.wrong(b));
        }
      };
      dragChoice(this, ball, {
        onTap: () => { sfx.tap(); this.tweens.add({ targets: ball, scale: { from: 1.15, to: 1 }, duration: 250 }); },
        onDrop: (t) => choose(t.b),
        targets: () => baskets.map((b) => ({ x: b.x, y: b.y - 30, r: 130, b })),
      });
    }
  }

  // 🐘 Besar & Kecil: ketik haiwan yang besar atau yang kecil.
  class Saiz extends Play {
    constructor() { super('Saiz'); }
    setup() { this.plan = shuffle(['BESAR', 'KECIL', 'BESAR', 'KECIL', pick(['BESAR', 'KECIL'])]); }
    buildRound(r) {
      const ask = this.plan[r];
      const a = pickFresh(this, ANIMALS, 'animal');
      this.setPrompt(`Ketik ${a.n} yang ${ask}!`);
      shuffle(['BESAR', 'KECIL']).forEach((size, i) => {
        const x = [200, 520][i];
        const e = this.track(emoji(this, x, GROUND - 10, a.e, size === 'BESAR' ? 250 : 100).setOrigin(0.5, 1));
        e.setScale(0);
        this.tweens.add({ targets: e, scale: 1, duration: 400, delay: i * 120, ease: 'Back.out' });
        e.setInteractive({ useHandCursor: true });
        e.on('pointerdown', () => {
          if (this.busy) return;
          if (size === ask) {
            this.busy = true;
            this.tweens.add({ targets: e, y: e.y - 120, duration: 220, yoyo: true, repeat: 1, ease: 'Quad.out' });
            this.roundDone(`Ya! ${a.n} ${size.toLowerCase()}!`, x, GROUND - 200);
          } else {
            this.wrong(e);
          }
        });
      });
    }
  }

  // 🚂 Sambung Corak: kereta api bawa corak AB, isi gerabak kosong.
  class Corak extends Play {
    constructor() { super('Corak'); }
    setup() {
      const g = this.add.graphics().setDepth(-4);
      g.fillStyle(0x8d6e63);
      for (let x = -900; x < W + 900; x += 40) g.fillRect(x, 790, 22, 14);
      g.fillStyle(0x616161).fillRect(-900, 784, W + 1800, 8);
    }
    buildRound(r) {
      const [A, B] = shuffle(pickFresh(this, PAIRS, 'pair'));
      const shown = r % 2 === 0 ? 5 : 4; // 5 → jawapan B, 4 → jawapan A
      const seq = Array.from({ length: shown + 1 }, (_, i) => (i % 2 === 0 ? A : B));
      const answer = seq[shown];
      const TX = 14;
      const TY = 770;
      const WW = 86;
      const GAP = 8;
      const firstWagon = 150;

      const train = this.track(this.add.container(W + 60, TY).setDepth(3));
      const eg = this.add.graphics();
      drawTrainEngine(eg);
      train.add(eg);
      const items = [];
      seq.forEach((x, i) => {
        const wx = firstWagon + i * (WW + GAP);
        const blank = i === shown;
        const wg = this.add.graphics();
        drawWagon(wg, WAGON_COLORS[i % WAGON_COLORS.length], WW, blank);
        wg.x = wx;
        train.add(wg);
        const it = blank ? txt(this, wx + WW / 2, -44, '?', 64, { color: '#9e9e9e' }) : emoji(this, wx + WW / 2, -44, x.e, 56);
        train.add(it);
        items.push(it);
      });
      const blankItem = items[shown];
      const blankWorld = { x: TX + firstWagon + shown * (WW + GAP) + WW / 2, y: TY - 44 };
      this.tweens.add({ targets: blankItem, alpha: 0.35, duration: 600, yoyo: true, repeat: -1 });
      sfx.chug();
      this.tweens.add({ targets: train, x: TX, duration: 1100, ease: 'Cubic.out' });

      const names = seq.slice(0, shown).map((x) => x.n).join(', ');
      this.setPrompt('Apa seterusnya?', `${names}... apa seterusnya?`);

      shuffle([A, B]).forEach((x, i) => {
        const c = this.track(this.add.container([220, 500][i], 1010).setDepth(6));
        const card = this.add.graphics();
        drawCard(card, 220, 220);
        c.add([card, emoji(this, 0, 0, x.e, 120)]).setSize(220, 220);
        const choose = () => {
          if (this.busy) return;
          if (x === answer) {
            this.busy = true;
            c.disableInteractive();
            card.setVisible(false);
            this.tweens.add({ targets: c, x: blankWorld.x, y: blankWorld.y, scale: 0.47, duration: 400, ease: 'Quad.out',
              onComplete: () => {
                c.setVisible(false);
                this.tweens.killTweensOf(blankItem);
                const filled = emoji(this, blankItem.x, blankItem.y, x.e, 56);
                train.add(filled);
                blankItem.destroy();
                items.forEach((it, k) => this.tweens.add({ targets: it, scale: { from: 1.4, to: 1 }, duration: 300, delay: k * 120 }));
                this.roundDone(seq.map((s) => s.n).join(', ') + '!', blankWorld.x, blankWorld.y);
                this.time.delayedCall(900, () => {
                  sfx.toot();
                  this.tweens.add({ targets: train, x: -900, duration: 1400, ease: 'Cubic.in' });
                });
              } });
          } else {
            goHomeTween(this, c, () => this.wrong(c));
          }
        };
        dragChoice(this, c, { onTap: choose, onDrop: choose, targets: () => [{ x: blankWorld.x, y: blankWorld.y, r: 110 }] });
      });
    }
  }

  // ---------- Adegan: Tahniah ----------
  class Win extends Phaser.Scene {
    constructor() { super('Win'); }
    create(data) {
      drawSky(this, 0xffe082, 0xfff8e1);
      fitCamera(this);
      this.add.particles(0, -60, 'star', {
        x: { min: -300, max: W + 300 }, speedY: { min: 220, max: 420 }, speedX: { min: -80, max: 80 },
        rotate: { min: 0, max: 360 }, scale: { min: 0.35, max: 0.9 }, lifespan: 6500, frequency: 110, quantity: 2,
      }).setDepth(-1);
      const trophy = emoji(this, W / 2, 330, '🏆', 220);
      this.tweens.add({ targets: trophy, y: 300, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const t = txt(this, W / 2, 590, 'Hebat!', 150, { color: '#ff7043', stroke: '#ffffff', strokeThickness: 18 });
      this.tweens.add({ targets: t, scale: { from: 0, to: 1 }, duration: 600, ease: 'Back.out' });
      for (let i = 0; i < ROUNDS; i++) {
        const s = this.add.image(W / 2 + (i - 2) * 100, 740, 'star').setScale(0);
        this.tweens.add({ targets: s, scale: 1.2, duration: 400, delay: 400 + i * 150, ease: 'Back.out', onStart: () => sfx.tap() });
      }
      const m = addMascot(this, W / 2, 920, 0.85);
      this.tweens.add({ targets: m, angle: { from: -8, to: 8 }, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      button(this, 200, 1150, 300, 120, ACCENT, '🔁 Lagi', 46, () => this.scene.start(data.key));
      button(this, 520, 1150, 300, 120, 0x42a5f5, '🏠 Menu', 46, () => this.scene.start('Menu'));
      sfx.win();
      say('Hebat! Kamu dapat lima bintang!');
    }
  }

  function start() {
    window.jomKira = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      backgroundColor: '#fff3d6',
      scale: { mode: Phaser.Scale.EXPAND, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
      physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
      scene: [Boot, Menu, Kira, Bentuk, Warna, Saiz, Corak, Win],
    });
  }
  // Tunggu fon dimuatkan supaya teks dalam kanvas guna fon yang betul.
  const fontReady = document.fonts && document.fonts.load ? document.fonts.load('800 40px "Baloo 2"') : Promise.resolve();
  Promise.race([fontReady, new Promise((r) => setTimeout(r, 2000))]).catch(() => {}).then(start);
})();
