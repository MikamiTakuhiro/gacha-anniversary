let sharedCtx = null;

function getCtx() {
  if (!sharedCtx) {
    sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedCtx;
}

/** ブラウザの自動再生制限を解除 */
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') { ctx.resume(); }
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
}

function createNoiseBuffer(ctx, durationSec) {
  const length = Math.floor(ctx.sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) { data[i] = Math.random() * 2 - 1; }
  return buffer;
}

/**
 * ① 筐体駆動音（ガランガラン……）
 * 【テンポ大幅減速】発音間隔を広くし、1発ずつの響きを長くして、重々しい「ガランガラン」を表現
 */
export function playMachineRattle(durationMs = 800) {
  const ctx = getCtx();
  const master = ctx.createGain();
  
  // 迫力のある音量をしっかりと維持（2.5）
  master.gain.value = 2.5; 
  master.connect(ctx.destination);

  let active = true;

  const playSingleGaran = () => {
    if (!active) return;
    const t = ctx.currentTime;

    // ドラム全体が重く擦れ合う、余韻の長い「ガラン……」という摩擦音の核
    const frictionNoise = ctx.createBufferSource();
    // 【修正】音の消え方をゆったりにするため、バッファ時間を少し長め（0.15秒）に確保
    frictionNoise.buffer = createNoiseBuffer(ctx, 0.15);
    
    const scratchFilter = ctx.createBiquadFilter();
    scratchFilter.type = 'bandpass';
    scratchFilter.frequency.setValueAtTime(110 + Math.random() * 40, t); // より低く安定した響き
    scratchFilter.Q.value = 6.0; // フィルターの鋭さを絶妙に調整し、空洞内の響きを再現
    
    const scratchGain = ctx.createGain();
    scratchGain.gain.setValueAtTime(0.6, t);
    // 【修正】1発ずつの音の減衰（フェードアウト）をゆったり引き伸ばし、響きを持たせる
    scratchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    
    frictionNoise.connect(scratchFilter);
    scratchFilter.connect(scratchGain);
    scratchGain.connect(master);
    frictionNoise.start(t); frictionNoise.stop(t + 0.15);

    // 内部の太いギアが「ゴツン」と噛み合う重低音
    const gearOsc = ctx.createOscillator();
    const gearGain = ctx.createGain();
    gearOsc.type = 'sawtooth';
    gearOsc.frequency.setValueAtTime(40 + Math.random() * 10, t); // 地鳴りのような40Hz
    
    gearGain.gain.setValueAtTime(0.45, t);
    gearGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    
    gearOsc.connect(gearGain);
    gearGain.connect(master);
    gearOsc.start(t); gearOsc.stop(t + 0.13);
  };

  // 最初の1発
  playSingleGaran();
  
  // 【修正】細かく連打せず、180ms〜260msという大きな間隔をあけて「ガラン、ガラン」とゆったり鳴らす
  const triggerNext = () => {
    if (!active) return;
    playSingleGaran();
    const nextInterval = 180 + Math.random() * 80; 
    setTimeout(triggerNext, nextInterval);
  };
  
  setTimeout(triggerNext, 200);

  const timeout = setTimeout(() => {
    active = false;
    const t = ctx.currentTime;
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.exponentialRampToValueAtTime(0.001, t + 0.2); // 終わりのフェードアウトも長めにとって自然に
    setTimeout(() => master.disconnect(), 250);
  }, durationMs);

  return () => {
    active = false;
    clearTimeout(timeout);
    master.disconnect();
  };
}

/**
 * ② 煙もくもく（シューーーー……）
 */
export function playSmokeSound(durationMs = 600) {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const dur = durationMs / 1000;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.001, t);
  master.gain.linearRampToValueAtTime(0.4, t + 0.15); 
  master.gain.exponentialRampToValueAtTime(0.001, t + dur);
  master.connect(ctx.destination);

  const smokeNoise = ctx.createBufferSource();
  smokeNoise.buffer = createNoiseBuffer(ctx, dur + 0.2);
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1500, t);
  filter.frequency.exponentialRampToValueAtTime(350, t + dur * 0.8);
  filter.Q.value = 1.0;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.5;

  smokeNoise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);

  smokeNoise.start(t); smokeNoise.stop(t + dur + 0.1);

  const timeout = setTimeout(() => master.disconnect(), durationMs + 150);

  return () => {
    clearTimeout(timeout);
    try { smokeNoise.stop(); } catch (_) {}
    master.disconnect();
  };
}

/**
 * ③ カプセル開封（ガポッ ➔ キラーーーん✨）
 * 【大幅修正】チープさを極限まで排除。密閉が解ける重厚な「ガポッ」の直後、
 * コード内で擬似ディレイ回路を構築し、星が散りばめられるような極上の「キラーん」を響かせます
 */
