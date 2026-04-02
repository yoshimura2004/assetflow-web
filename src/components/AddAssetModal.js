import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { STOCK_LIST } from '../data/stockList';

// 채권 매핑 (BOND_MAPPING) 상수는 그대로 유지

// [API 키] Finnhub (시세 조회용)
const FINNHUB_KEY = 'd5s5631r01qoo9r2mnp0d5s5631r01qoo9r2mnpg';

function AddAssetModal({ isOpen, onClose, onSave, exchangeRates }) { 
  const { t } = useTranslation();
  
  const [category, setCategory] = useState('STOCK');
  const [keyword, setKeyword] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [subOption, setSubOption] = useState(''); 
  const [quantity, setQuantity] = useState('');
  const [avgPrice, setAvgPrice] = useState(''); 
  const [currentPrice, setCurrentPrice] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // 초기화 및 외부 클릭 감지 로직 (기존과 동일)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    if (isOpen) resetFields();
  }, [isOpen]);

  const resetFields = () => {
    setCategory('STOCK'); setKeyword(''); setSelectedSymbol('');
    setQuantity(''); setAvgPrice(''); setCurrentPrice(null);
    setSuggestions([]); setSubOption('');
  };

  // ... (fetchStockPrice, handleCategoryChange, handleSearchChange 등 로직은 기존과 동일) ...
  // 지면 관계상 로직 부분은 생략하고 JSX(화면) 부분 위주로 수정합니다.
  
  // API 조회 로직 (Hybrid)
  const fetchStockPrice = async (symbol) => {
    if (!symbol) return;
    setIsLoadingPrice(true);
    setCurrentPrice(null);

    // Crypto -> CoinGecko
    if (category === 'CRYPTO' || symbol === 'BTC' || symbol === 'BINANCE:BTCUSDT') {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await response.json();
        if (data.bitcoin && data.bitcoin.usd) {
          setCurrentPrice(data.bitcoin.usd);
          setAvgPrice(data.bitcoin.usd);
        }
      } catch (error) { console.error(error); } 
      finally { setIsLoadingPrice(false); }
      return;
    }

    // Stock -> Finnhub
    try {
      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
      const data = await response.json();
      if (data.c) {
        setCurrentPrice(data.c);
        if (category !== 'CASH') setAvgPrice(data.c);
      }
    } catch (error) { console.error(error); } 
    finally { setIsLoadingPrice(false); }
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setKeyword(''); setSelectedSymbol(''); setQuantity(''); setAvgPrice(''); setCurrentPrice(null);

    if (newCategory === 'CRYPTO') {
      setSubOption('BTC'); setSelectedSymbol('BINANCE:BTCUSDT'); fetchStockPrice('BINANCE:BTCUSDT');
    } else if (newCategory === 'CASH') {
      setSubOption('USD'); setCurrentPrice(1); setAvgPrice(1);
    }
  };
  
  // 현금 변경 로직 (기존과 동일)
  const handleCashChange = (currency) => {
    setSubOption(currency);
    let priceInUSD = 1; 
    if (currency === 'KRW' && exchangeRates?.KRW) priceInUSD = 1 / exchangeRates.KRW;
    else if (currency === 'JPY' && exchangeRates?.JPY) priceInUSD = 1 / exchangeRates.JPY;
    setCurrentPrice(priceInUSD);
    setAvgPrice(priceInUSD);
  };

  // ... (handleSearchChange, handleSelectStock 등 기존 동일) ...
  const handleSearchChange = (e) => {
      const value = e.target.value;
      setKeyword(value);
      if (value.length > 0) {
        const filtered = STOCK_LIST.filter(stock => 
          stock.symbol.includes(value.toUpperCase()) || stock.nameEn.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
  };

  const handleSelectStock = (stock) => {
    setKeyword(stock.symbol);
    setSelectedSymbol(stock.symbol);
    setShowSuggestions(false);
    fetchStockPrice(stock.symbol);
  };

  const handleSubmit = () => {
    if (category === 'STOCK' && !selectedSymbol && !keyword) return alert(t('msg_no_price')); // 임시 경고
    if (!quantity) return alert(t('msg_no_qty'));

    let finalName = keyword;
    let finalSymbol = selectedSymbol;

    if (category === 'CRYPTO') { finalName = "Bitcoin"; finalSymbol = "BTC"; } 
    else if (category === 'CASH') { finalName = `Cash (${subOption})`; finalSymbol = subOption; }
    else if (category === 'STOCK') { if (!finalSymbol) finalSymbol = keyword.toUpperCase(); }

    const newAsset = {
      assetName: finalName,
      symbol: finalSymbol,
      category,
      quantity: parseFloat(quantity),
      avgPrice: parseFloat(avgPrice),
      currentPrice: currentPrice || parseFloat(avgPrice)
    };

    onSave(newAsset);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>➕ {t('modal_title')}</h2>

        <div style={fieldStyle}>
          <label style={labelStyle}>{t('input_category')}</label>
          <select value={category} onChange={(e) => handleCategoryChange(e.target.value)} style={inputStyle}>
            <option value="STOCK">{t('cat_stock')}</option>
            <option value="CRYPTO">{t('cat_crypto')}</option>
            <option value="BOND">{t('cat_bond')}</option>
            <option value="CASH">{t('cat_cash')}</option>
          </select>
        </div>

        {/* 주식 검색 */}
        {category === 'STOCK' && (
          <div style={fieldStyle} ref={wrapperRef}>
            <label style={labelStyle}>{t('input_name')}</label>
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder={t('input_name_placeholder')} value={keyword} onChange={handleSearchChange} style={inputStyle} />
              {showSuggestions && suggestions.length > 0 && (
                <ul style={dropdownStyle}>
                  {suggestions.map(s => (
                    <li key={s.symbol} onClick={() => handleSelectStock(s)} style={itemStyle}>
                      <b>{s.symbol}</b> <span style={{fontSize:'0.8rem', color:'#888'}}>{s.nameEn}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedSymbol && (
              <div style={priceBadgeStyle}>📊 {t('current_price')}: <b>{isLoadingPrice ? 'Loading...' : `$${currentPrice}`}</b></div>
            )}
          </div>
        )}

        {/* 코인, 채권 등 (UI 생략 없이 기존 로직 유지하되 라벨만 t() 적용) */}
        {category === 'CRYPTO' && (
          <div style={infoBoxStyle}>
             <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>🪙 Bitcoin (BTC)</span>
             <div style={{ color: '#f39c12', fontWeight: 'bold', fontSize: '1.1rem' }}>{isLoadingPrice ? 'Loading...' : `$${currentPrice?.toLocaleString()}`}</div>
          </div>
        )}

        {category === 'CASH' && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Currency</label>
            <select value={subOption} onChange={(e) => handleCashChange(e.target.value)} style={inputStyle}>
              <option value="USD">{t('cash_usd')}</option>
              <option value="KRW">{t('cash_krw')}</option>
              <option value="JPY">{t('cash_jpy')}</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ ...fieldStyle, flex: 1 }}>
            <label style={labelStyle}>{category === 'CASH' ? t('input_amount') : t('input_quantity')}</label>
            <input 
              type="number" placeholder={t('input_quantity_placeholder')}
              value={quantity} onChange={(e) => setQuantity(e.target.value)}
              style={inputStyle}
            />
          </div>

          {category !== 'CASH' && (
            <div style={{ ...fieldStyle, flex: 1 }}>
              <label style={labelStyle}>{t('input_price')}</label>
              <input 
                type="number" 
                placeholder={currentPrice || t('input_price_placeholder')}
                value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)}
                style={{ ...inputStyle, backgroundColor: currentPrice ? '#f0fff4' : 'white' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={handleSubmit} style={saveBtnStyle}>{t('save_btn')}</button>
          <button onClick={onClose} style={cancelBtnStyle}>{t('cancel_btn')}</button>
        </div>
      </div>
    </div>
  );
}

// Styles (기존 동일)
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' };
const modalStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const fieldStyle = { marginBottom: '15px' };
const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#34495e', fontSize: '0.9rem' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };
const dropdownStyle = { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #eee', borderRadius: '8px', marginTop: '5px', listStyle: 'none', padding: '0', maxHeight: '200px', overflowY: 'auto', zIndex: 1001 };
const itemStyle = { padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f8f9fa' };
const infoBoxStyle = { backgroundColor: '#fff8e1', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ffe0b2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const priceBadgeStyle = { marginTop: '8px', fontSize: '0.9rem', color: '#2980b9', backgroundColor: '#eef6fb', padding: '8px', borderRadius: '6px' };
const saveBtnStyle = { flex: 1, padding: '12px', backgroundColor: '#00b894', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' };
const cancelBtnStyle = { flex: 1, padding: '12px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' };

export default AddAssetModal;