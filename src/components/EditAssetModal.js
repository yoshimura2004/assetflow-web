import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // [추가]
// [API 키] Finnhub (주식용)
const FINNHUB_KEY = 'd5s5631r01qoo9r2mnp0d5s5631r01qoo9r2mnpg';

function EditAssetModal({ isOpen, onClose, asset, onConfirm, exchangeRates }) {
  const { t } = useTranslation();
  const navigate = useNavigate(); // [추가]
  const [mode, setMode] = useState('BUY'); // 'BUY' or 'SELL'
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState(''); 
  const [currentMarketPrice, setCurrentMarketPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && asset) {
      setMode('BUY'); setQuantity(''); setPrice(''); 
      fetchLatestPrice(asset); 
    }
  }, [isOpen, asset]);

  const fetchLatestPrice = async (targetAsset) => {
    if (!targetAsset || targetAsset.category === 'CASH') return;
    setIsLoading(true); setCurrentMarketPrice(null);

    try {
      if (targetAsset.category === 'CRYPTO') {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await response.json();
        if (data.bitcoin && data.bitcoin.usd) {
          setCurrentMarketPrice(data.bitcoin.usd);
          setPrice(data.bitcoin.usd); 
        }
      } else {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${targetAsset.symbol}&token=${FINNHUB_KEY}`);
        const data = await response.json();
        if (data.c) {
          setCurrentMarketPrice(data.c);
          setPrice(data.c); 
        }
      }
    } catch (e) {
      setPrice(targetAsset.currentPrice);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSimulation = () => {
    if (!quantity || !price || asset.category === 'CASH') return null;
    const qty = parseFloat(quantity);
    const prc = parseFloat(price);
    
    if (mode === 'BUY') {
      const totalCost = (asset.quantity * asset.avgPrice) + (qty * prc);
      const totalQty = asset.quantity + qty;
      const newAvg = totalCost / totalQty;
      return { type: 'AVG', value: newAvg, diff: newAvg - asset.avgPrice };
    } else {
      const profit = (prc - asset.avgPrice) * qty;
      const profitRate = asset.avgPrice > 0 ? ((prc - asset.avgPrice) / asset.avgPrice) * 100 : 0;
      return { type: 'PROFIT', value: profit, rate: profitRate };
    }
  };

  const simResult = calculateSimulation();

  const handleSubmit = () => {
    if (!quantity || parseFloat(quantity) <= 0) return alert(t('msg_no_qty'));
    if (asset.category !== 'CASH' && !price) return alert(t('msg_no_price'));
    onConfirm(asset.id, mode, parseFloat(quantity), parseFloat(price));
    onClose();
  };

  if (!isOpen || !asset) return null;
  const isCash = asset.category === 'CASH';

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* [수정] 헤더 부분: 종목명 + 차트 바로가기 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>{asset.assetName}</h3>
          
          {/* 현금이 아닐 때만 차트 버튼 표시 */}
          {!isCash && (
            <button 
              onClick={() => navigate(`/stock/${asset.symbol}`)}
              style={{ 
                padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#ecf0f1', 
                border: 'none', borderRadius: '5px', cursor: 'pointer', color: '#7f8c8d' 
              }}
            >
              📈 {t('chart_btn')}
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '20px' }}>
          {t('holding_qty')}: <b>{asset.quantity.toLocaleString()}</b>
        </div>

        {/* 탭 버튼 (다국어 적용) */}
        <div style={{ display: 'flex', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
          <button 
            style={{ ...tabStyle, backgroundColor: mode === 'BUY' ? '#e74c3c' : '#f8f9fa', color: mode === 'BUY' ? 'white' : '#7f8c8d' }}
            onClick={() => setMode('BUY')}
          >
            {isCash ? 'Deposit' : t('trade_buy')}
          </button>
          <button 
            style={{ ...tabStyle, backgroundColor: mode === 'SELL' ? '#3498db' : '#f8f9fa', color: mode === 'SELL' ? 'white' : '#7f8c8d' }}
            onClick={() => setMode('SELL')}
          >
            {isCash ? 'Withdraw' : t('trade_sell')}
          </button>
        </div>

        {/* 수량 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>{isCash ? t('input_amount') : t('input_qty')}</label>
          <input 
            type="number" placeholder="0"
            value={quantity} onChange={(e) => setQuantity(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* 가격 */}
        {!isCash && (
          <div style={fieldStyle}>
            <label style={labelStyle}>
              {t('input_price')} ($) 
              {isLoading && <span style={{fontSize:'0.8rem', color:'#f39c12', marginLeft:'5px'}}>Loading...</span>}
            </label>
            <input 
              type="number" 
              placeholder={currentMarketPrice || asset.currentPrice}
              value={price} onChange={(e) => setPrice(e.target.value)}
              style={inputStyle}
            />
          </div>
        )}

        {/* 시뮬레이션 결과 (다국어 적용) */}
        {!isCash && simResult && (
          <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem' }}>
            {mode === 'BUY' ? (
               <div>
                 📊 {t('est_avg')}: <b>${simResult.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</b>
               </div>
            ) : (
               <div>
                 💰 {t('est_profit')}: 
                 <span style={{ fontWeight:'bold', color: simResult.value > 0 ? '#e74c3c' : '#2980b9', marginLeft:'5px' }}>
                   {simResult.value > 0 ? '+' : ''}{simResult.value.toFixed(2)} USD
                 </span>
               </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button onClick={handleSubmit} style={saveBtnStyle}>{t('save_btn')}</button>
          <button onClick={onClose} style={cancelBtnStyle}>{t('cancel_btn')}</button>
        </div>
      </div>
    </div>
  );
}

// Styles (기존 동일)
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(3px)' };
const modalStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '15px', width: '90%', maxWidth: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const fieldStyle = { marginBottom: '15px' };
const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#34495e', fontSize: '0.9rem' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };
const tabStyle = { flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', transition: '0.2s' };
const saveBtnStyle = { flex: 1, padding: '10px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' };
const cancelBtnStyle = { flex: 1, padding: '10px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' };

export default EditAssetModal;