export function playCapsulePop() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(ctx.destination);

  // --- パート1：「がぽっ」という硬質な開封音 ---
  const gapoOsc = ctx.createOscillator();
  const gapoGain = ctx.createGain();
  gapoOsc.type = 'sine';
  gapoOsc.frequency.setValueAtTime(140, t); // さらに低くして空洞感を強調
  gapoOsc.frequency.exponentialRampToValueAtTime(45, t + 0.1);
  
  gapoGain.gain.setValueAtTime(0.8, t);
  gapoGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
  
  gapoOsc.connect(gapoGain);
  gapoGain.connect(master);
  gapoOsc.start(t); gapoOsc.stop(t + 0.12);

  const gapoNoise = ctx.createBufferSource();
  gapoNoise.buffer = createNoiseBuffer(ctx, 0.1);
  const lpFilter = ctx.createBiquadFilter();
  lpFilter.type = 'lowpass';
  lpFilter.frequency.value = 500; // 低域をさらに強調
  
  const gapoNoiseGain = ctx.createGain();
  gapoNoiseGain.gain.setValueAtTime(0.5, t);
  gapoNoiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  
  gapoNoise.connect(lpFilter);
  lpFilter.connect(gapoNoiseGain);
  gapoNoiseGain.connect(master);
  gapoNoise.start(t); gapoNoise.stop(t + 0.1);


  // --- パート2：透明感あふれる極上の「キラーーーん✨」（擬似ディレイ実装） ---
  const delayNode = ctx.createDelay();
  delayNode.delayTime.value = 0.15; // 0.15秒遅れて音が跳ね返る（やまびこ効果）
  
  const feedbackGain = ctx.createGain();
  feedbackGain.gain.value = 0.45; // 残響が消えていく強さ

  // ディレイのループ回路を接続
  delayNode.connect(feedbackGain);
  feedbackGain.connect(delayNode);
  delayNode.connect(master);

  // 澄んだクリスタルサウンドを作る5つの超高域周波数（美しいシレー調の和音）
  const crystalFreqs = [1046.50, 1318.51, 1567.98, 2093.00, 3135.96]; // C6, E6, G6, C7, G7
  const chimeDuration = 2.0; // しっかりと2秒間響かせる

  crystalFreqs.forEach((freq, index) => {
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    
    // 最も澄んだ音が出る「サイン波」を採用し、チープなピコピコ感を徹底排除
    chimeOsc.type = 'sine';
    // わずかに発音タイミングをずらす（アルペジオ効果）ことで、「キ・ラ・ラ・ラ・ラ・ーん」という美しい広がりを作ります
    const triggerTime = t + 0.05 + (index * 0.03);
    
    chimeOsc.frequency.setValueAtTime(freq, triggerTime);
    // 音の終端にかけて、天に昇るようにわずかにピッチを上げる（キラーんの輝き感）
    chimeOsc.frequency.linearRampToValueAtTime(freq + 15, triggerTime + chimeDuration);

    chimeGain.gain.setValueAtTime(0.001, triggerTime);
    chimeGain.gain.linearRampToValueAtTime(0.15, triggerTime + 0.1); // 優しく発音
    chimeGain.gain.exponentialRampToValueAtTime(0.001, triggerTime + chimeDuration);

    chimeOsc.connect(chimeGain);
    // 直接マスターに出力するのと同時に、ディレイ回路にも流すことでリッチな空間の広がりを作ります
    chimeGain.connect(master);
    chimeGain.connect(delayNode);

    chimeOsc.start(triggerTime);
    chimeOsc.stop(triggerTime + chimeDuration + 0.1);
  });

  // 仕上げに、空気中に光の粉が舞うような「サラサラ……」という超高域ノイズ
  const lightGlitter = ctx.createBufferSource();
  lightGlitter.buffer = createNoiseBuffer(ctx, 1.5);
  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = 'highpass';
  hpFilter.frequency.value = 7500; // 人間の耳に心地よい超高音
  
  const glitterGain = ctx.createGain();
  glitterGain.gain.setValueAtTime(0.001, t + 0.05);
  glitterGain.gain.linearRampToValueAtTime(0.1, t + 0.2);
  glitterGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  
  lightGlitter.connect(hpFilter);
  hpFilter.connect(glitterGain);
  glitterGain.connect(master);
  lightGlitter.start(t + 0.05); lightGlitter.stop(t + 1.6);

  setTimeout(() => {
    master.disconnect();
    delayNode.disconnect();
    feedbackGain.disconnect();
  }, (chimeDuration * 1000) + 500);
}

/**
 * ④ 覚醒ファンファーレ（エラー解除 → 変身カットイン）
 */
