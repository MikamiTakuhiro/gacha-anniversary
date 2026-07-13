import React, { useState, useEffect, useRef } from 'react';
import { unlockAudio, playMachineRattle, playSmokeSound, playCapsulePop } from './gachaSounds';

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

  const dialRef = useRef(null);
  const gachaContainerRef = useRef(null);
  const isDragging = useRef(false);
  const accumulatedRotation = useRef(0); 
  const lastAngle = useRef(0);

  // 画面リサイズ時にガチャ筐体がぴったり収まるようにスケール調整
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scaleW = w / (MACHINE_W + 20);
      const scaleH = h / (MACHINE_H + 20);
      const minScale = Math.min(scaleW, scaleH);
      setScale(Math.min(1, minScale));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    if (!isCapsulePopped) return;
    playCapsulePop();
  }, [isCapsulePopped]);

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

  // 【完全修復】隠しコマンドのタイピング入力をリアルタイムで裏監視する処理
  useEffect(() => {
    if (gachaStatus !== 'error' || !loadedConfig) return;

    const handleKeyDown = (e) => {
      // 押されたキー文字を1つずつ結合していく
      setCommandInput(prev => {
        const nextInput = prev + e.key;
        
        // 設定された隠しコマンド（誕生日など）が含まれているか判定
        if (nextInput.includes(loadedConfig.secretCommand)) {
          setGachaStatus('awakened'); // 【覚醒モード起動】
          setRemainingCount(1); // ラスト確定の黄金カプセルをドームに出現させる
          return ''; // 入力バッファをクリア
        }
        
        // 長くなりすぎないように最新の20文字だけ残す
        return nextInput.slice(-20);
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gachaStatus, loadedConfig]);

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
    if (currentPrize || isBodyThumping || gachaStatus === 'error' || gachaStatus === 'soldout') return;
    unlockAudio();
    isDragging.current = true;
    lastAngle.current = getAngle(e.clientX, e.clientY);
    accumulatedRotation.current = 0;
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
    if (currentPrize || isBodyThumping || gachaStatus === 'error' || gachaStatus === 'soldout') return;
    if (e.cancelable) e.preventDefault();
    unlockAudio();
    isDragging.current = true;
    const touch = e.touches[0];
    lastAngle.current = getAngle(touch.clientX, touch.clientY);
    accumulatedRotation.current = 0;
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
    setIsBodyThumping(true);
    setTimeout(() => {
      setIsBodyThumping(false);
      let prize = '';
      if (gachaStatus === 'awakened') {
        // 覚醒モード時は、設定画面で入れた最後の「超豪華メインギフト」を確定で排出
        prize = loadedConfig.prizes[loadedConfig.prizes.length - 1];
      } else {
        prize = orderedPrizes[orderedPrizes.length - remainingCount];
      }
      const dispensedIndex = remainingCount - 1;
      setDispensedCapsule(buildDispensedCapsule(capsuleStyles, dispensedIndex, gachaStatus === 'awakened'));
      setCurrentPrize(prize);
      setRemainingCount(prev => prev - 1);
      setIsCapsuleVisible(true);

      setTimeout(() => {
        setIsSmokeActive(true);
        setTimeout(() => {
          setIsCapsulePopped(true);
          setIsSmokeActive(false);
        }, 600);
      }, 1200);
    }, 800);
  };

  const nextGacha = () => {
    setCurrentPrize(null);
    setDispensedCapsule(null);
    setIsCapsulePopped(false);
    setIsCapsuleVisible(false);
    setDialRotation(0);
    
    // 【修復】サプライズが有効のときだけ、道中が終わった瞬間にエラー画面へ飛ばす
    if (remainingCount === 0 && gachaStatus === 'playing') {
      if (loadedConfig.isSecretEnabled) {
        setGachaStatus('error'); // エラーロック画面へ
      } else {
        setGachaStatus('soldout'); // 通常モードならそのまま完売
      }
    } else if (remainingCount === 0 && gachaStatus === 'awakened') {
      setGachaStatus('soldout'); // 覚醒後のラストを引いたらフィナーレ
    }
  };

  // --- 画面A: 設定画面 ---
  if (screen === 'config') {
    return (
      <div style={{ padding: '24px 16px', fontFamily: POP_FONT, maxWidth: '650px', margin: '0 auto', backgroundColor: '#fff9fc', color: POP_OUTLINE, boxSizing: 'border-box', border: `4px solid ${POP_OUTLINE}`, borderRadius: '20px', boxShadow: '6px 6px 0 #ffb3c6' }}>
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
    );
  }

  // --- 【システムエラー画面】 ---
  if (gachaStatus === 'error') {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#1c1e22', color: '#ff3b30', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', padding: '20px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: 'clamp(32px, 8vw, 80px)', margin: '0 0 20px 0', borderBottom: '6px solid #ff3b30', paddingBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>⚠️ SYSTEM ERROR</h1>
        <p style={{ fontSize: 'clamp(16px, 4vw, 32px)', textAlign: 'center', maxWidth: '900px', lineHeight: '1.6', background: '#000', padding: '20px 30px', borderRadius: '12px', border: '2px solid #444', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', wordBreak: 'break-all' }}>
          {loadedConfig.errorMsg}
        </p>
        <p style={{ color: '#aaa', marginTop: '40px', fontSize: 'clamp(12px, 3vw, 20px)', letterSpacing: '1px', textAlign: 'center' }}>[管理者権限パスコードをキーボードで入力してください...]</p>
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
        width: `${MACHINE_W}px`, height: `${MACHINE_H}px`,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        flexShrink: 0
      }}>
        <div className={isBodyThumping ? 'bodyThump' : ''} style={{
          width: `${MACHINE_W}px`, height: `${MACHINE_H}px`,
          background: 'linear-gradient(180deg, #fffdf8 0%, #fff5f0 55%, #ffeef5 100%)',
          border: `5px solid ${POP_OUTLINE}`,
          borderRadius: '42px 42px 28px 28px',
          boxShadow: '0 28px 0 #ffb3c6, 0 48px 80px rgba(45,52,54,0.35), inset 0 12px 0 #fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
          boxSizing: 'border-box', padding: '0 0 16px 0',
          willChange: 'transform'
        }}>

        {/* ヘッダー */}
        <div style={{
          width: '100%', height: '88px',
          background: 'linear-gradient(180deg, #ffffff 0%, #fff0f8 100%)',
          borderRadius: '38px 38px 0 0',
          borderBottom: `4px solid ${POP_OUTLINE}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '10px', left: '120px', fontSize: '18px', opacity: 0.35 }}>★</div>
          <div style={{ position: 'absolute', top: '18px', right: '130px', fontSize: '14px', opacity: 0.35 }}>✦</div>
          <div style={{
            background: 'linear-gradient(135deg, #ff3366, #ff6b6b)',
            color: '#fff', fontWeight: '900', fontSize: '19px',
            padding: '9px 18px', borderRadius: '20px',
            border: `3px solid ${POP_OUTLINE}`,
            boxShadow: '3px 3px 0 rgba(45,52,54,0.25)',
            letterSpacing: '0.5px'
          }}>
            takusaki
          </div>
          <div style={{
            color: gachaStatus === 'awakened' ? '#ff007f' : '#0096c7',
            fontWeight: '900', fontSize: '30px', fontStyle: 'italic',
            textShadow: gachaStatus === 'awakened'
              ? '2px 2px 0 #fff, 3px 3px 0 #ff007f, -1px -1px 0 #fff'
              : `2px 2px 0 #fff, 3px 3px 0 ${POP_OUTLINE}, -1px -1px 0 #fff`
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
              <div style={{
                position: 'absolute', top: '38%', width: '100%', textAlign: 'center',
                fontSize: '56px', color: '#ff3366', fontWeight: '900',
                transform: 'rotate(-6deg)', zIndex: 20,
                textShadow: `4px 4px 0 #fff, 5px 5px 0 ${POP_OUTLINE}`,
                WebkitTextStroke: `2px ${POP_OUTLINE}`
              }}>完 売</div>
            )}

            {gachaStatus === 'awakened' && remainingCount > 0 && !currentPrize && (
              <div style={{
                position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffd700 50%, #fff 50%)',
                boxShadow: '0 0 40px #ffd700, 4px 4px 0 rgba(45,52,54,0.3)',
                border: `3px solid ${POP_OUTLINE}`, zIndex: 10,
                animation: isShaking ? 'gashagasha 0.05s infinite' : 'none'
              }} />
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
                    animationDelay: isShaking || isBodyThumping ? style.delay : style.delay,
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
            color: '#fff', padding: '6px 16px', borderRadius: '20px',
            fontWeight: '900', fontSize: '15px',
            border: `3px solid ${POP_OUTLINE}`,
            boxShadow: '3px 3px 0 rgba(45,52,54,0.2)', zIndex: 25
          }}>
            {gachaStatus === 'soldout' ? 'OUT' : gachaStatus === 'awakened' ? 'LAST: 1個' : `残: ${remainingCount}個`}
          </div>
        </div>

        {/* 下部操作エリア */}
        <div style={{
          width: '100%', flex: 1, position: 'relative',
          padding: '8px 28px 4px 28px', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{
              display: 'flex', gap: '8px',
              background: '#fff', padding: '6px 8px', borderRadius: '16px',
              border: `3px solid ${POP_OUTLINE}`, boxShadow: '3px 3px 0 #bde0fe'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: '#0096c7', color: '#fff', fontSize: '12px', fontWeight: '900', padding: '4px 10px', borderRadius: '8px 8px 0 0', width: '58px', textAlign: 'center', border: `2px solid ${POP_OUTLINE}`, borderBottom: 'none' }}>100円玉</div>
                <div style={{ background: '#fff', color: '#0096c7', fontSize: '20px', fontWeight: '900', padding: '2px 10px', borderRadius: '0 0 8px 8px', width: '58px', textAlign: 'center', border: `2px solid ${POP_OUTLINE}`, borderTop: 'none' }}>2 枚</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: '#ff3366', color: '#fff', fontSize: '12px', fontWeight: '900', padding: '4px 10px', borderRadius: '8px 8px 0 0', width: '58px', textAlign: 'center', border: `2px solid ${POP_OUTLINE}`, borderBottom: 'none' }}>10円玉</div>
                <div style={{ background: '#fff', color: '#ff3366', fontSize: '20px', fontWeight: '900', padding: '2px 10px', borderRadius: '0 0 8px 8px', width: '58px', textAlign: 'center', border: `2px solid ${POP_OUTLINE}`, borderTop: 'none' }}>0 枚</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                  cursor: (gachaStatus === 'error' || gachaStatus === 'soldout' || isBodyThumping) ? 'not-allowed' : 'grab',
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
              fontSize: '13px', color: POP_OUTLINE, marginTop: '5px', fontWeight: '900',
              background: '#fff', padding: '5px 14px', borderRadius: '14px',
              border: `2px solid ${POP_OUTLINE}`, boxShadow: '2px 2px 0 #ffb3c6'
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

              {currentPrize && isCapsuleVisible && dispensedCapsule && (
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

      {/* --- 【景品ポップアップモーダル】 --- */}
      {currentPrize && isCapsuleVisible && !isBodyThumping && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(255, 240, 248, 0.94)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 50,
          opacity: isCapsulePopped || isSmokeActive ? 1 : 0,
          pointerEvents: isCapsulePopped ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}>
          {isSmokeActive && (
            <div style={{ position: 'absolute', width: '400px', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 60 }}>
              <div className="smokeCloud" style={{ width: '150px', height: '150px', left: '-50px' }} />
              <div className="smokeCloud" style={{ width: '180px', height: '180px', top: '-40px' }} />
              <div className="smokeCloud" style={{ width: '140px', height: '140px', right: '-40px' }} />
              <div className="smokeCloud" style={{ width: '160px', height: '160px', bottom: '-20px' }} />
            </div>
          )}
          {isCapsulePopped && dispensedCapsule && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.5s ease forwards' }}>
              <OpenedCapsuleHalves color={dispensedCapsule.color} size={96} />
              <h1 style={{
                fontSize: '52px', color: gachaStatus === 'awakened' ? '#ff007f' : dispensedCapsule.color,
                margin: '8px 0', fontWeight: '900',
                textShadow: `3px 3px 0 #fff, 4px 4px 0 ${POP_OUTLINE}`
              }}>
                {gachaStatus === 'awakened' ? '✨ 20歳の誕生日おめでとう ✨' : '🎉 カプセルをあけました！'}
              </h1>
              <div style={{
                background: '#fff', color: POP_OUTLINE, padding: '44px 72px', borderRadius: '28px',
                fontSize: '48px', fontWeight: '900',
                border: gachaStatus === 'awakened' ? '5px solid #ff007f' : `5px solid ${POP_OUTLINE}`,
                boxShadow: gachaStatus === 'awakened' ? '0 20px 0 #ffb3c6, 0 30px 50px rgba(255,0,127,0.25)' : '0 20px 0 #bde0fe, 0 30px 50px rgba(45,52,54,0.2)',
                textAlign: 'center', maxWidth: '85%',
                animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}>
                {currentPrize}
              </div>
              <button onClick={nextGacha} style={{
                marginTop: '40px', padding: '16px 52px', fontSize: '22px', fontWeight: '900',
                background: gachaStatus === 'awakened' ? '#ff007f' : '#0096c7', color: '#fff',
                border: `4px solid ${POP_OUTLINE}`, borderRadius: '20px', cursor: 'pointer',
                boxShadow: '4px 4px 0 rgba(45,52,54,0.25)', fontFamily: POP_FONT
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
        @keyframes bodyThumpAnim { 0% { transform: translate(2px, 2px) rotate(0.2deg); } 100% { transform: translate(-2px, -2px) rotate(-0.2deg); } }
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
        @keyframes dropCapsule { 0% { transform: translateY(-70px) scale(0.3); opacity: 0; } 50% { transform: translateY(0) scale(1.1); } 75% { transform: translateY(-8px) scale(1); } 100% { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

export default App;