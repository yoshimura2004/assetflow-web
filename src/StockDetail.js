import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// [컴포넌트 임포트] 헤더 구성을 위해 필요
import LanguageSwitcher from './components/LanguageSwitcher';
import SearchBar from './components/SearchBar';
import TradingViewWidget from './components/TradingViewWidget';

// [API 키] Finnhub
const FINNHUB_KEY = 'd5s5631r01qoo9r2mnp0d5s5631r01qoo9r2mnpg';

function StockDetail() {
  const { t, i18n } = useTranslation();
  const { symbol } = useParams();
  const navigate = useNavigate();
  const container = useRef();
  
  const decodedSymbol = decodeURIComponent(symbol);

  // --- 사용자 정보 가져오기 (헤더용) ---
  const userName = localStorage.getItem('userName') || "Investor";
  const userPicture = localStorage.getItem('userPicture');

  // --- 상태 관리 ---
  const [currentPrice, setCurrentPrice] = useState(null);
  const [mode, setMode] = useState('BUY'); 
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState(''); 

  const [myAssets, setMyAssets] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  const [myCash, setMyCash] = useState(0); 
  const [myStock, setMyStock] = useState(null); 

  // --- [Effect 1] 차트 위젯 생성 ---
  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = ""; 
      const chartLocale = i18n.language === 'ko' ? 'kr' : (i18n.language === 'ja' ? 'ja' : 'en');
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "width": "100%",
        "height": "100%", 
        "symbol": decodedSymbol,
        "style": "1", 
        "hide_top_toolbar": false, 
        "interval": "D", 
        "timezone": "Asia/Tokyo",
        "theme": "light",
        "locale": chartLocale,
        "enable_publishing": false,
        "allow_symbol_change": true, 
        "hide_side_toolbar": false, 
        "save_image": false,
        "calendar": false,
        "support_host": "https://www.tradingview.com"
      });
      container.current.appendChild(script);
    }
  }, [decodedSymbol, i18n.language]);

  // --- [Effect 2] 자산 데이터 및 시세 조회 ---
  useEffect(() => {
    loadUserData();
    fetchCurrentPrice(decodedSymbol);
  }, [decodedSymbol]);

  const loadUserData = () => {
    const assets = JSON.parse(localStorage.getItem('my_assets')) || [];
    const history = JSON.parse(localStorage.getItem('my_history')) || [];
    setMyAssets(assets);
    setMyHistory(history);

    const cashAsset = assets.find(a => a.category === 'CASH' && a.symbol === 'USD');
    setMyCash(cashAsset ? cashAsset.quantity : 0);

    const stockAsset = assets.find(a => a.symbol === decodedSymbol);
    setMyStock(stockAsset || null);
  };

  const fetchCurrentPrice = async (ticker) => {
    if (!ticker) return;
    if (ticker.includes('BTC')) {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await res.json();
        if (data.bitcoin) {
          setCurrentPrice(data.bitcoin.usd);
          setPrice(data.bitcoin.usd); 
        }
      } catch (e) { console.error(e); }
    } else {
      try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
        const data = await res.json();
        if (data.c) {
          setCurrentPrice(data.c);
          setPrice(data.c); 
        }
      } catch (e) { console.error(e); }
    }
  };

  const calculateSim = () => {
    if (!quantity || !price) return null;
    const qty = parseFloat(quantity);
    const prc = parseFloat(price);
    const totalAmt = qty * prc;

    if (mode === 'BUY') {
      const currentQty = myStock ? myStock.quantity : 0;
      const currentAvg = myStock ? myStock.avgPrice : 0;
      const newAvg = ((currentQty * currentAvg) + totalAmt) / (currentQty + qty);
      return { type: 'BUY', total: totalAmt, newAvg };
    } else {
      const currentAvg = myStock ? myStock.avgPrice : 0;
      const profit = (prc - currentAvg) * qty;
      const profitRate = currentAvg > 0 ? (profit / (currentAvg * qty)) * 100 : 0;
      return { type: 'SELL', total: totalAmt, profit, profitRate };
    }
  };

  const sim = calculateSim();

  const handleTrade = () => {
    if (!quantity || parseFloat(quantity) <= 0) return alert(t('msg_no_qty'));
    if (!price || parseFloat(price) <= 0) return alert(t('msg_no_price'));

    const qty = parseFloat(quantity);
    const prc = parseFloat(price);
    const tradeAmount = qty * prc;

    let updatedAssets = [...myAssets];
    let updatedHistory = [...myHistory];

    if (mode === 'BUY') {
      if (myCash < tradeAmount) return alert(`${t('msg_no_cash')} (USD ${myCash.toFixed(2)})`);

      const usdIndex = updatedAssets.findIndex(a => a.category === 'CASH' && a.symbol === 'USD');
      if (usdIndex !== -1) updatedAssets[usdIndex].quantity -= tradeAmount;

      const stockIndex = updatedAssets.findIndex(a => a.symbol === decodedSymbol);
      if (stockIndex !== -1) {
        const existing = updatedAssets[stockIndex];
        const totalCost = (existing.quantity * existing.avgPrice) + tradeAmount;
        const newQty = existing.quantity + qty;
        updatedAssets[stockIndex] = { ...existing, quantity: newQty, avgPrice: totalCost / newQty, currentPrice: currentPrice };
      } else {
        updatedAssets.push({
          id: Date.now(), assetName: decodedSymbol, symbol: decodedSymbol,
          category: decodedSymbol.includes('BTC') ? 'CRYPTO' : 'STOCK',
          quantity: qty, avgPrice: prc, currentPrice: currentPrice
        });
      }
      
      updatedHistory.push({ id: Date.now(), date: new Date().toISOString(), type: 'BUY', name: decodedSymbol, quantity: qty, price: prc, amount: tradeAmount, profit: null });
      alert(`🎉 ${t('msg_buy_success')}`);
    } else {
      if (!myStock || myStock.quantity < qty) return alert(t('msg_no_stock'));

      const stockIndex = updatedAssets.findIndex(a => a.symbol === decodedSymbol);
      const existing = updatedAssets[stockIndex];
      const profit = (prc - existing.avgPrice) * qty;
      
      updatedAssets[stockIndex] = { ...existing, quantity: existing.quantity - qty };
      if (updatedAssets[stockIndex].quantity === 0) updatedAssets = updatedAssets.filter(a => a.id !== existing.id);

      const usdIndex = updatedAssets.findIndex(a => a.category === 'CASH' && a.symbol === 'USD');
      if (usdIndex !== -1) updatedAssets[usdIndex].quantity += tradeAmount;
      else updatedAssets.push({ id: Date.now()+99, assetName: 'Cash (USD)', symbol: 'USD', category: 'CASH', quantity: tradeAmount, avgPrice: 1, currentPrice: 1 });

      updatedHistory.push({ id: Date.now(), date: new Date().toISOString(), type: 'SELL', name: decodedSymbol, quantity: qty, price: prc, amount: tradeAmount, profit: profit });
      alert(`💰 ${t('msg_sell_success')} (Profit: $${profit.toFixed(2)})`);
    }

    localStorage.setItem('my_assets', JSON.stringify(updatedAssets));
    localStorage.setItem('my_history', JSON.stringify(updatedHistory));
    loadUserData();
    setQuantity('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPicture');
    navigate('/');
  };

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* [1] Global Header (Dashboard와 동일한 디자인) 
        - 로고 클릭 시: 메인(/)으로 이동
        - 검색창: 언제든 다른 종목 검색 가능
        - 우측: 프로필 및 로그아웃
      */}
      <nav style={{ backgroundColor: 'white', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
        {/* 로고 (클릭 시 메인으로) */}
        <div onClick={() => navigate('/')} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          📊 AssetFlow <span style={{ fontSize: '0.9rem', color: '#95a5a6', fontWeight: 'normal' }}>| Trading Room</span>
        </div>
        
        {/* 검색창 */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', margin: '0 20px' }}>
          <SearchBar />
        </div>

        {/* 우측 컨트롤 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {userPicture && <img src={userPicture} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #eee' }} />}
            <span style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '0.95rem' }}>{userName}</span>
          </div>
          <div style={{ width: '1px', height: '20px', backgroundColor: '#e0e0e0', margin: '0 5px' }}></div>
          <LanguageSwitcher />
          <button onClick={handleLogout} style={logoutBtnStyle}>{t('logout')}</button>
        </div>
      </nav>

      {/* [2] 서브 헤더 (종목명 & 뒤로가기) */}
      <div style={{ padding: '15px 30px', backgroundColor: '#fff', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {decodedSymbol} <span style={{fontSize:'1rem', color:'#7f8c8d', fontWeight:'normal'}}>Detail Chart</span>
        </h2>
        {/* 우측 상단 버튼: 대시보드로 이동 */}
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ padding: '8px 15px', cursor: 'pointer', border: 'none', background: '#ecf0f1', borderRadius: '5px', fontWeight: 'bold', color: '#7f8c8d' }}
        >
          ← {t('back_to_dashboard')}
        </button>
      </div>

      {/* [3] 메인 컨텐츠 */}
      <div style={{ display: 'flex', flex: 1, padding: '20px', gap: '20px', height: 'calc(100vh - 140px)' }}> {/* 높이 조절: 헤더 높이만큼 뺌 */}
        
        {/* 차트 영역 (70%) */}
        <div style={{ flex: 7, backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', position: 'relative' }}>
          <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}></div>
        </div>

        {/* 매매창 영역 (30%) */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', height: '100%', overflowY: 'auto' }}>
            
            {/* 현재가 */}
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px', textAlign: 'center' }}>
               <div style={{ fontSize: '2rem', fontWeight: 'bold', color: currentPrice > 0 ? '#e74c3c' : '#333' }}>
                ${currentPrice ? currentPrice.toLocaleString() : '---'}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#95a5a6', marginTop: '5px' }}>Current Market Price</div>
            </div>

            {/* 내 보유 현황 */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#7f8c8d' }}>💵 {t('available_cash')}(USD)</span>
                <span style={{ fontWeight: 'bold' }}>${myCash.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7f8c8d' }}>📦 {t('holding_qty')}</span>
                <span style={{ fontWeight: 'bold' }}>{myStock ? myStock.quantity.toLocaleString() : 0}</span>
              </div>
            </div>

            {/* 매수/매도 탭 */}
            <div style={{ display: 'flex', marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setMode('BUY')} style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: mode === 'BUY' ? '#e74c3c' : 'white', color: mode === 'BUY' ? 'white' : '#7f8c8d', fontWeight: 'bold', cursor: 'pointer' }}>
                {t('trade_buy')}
              </button>
              <button onClick={() => setMode('SELL')} style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: mode === 'SELL' ? '#3498db' : 'white', color: mode === 'SELL' ? 'white' : '#7f8c8d', fontWeight: 'bold', cursor: 'pointer' }}>
                {t('trade_sell')}
              </button>
            </div>

            {/* 입력 폼 */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '5px' }}>{t('input_price')}</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '5px' }}>{t('input_qty')}</label>
              <input type="number" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} />
            </div>

            {/* 시뮬레이션 결과 */}
            {sim && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: mode === 'BUY' ? '#fff5f5' : '#f0f8ff', borderRadius: '8px', border: mode === 'BUY' ? '1px solid #ffcccc' : '1px solid #cce5ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontWeight: 'bold' }}>
                  <span>{t('est_total')}</span>
                  <span>${sim.total.toLocaleString()}</span>
                </div>
                {mode === 'BUY' ? (
                   <div style={{ fontSize: '0.85rem', color: '#e74c3c' }}>{t('est_avg')}: ${sim.newAvg.toFixed(2)}</div>
                ) : (
                   <div style={{ fontSize: '0.85rem', color: sim.profit > 0 ? '#e74c3c' : '#2980b9' }}>
                     {t('est_profit')}: {sim.profit > 0 ? '+' : ''}${sim.profit.toFixed(2)}
                   </div>
                )}
              </div>
            )}

            {/* 주문 버튼 */}
            <button onClick={handleTrade} style={{ width: '100%', padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: mode === 'BUY' ? '#e74c3c' : '#3498db', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              {mode === 'BUY' ? t('order_buy') : t('order_sell')}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

// 스타일
const logoutBtnStyle = { padding: '8px 20px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', transition: '0.3s' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.1rem', boxSizing: 'border-box', outline: 'none' };

export default StockDetail;