import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  unlockAudio,
  playMachineRattle,
  playSmokeSound,
  playCapsulePop,
  playAwakeningFanfare,
  playGearClick,
  playAwakenedCapsulePop,
  playSoldoutChime,
  playRevealSuspense,
  playEggWobbleTick,
} from './gachaSounds';

const CONFETTI_COLORS_NORMAL = ['#ff3366', '#00d4aa', '#4dabff', '#ffb703', '#b967ff', '#ff6b35', '#fff'];
const CONFETTI_COLORS_AWAKENED = ['#ffd700', '#ff007f', '#fff0f6', '#ff69b4', '#ffe066', '#fff'];

const ConfettiBurst = ({ awakened = false, count = 28 }) => {
  const pieces = useMemo(() => {
    const colors = awakened ? CONFETTI_COLORS_AWAKENED : CONFETTI_COLORS_NORMAL;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${8 + Math.random() * 84}%`,
      delay: `${Math.random() * 0.35}s`,
      duration: `${1.4 + Math.random() * 1.1}s`,
      color: colors[i % colors.length],
      size: 6 + Math.floor(Math.random() * 8),
      rotate: Math.floor(Math.random() * 360),
      drift: `${(Math.random() - 0.5) * 120}px`,
      shape: i % 3 === 0 ? 'circle' : 'rect',
    }));
  }, [awakened, count]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 55,
      }}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.shape === 'circle' ? p.size : p.size * 0.55,
            height: p.size,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animationDelay: p.delay,
            animationDuration: p.duration,
            '--confetti-drift': p.drift,
            '--confetti-rotate': `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
};

const MACHINE_W = 540;
const MACHINE_H = 920;
const DOME_W = 500;
const DOME_H = 530;
const CAPSULE_SIZE = 82;
const CAPSULE_COLORS = ['#ff3366', '#00d4aa', '#4dabff', '#ffb703', '#b967ff', '#ff6b35'];
const AWAKENED_CAPSULE_COLOR = '#ffd700';
const POP_OUTLINE = '#2d3436';
const POP_FONT = '"Arial Rounded MT Bold", "Hiragino Maru Gothic ProN", "Yu Gothic UI", "Comic Sans MS", sans-serif';

const getCapsuleGradient = (color, angle = 135) =>
  `linear-gradient(${angle}deg, ${color} 52%, rgba(255,255,255,0.95) 52%)`;

const buildDispensedCapsule = (capsuleStyles, index, isAwakened) => {
  if (isAwakened) {
    return { color: AWAKENED_CAPSULE_COLOR, gradientAngle: 135, rotate: 0 };
  }
  if (index >= 0 && capsuleStyles[index]) {
    const style = capsuleStyles[index];
    return {
      color: CAPSULE_COLORS[style.colorIdx],
      gradientAngle: 130 + (index * 37) % 80,
      rotate: style.rotate,
    };
  }
  const colorIdx = Math.floor(Math.random() * CAPSULE_COLORS.length);
  return { color: CAPSULE_COLORS[colorIdx], gradientAngle: 135, rotate: 0 };
};

const RoundCapsule = ({ color, gradientAngle = 135, size, style = {} }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: getCapsuleGradient(color, gradientAngle),
      border: `3px solid ${POP_OUTLINE}`,
      boxShadow: '4px 5px 0 rgba(45,52,54,0.18), inset -3px -3px 8px rgba(0,0,0,0.08)',
      flexShrink: 0,
      ...style,
    }}
  />
);

const OpenedCapsuleHalves = ({ color, size = 96 }) => {
  const half = size / 2;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', marginBottom: '18px', height: size }}>
      <div style={{
        width: half, height: size,
        borderRadius: `${half}px 0 0 ${half}px`,
        background: color,
        border: `4px solid ${POP_OUTLINE}`,
        borderRight: 'none',
        boxShadow: '4px 4px 0 rgba(45,52,54,0.2)',
        transform: 'rotate(-14deg) translateX(-4px)',
      }} />
      <div style={{
        width: half, height: size,
        borderRadius: `0 ${half}px ${half}px 0`,
        background: 'rgba(255,255,255,0.95)',
        border: `4px solid ${POP_OUTLINE}`,
        borderLeft: 'none',
        boxShadow: '4px 4px 0 rgba(45,52,54,0.2)',
        transform: 'rotate(14deg) translateX(4px)',
      }} />
    </div>
  );
};

const SplittingCapsule = ({ color, size = 96, isOpening }) => {
  const half = size / 2;
  return (
    <div
      className={isOpening ? 'capsule-split-stage--open' : 'capsule-split-stage'}
      style={{ position: 'relative', width: size, height: size, marginBottom: '18px' }}
    >
      <div
        className="capsule-split-half capsule-split-half--left"
        style={{
          position: 'absolute', left: 0, top: 0,
          width: half, height: size,
          borderRadius: `${half}px 0 0 ${half}px`,
          background: color,
          border: `4px solid ${POP_OUTLINE}`,
          borderRight: `2px solid ${POP_OUTLINE}`,
          boxSizing: 'border-box',
          boxShadow: '4px 4px 0 rgba(45,52,54,0.2)',
          transformOrigin: 'right center',
        }}
      />
      <div
        className="capsule-split-half capsule-split-half--right"
        style={{
          position: 'absolute', right: 0, top: 0,
          width: half, height: size,
          borderRadius: `0 ${half}px ${half}px 0`,
          background: 'rgba(255,255,255,0.95)',
          border: `4px solid ${POP_OUTLINE}`,
          borderLeft: 'none',
          boxSizing: 'border-box',
          boxShadow: '4px 4px 0 rgba(45,52,54,0.2)',
          transformOrigin: 'left center',
        }}
      />
    </div>
  );
};

const HANDLE_RING_BORDER = 36;
const TURN_ARROW_SIZE = 54;
const RING_ARROW_OFFSET = HANDLE_RING_BORDER + 6;
const HANDLE_DIAL_SIZE = 240;
const HANDLE_BAR_W = 156;
const HANDLE_BAR_H = 56;

