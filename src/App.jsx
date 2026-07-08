import React, { useState, useEffect, useRef } from 'react';
import { unlockAudio, playMachineRattle, playSmokeSound, playCapsulePop } from './gachaSounds';

const HANDLE_RING_BORDER = 40;
const TURN_ARROW_SIZE = 36;

const TurnArrow = ({ color = '#ffd100', rotation = 0, size = TURN_ARROW_SIZE }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    aria-hidden="true"
    style={{
      transform: `rotate(${rotation}deg)`,
      filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))',
      display: 'block',
      overflow: 'visible',
    }}
  >
    <path
      d="M 6 15.5 H 21.5 V 11 L 30 18 L 21.5 25 V 20.5 H 6 Z"
      fill={color}
    />
  </svg>
);

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
  { key: 'top', style: { top: `-${HANDLE_RING_BORDER + 2}px`, left: '50%', transform: 'translateX(-50%)' }, rotation: 0 },
  { key: 'right', style: { top: '50%', right: `-${HANDLE_RING_BORDER + 2}px`, transform: 'translateY(-50%)' }, rotation: 90 },
  { key: 'bottom', style: { bottom: `-${HANDLE_RING_BORDER + 2}px`, left: '50%', transform: 'translateX(-50%)' }, rotation: 180 },
  { key: 'left', style: { top: '50%', left: `-${HANDLE_RING_BORDER + 2}px`, transform: 'translateY(-50%)' }, rotation: 270 },
];

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
  const [scale, setScale] = useState(1);

  const dialRef = useRef(null);
  const isDragging = useRef(false);
  const accumulatedRotation = useRef(0); 
  const lastAngle = useRef(0);

  // 画面リサイズ時にガチャ筐体がぴったり収まるようにスケール調整
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scaleW = w / 540;
      const scaleH = h / 900;
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

  useEffect(() => {
    // #region agent log
    if (dialRef.current) {
      const parent = dialRef.current.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(parent);
        fetch('http://127.0.0.1:7714/ingest/e61bfd62-c7cc-41c6-b32e-082bb8f0d4dd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'573413'},body:JSON.stringify({sessionId:'573413',hypothesisId:'C',location:'App.jsx:useEffect:arrows',message:'Parent element dimensions',data:{width:rect.width,height:rect.height,borderWidth:computedStyle.borderWidth,boxSizing:computedStyle.boxSizing},timestamp:Date.now()})}).catch(()=>{});
      }
    }
    // #endregion
  }, []);

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

        const styles = Array(initialCount).fill(0).map((_, i) => {
          const row = Math.floor(i / 5);
          const randomX = 25 + (i % 5) * 82 + (Math.random() * 24 - 12);
          const randomY = 15 + row * 42 + (Math.random() * 12);
          return {
            left: `${Math.max(15, Math.min(380, randomX))}px`,
            bottom: `${randomY}px`,
            scale: 0.85 + Math.random() * 0.25,
            zIndex: Math.floor(Math.random() * 10) + 2,
            opacity: 0.85 + Math.random() * 0.15,
            colorIdx: i % 5,
            rotate: Math.random() * 360,
            delay: `${Math.random() * 0.1}s`,
            duration: `${0.3 + Math.random() * 0.2}s`
          };
        });
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
    // #region agent log
    fetch('http://127.0.0.1:7714/ingest/e61bfd62-c7cc-41c6-b32e-082bb8f0d4dd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'573413'},body:JSON.stringify({sessionId:'573413',hypothesisId:'B',location:'App.jsx:getAngle',message:'Calculated angle',data:{clientX,clientY,rectTop:rect.top,rectLeft:rect.left,angle},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7714/ingest/e61bfd62-c7cc-41c6-b32e-082bb8f0d4dd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'573413'},body:JSON.stringify({sessionId:'573413',hypothesisId:'A',location:'App.jsx:handleTouchStart',message:'Touch start detected',data:{hasTouches: !!e.touches, touchCount: e.touches?.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (currentPrize || isBodyThumping || gachaStatus === 'error' || gachaStatus === 'soldout') return;
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

    // #region agent log
    fetch('http://127.0.0.1:7714/ingest/e61bfd62-c7cc-41c6-b32e-082bb8f0d4dd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'573413'},body:JSON.stringify({sessionId:'573413',hypothesisId:'B',location:'App.jsx:handleTouchMove',message:'Touch move angle diff',data:{diff,accumulated:accumulatedRotation.current},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7714/ingest/e61bfd62-c7cc-41c6-b32e-082bb8f0d4dd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'573413'},body:JSON.stringify({sessionId:'573413',hypothesisId:'A',location:'App.jsx:handleTouchEnd',message:'Touch end detected',data:{},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
      <div style={{ padding: '24px 16px', fontFamily: '"Arial Rounded MT Bold", "Yu Gothic", sans-serif', maxWidth: '650px', margin: '0 auto', backgroundColor: '#fff', color: '#1e293b', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '3px solid #005ea6', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: '800', color: '#005ea6' }}>Custom Gacha System</h1>
          <p style={{ margin: 0, fontSize: '15px', color: '#64748b', fontWeight: 'bold' }}>オリジナルガチャ作成・管理画面</p>
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
        <button onClick={generateGachaUrl} style={{ width: '100%', padding: '16px', fontSize: '18px', fontWeight: '800', background: '#005ea6', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>🚀 上記の設定でガチャURLを生成する</button>
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

  // --- 画面B: ガチャ本番画面（完全修復・最大化＆凝縮ポップ版） ---
  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100vw', height: '100vh',
        background: '#111317', color: '#2f3542',
        fontFamily: '"Arial Rounded MT Bold", "Comic Sans MS", "Yu Gothic", "丸ゴシック", sans-serif',
        display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', userSelect: 'none'
      }}
    >
      {/* 画面サイズに合わせて全体を伸縮させるためのスケール用ラッパー */}
      <div style={{
        width: '530px', height: '890px',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        flexShrink: 0
      }}>
        <div className={isBodyThumping ? 'bodyThump' : ''} style={{
          width: '530px', height: '890px',
          background: '#f8f9fa', 
          border: '4px solid #cbd5e1', 
          borderRadius: '35px 35px 20px 20px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 10px 0 #fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
          boxSizing: 'border-box', padding: '0 0 20px 0',
          willChange: 'transform'
        }}>
        
        {/* 看板エリア */}
        <div style={{
          width: '100%', height: '85px', background: '#fff',
          borderRadius: '32px 32px 0 0', borderBottom: '4px solid #cbd5e1',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 35px', boxSizing: 'border-box'
        }}>
          <div style={{ background: '#e60012', color: '#fff', fontWeight: 'bold', fontSize: '20px', padding: '8px 16px', borderRadius: '6px', letterSpacing: '0.5px' }}>
            takusaki
          </div>
          {/* 【演出変化】覚醒モードの時はヘッダータイトルもピンクに覚醒 */}
          <div style={{ color: gachaStatus === 'awakened' ? '#ff007f' : '#0066cc', fontWeight: '900', fontSize: '32px', fontStyle: 'italic', textShadow: gachaStatus === 'awakened' ? '0 0 15px rgba(255,0,127,0.3)' : 'none' }}>
            {gachaStatus === 'awakened' ? '20th Awakening' : 'Happy Birthday'}
          </div>
        </div>

        {/* カプセルが超満タンに詰まるクリアドーム窓（最大化：410px） */}
        <div style={{
          width: '470px', height: '410px',
          background: 'linear-gradient(to bottom, rgba(210,230,255,0.45), rgba(255,255,255,0.95))',
          border: '3px solid #94a3b8', borderTop: 'none', borderRadius: '0 0 45px 45px',
          position: 'relative', overflow: 'hidden', marginTop: '10px',
          boxShadow: 'inset 0 15px 25px rgba(0,0,0,0.08), 0 5px 15px rgba(0,0,0,0.05)'
        }}>
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {gachaStatus === 'soldout' && (
              <div style={{ position: 'absolute', top: '40%', width: '100%', textAlign: 'center', fontSize: '48px', color: '#ef4444', fontWeight: 'bold', transform: 'rotate(-8deg)', zIndex: 20, textShadow: '2px 2px 0 #fff' }}>完 売</div>
            )}
            
            {/* 【修復・完全連動】覚醒コマンド入力後に、ドーム中央に黄金カプセルが出現する挙動 */}
            {gachaStatus === 'awakened' && remainingCount > 0 && !currentPrize && (
              <div style={{
                position: 'absolute', bottom: '25px', left: '190px', width: '90px', height: '90px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffd700 50%, #fff 50%)', boxShadow: '0 0 35px #ffd700',
                border: '2px solid #e2e8f0', zIndex: 10,
                animation: isShaking ? 'gashagasha 0.05s infinite' : 'none'
              }} />
            )}
            
            {/* 通常のカプセル山なり配置群 */}
            {gachaStatus === 'playing' && !currentPrize && capsuleStyles.map((style, i) => {
              if (i >= remainingCount) return null;
              return (
                <div 
                  key={i} 
                  style={{
                    position: 'absolute', left: style.left, bottom: style.bottom, zIndex: style.zIndex,
                    width: '66px', height: '66px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${['#ff4757','#2ed573','#1e90ff','#ffa502','#9b51e0'][style.colorIdx]} 50%, rgba(255,255,255,0.85) 50%)`,
                    transform: `scale(${style.scale}) rotate(${style.rotate}deg)`,
                    opacity: style.opacity,
                    boxShadow: '0 6px 12px rgba(0,0,0,0.15), inset -2px -2px 6px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    animation: isShaking 
                      ? `${i % 2 === 0 ? 'guruguruGachaMutedA' : 'guruguruGachaMutedB'} ${style.duration} infinite linear` 
                      : isBodyThumping ? 'gashagasha 0.05s infinite' : 'none',
                    animationDelay: isShaking ? style.delay : '0s',
                    transformOrigin: 'center center'
                  }} 
                />
              );
            })}
          </div>
          <div style={{
            position: 'absolute', top: '15px', right: '15px',
            background: gachaStatus === 'awakened' ? '#ff007f' : '#ff4757', color: '#fff', padding: '5px 14px', borderRadius: '15px',
            fontWeight: 'bold', fontSize: '15px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', zIndex: 25
          }}>
            {gachaStatus === 'soldout' ? 'OUT' : gachaStatus === 'awakened' ? 'LAST: 1個' : `残: ${remainingCount}個`}
          </div>
        </div>

        {/* 下部メカニカルパネル（パーツをギュッと凝縮配置） */}
        <div style={{ width: '100%', flex: 1, position: 'relative', padding: '10px 35px 5px 35px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          {/* コイン投入口エリア */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', gap: '10px', background: '#e2e8f0', padding: '6px', borderRadius: '10px', border: '2px solid #cbd5e1' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: '#005ea6', color: '#fff', fontSize: '13px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '5px 5px 0 0', width: '55px', textAlign: 'center' }}>100円玉</div>
                <div style={{ background: '#fff', color: '#005ea6', fontSize: '20px', fontWeight: '900', padding: '2px 10px', borderRadius: '0 0 5px 5px', width: '55px', textAlign: 'center', border: '2px solid #005ea6', borderTop: 'none' }}>3 枚</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: '#e60012', color: '#fff', fontSize: '13px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '5px 5px 0 0', width: '55px', textAlign: 'center' }}>10円玉</div>
                <div style={{ background: '#fff', color: '#e60012', fontSize: '20px', fontWeight: '900', padding: '2px 10px', borderRadius: '0 0 5px 5px', width: '55px', textAlign: 'center', border: '2px solid #e60012', borderTop: 'none' }}>0 枚</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>投入口</span>
                <div style={{ width: '42px', height: '42px', background: '#94a3b8', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.5)', border: '3px solid #fff' }}>
                  <div style={{ width: '6px', height: '24px', background: '#1e293b', borderRadius: '2px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>返却</span>
                <div style={{ width: '32px', height: '32px', background: '#005ea6', borderRadius: '50%', color: '#fff', fontSize: '12px', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', border: '2px solid #fff' }}>
                  按
                </div>
              </div>
            </div>
          </div>

          {/* 実機ハンドル（極太リング ＆ 回転方向を示す矢印） */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2px 0' }}>
            <div style={{
              width: '210px', height: '210px',
              background: '#fff', borderRadius: '50%',
              border: gachaStatus === 'awakened' ? `${HANDLE_RING_BORDER}px solid #ff007f` : `${HANDLE_RING_BORDER}px solid #005ea6`,
              boxShadow: gachaStatus === 'awakened' ? '0 10px 25px rgba(255,0,127,0.3)' : '0 10px 22px rgba(0,0,0,0.18), inset 0 4px 8px rgba(0,0,0,0.15)',
              display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative',
              transition: 'border-color 0.5s ease',
              boxSizing: 'border-box',
            }}>
              
              {/* 時計回りの回転方向を示す矢印 */}
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

              {/* 回転する持ち手 */}
              <div 
                ref={dialRef} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}
                style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  transform: `rotate(${dialRotation}deg)`,
                  transition: isDragging.current ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  cursor: (gachaStatus === 'error' || gachaStatus === 'soldout' || isBodyThumping) ? 'not-allowed' : 'grab',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2
                }}
              >
                <div style={{
                  width: '120px', height: '46px',
                  background: '#fff', borderRadius: '12px',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.2), inset 0 -5px 0 #cbd5e1',
                  border: gachaStatus === 'awakened' ? '3px solid #ff007f' : '3px solid #94a3b8',
                  position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 14px', boxSizing: 'border-box'
                }}>
                  <HandleArrow color="#ffd100" direction="left" />
                  <HandleArrow color="#ffd100" direction="right" />
                </div>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: '#475569', marginTop: '6px', fontWeight: '900' }}>
              {isBodyThumping ? 'ガシャコン！演出中...' : gachaStatus === 'awakened' ? '⚡️ ラストワン賞を回して取り出してください！' : 'ハンドルを右方向にくるっと 1 周まわしてね'}
            </p>
          </div>

          {/* 下段：排出口 */}
          <div style={{ width: '100%', display: 'flex', position: 'relative', height: '135px' }}>
            <div style={{
              position: 'absolute', left: '5px', bottom: '0',
              width: '135px', height: '135px',
              background: '#1e293b', borderRadius: '50%', 
              border: '8px solid #cbd5e1', 
              boxShadow: 'inset 0 10px 25px rgba(0,0,0,0.85), 0 4px 10px rgba(0,0,0,0.2)',
              display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: 0, width: '100%', height: '85%',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.15))',
                borderBottom: '2px solid rgba(255,255,255,0.2)', zIndex: 3, pointerEvents: 'none'
              }} />

              {currentPrize && isCapsuleVisible && (
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: gachaStatus === 'awakened' ? 'linear-gradient(135deg, #ffd700 50%, #fff 50%)' : 'linear-gradient(135deg, #ff4757 50%, rgba(255,255,255,0.9) 50%)',
                  boxShadow: '0 6px 15px rgba(0,0,0,0.6)',
                  zIndex: 2, animation: 'dropCapsule 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
                }} />
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
          background: 'rgba(15, 17, 23, 0.94)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 50,
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
          {isCapsulePopped && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.5s ease forwards' }}>
              <div style={{ display: 'flex', gap: '25px', marginBottom: '20px' }}>
                <div style={{ width: '110px', height: '110px', background: gachaStatus === 'awakened' ? '#ffd700' : '#005ea6', borderRadius: '110px 0 0 110px', transform: 'rotate(-15deg)', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }} />
                <div style={{ width: '110px', height: '110px', background: '#fff', borderRadius: '0 110px 110px 0', transform: 'rotate(15deg)', border: '3px solid #cbd5e1', borderLeft: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }} />
              </div>
              <h1 style={{ fontSize: '64px', color: gachaStatus === 'awakened' ? '#ffd700' : '#005ea6', margin: '10px 0', fontWeight: '900' }}>
                {gachaStatus === 'awakened' ? '✨ 20歳の誕生日おめでとう ✨' : '🎉 カプセルをあけました！'}
              </h1>
              <div style={{
                background: '#fff', color: '#1e293b', padding: '50px 90px', borderRadius: '24px',
                fontSize: '56px', fontWeight: 'bold', border: gachaStatus === 'awakened' ? '6px solid #ff007f' : '6px solid #005ea6',
                boxShadow: gachaStatus === 'awakened' ? '0 30px 60px rgba(255,0,127,0.4)' : '0 30px 60px rgba(0,0,0,0.4)', textAlign: 'center', maxWidth: '85%',
                animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}>
                {currentPrize}
              </div>
              <button onClick={nextGacha} style={{ marginTop: '50px', padding: '18px 60px', fontSize: '24px', fontWeight: 'bold', background: gachaStatus === 'awakened' ? '#ff007f' : '#005ea6', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 6px 15px rgba(0,94,166,0.3)' }}>
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
        .smokeCloud { position: absolute; background: rgba(220, 225, 235, 0.85); border-radius: 50%; filter: blur(15px); animation: smokeExplode 0.6s ease-out forwards; opacity: 0; }
        @keyframes smokeExplode { 0% { transform: scale(0.2); opacity: 0; } 40% { opacity: 0.9; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes guruguruGachaMutedA { 0% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(45px, -35px) rotate(90deg); } 50% { transform: translate(-30px, -60px) rotate(180deg); } 75% { transform: translate(-45px, -20px) rotate(270deg); } 100% { transform: translate(0, 0) rotate(360deg); } }
        @keyframes guruguruGachaMutedB { 0% { transform: translate(0, 0) rotate(0deg); } 30% { transform: translate(-50px, -50px) rotate(-120deg); } 65% { transform: translate(40px, -20px) rotate(-240deg); } 85% { transform: translate(10px, -65px) rotate(-300deg); } 100% { transform: translate(0, 0) rotate(-360deg); } }
        @keyframes gashagasha { 0% { transform: translate(1px, 1px) rotate(0deg); } 50% { transform: translate(-1px, -1px) rotate(0.15deg); } 100% { transform: translate(1px, -1px) rotate(-0.15deg); } }
        @keyframes dropCapsule { 0% { transform: translateY(-70px) scale(0.3); opacity: 0; } 50% { transform: translateY(0) scale(1.1); } 75% { transform: translateY(-8px) scale(1); } 100% { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

export default App;