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
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
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
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * ① 筐体ガタガタ（ごとごとごと……）
 * 【音量極限強化】全体のボリュームを限界まで引き上げ、低音のパンチ力をアップ！
 */
export function playMachineRattle(durationMs = 800) {
  const ctx = getCtx();
  const master = ctx.createGain();
  
  // 【修正】音量を 0.6 ➔ 1.5 へ大幅アップ！歪まない限界の最大音量です
  master.gain.value = 1.5; 
  master.connect(ctx.destination);

  let active = true;

  const playSingleGoto = () => {
    if (!active) return;
    const t = ctx.currentTime;

    // 大きな空洞プラスチックがぶつかる低音「ご」
    const lowOsc = ctx.createOscillator();
    const lowGain = ctx.createGain();
    lowOsc.type = 'triangle'; 
    lowOsc.frequency.setValueAtTime(65 + Math.random() * 20, t); 
    lowOsc.frequency.linearRampToValueAtTime(35, t + 0.08); 
    
    // 【修正】一発ずつの芯のある低音をさらに太く強調（0.4 ➔ 0.7）
    lowGain.gain.setValueAtTime(0.7, t);
    lowGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    
    lowOsc.connect(lowGain);
    lowGain.connect(master);
    lowOsc.start(t); lowOsc.stop(t + 0.1);

    // 内部のメカが噛み合う鈍い擦れ音「と」
    const thickNoise = ctx.createBufferSource();
    thickNoise.buffer = createNoiseBuffer(ctx, 0.06);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(250 + Math.random() * 100, t); 
    filter.Q.value = 1.5;
    
    // 【修正】中低域の擦れ音の音圧もアップ（0.2 ➔ 0.4）
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    
    thickNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);
    thickNoise.start(t); thickNoise.stop(t + 0.06);
  };

  // 最初の1発
  playSingleGoto();
  
  // ゆっくりとしたテンポ（80ms〜110ms間隔）で「ごと、ごと、ごと」と連打
  const triggerNext = () => {
    if (!active) return;
    playSingleGoto();
    const nextInterval = 80 + Math.random() * 30; 
    setTimeout(triggerNext, nextInterval);
  };
  
  setTimeout(triggerNext, 90);

  const timeout = setTimeout(() => {
    active = false;
    const t = ctx.currentTime;
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    setTimeout(() => master.disconnect(), 180);
  }, durationMs);

  return () => {
    active = false;
    clearTimeout(timeout);
    master.disconnect();
  };
}

/**
 * ② 煙もくもく（シューーーー……）
 * 【修正】余韻を聞き取りやすくするため、全体の音の立ち上がりと消え方をより滑らかに
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
  filter.frequency.setValueAtTime(1800, t);
  filter.frequency.exponentialRampToValueAtTime(450, t + dur * 0.8);
  filter.Q.value = 1.2;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.5;

  smokeNoise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);

  smokeNoise.start(t);
  smokeNoise.stop(t + dur + 0.1);

  const timeout = setTimeout(() => master.disconnect(), durationMs + 150);

  return () => {
    clearTimeout(timeout);
    try { smokeNoise.stop(); } catch (_) {}
    master.disconnect();
  };
}

/**
 * ③ カプセル開封（ガポッ ➔ キラーーーん✨）
 * 【修正】チープさを完全撤廃。重厚な「ガポッ」から、1.5秒以上響き渡る美しい「キラーん」へ繋ぐ
 */
export function playCapsulePop() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.value = 0.65;
  master.connect(ctx.destination);

  // --- 【パート1：重みのある「ガポッ」という開封音】 ---
  // 低い空気の破裂音
  const gapoOsc = ctx.createOscillator();
  const gapoGain = ctx.createGain();
  gapoOsc.type = 'sine';
  gapoOsc.frequency.setValueAtTime(180, t);
  gapoOsc.frequency.exponentialRampToValueAtTime(55, t + 0.08); // どっしり落とす
  
  gapoGain.gain.setValueAtTime(0.7, t);
  gapoGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  
  gapoOsc.connect(gapoGain);
  gapoGain.connect(master);
  gapoOsc.start(t); gapoOsc.stop(t + 0.1);

  // 厚みのあるプラスチックが外れるノイズ
  const gapoNoise = ctx.createBufferSource();
  gapoNoise.buffer = createNoiseBuffer(ctx, 0.08);
  const lpFilter = ctx.createBiquadFilter();
  lpFilter.type = 'lowpass';
  lpFilter.frequency.value = 800; // 高音をカットして「ガポッ」の篭もり感を出す
  
  const gapoNoiseGain = ctx.createGain();
  gapoNoiseGain.gain.setValueAtTime(0.4, t);
  gapoNoiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  
  gapoNoise.connect(lpFilter);
  lpFilter.connect(gapoNoiseGain);
  gapoNoiseGain.connect(master);
  gapoNoise.start(t); gapoNoise.stop(t + 0.09);


  // --- 【パート2：華やかな「キラーーーん✨」という魔法効果音（FM合成風）】 ---
  // 複数の高いオシレーターを少しずつ周波数をずらして重ね、きらびやかな和音（チャイム）を作る
  const freqs = [987.77, 1318.51, 1567.98, 1975.53, 2637.02]; // E5, E6, G6, B6, E7の美しいメジャーコード
  const totalDuration = 1.8; // 【修正】1.8秒間、長々と綺麗に響かせる

  freqs.forEach((freq, index) => {
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    
    // きらきら感を出すためサイン波ではなく倍音の豊かな「三角波」を採用
    chimeOsc.type = 'triangle';
    chimeOsc.frequency.setValueAtTime(freq, t + 0.02); // ガポッの直後から鳴り始める
    
    // わずかにビブラート（揺らぎ）をかけて金属の残響感を出す
    chimeOsc.frequency.linearRampToValueAtTime(freq + (index * 4), t + totalDuration);

    // 美しいロングフェードアウト
    chimeGain.gain.setValueAtTime(0.001, t);
    chimeGain.gain.linearRampToValueAtTime(0.18, t + 0.15); // ふんわり立ち上がる
    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + totalDuration); // 長く響いて消える

    chimeOsc.connect(chimeGain);
    chimeGain.connect(master);
    chimeOsc.start(t);
    chimeOsc.stop(t + totalDuration + 0.1);
  });

  // 超高域のきらめきノイズ（シュワシュワ…という金属光沢感）
  const glitterNoise = ctx.createBufferSource();
  glitterNoise.buffer = createNoiseBuffer(ctx, 1.2);
  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = 'highpass';
  hpFilter.frequency.value = 6000; // 超高音
  
  const glitterGain = ctx.createGain();
  glitterGain.gain.setValueAtTime(0.001, t + 0.02);
  glitterGain.gain.linearRampToValueAtTime(0.12, t + 0.15);
  glitterGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
  
  glitterNoise.connect(hpFilter);
  hpFilter.connect(glitterGain);
  glitterGain.connect(master);
  glitterNoise.start(t); glitterNoise.stop(t + 1.3);

  // 全体の切断タイミングを引き伸ばす
  const timeout = setTimeout(() => master.disconnect(), (totalDuration * 1000) + 200);
}