const TurnArrow = ({ color = '#ffd100', rotation = 0, size = TURN_ARROW_SIZE }) => {
  const markerId = `ring-arrow-tip-${rotation}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="-4 0 66 58"
      aria-hidden="true"
      style={{
        transform: `rotate(${rotation}deg)`,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
        display: 'block',
        overflow: 'visible',
      }}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 2 L 8 5 L 0 8 Z" fill={color} />
        </marker>
      </defs>
      <path
        d="M -3 35 A 110 110 0 0 1 59 35"
        fill="none"
        stroke={color}
        strokeWidth="8.5"
        strokeLinecap="butt"
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  );
};

const HandleArrow = ({ color = '#ffd100', direction = 'right', width = 22, height = 14 }) => {
  const isRight = direction === 'right';

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 22 14"
      aria-hidden="true"
      style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}
    >
      <polygon
        points={isRight ? '1,0 21,7 1,14' : '21,0 1,7 21,14'}
        fill={color}
      />
    </svg>
  );
};

const RING_TURN_ARROWS = [
  { key: 'top', style: { top: `-${RING_ARROW_OFFSET}px`, left: '50%', transform: 'translateX(-50%)' }, rotation: 0 },
  { key: 'right', style: { top: '50%', right: `-${RING_ARROW_OFFSET}px`, transform: 'translateY(-50%)' }, rotation: 90 },
  { key: 'bottom', style: { bottom: `-${RING_ARROW_OFFSET}px`, left: '50%', transform: 'translateX(-50%)' }, rotation: 180 },
  { key: 'left', style: { top: '50%', left: `-${RING_ARROW_OFFSET}px`, transform: 'translateY(-50%)' }, rotation: 270 },
];

const generateCapsuleStyles = (count) => {
  const spreadX = DOME_W - CAPSULE_SIZE - 12;
  const colors = Array.from({ length: count }, () => Math.floor(Math.random() * CAPSULE_COLORS.length))
    .sort(() => Math.random() - 0.5);

  const placements = [];
  let placed = 0;
  let layerIdx = 0;

  while (placed < count) {
    const layerCount = Math.min(count - placed, 2 + Math.floor(Math.random() * 5));
    const layerBase = 6 + layerIdx * (34 + Math.random() * 26);
    for (let j = 0; j < layerCount; j++) {
      placements.push({
        left: 4 + Math.random() * spreadX,
        bottom: layerBase + Math.random() * 28 - 12,
      });
    }
    placed += layerCount;
    layerIdx += 1;
  }

  placements.sort(() => Math.random() - 0.5);

  return placements.map((pos, i) => ({
    left: `${Math.round(pos.left)}px`,
    bottom: `${Math.round(Math.max(4, pos.bottom))}px`,
    scale: 0.8 + Math.random() * 0.3,
    zIndex: Math.floor(Math.random() * 14) + 1,
    opacity: 0.86 + Math.random() * 0.14,
    colorIdx: colors[i],
    rotate: Math.random() * 360,
    delay: `${Math.random() * 0.35}s`,
    duration: `${0.25 + Math.random() * 0.22}s`,
    idleVariant: (Math.floor(Math.random() * 4) % 4) + 1,
    chaosVariant: (Math.floor(Math.random() * 4) % 4) + 1,
    idleDuration: `${1.6 + Math.random() * 1.6}s`,
  }));
};

function App() {
  const [screen, setScreen] = useState('config');

  // --- 【設定画面用の状態】 ---
  const [prizeCount, setPrizeCount] = useState(20);
  const [prizes, setPrizes] = useState(Array(20).fill(''));
  const [isSecretEnabled, setIsSecretEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState('404 ERROR: 20歳未満のアクセスを検知しました。管理者の承認が必要です。');
  const [secretCommand, setSecretCommand] = useState('20061123');
  const [generatedUrl, setGeneratedUrl] = useState('');

  // --- 【ガチャ画面用の状態・参照】 ---
  const [loadedConfig, setLoadedConfig] = useState(null);
  const [remainingCount, setRemainingCount] = useState(0);
  const [dialRotation, setDialRotation] = useState(0);
  const [currentPrize, setCurrentPrize] = useState(null);
  const [isCapsulePopped, setIsCapsulePopped] = useState(false);
  
  const [gachaStatus, setGachaStatus] = useState('playing'); 
  const [isShaking, setIsShaking] = useState(false); 
  const [isBodyThumping, setIsBodyThumping] = useState(false); 
  const [isCapsuleVisible, setIsCapsuleVisible] = useState(false); 
  const [isSmokeActive, setIsSmokeActive] = useState(false); 
  const [orderedPrizes, setOrderedPrizes] = useState([]); 
  const [commandInput, setCommandInput] = useState(''); 
  const [capsuleStyles, setCapsuleStyles] = useState([]);
  const [dispensedCapsule, setDispensedCapsule] = useState(null);
  const [scale, setScale] = useState(1);
  const [popupScale, setPopupScale] = useState(1);
  const [isAwakeningFx, setIsAwakeningFx] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSoldoutReveal, setIsSoldoutReveal] = useState(false);
  const [revealPhase, setRevealPhase] = useState(null);
  const [isDispenseZoom, setIsDispenseZoom] = useState(false);

  const dialRef = useRef(null);
  const gachaContainerRef = useRef(null);
  const commandInputRef = useRef(null);
  const isDragging = useRef(false);
  const accumulatedRotation = useRef(0); 
  const lastAngle = useRef(0);
  const lastGearAngle = useRef(0);
  const awakeningTimerRef = useRef(null);
  const revealTimersRef = useRef([]);
  const wobbleSoundRef = useRef(null);

  // 画面リサイズ時にガチャ筐体がぴったり収まるようにスケール調整
  useEffect(() => {
    const updateScales = () => {
      const vv = window.visualViewport;
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;
      const pad = 12;
      const machineScale = Math.min(1, (w - pad * 2) / MACHINE_W, (h - pad * 2) / MACHINE_H);
      const popupScale = Math.min(1, (w - pad * 2) / 520, (h - pad * 2) / 680);
      setScale(machineScale);
      setPopupScale(popupScale);
    };
    updateScales();
    window.addEventListener('resize', updateScales);
    window.visualViewport?.addEventListener('resize', updateScales);
    return () => {
      window.removeEventListener('resize', updateScales);
      window.visualViewport?.removeEventListener('resize', updateScales);
    };
  }, []);

  // 演出タイミングに合わせた効果音
  useEffect(() => {
    if (!isBodyThumping) return;
    return playMachineRattle(800);
  }, [isBodyThumping]);

  useEffect(() => {
    if (!isSmokeActive) return;
    return playSmokeSound(600);
  }, [isSmokeActive]);

  useEffect(() => {
    if (revealPhase !== 'zoom') return;
    return playRevealSuspense();
  }, [revealPhase]);

  useEffect(() => {
    if (revealPhase !== 'wobble') return;
    let count = 0;
    const tick = () => {
      playEggWobbleTick(count);
      count += 1;
      if (count < 9) {
        wobbleSoundRef.current = setTimeout(tick, 170 + count * 8);
      }
    };
    wobbleSoundRef.current = setTimeout(tick, 520);
    return () => {
      if (wobbleSoundRef.current) clearTimeout(wobbleSoundRef.current);
    };
  }, [revealPhase]);

  useEffect(() => {
    if (!isCapsulePopped) return;
    if (gachaStatus === 'awakened') {
      playAwakenedCapsulePop();
    } else {
      playCapsulePop();
    }
    setShowConfetti(true);
    const hide = setTimeout(() => setShowConfetti(false), gachaStatus === 'awakened' ? 3200 : 2200);
    return () => clearTimeout(hide);
  }, [isCapsulePopped, gachaStatus]);

  useEffect(() => () => {
    if (awakeningTimerRef.current) clearTimeout(awakeningTimerRef.current);
    revealTimersRef.current.forEach(clearTimeout);
    if (wobbleSoundRef.current) clearTimeout(wobbleSoundRef.current);
  }, []);

  const clearRevealTimers = () => {
    revealTimersRef.current.forEach(clearTimeout);
    revealTimersRef.current = [];
  };

  const scheduleReveal = (fn, delay) => {
    const id = setTimeout(fn, delay);
    revealTimersRef.current.push(id);
  };

  // スマホでページがスクロール・バウンスしないよう固定
  useEffect(() => {
    if (screen !== 'gacha') return;

    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyWidth: body.style.width,
      bodyHeight: body.style.height,
      bodyTouchAction: body.style.touchAction,
      bodyOverscroll: body.style.overscrollBehavior,
    };

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.width = '100%';
    body.style.height = '100%';
    body.style.touchAction = 'none';
    body.style.overscrollBehavior = 'none';

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.width = prev.bodyWidth;
      body.style.height = prev.bodyHeight;
      body.style.touchAction = prev.bodyTouchAction;
      body.style.overscrollBehavior = prev.bodyOverscroll;
    };
  }, [screen]);

  // React の合成イベントでは preventDefault が効かない場合があるためネイティブで抑止
  useEffect(() => {
    const dial = dialRef.current;
    const container = gachaContainerRef.current;
    if (screen !== 'gacha' || !dial || !container) return;

    const blockTouchScroll = (e) => {
      if (e.cancelable) e.preventDefault();
    };

    const blockContainerTouchMove = (e) => {
      if (isDragging.current && e.cancelable) e.preventDefault();
    };

    dial.addEventListener('touchstart', blockTouchScroll, { passive: false });
    dial.addEventListener('touchmove', blockTouchScroll, { passive: false });
    container.addEventListener('touchmove', blockContainerTouchMove, { passive: false });

    return () => {
      dial.removeEventListener('touchstart', blockTouchScroll);
      dial.removeEventListener('touchmove', blockTouchScroll);
      container.removeEventListener('touchmove', blockContainerTouchMove);
    };
  }, [screen, gachaStatus, currentPrize, isBodyThumping]);

  // URLパラメータの読み込み
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');
    if (dataParam) {
      try {
        const decodedData = decodeURIComponent(atob(dataParam));
        const configData = JSON.parse(decodedData);
        setLoadedConfig(configData);
        const N = configData.prizes.length;
        
        let initialCount = 0;
        // 【修復】設定データのisSecretEnabled（サプライズ有効フラグ）を厳密にチェック
        if (configData.isSecretEnabled) {
          initialCount = N - 1; // 道中は N-1 個
          setRemainingCount(initialCount);
          setOrderedPrizes(generateGentleRandomSchedule(configData.prizes));
        } else {
          initialCount = N; // 通常は N 個
          setRemainingCount(initialCount);
          setOrderedPrizes([...configData.prizes].sort(() => Math.random() - 0.5));
        }

        const styles = generateCapsuleStyles(initialCount);
        setCapsuleStyles(styles);
        setScreen('gacha');
      } catch (e) { alert('URLのデータが破損しています。'); }
    }
  }, []);

  // 隠しコマンド入力欄にフォーカス（スマホでキーボードを開く）
  useEffect(() => {
    if (gachaStatus !== 'error') return;
    const timer = setTimeout(() => commandInputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [gachaStatus]);

  const tryUnlockWithCommand = () => {
    if (!loadedConfig || commandInput !== loadedConfig.secretCommand || isAwakeningFx) return;
    unlockAudio();
    setCommandInput('');
    setIsAwakeningFx(true);
    playAwakeningFanfare();
    if (awakeningTimerRef.current) clearTimeout(awakeningTimerRef.current);
    awakeningTimerRef.current = setTimeout(() => {
      setGachaStatus('awakened');
      setRemainingCount(1);
      setIsAwakeningFx(false);
      awakeningTimerRef.current = null;
    }, 2400);
  };

  const noteGearAndShake = (nextAccumulated) => {
    if (nextAccumulated - lastGearAngle.current >= 28) {
      lastGearAngle.current = nextAccumulated;
      playGearClick();
    }
  };

  // 優しいランダム生成
  const generateGentleRandomSchedule = (rawPrizes) => {
    const N = rawPrizes.length;
    const pool = [...rawPrizes];
    pool.pop(); 
    const tempPool = [...pool];
    let isApproved = false;
    let attempts = 0;
    let finalSchedule = [];

    while (!isApproved && attempts < 100) {
      attempts++;
      finalSchedule = [...tempPool].sort(() => Math.random() - 0.5);
      const firstThree = finalSchedule.slice(0, 3);
      const containsBigPrizeEarly = firstThree.some(p => pool.indexOf(p) >= N - 5);
      const lastFive = finalSchedule.slice(-5);
      const containsBigPrizeLate = lastFive.some(p => pool.indexOf(p) >= N - 5);
      if (!containsBigPrizeEarly && containsBigPrizeLate) isApproved = true;
    }
    return isApproved ? finalSchedule : tempPool.sort(() => Math.random() - 0.5);
  };

  const handleCountChange = (value) => {
    const count = parseInt(value) || 0;
    setPrizeCount(count); 
    setPrizes(Array(count).fill(''));
  };

  const handlePrizeInputChange = (index, value) => {
    const newPrizes = [...prizes]; newPrizes[index] = value; setPrizes(newPrizes);
  };

  const generateGachaUrl = () => {
    const 被補完Prizes = prizes.map((prize, index) => prize.trim() === '' ? `${index + 1}番` : prize);
    const configObject = {
      prizes: 被補完Prizes, 
      isSecretEnabled: isSecretEnabled, // ここをガチャ画面側へしっかり引き継ぐ
      ...(isSecretEnabled && { errorMsg: errorMsg, secretCommand: secretCommand })
    };
    try {
      const jsonStr = JSON.stringify(configObject);
      const base64Str = btoa(encodeURIComponent(jsonStr));
      setGeneratedUrl(`${window.location.origin}${window.location.pathname}?data=${base64Str}`);
    } catch (e) { alert('URLの生成に失敗しました。'); }
  };

  // ハンドルドラッグ計算
  const getAngle = (clientX, clientY) => {
    if (!dialRef.current) return 0;
    const rect = dialRef.current.getBoundingClientRect();
    const angle = Math.atan2(clientY - (rect.top + rect.height / 2), clientX - (rect.left + rect.width / 2)) * (180 / Math.PI);
    return angle;
  };

  const handleMouseDown = (e) => {
    if (currentPrize || isBodyThumping || isAwakeningFx || gachaStatus === 'error' || gachaStatus === 'soldout') return;
    unlockAudio();
    isDragging.current = true;
    lastAngle.current = getAngle(e.clientX, e.clientY);
    accumulatedRotation.current = 0;
    lastGearAngle.current = 0;
    setIsShaking(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const currentAngle = getAngle(e.clientX, e.clientY);
    let diff = currentAngle - lastAngle.current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    if (diff > 0) {
      accumulatedRotation.current += diff;
      setDialRotation(prev => prev + diff);
      noteGearAndShake(accumulatedRotation.current);
    }
    lastAngle.current = currentAngle;

    if (accumulatedRotation.current >= 360) {
      isDragging.current = false;
      setIsShaking(false);
      startSequenceAfterTurn();
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setIsShaking(false);
    if (!currentPrize && !isBodyThumping) {
      setDialRotation(0);
    }
  };

  const handleTouchStart = (e) => {
    if (currentPrize || isBodyThumping || isAwakeningFx || gachaStatus === 'error' || gachaStatus === 'soldout') return;
    if (e.cancelable) e.preventDefault();
    unlockAudio();
    isDragging.current = true;
    const touch = e.touches[0];
    lastAngle.current = getAngle(touch.clientX, touch.clientY);
    accumulatedRotation.current = 0;
    lastGearAngle.current = 0;
    setIsShaking(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    const currentAngle = getAngle(touch.clientX, touch.clientY);
    let diff = currentAngle - lastAngle.current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    if (diff > 0) {
      accumulatedRotation.current += diff;
      setDialRotation(prev => prev + diff);
      noteGearAndShake(accumulatedRotation.current);
    }
    lastAngle.current = currentAngle;

    if (accumulatedRotation.current >= 360) {
      isDragging.current = false;
      setIsShaking(false);
      startSequenceAfterTurn();
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    setIsShaking(false);
    if (!currentPrize && !isBodyThumping) {
      setDialRotation(0);
    }
  };

  const startSequenceAfterTurn = () => {
    clearRevealTimers();
    setIsDispenseZoom(true);
    setIsBodyThumping(true);
    setTimeout(() => {
      setIsBodyThumping(false);
      let prize = '';
      if (gachaStatus === 'awakened') {
        prize = loadedConfig.prizes[loadedConfig.prizes.length - 1];
      } else {
        prize = orderedPrizes[orderedPrizes.length - remainingCount];
      }
      const dispensedIndex = remainingCount - 1;
      setDispensedCapsule(buildDispensedCapsule(capsuleStyles, dispensedIndex, gachaStatus === 'awakened'));
      setCurrentPrize(prize);
      setRemainingCount(prev => prev - 1);
      setIsCapsuleVisible(true);
      setRevealPhase('zoom');

      scheduleReveal(() => setRevealPhase('wobble'), 700);
      scheduleReveal(() => setRevealPhase('opening'), 2400);
      scheduleReveal(() => {
        setRevealPhase(null);
        setIsDispenseZoom(false);
        setIsCapsulePopped(true);
      }, 2900);
    }, 800);
  };

  const nextGacha = () => {
    clearRevealTimers();
    if (wobbleSoundRef.current) clearTimeout(wobbleSoundRef.current);
    setCurrentPrize(null);
    setDispensedCapsule(null);
    setIsCapsulePopped(false);
    setIsCapsuleVisible(false);
    setRevealPhase(null);
    setIsDispenseZoom(false);
    setIsSmokeActive(false);
    setShowConfetti(false);
    setDialRotation(0);
    
    // 【修復】サプライズが有効のときだけ、道中が終わった瞬間にエラー画面へ飛ばす
    if (remainingCount === 0 && gachaStatus === 'playing') {
      if (loadedConfig.isSecretEnabled) {
        setCommandInput('');
        setGachaStatus('error'); // エラーロック画面へ
      } else {
        setGachaStatus('soldout');
        setIsSoldoutReveal(true);
        playSoldoutChime();
      }
    } else if (remainingCount === 0 && gachaStatus === 'awakened') {
      setGachaStatus('soldout');
      setIsSoldoutReveal(true);
      playSoldoutChime();
    }
  };

  // --- 画面A: 設定画面 ---
  if (screen === 'config') {
    return (
      <div style={{ minHeight: '100dvh', width: '100%', boxSizing: 'border-box', padding: '16px', overflowY: 'auto', background: '#fff0f6' }}>
      <div style={{ padding: '20px 16px', fontFamily: POP_FONT, width: '100%', maxWidth: '650px', margin: '0 auto', backgroundColor: '#fff9fc', color: POP_OUTLINE, boxSizing: 'border-box', border: `4px solid ${POP_OUTLINE}`, borderRadius: '20px', boxShadow: '6px 6px 0 #ffb3c6' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: `4px solid ${POP_OUTLINE}`, paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: '900', color: '#0096c7', textShadow: '2px 2px 0 #fff' }}>Custom Gacha System</h1>
          <p style={{ margin: 0, fontSize: '15px', color: '#636e72', fontWeight: 'bold' }}>オリジナルガチャ作成・管理画面</p>
        </div>
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '18px', fontWeight: '800' }}>1. ガチャの総数 (プレゼントの数)</label>
          <div style={{ position: 'relative', width: '100%', maxWidth: '200px' }}>
            <select value={prizeCount} onChange={(e) => handleCountChange(e.target.value)} style={{ padding: '12px 16px', fontSize: '18px', width: '100%', border: '3px solid #cbd5e1', borderRadius: '10px', fontWeight: 'bold', backgroundColor: '#fff', color: '#1e293b', boxSizing: 'border-box', outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
              {Array.from({ length: 29 }, (_, i) => i + 2).map((num) => (<option key={num} value={num}>{num} 個</option>))}
            </select>
            <div style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>▼</div>
          </div>
        </div>
        <div style={{ marginBottom: '28px', padding: '16px', background: '#f8fafc', border: '3px solid #e2e8f0', borderRadius: '12px' }}>
          <label style={{ fontWeight: '800', fontSize: '17px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={isSecretEnabled} onChange={(e) => setIsSecretEnabled(e.target.checked)} style={{ marginRight: '12px', width: '22px', height: '22px', cursor: 'pointer' }} />
            サプライズ演出を有効にする
          </label>
        </div>
        {isSecretEnabled && (
          <div style={{ borderLeft: '6px solid #005ea6', background: '#f0f7ff', borderTop: '3px solid #005ea6', borderRight: '3px solid #005ea6', borderBottom: '3px solid #005ea6', padding: '20px 16px', borderRadius: '0 12px 12px 0', marginBottom: '28px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '16px', marginBottom: '8px' }}>🔒 エラー画面に表示する文字</label>
              <textarea value={errorMsg} onChange={(e) => setErrorMsg(e.target.value)} rows="3" style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #94a3b8', borderRadius: '8px', boxSizing: 'border-box', fontWeight: '600', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '5px' }}>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '16px', marginBottom: '8px' }}>🔑 解除用 隠しコマンド (半角英数字)</label>
              <input type="text" value={secretCommand} onChange={(e) => setSecretCommand(e.target.value)} style={{ padding: '12px', fontSize: '16px', width: '100%', maxWidth: '240px', border: '2px solid #94a3b8', borderRadius: '8px', fontWeight: 'bold', boxSizing: 'border-box', outline: 'none' }} />
            </div>
          </div>
        )}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>2. プレゼント内容（景品名）の入力</label>
          <div style={{ maxHeight: '340px', overflowY: 'scroll', border: '3px solid #cbd5e1', padding: '12px', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
            {prizes.map((prize, index) => {
              const isLast = isSecretEnabled && index === prizeCount - 1;
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', background: isLast ? '#fff5f5' : '#fff', padding: '8px', borderRadius: '8px', border: isLast ? '2px solid #f87171' : '1px solid #e2e8f0' }}>
                  <span style={{ width: '55px', textAlign: 'center', fontWeight: '800', fontSize: '15px', background: isLast ? '#ef4444' : '#64748b', color: '#fff', padding: '4px 6px', borderRadius: '6px', marginRight: '12px' }}>{index + 1}</span>
                  <input type="text" value={prize} placeholder={isLast ? "★大物のプレゼント名" : `例: ${index + 1}番のプレゼント`} onChange={(e) => handlePrizeInputChange(index, e.target.value)} style={{ flex: 1, padding: '10px', fontSize: '15px', border: '2px solid #cbd5e1', borderRadius: '6px', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              );
            })}
          </div>
        </div>
        <button onClick={generateGachaUrl} style={{ width: '100%', padding: '16px', fontSize: '18px', fontWeight: '900', background: '#0096c7', color: '#fff', border: `3px solid ${POP_OUTLINE}`, borderRadius: '16px', cursor: 'pointer', boxShadow: '4px 4px 0 rgba(45,52,54,0.2)', fontFamily: POP_FONT }}>🚀 上記の設定でガチャURLを生成する</button>
        {generatedUrl && (
          <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#ecfdf5', border: '3px solid #10b981', borderRadius: '16px' }}>
            <input type="text" value={generatedUrl} readOnly style={{ width: '100%', padding: '12px', fontSize: '15px', border: '2px solid #10b981', borderRadius: '8px', fontWeight: 'bold', backgroundColor: '#fff', color: '#10b981', boxSizing: 'border-box', outline: 'none' }} onClick={(e) => e.target.select()} />
          </div>
        )}
      </div>
      </div>
    );
  }

  // --- 【システムエラー画面】 ---
  if (gachaStatus === 'error') {
    return (
      <div style={{ width: '100%', minHeight: '100dvh', background: '#1c1e22', color: '#ff3b30', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', padding: '20px 16px', boxSizing: 'border-box', overflowY: 'auto', position: 'relative' }}>
        <h1 style={{ fontSize: 'clamp(24px, 7vw, 80px)', margin: '0 0 16px 0', borderBottom: '6px solid #ff3b30', paddingBottom: '10px', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.2 }}>⚠️ SYSTEM ERROR</h1>
        <p style={{ fontSize: 'clamp(14px, 3.8vw, 32px)', textAlign: 'center', width: '100%', maxWidth: '900px', lineHeight: '1.6', background: '#000', padding: '16px 20px', borderRadius: '12px', border: '2px solid #444', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', wordBreak: 'break-word', boxSizing: 'border-box' }}>
          {loadedConfig.errorMsg}
        </p>
        <p style={{ color: '#aaa', marginTop: '24px', fontSize: 'clamp(12px, 3.2vw, 18px)', letterSpacing: '0.5px', textAlign: 'center', lineHeight: 1.5, maxWidth: '420px' }}>
          下の欄をタップしてパスコードを入力し、送信してください
        </p>
        <input
          ref={commandInputRef}
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value.slice(-40))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              tryUnlockWithCommand();
            }
          }}
          enterKeyHint="go"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="パスコードを入力"
          disabled={isAwakeningFx}
          style={{
            marginTop: '12px',
            background: '#000',
            border: '2px solid #555',
            borderRadius: '8px',
            padding: '12px 16px',
            width: '100%',
            maxWidth: '360px',
            fontSize: 'clamp(16px, 4.5vw, 28px)',
            color: '#39ff14',
            letterSpacing: '1px',
            textAlign: 'center',
            fontFamily: 'monospace',
            boxShadow: 'inset 0 0 12px rgba(57,255,20,0.15)',
            outline: 'none',
            boxSizing: 'border-box',
            caretColor: '#39ff14',
            opacity: isAwakeningFx ? 0.5 : 1,
          }}
        />
        <button
          type="button"
          onClick={tryUnlockWithCommand}
          disabled={isAwakeningFx}
          style={{
            marginTop: '16px',
            padding: '12px 32px',
            fontSize: 'clamp(14px, 3.5vw, 18px)',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            background: '#ff3b30',
            color: '#fff',
            border: '2px solid #888',
            borderRadius: '8px',
            cursor: isAwakeningFx ? 'not-allowed' : 'pointer',
            opacity: isAwakeningFx ? 0.5 : 1,
          }}
        >
          送信
        </button>
        {isAwakeningFx && (
          <div
            className="awakening-fx-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <div className="awakening-fx-flash" />
            <div className="awakening-fx-wipe" />
            <div className="awakening-fx-title-wrap">
              <div className="awakening-fx-title">20th Awakening</div>
              <div className="awakening-fx-sub">LAST ONE UNLOCKED</div>
            </div>
          </div>
        )}
        <style>{`
          input::placeholder { color: rgba(57, 255, 20, 0.35); letter-spacing: 1px; }
          .awakening-fx-flash {
            position: absolute; inset: 0;
            background: #fff;
            animation: awakeningFlash 0.55s ease-out forwards;
            pointer-events: none;
          }
          .awakening-fx-wipe {
            position: absolute; inset: 0;
            background: linear-gradient(135deg, #ff007f 0%, #ff69b4 40%, #ffd700 100%);
            animation: awakeningWipe 2.2s ease-in-out forwards;
            pointer-events: none;
          }
          .awakening-fx-title-wrap {
            position: relative; z-index: 2;
            text-align: center;
            animation: awakeningTitleIn 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.35s both;
            pointer-events: none;
            padding: 0 16px;
          }
          .awakening-fx-title {
            font-family: ${POP_FONT};
            font-size: clamp(36px, 10vw, 72px);
            font-weight: 900;
            font-style: italic;
            color: #fff;
            text-shadow: 0 0 24px rgba(255,215,0,0.85), 3px 3px 0 #ff007f, -1px -1px 0 #fff;
            letter-spacing: 1px;
            line-height: 1.15;
          }
          .awakening-fx-sub {
            margin-top: 14px;
            font-family: ${POP_FONT};
            font-size: clamp(14px, 3.8vw, 22px);
            font-weight: 900;
            color: #ffd700;
            letter-spacing: 3px;
            text-shadow: 0 2px 8px rgba(0,0,0,0.35);
          }
          @keyframes awakeningFlash {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes awakeningWipe {
            0% { opacity: 0; transform: scale(1.08); }
            18% { opacity: 1; transform: scale(1); }
            75% { opacity: 1; }
            100% { opacity: 0.92; }
          }
          @keyframes awakeningTitleIn {
            0% { opacity: 0; transform: scale(0.55) translateY(20px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // --- 画面B: ガチャ本番画面 ---
  return (
    <div 
      ref={gachaContainerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100dvh',
        background: 'radial-gradient(circle at 15% 20%, rgba(255,182,193,0.55) 0%, transparent 42%), radial-gradient(circle at 85% 75%, rgba(135,206,250,0.5) 0%, transparent 40%), linear-gradient(165deg, #fff0f6 0%, #e8f7ff 45%, #fff9db 100%)',
        color: POP_OUTLINE,
        fontFamily: POP_FONT,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden', userSelect: 'none',
        touchAction: 'none', overscrollBehavior: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div style={{
        width: MACHINE_W * scale,
        height: MACHINE_H * scale,
        flexShrink: 0,
        position: 'relative',
      }}>
        <div
          style={{
            width: `${MACHINE_W}px`,
            height: `${MACHINE_H}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
        <div className={isDispenseZoom ? 'machine-dispense-zoom-inner' : ''} style={{ width: '100%', height: '100%' }}>
        <div className={isBodyThumping ? 'bodyThump' : ''} style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(180deg, #fffdf8 0%, #fff5f0 55%, #ffeef5 100%)',
          border: `5px solid ${POP_OUTLINE}`,
          borderRadius: '42px 42px 28px 28px',
          boxShadow: '0 28px 0 #ffb3c6, 0 48px 80px rgba(45,52,54,0.35), inset 0 12px 0 #fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
          boxSizing: 'border-box', padding: '0 0 16px 0',
        }}>

        {/* ヘッダー */}
        <div style={{
          width: '100%', height: '88px', minHeight: '88px',
          background: 'linear-gradient(180deg, #ffffff 0%, #fff0f8 100%)',
          borderRadius: '38px 38px 0 0',
          borderBottom: `4px solid ${POP_OUTLINE}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden',
          gap: '8px', flexShrink: 0,
        }}>
          <div style={{ position: 'absolute', top: '10px', left: '120px', fontSize: '18px', opacity: 0.35 }}>★</div>
          <div style={{ position: 'absolute', top: '18px', right: '130px', fontSize: '14px', opacity: 0.35 }}>✦</div>
          <div style={{
            background: 'linear-gradient(135deg, #ff3366, #ff6b6b)',
            color: '#fff', fontWeight: '900', fontSize: '17px',
            padding: '8px 14px', borderRadius: '20px',
            border: `3px solid ${POP_OUTLINE}`,
            boxShadow: '3px 3px 0 rgba(45,52,54,0.25)',
            letterSpacing: '0.5px', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            takusaki
          </div>
          <div style={{
            color: gachaStatus === 'awakened' ? '#ff007f' : '#0096c7',
            fontWeight: '900', fontSize: gachaStatus === 'awakened' ? '22px' : '26px',
            fontStyle: 'italic', lineHeight: 1.1, textAlign: 'right',
            textShadow: gachaStatus === 'awakened'
              ? '2px 2px 0 #fff, 3px 3px 0 #ff007f, -1px -1px 0 #fff'
              : `2px 2px 0 #fff, 3px 3px 0 ${POP_OUTLINE}, -1px -1px 0 #fff`,
            whiteSpace: 'nowrap', flexShrink: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {gachaStatus === 'awakened' ? '20th Awakening' : 'Happy Birthday'}
          </div>
        </div>

        {/* カプセルドーム（拡大） */}
        <div style={{
          width: `${DOME_W}px`, height: `${DOME_H}px`,
          background: 'linear-gradient(to bottom, rgba(180,230,255,0.55) 0%, rgba(255,255,255,0.92) 38%, rgba(255,248,220,0.85) 100%)',
          border: `4px solid ${POP_OUTLINE}`,
          borderTop: 'none',
          borderRadius: '0 0 55px 55px',
          position: 'relative', overflow: 'hidden', marginTop: '6px',
          boxShadow: 'inset 0 20px 35px rgba(255,255,255,0.7), inset 0 -18px 30px rgba(0,0,0,0.06), 0 8px 0 #bde0fe'
        }}>
          {/* ガラスハイライト */}
          <div style={{
            position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
            width: '72%', height: '42%', borderRadius: '50%',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.85) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 4
          }} />
          {gachaStatus === 'awakened' && remainingCount > 0 && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
                background: 'radial-gradient(circle at 50% 70%, rgba(255,215,0,0.28) 0%, rgba(255,0,127,0.12) 42%, transparent 70%)',
                animation: 'domeAwakenGlow 2s ease-in-out infinite alternate',
              }}
            />
          )}
          {/* 床の影 */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, width: '100%', height: '28%',
            background: 'linear-gradient(to top, rgba(45,52,54,0.12), transparent)',
            pointerEvents: 'none', zIndex: 1
          }} />
          {/* 装飾キラキラ */}
          {[{ top: '12%', left: '8%' }, { top: '22%', right: '10%' }, { top: '45%', left: '5%' }, { top: '38%', right: '6%' }].map((pos, idx) => (
            <div key={idx} style={{ position: 'absolute', ...pos, fontSize: idx % 2 ? '16px' : '20px', color: 'rgba(255,183,3,0.55)', zIndex: 2, pointerEvents: 'none' }}>✦</div>
          ))}

          <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 3 }}>
            {gachaStatus === 'soldout' && (
              <div
                className={isSoldoutReveal ? 'soldout-reveal' : ''}
                style={{
                  position: 'absolute', top: '38%', width: '100%', textAlign: 'center',
                  fontSize: '56px', color: '#ff3366', fontWeight: '900',
                  transform: 'rotate(-6deg)', zIndex: 20,
                  textShadow: `4px 4px 0 #fff, 5px 5px 0 ${POP_OUTLINE}`,
                  WebkitTextStroke: `2px ${POP_OUTLINE}`,
                }}
              >完 売</div>
            )}

            {gachaStatus === 'awakened' && remainingCount > 0 && !currentPrize && (
              <div
                className="awakened-capsule-glow"
                style={{
                  position: 'absolute', bottom: '40px', left: '50%',
                  width: '100px', height: '100px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffd700 50%, #fff 50%)',
                  border: `3px solid ${POP_OUTLINE}`, zIndex: 10,
                  transform: 'translateX(-50%)',
                  transformOrigin: 'center center',
                  animation: isShaking
                    ? 'gashagashaAwakened 0.05s infinite'
                    : 'awakenedCapsulePulse 1.15s ease-in-out infinite',
                }}
              />
            )}

            {gachaStatus === 'playing' && !currentPrize && capsuleStyles.map((style, i) => {
              if (i >= remainingCount) return null;
              const color = CAPSULE_COLORS[style.colorIdx];
              const capAnim = isShaking
                ? `${i % 2 === 0 ? 'guruguruGachaMutedA' : 'guruguruGachaMutedB'} ${style.duration} infinite linear`
                : isBodyThumping
                  ? `gashagashaChaos${style.chaosVariant} 0.12s infinite linear`
                  : `capsuleIdle${style.idleVariant} ${style.idleDuration} ease-in-out infinite`;
              return (
                <div
                  key={i}
                  className="capsule-ball"
                  style={{
                    position: 'absolute', left: style.left, bottom: style.bottom, zIndex: style.zIndex,
                    width: `${CAPSULE_SIZE}px`, height: `${CAPSULE_SIZE}px`, borderRadius: '50%',
                    background: `linear-gradient(${130 + (i * 37) % 80}deg, ${color} 52%, rgba(255,255,255,0.95) 52%)`,
                    opacity: style.opacity,
                    boxShadow: '4px 5px 0 rgba(45,52,54,0.18), inset -3px -3px 8px rgba(0,0,0,0.08)',
                    border: `3px solid ${POP_OUTLINE}`,
                    animation: capAnim,
                    animationDelay: style.delay,
                    transformOrigin: 'center center',
                    '--cap-scale': style.scale,
                    '--cap-rotate': style.rotate,
                  }}
                />
              );
            })}
          </div>

          <div style={{
            position: 'absolute', top: '14px', right: '14px',
            background: gachaStatus === 'awakened' ? '#ff007f' : '#ff3366',
            color: '#fff', padding: '5px 12px', borderRadius: '20px',
            fontWeight: '900', fontSize: '13px', lineHeight: 1.2,
            border: `3px solid ${POP_OUTLINE}`,
            boxShadow: '3px 3px 0 rgba(45,52,54,0.2)', zIndex: 25,
            whiteSpace: 'nowrap',
          }}>
            {gachaStatus === 'soldout' ? 'SOLD OUT' : gachaStatus === 'awakened' ? 'LAST: 1個' : `残: ${remainingCount}個`}
          </div>
        </div>

        {/* 下部操作エリア */}
        <div style={{
          width: '100%', flex: 1, position: 'relative',
          padding: '8px 28px 4px 28px', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', gap: '6px', flexWrap: 'nowrap' }}>
            <div style={{
              display: 'flex', gap: '6px',
              background: '#fff', padding: '5px 6px', borderRadius: '16px',
              border: `3px solid ${POP_OUTLINE}`, boxShadow: '3px 3px 0 #bde0fe', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: '#0096c7', color: '#fff', fontSize: '11px', fontWeight: '900', padding: '3px 8px', borderRadius: '8px 8px 0 0', minWidth: '52px', textAlign: 'center', border: `2px solid ${POP_OUTLINE}`, borderBottom: 'none', whiteSpace: 'nowrap', lineHeight: 1.3 }}>100円玉</div>
                <div style={{ background: '#fff', color: '#0096c7', fontSize: '18px', fontWeight: '900', padding: '2px 8px', borderRadius: '0 0 8px 8px', minWidth: '52px', textAlign: 'center', border: `2px solid ${POP_OUTLINE}`, borderTop: 'none', lineHeight: 1.2 }}>2 枚</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: '#ff3366', color: '#fff', fontSize: '11px', fontWeight: '900', padding: '3px 8px', borderRadius: '8px 8px 0 0', minWidth: '52px', textAlign: 'center', border: `2px solid ${POP_OUTLINE}`, borderBottom: 'none', whiteSpace: 'nowrap', lineHeight: 1.3 }}>10円玉</div>
                <div style={{ background: '#fff', color: '#ff3366', fontSize: '18px', fontWeight: '900', padding: '2px 8px', borderRadius: '0 0 8px 8px', minWidth: '52px', textAlign: 'center', border: `2px solid ${POP_OUTLINE}`, borderTop: 'none', lineHeight: 1.2 }}>0 枚</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '11px', fontWeight: '900', color: POP_OUTLINE }}>投入口</span>
                <div style={{
                  width: '44px', height: '44px',
                  background: 'linear-gradient(145deg, #adb5bd, #6c757d)',
                  borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
                  boxShadow: 'inset 0 5px 10px rgba(0,0,0,0.45), 3px 3px 0 rgba(45,52,54,0.2)',
                  border: `3px solid ${POP_OUTLINE}`
                }}>
                  <div style={{ width: '7px', height: '22px', background: POP_OUTLINE, borderRadius: '3px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '11px', fontWeight: '900', color: POP_OUTLINE }}>返却</span>
                <div style={{
                  width: '36px', height: '36px', background: '#0096c7', borderRadius: '50%',
                  color: '#fff', fontSize: '12px', fontWeight: '900',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  boxShadow: '3px 3px 0 rgba(45,52,54,0.25)', border: `3px solid ${POP_OUTLINE}`
                }}>
                  按
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0' }}>
            <div style={{
              width: `${HANDLE_DIAL_SIZE}px`, height: `${HANDLE_DIAL_SIZE}px`,
              background: '#fff', borderRadius: '50%',
              border: gachaStatus === 'awakened' ? `${HANDLE_RING_BORDER}px solid #ff007f` : `${HANDLE_RING_BORDER}px solid #0096c7`,
              boxShadow: gachaStatus === 'awakened'
                ? '0 10px 25px rgba(255,0,127,0.35), 4px 4px 0 rgba(45,52,54,0.15)'
                : '0 10px 22px rgba(0,0,0,0.15), 4px 4px 0 rgba(45,52,54,0.15), inset 0 4px 8px rgba(0,0,0,0.1)',
              display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative',
              transition: 'border-color 0.5s ease',
              boxSizing: 'border-box',
            }}>
              {RING_TURN_ARROWS.map(({ key, style, rotation }) => (
                <div
                  key={key}
                  style={{
                    position: 'absolute',
                    zIndex: 5,
                    width: `${TURN_ARROW_SIZE}px`,
                    height: `${TURN_ARROW_SIZE}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    ...style,
                  }}
                >
                  <TurnArrow color={gachaStatus === 'awakened' ? '#fff' : '#ffd100'} rotation={rotation} />
                </div>
              ))}

              <div
                ref={dialRef} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}
                style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  transform: `rotate(${dialRotation}deg)`,
                  transition: isDragging.current ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  cursor: (gachaStatus === 'error' || gachaStatus === 'soldout' || isBodyThumping || isAwakeningFx) ? 'not-allowed' : 'grab',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2,
                  touchAction: 'none',
                }}
              >
                <div style={{
                  width: `${HANDLE_BAR_W}px`, height: `${HANDLE_BAR_H}px`,
                  background: '#fff', borderRadius: '16px',
                  boxShadow: '0 8px 14px rgba(0,0,0,0.18), inset 0 -5px 0 #e2e8f0, 3px 3px 0 rgba(45,52,54,0.12)',
                  border: gachaStatus === 'awakened' ? `3px solid #ff007f` : `3px solid ${POP_OUTLINE}`,
                  position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0 16px', boxSizing: 'border-box'
                }}>
                  <HandleArrow color="#ffd100" direction="left" width={26} height={17} />
                  <HandleArrow color="#ffd100" direction="right" width={26} height={17} />
                </div>
              </div>
            </div>
            <p style={{
              fontSize: '12px', color: POP_OUTLINE, marginTop: '5px', fontWeight: '900',
              background: '#fff', padding: '6px 12px', borderRadius: '14px',
              border: `2px solid ${POP_OUTLINE}`, boxShadow: '2px 2px 0 #ffb3c6',
              lineHeight: 1.45, textAlign: 'center', maxWidth: '100%', boxSizing: 'border-box',
            }}>
              {isBodyThumping ? 'ガシャコン！演出中...' : gachaStatus === 'awakened' ? '⚡️ ラストワン賞を回して取り出してください！' : 'ハンドルを右方向にくるっと 1 周まわしてね'}
            </p>
          </div>

          <div style={{ width: '100%', display: 'flex', position: 'relative', height: '118px' }}>
            <div style={{
              position: 'absolute', left: '8px', bottom: '0',
              width: '118px', height: '118px',
              background: '#495057', borderRadius: '50%',
              border: `6px solid ${POP_OUTLINE}`,
              boxShadow: 'inset 0 10px 25px rgba(0,0,0,0.85), 4px 4px 0 #bde0fe',
              display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: 0, width: '100%', height: '85%',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.12))',
                borderBottom: '2px solid rgba(255,255,255,0.25)', zIndex: 3, pointerEvents: 'none'
              }} />

              {currentPrize && isCapsuleVisible && dispensedCapsule && revealPhase !== 'wobble' && revealPhase !== 'opening' && (
                <RoundCapsule
                  color={dispensedCapsule.color}
                  gradientAngle={dispensedCapsule.gradientAngle}
                  size={72}
                  style={{ zIndex: 2, animation: 'dropCapsule 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' }}
                />
              )}
            </div>
          </div>

        </div>
        </div>
        </div>
      </div>
      </div>

      {/* --- 【景品ポップアップモーダル】 --- */}
      {currentPrize && isCapsuleVisible && !isBodyThumping && (
        <div
          className={`reveal-modal${revealPhase === 'zoom' ? ' reveal-modal--zoom' : ''}${revealPhase === 'wobble' || revealPhase === 'opening' ? ' reveal-modal--hatch' : ''}`}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh',
            background: revealPhase === 'zoom'
              ? 'rgba(12, 8, 24, 0.45)'
              : 'rgba(255, 240, 248, 0.94)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 50,
            opacity: revealPhase || isCapsulePopped ? 1 : 0,
            pointerEvents: isCapsulePopped ? 'auto' : 'none',
            transition: revealPhase === 'zoom' ? 'opacity 0.35s ease, background 0.5s ease' : 'opacity 0.3s ease, background 0.4s ease',
            padding: '16px', boxSizing: 'border-box', overflowY: 'auto',
          }}
        >
          {revealPhase === 'zoom' && (
            <div className="reveal-vignette" aria-hidden="true" />
          )}

          {(revealPhase === 'wobble' || revealPhase === 'opening') && dispensedCapsule && (
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                transform: `scale(${popupScale})`,
                transformOrigin: 'center center',
                position: 'relative', zIndex: 56,
              }}
            >
              {revealPhase === 'wobble' && (
                <RoundCapsule
                  color={dispensedCapsule.color}
                  gradientAngle={dispensedCapsule.gradientAngle}
                  size={Math.round(88 + popupScale * 16)}
                  style={{ animation: 'capsuleMoveToCenter 0.55s ease-out forwards, capsuleEggWobble 0.13s ease-in-out 0.55s infinite' }}
                />
              )}
              {revealPhase === 'opening' && (
                <SplittingCapsule
                  color={dispensedCapsule.color}
                  size={Math.round(88 + popupScale * 16)}
                  isOpening
                />
              )}
            </div>
          )}

          {showConfetti && isCapsulePopped && (
            <ConfettiBurst
              awakened={gachaStatus === 'awakened'}
              count={gachaStatus === 'awakened' ? 42 : 28}
            />
          )}
          {isCapsulePopped && dispensedCapsule && (
            <div style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              animation: gachaStatus === 'awakened' ? 'fadeIn 0.7s ease forwards' : 'fadeIn 0.5s ease forwards',
              width: '100%', maxWidth: '520px',
              transform: `scale(${popupScale})`,
              transformOrigin: 'center center',
              position: 'relative',
              zIndex: 56,
            }}>
              <div
                className={`prize-rays${gachaStatus === 'awakened' ? ' prize-rays--awakened' : ''}`}
                aria-hidden="true"
              />
              <h1
                className={`prize-popup-title${gachaStatus === 'awakened' ? ' prize-popup-title--long prize-popup-title--awakened' : ''}`}
                style={{
                  color: gachaStatus === 'awakened' ? '#ff007f' : dispensedCapsule.color,
                  textShadow: `3px 3px 0 #fff, 4px 4px 0 ${POP_OUTLINE}`,
                }}
              >
                {gachaStatus === 'awakened' ? '✨ 20歳の誕生日おめでとう ✨' : '🎉 カプセルをあけました！'}
              </h1>
              <div
                className={`prize-card-glow${gachaStatus === 'awakened' ? ' prize-card-glow--awakened' : ''}`}
                style={{
                  background: '#fff', color: POP_OUTLINE,
                  padding: 'clamp(20px, 5vw, 44px) clamp(16px, 5vw, 56px)',
                  borderRadius: '28px',
                  fontSize: 'clamp(22px, 6vw, 44px)', fontWeight: '900', lineHeight: 1.3,
                  border: gachaStatus === 'awakened' ? '5px solid #ff007f' : `5px solid ${POP_OUTLINE}`,
                  boxShadow: gachaStatus === 'awakened' ? '0 20px 0 #ffb3c6, 0 30px 50px rgba(255,0,127,0.25)' : '0 20px 0 #bde0fe, 0 30px 50px rgba(45,52,54,0.2)',
                  textAlign: 'center', width: '100%', maxWidth: '100%', boxSizing: 'border-box',
                  wordBreak: 'break-word',
                  ...(gachaStatus !== 'awakened'
                    ? { animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }
                    : {}),
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {currentPrize}
              </div>
              <button onClick={nextGacha} style={{
                marginTop: 'clamp(24px, 5vw, 40px)',
                padding: 'clamp(12px, 3vw, 16px) clamp(28px, 8vw, 52px)',
                fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: '900',
                background: gachaStatus === 'awakened' ? '#ff007f' : '#0096c7', color: '#fff',
                border: `4px solid ${POP_OUTLINE}`, borderRadius: '20px', cursor: 'pointer',
                boxShadow: '4px 4px 0 rgba(45,52,54,0.25)', fontFamily: POP_FONT,
                whiteSpace: 'nowrap',
                position: 'relative',
                zIndex: 1,
              }}>
                {gachaStatus === 'awakened' ? '全ての演出を終了する' : '次のカプセルへ ➔'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* スタイルCSS */}
      <style>{`
        .bodyThump { animation: bodyThumpAnim 0.05s infinite alternate; }
        @keyframes bodyThumpAnim { 0% { transform: translate(2px, 0) rotate(0.2deg); } 100% { transform: translate(-2px, 0) rotate(-0.2deg); } }
        .machine-dispense-zoom-inner {
          animation: machineDispenseZoom 1.5s ease-in-out forwards;
          transform-origin: center 38%;
          will-change: transform;
        }
        @keyframes machineDispenseZoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.07); }
          100% { transform: scale(1.035); }
        }
        .reveal-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at 50% 42%, transparent 8%, rgba(0,0,0,0.55) 72%);
          animation: revealVignetteClose 1.1s ease-in forwards;
        }
        @keyframes revealVignetteClose {
          0% { opacity: 0; transform: scale(1.12); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes capsuleMoveToCenter {
          0% { transform: translateY(48px) scale(0.55); opacity: 0.5; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes capsuleEggWobble {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          15% { transform: rotate(-5deg) translateX(-4px); }
          30% { transform: rotate(5deg) translateX(4px); }
          45% { transform: rotate(-4deg) translateX(-3px); }
          60% { transform: rotate(4deg) translateX(3px); }
          75% { transform: rotate(-3deg) translateX(-2px); }
          90% { transform: rotate(3deg) translateX(2px); }
        }
        .capsule-split-stage--open .capsule-split-half--left {
          animation: capsuleHalfLeftOpen 0.52s cubic-bezier(0.34, 1.35, 0.64, 1) forwards;
        }
        .capsule-split-stage--open .capsule-split-half--right {
          animation: capsuleHalfRightOpen 0.52s cubic-bezier(0.34, 1.35, 0.64, 1) forwards;
        }
        @keyframes capsuleHalfLeftOpen {
          0% { transform: translateX(0) rotate(0deg); }
          35% { transform: translateX(-6px) rotate(-8deg) scale(1.02); }
          100% { transform: translateX(-24px) rotate(-18deg); }
        }
        @keyframes capsuleHalfRightOpen {
          0% { transform: translateX(0) rotate(0deg); }
          35% { transform: translateX(6px) rotate(8deg) scale(1.02); }
          100% { transform: translateX(24px) rotate(18deg); }
        }
        @keyframes prizeRevealIn {
          0% { opacity: 0; transform: scale(0.88); }
          100% { opacity: 1; transform: scale(1); }
        }
        .smokeCloud { position: absolute; background: rgba(255, 220, 240, 0.9); border-radius: 50%; filter: blur(15px); animation: smokeExplode 0.6s ease-out forwards; opacity: 0; }
        @keyframes smokeExplode { 0% { transform: scale(0.2); opacity: 0; } 40% { opacity: 0.9; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes guruguruGachaMutedA { 0% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(55px, -42px) rotate(90deg); } 50% { transform: translate(-38px, -72px) rotate(180deg); } 75% { transform: translate(-55px, -28px) rotate(270deg); } 100% { transform: translate(0, 0) rotate(360deg); } }
        @keyframes guruguruGachaMutedB { 0% { transform: translate(0, 0) rotate(0deg); } 30% { transform: translate(-58px, -58px) rotate(-120deg); } 65% { transform: translate(48px, -28px) rotate(-240deg); } 85% { transform: translate(14px, -78px) rotate(-300deg); } 100% { transform: translate(0, 0) rotate(-360deg); } }
        @keyframes capsuleIdle1 { 0%, 100% { transform: translate(0, 0) scale(var(--cap-scale)) rotate(calc(var(--cap-rotate) * 1deg)); } 50% { transform: translate(3px, -2px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) + 5) * 1deg)); } }
        @keyframes capsuleIdle2 { 0%, 100% { transform: translate(0, 0) scale(var(--cap-scale)) rotate(calc(var(--cap-rotate) * 1deg)); } 50% { transform: translate(-4px, 2px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) - 7) * 1deg)); } }
        @keyframes capsuleIdle3 { 0%, 100% { transform: translate(0, 0) scale(var(--cap-scale)) rotate(calc(var(--cap-rotate) * 1deg)); } 50% { transform: translate(2px, 3px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) + 9) * 1deg)); } }
        @keyframes capsuleIdle4 { 0%, 100% { transform: translate(0, 0) scale(var(--cap-scale)) rotate(calc(var(--cap-rotate) * 1deg)); } 50% { transform: translate(-3px, -3px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) - 6) * 1deg)); } }
        @keyframes gashagashaChaos1 { 0% { transform: translate(0, 0) scale(var(--cap-scale)) rotate(calc(var(--cap-rotate) * 1deg)); } 25% { transform: translate(14px, -10px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) + 22) * 1deg)); } 50% { transform: translate(-12px, -6px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) - 18) * 1deg)); } 75% { transform: translate(8px, 12px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) + 14) * 1deg)); } 100% { transform: translate(0, 0) scale(var(--cap-scale)) rotate(calc(var(--cap-rotate) * 1deg)); } }
        @keyframes gashagashaChaos2 { 0% { transform: translate(0, 0) scale(var(--cap-scale)) rotate(calc(var(--cap-rotate) * 1deg)); } 25% { transform: translate(-16px, -8px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) - 25) * 1deg)); } 50% { transform: translate(10px, -14px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) + 16) * 1deg)); } 75% { transform: translate(-6px, 10px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) - 12) * 1deg)); } 100% { transform: translate(0, 0) scale(var(--cap-scale)) rotate(calc(var(--cap-rotate) * 1deg)); } }
        @keyframes gashagashaChaos3 { 0% { transform: translate(0, 0) scale(var(--cap-scale)) rotate(calc(var(--cap-rotate) * 1deg)); } 25% { transform: translate(11px, 9px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) + 20) * 1deg)); } 50% { transform: translate(-14px, -12px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) - 20) * 1deg)); } 75% { transform: translate(6px, -9px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) + 10) * 1deg)); } 100% { transform: translate(0, 0) scale(var(--cap-scale)) rotate(calc(var(--cap-rotate) * 1deg)); } }
        @keyframes gashagashaChaos4 { 0% { transform: translate(0, 0) scale(var(--cap-scale)) rotate(calc(var(--cap-rotate) * 1deg)); } 25% { transform: translate(-9px, 13px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) - 15) * 1deg)); } 50% { transform: translate(15px, -7px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) + 24) * 1deg)); } 75% { transform: translate(-11px, -11px) scale(var(--cap-scale)) rotate(calc((var(--cap-rotate) - 8) * 1deg)); } 100% { transform: translate(0, 0) scale(var(--cap-scale)) rotate(calc(var(--cap-rotate) * 1deg)); } }
        @keyframes gashagasha { 0% { transform: translate(1px, 1px) rotate(0deg); } 50% { transform: translate(-1px, -1px) rotate(0.15deg); } 100% { transform: translate(1px, -1px) rotate(-0.15deg); } }
        @keyframes gashagashaAwakened {
          0% { transform: translateX(calc(-50% + 1px)) translateY(1px) rotate(0deg); }
          50% { transform: translateX(calc(-50% - 1px)) translateY(-1px) rotate(0.15deg); }
          100% { transform: translateX(calc(-50% + 1px)) translateY(-1px) rotate(-0.15deg); }
        }
        @keyframes awakenedCapsulePulse {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            box-shadow: 0 0 28px rgba(255, 215, 0, 0.75), 0 0 56px rgba(255, 0, 127, 0.35), 4px 4px 0 rgba(45,52,54,0.3);
          }
          50% {
            transform: translateX(-50%) scale(1.06);
            box-shadow: 0 0 42px rgba(255, 215, 0, 0.95), 0 0 72px rgba(255, 0, 127, 0.5), 4px 4px 0 rgba(45,52,54,0.3);
          }
        }
        .awakened-capsule-glow {
          will-change: transform, box-shadow;
        }
        @keyframes dropCapsule { 0% { transform: translateY(-70px) scale(0.3); opacity: 0; } 50% { transform: translateY(0) scale(1.1); } 75% { transform: translateY(-8px) scale(1); } 100% { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes confettiFall {
          0% { transform: translate3d(0, -12vh, 0) rotate(var(--confetti-rotate)); opacity: 1; }
          100% { transform: translate3d(var(--confetti-drift), 110vh, 0) rotate(calc(var(--confetti-rotate) + 480deg)); opacity: 0.85; }
        }
        .confetti-piece {
          position: absolute;
          top: -8%;
          display: block;
          pointer-events: none;
          animation-name: confettiFall;
          animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
          animation-fill-mode: forwards;
        }
        .prize-rays {
          position: absolute;
          width: min(420px, 90vw);
          height: min(420px, 90vw);
          left: 50%;
          top: 42%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.2) 28%, transparent 62%);
          animation: prizeRaysPulse 1.2s ease-out forwards;
        }
        .prize-rays--awakened {
          background: radial-gradient(circle, rgba(255,215,0,0.75) 0%, rgba(255,0,127,0.28) 32%, transparent 65%);
          animation: prizeRaysPulseAwakened 1.6s ease-out forwards;
        }
        @keyframes prizeRaysPulse {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
          40% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1.2); }
        }
        @keyframes prizeRaysPulseAwakened {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.35); }
          35% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.35); }
        }
        .prize-card-glow--awakened {
          animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), prizeCardShine 1.8s ease-in-out 0.3s infinite alternate;
        }
        @keyframes prizeCardShine {
          0% { filter: drop-shadow(0 0 0 rgba(255, 215, 0, 0)); }
          100% { filter: drop-shadow(0 0 14px rgba(255, 0, 127, 0.45)); }
        }
        .prize-popup-title--awakened {
          animation: awakenedTitleBob 1.4s ease-in-out infinite;
        }
        @keyframes awakenedTitleBob {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .soldout-reveal {
          animation: soldoutFadeIn 1.1s ease-out both;
        }
        @keyframes soldoutFadeIn {
          0% { opacity: 0; transform: rotate(-6deg) scale(0.85); }
          100% { opacity: 1; transform: rotate(-6deg) scale(1); }
        }
        @keyframes domeAwakenGlow {
          0% { opacity: 0.65; }
          100% { opacity: 1; }
        }
        .prize-popup-title {
          margin: 8px 0;
          font-weight: 900;
          line-height: 1.15;
          text-align: center;
          white-space: nowrap;
          width: max-content;
          max-width: 100%;
          font-size: clamp(30px, 3.2vw, 44px);
          position: relative;
          z-index: 1;
        }
        .prize-popup-title--long {
          font-size: clamp(24px, 2.6vw, 36px);
        }
        @media (max-width: 768px) {
          .prize-popup-title {
            width: 100%;
            font-size: clamp(22px, 7vw, 40px);
          }
          .prize-popup-title--long {
            font-size: clamp(17px, 5.4vw, 30px);
          }
        }
      `}</style>
    </div>
  );
}

export default App;