export function playAwakeningFanfare() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.85;
  master.connect(ctx.destination);

  // 低域の立ち上がり
  const boom = ctx.createOscillator();
  const boomGain = ctx.createGain();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(80, t);
  boom.frequency.exponentialRampToValueAtTime(40, t + 0.35);
  boomGain.gain.setValueAtTime(0.55, t);
  boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  boom.connect(boomGain);
  boomGain.connect(master);
  boom.start(t);
  boom.stop(t + 0.42);

  // 上昇アルペジオ
  const arp = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  arp.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = t + 0.12 + i * 0.09;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.22, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + 0.6);
  });

  // シャイニー高域キラキラ
  const shimmer = ctx.createBufferSource();
  shimmer.buffer = createNoiseBuffer(ctx, 1.4);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  const shGain = ctx.createGain();
  shGain.gain.setValueAtTime(0.001, t + 0.2);
  shGain.gain.linearRampToValueAtTime(0.12, t + 0.45);
  shGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
  shimmer.connect(hp);
  hp.connect(shGain);
  shGain.connect(master);
  shimmer.start(t + 0.2);
  shimmer.stop(t + 1.6);

  // 締めの和音
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = t + 0.7;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.14 - i * 0.015, start + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.4);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + 1.5);
  });

  setTimeout(() => master.disconnect(), 2400);
}

/**
 * ⑤ ハンドル回転のギアクリック（軽め・間引き前提）
 */
export function playGearClick() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);

  const click = ctx.createOscillator();
  const clickGain = ctx.createGain();
  click.type = 'square';
  click.frequency.setValueAtTime(180 + Math.random() * 40, t);
  click.frequency.exponentialRampToValueAtTime(90, t + 0.04);
  clickGain.gain.setValueAtTime(0.18, t);
  clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  click.connect(clickGain);
  clickGain.connect(master);
  click.start(t);
  click.stop(t + 0.06);

  const tickNoise = ctx.createBufferSource();
  tickNoise.buffer = createNoiseBuffer(ctx, 0.04);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 900 + Math.random() * 300;
  bp.Q.value = 4;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.2, t);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  tickNoise.connect(bp);
  bp.connect(nGain);
  nGain.connect(master);
  tickNoise.start(t);
  tickNoise.stop(t + 0.04);

  setTimeout(() => master.disconnect(), 80);
}

/**
 * ⑥ 覚醒時の開封（通常より厚めのキラキラ）
 */
export function playAwakenedCapsulePop() {
  playCapsulePop();
  const ctx = getCtx();
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  const fanfare = [784, 988, 1175, 1568];
  fanfare.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = t + 0.08 + i * 0.05;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.16, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + 1.3);
  });

  setTimeout(() => master.disconnect(), 1600);
}

/**
 * ⑦ 完売の静かな余韻
 */
export function playSoldoutChime() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.4;
  master.connect(ctx.destination);

  [392, 523.25].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = t + i * 0.18;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.6);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + 1.7);
  });

  setTimeout(() => master.disconnect(), 2000);
}

/**
 * ⑧ 排出前の溜め（低域がじわっと盛り上がる）
 */
export function playRevealSuspense() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.45;
  master.connect(ctx.destination);

  const drone = ctx.createOscillator();
  const droneGain = ctx.createGain();
  drone.type = 'sine';
  drone.frequency.setValueAtTime(55, t);
  drone.frequency.linearRampToValueAtTime(95, t + 1.1);
  droneGain.gain.setValueAtTime(0.001, t);
  droneGain.gain.linearRampToValueAtTime(0.22, t + 0.5);
  droneGain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
  drone.connect(droneGain);
  droneGain.connect(master);
  drone.start(t);
  drone.stop(t + 1.35);

  const pulse = ctx.createOscillator();
  const pulseGain = ctx.createGain();
  pulse.type = 'triangle';
  pulse.frequency.setValueAtTime(180, t + 0.3);
  pulse.frequency.linearRampToValueAtTime(240, t + 1.0);
  pulseGain.gain.setValueAtTime(0.001, t + 0.3);
  pulseGain.gain.linearRampToValueAtTime(0.06, t + 0.7);
  pulseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  pulse.connect(pulseGain);
  pulseGain.connect(master);
  pulse.start(t + 0.3);
  pulse.stop(t + 1.25);

  setTimeout(() => master.disconnect(), 1500);
  return () => master.disconnect();
}

/**
 * ⑨ 卵が揺れる「カタ…カタ…」音
 */
export function playEggWobbleTick(step = 0) {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.28 + Math.min(step * 0.015, 0.12);
  master.connect(ctx.destination);

  const knock = ctx.createOscillator();
  const knockGain = ctx.createGain();
  knock.type = 'sine';
  knock.frequency.setValueAtTime(220 + step * 12, t);
  knock.frequency.exponentialRampToValueAtTime(120, t + 0.06);
  knockGain.gain.setValueAtTime(0.35, t);
  knockGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  knock.connect(knockGain);
  knockGain.connect(master);
  knock.start(t);
  knock.stop(t + 0.08);

  const tap = ctx.createBufferSource();
  tap.buffer = createNoiseBuffer(ctx, 0.03);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 700 + step * 40;
  bp.Q.value = 5;
  const tapGain = ctx.createGain();
  tapGain.gain.setValueAtTime(0.12, t);
  tapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  tap.connect(bp);
  bp.connect(tapGain);
  tapGain.connect(master);
  tap.start(t);
  tap.stop(t + 0.04);

  setTimeout(() => master.disconnect(), 90);
}