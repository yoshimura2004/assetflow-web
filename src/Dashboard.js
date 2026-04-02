import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// 컴포넌트 임포트
import AssetTable from './components/AssetTable'; // 경로 확인 필요 (파일 위치에 따라 ./ 또는 ../)
import AddAssetModal from './components/AddAssetModal';
import EditAssetModal from './components/EditAssetModal';
import PortfolioChart from './components/PortfolioChart';
import HistoryTable from './components/HistoryTable';
import LanguageSwitcher from './components/LanguageSwitcher';
import SearchBar from './components/SearchBar';

// [API 키] Finnhub (시세 조회용)
const FINNHUB_KEY = 'd5s5631r01qoo9r2mnp0d5s5631r01qoo9r2mnpg';

function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  // --- 1. 상태 관리 (State) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  const [assets, setAssets] = useState([]);
  const [history, setHistory] = useState([]); // 거래 내역

  const [exchangeRates, setExchangeRates] = useState({ KRW: 1430, JPY: 155, date: null });
  const [isRateLoaded, setIsRateLoaded] = useState(false);

  const userName = localStorage.getItem('userName') || "Investor";
  const userPicture = localStorage.getItem('userPicture');

  // --- 2. 초기화 (Effect) ---
  useEffect(() => {
    // 1. 저장된 자산 불러오기
    const savedAssets = localStorage.getItem('my_assets');
    let loadedAssets = [];
    if (savedAssets) {
      loadedAssets = JSON.parse(savedAssets);
      setAssets(loadedAssets);
    }

    // 2. 환율 및 거래내역 불러오기
    fetchHistory();
    fetchExchangeRates();

    // 3. [핵심] 보유 자산 최신 시세 업데이트 (새로고침 시 반영)
    if (loadedAssets.length > 0) {
      updateAllAssetPrices(loadedAssets);
    }
  }, []);

  // --- 3. 데이터 불러오기 및 업데이트 함수들 ---
  
  const fetchAssets = () => {
    const saved = localStorage.getItem('my_assets');
    if (saved) setAssets(JSON.parse(saved));
  };

  const fetchHistory = () => {
    const saved = localStorage.getItem('my_history');
    if (saved) setHistory(JSON.parse(saved));
  };

  // [NEW] 모든 보유 주식/코인 가격 최신화 함수
  const updateAllAssetPrices = async (currentAssets) => {
    const targets = currentAssets.filter(a => a.category !== 'CASH');
    if (targets.length === 0) return;

    console.log("🔄 시세 업데이트 시작 (Stocks: Finnhub / Crypto: CoinGecko)...");
    let updatedAssets = [...currentAssets];
    let isUpdated = false;

    await Promise.all(targets.map(async (asset) => {
      try {
        let newPrice = null;

        // [A] 암호화폐인 경우 (CoinGecko)
        if (asset.category === 'CRYPTO') {
          const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
          const data = await res.json();
          if (data.bitcoin && data.bitcoin.usd) {
            newPrice = data.bitcoin.usd;
          }
        } 
        // [B] 주식/채권인 경우 (Finnhub)
        else {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${asset.symbol}&token=${FINNHUB_KEY}`);
          const data = await res.json();
          if (data.c) {
            newPrice = data.c;
          }
        }

        // 가격 업데이트 반영
        if (newPrice !== null) {
          const index = updatedAssets.findIndex(a => a.id === asset.id);
          if (index !== -1 && updatedAssets[index].currentPrice !== newPrice) {
            updatedAssets[index] = { ...updatedAssets[index], currentPrice: newPrice };
            isUpdated = true;
            console.log(`✅ [${asset.symbol}] Updated: $${newPrice}`);
          }
        }

      } catch (error) {
        console.error(`❌ [${asset.symbol}] Update failed:`, error);
      }
    }));

    if (isUpdated) {
      setAssets(updatedAssets);
      localStorage.setItem('my_assets', JSON.stringify(updatedAssets));
    }
  };

  // --- 4. 환율 관련 함수 ---
  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      const newRates = { KRW: data.rates.KRW, JPY: data.rates.JPY, date: data.date };
      setExchangeRates(newRates);
      setIsRateLoaded(true);
      updateCashValues(newRates);
    } catch (error) {
      const mockRates = { KRW: 1445.5, JPY: 153.2, date: new Date().toISOString().split('T')[0] };
      setExchangeRates(mockRates);
      setIsRateLoaded(true);
      updateCashValues(mockRates);
    }
  };

  // 현금 자산 가치 보정 (환율 변동 반영)
  const updateCashValues = (rates) => {
    setAssets(prevAssets => {
      if (!prevAssets) return [];
      const updated = prevAssets.map(asset => {
        if (asset.category === 'CASH') {
          if (asset.symbol === 'KRW') return { ...asset, currentPrice: 1 / rates.KRW, avgPrice: 1 / rates.KRW };
          if (asset.symbol === 'JPY') return { ...asset, currentPrice: 1 / rates.JPY, avgPrice: 1 / rates.JPY };
          if (asset.symbol === 'USD') return { ...asset, currentPrice: 1, avgPrice: 1 };
        }
        return asset;
      });
      return updated;
    });
  };

  // --- 5. 핸들러 함수들 (User Actions) ---

  // 수정 모달 열기
  const handleOpenEdit = (asset) => {
    setSelectedAsset(asset);
    setIsEditModalOpen(true);
  };

  // 로그 저장
  const addHistoryLog = (type, assetName, quantity, price, profit = null) => {
    const newLog = {
      id: Date.now(),
      date: new Date().toISOString(),
      type, // 'BUY' or 'SELL'
      name: assetName,
      quantity,
      price,
      amount: quantity * price,
      profit
    };
    const updatedHistory = [...history, newLog];
    setHistory(updatedHistory);
    localStorage.setItem('my_history', JSON.stringify(updatedHistory));
  };

  // 자산 추가 (신규)
  const handleAddAsset = (newAsset) => {
    const existingIndex = assets.findIndex(asset =>
      (asset.symbol && asset.symbol === newAsset.symbol) || (!asset.symbol && asset.assetName === newAsset.assetName)
    );

    let updatedAssets;
    if (existingIndex !== -1) {
      const existing = assets[existingIndex];
      const totalQuantity = existing.quantity + newAsset.quantity;
      const totalCost = (existing.quantity * existing.avgPrice) + (newAsset.quantity * newAsset.avgPrice);
      const newAvgPrice = totalCost / totalQuantity;
      const mergedAsset = { ...existing, quantity: totalQuantity, avgPrice: newAvgPrice, currentPrice: newAsset.currentPrice };
      updatedAssets = [...assets];
      updatedAssets[existingIndex] = mergedAsset;
      
      // [수정] 병합 알림 메시지 (다국어 적용)
      alert(t('msg_merge_buy')); 
    } else {
      updatedAssets = [...assets, { ...newAsset, id: Date.now() }];
    }

    setAssets(updatedAssets);
    localStorage.setItem('my_assets', JSON.stringify(updatedAssets));
    setIsModalOpen(false);

    // 로그 기록 (현금 제외)
    if (newAsset.category !== 'CASH') {
       addHistoryLog('BUY', newAsset.assetName, newAsset.quantity, newAsset.avgPrice);
    }
  };

  // 자산 업데이트 (매수/매도/현금화)
  const handleUpdateAsset = (assetId, mode, quantity, price) => {
    let profit = null;
    let sellAmountUSD = 0;

    // 1. 자산 리스트 업데이트
    const tempAssets = assets.map(asset => {
      if (asset.id === assetId) {
        if (mode === 'BUY') {
          if (asset.category === 'CASH') {
             return { ...asset, quantity: asset.quantity + quantity };
          } else {
             // 가중 평균 평단가
             const totalCost = (asset.quantity * asset.avgPrice) + (quantity * price);
             const newQuantity = asset.quantity + quantity;
             const newAvgPrice = totalCost / newQuantity;
             addHistoryLog('BUY', asset.assetName, quantity, price);
             return { ...asset, quantity: newQuantity, avgPrice: newAvgPrice, currentPrice: price };
          }
        } 
        else if (mode === 'SELL') {
          const newQuantity = asset.quantity - quantity;
          profit = (price - asset.avgPrice) * quantity;
          sellAmountUSD = quantity * price; // 매도 총액
          addHistoryLog('SELL', asset.assetName, quantity, price, profit);
          return { ...asset, quantity: newQuantity };
        }
      }
      return asset;
    }).filter(asset => asset.quantity > 0);

    // 2. 매도 시 현금(USD) 입금 로직
    let finalAssets = [...tempAssets];
    if (mode === 'SELL' && sellAmountUSD > 0) {
      const usdIndex = finalAssets.findIndex(a => a.category === 'CASH' && a.symbol === 'USD');
      
      if (usdIndex !== -1) {
        finalAssets[usdIndex] = {
          ...finalAssets[usdIndex],
          quantity: finalAssets[usdIndex].quantity + sellAmountUSD
        };
      } else {
        finalAssets.push({
          id: Date.now() + 999,
          assetName: 'Cash (USD)',
          symbol: 'USD',
          category: 'CASH',
          quantity: sellAmountUSD,
          avgPrice: 1,
          currentPrice: 1
        });
      }
      
      // [수정] 매도 완료 알림 (다국어 적용 & 변수 전달)
      alert(t('msg_sell_deposit', { amount: sellAmountUSD.toFixed(2) }));
    }

    setAssets(finalAssets);
    localStorage.setItem('my_assets', JSON.stringify(finalAssets));
  };

  const handleDeleteAsset = (id) => {
    // [수정] 삭제 확인 메시지 (다국어 적용)
    if (window.confirm(t('msg_delete_confirm'))) {
      const updatedAssets = assets.filter(asset => asset.id !== id);
      setAssets(updatedAssets);
      localStorage.setItem('my_assets', JSON.stringify(updatedAssets));
    }
  };

  const handleResetData = () => {
    // 1. 초기화 확인
    if (!window.confirm(t('msg_reset_confirm'))) return;

    // 2. 초기 자금 입력 받기 (Prompt)
    // 기본값: 100,000 달러 (약 1억 4천만원)
    const inputBudget = window.prompt(t('msg_enter_budget'), "100000");
    
    // 취소 누르면 중단
    if (inputBudget === null) return; 

    const budget = parseFloat(inputBudget);
    if (isNaN(budget) || budget < 0) {
      return alert("Invalid Amount");
    }

    // 3. 데이터 초기화 및 현금 생성
    const initialCash = {
      id: Date.now(),
      assetName: 'Cash (USD)',
      symbol: 'USD',
      category: 'CASH',
      quantity: budget,
      avgPrice: 1,
      currentPrice: 1
    };

    setAssets([initialCash]); // 현금만 있는 상태로 시작
    setHistory([]);
    
    localStorage.setItem('my_assets', JSON.stringify([initialCash]));
    localStorage.removeItem('my_history');

    alert(t('msg_reset_done'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPicture');
    navigate('/');
  };

  // 총 자산 계산
  const calculateTotalAsset = () => {
    let totalUSD = assets.reduce((acc, cur) => acc + (cur.quantity * cur.currentPrice), 0);
    if (i18n.language === 'ko') return Math.floor(totalUSD * exchangeRates.KRW);
    if (i18n.language === 'ja') return Math.floor(totalUSD * exchangeRates.JPY);
    return totalUSD.toFixed(2);
  };

  const getCurrencySymbol = () => {
    if (i18n.language === 'ko') return '₩';
    if (i18n.language === 'ja') return '¥';
    return '$';
  };
  
  // --- 6. 렌더링 (JSX) ---
  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingBottom: '50px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* 헤더 */}
      <nav style={{ backgroundColor: 'white', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div onClick={() => navigate('/')} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          📊 AssetFlow <span style={{ fontSize: '0.9rem', color: '#95a5a6', fontWeight: 'normal' }}>| Dashboard</span>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', margin: '0 20px' }}>
          <SearchBar />
        </div>
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

      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>

        {/* 요약 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={summaryCardStyle}>
            <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '10px' }}>{t('total_asset')}</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#2c3e50' }}>
              {getCurrencySymbol()} {calculateTotalAsset().toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isRateLoaded ? '#2ecc71' : '#f1c40f', display: 'inline-block' }}></span>
                <span style={{ color: '#7f8c8d' }}>
                  USD/KRW: <b>{exchangeRates.KRW.toFixed(2)}</b> | USD/JPY: <b>{exchangeRates.JPY.toFixed(2)}</b>
                </span>
              </div>
              {exchangeRates.date && (
                <span style={{ fontSize: '0.75rem', color: '#bdc3c7', marginLeft: '13px' }}>
                  ({exchangeRates.date} 기준)
                </span>
              )}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '10px' }}>{t('total_count')}</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#2980b9' }}>
              {assets.length} <span style={{ fontSize: '1rem', color: '#95a5a6' }}>{t('item_unit')}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#95a5a6', marginTop: '10px' }}>{t('investing_desc')}</div>
          </div>

          <div
            onClick={() => setIsModalOpen(true)}
            style={{ ...summaryCardStyle, cursor: 'pointer', backgroundColor: '#3498db', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: 'none' }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>+</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{t('add_asset')}</div>
          </div>
        </div>

        {/* 차트 및 리스트 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          <div style={contentCardStyle}>
            <h3 style={sectionTitleStyle}>🍰 {t('portfolio_ratio')}</h3>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
              <PortfolioChart assets={assets} />
            </div>
          </div>

          <div style={contentCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={sectionTitleStyle}>📋 {t('asset_list_title')}</h3>
              <span style={{ fontSize: '0.8rem', color: '#95a5a6' }}>{t('real_time_update')}</span>
            </div>
            
            <AssetTable
              assets={assets}
              exchangeRates={exchangeRates}
              onDelete={handleDeleteAsset}
              onEdit={handleOpenEdit} 
            />
          </div>
        </div>

        {/* 거래 내역 테이블 */}
        <HistoryTable history={history} exchangeRates={exchangeRates} />

        {/* 초기화 버튼 */}
        <div style={{ textAlign: 'right', marginTop: '30px' }}>
          <button onClick={handleResetData} style={{ color: '#95a5a6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            🔄 {t('reset_btn')}
          </button>
        </div>

      </div>

      <AddAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddAsset}
        exchangeRates={exchangeRates}
      />

      <EditAssetModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        asset={selectedAsset}
        onConfirm={handleUpdateAsset}
        exchangeRates={exchangeRates}
      />
      
    </div>
  );
}

// 스타일
const logoutBtnStyle = { padding: '8px 20px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', transition: '0.3s' };
const summaryCardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f2f6', transition: 'transform 0.2s' };
const contentCardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f2f6' };
const sectionTitleStyle = { margin: 0, fontSize: '1.1rem', color: '#2c3e50', fontWeight: 'bold' };

export default Dashboard;