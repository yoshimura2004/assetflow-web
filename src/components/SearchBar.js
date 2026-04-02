import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { STOCK_LIST } from '../data/stockList';

function SearchBar() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // [중요] i18n 객체 가져오기
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // [핵심 1] 현재 언어에 맞는 이름을 가져오는 헬퍼 함수
  const getLocalizedName = (stock) => {
    if (i18n.language === 'ja') return stock.nameJa;
    if (i18n.language === 'ko') return stock.nameKo;
    return stock.nameEn; // 기본값 영어
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (value.length > 0) {
      const keyword = value.toLowerCase();

      // [핵심 2] 검색 로직: 심볼, 영어이름, 한글이름, 일본어이름 중 하나라도 걸리면 OK
      const filtered = STOCK_LIST.filter((stock) =>
        stock.symbol.toLowerCase().includes(keyword) ||
        stock.nameEn.toLowerCase().includes(keyword) ||
        stock.nameKo.toLowerCase().includes(keyword) ||
        stock.nameJa.toLowerCase().includes(keyword)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim()) {
      navigate(`/stock/${encodeURIComponent(input.toUpperCase())}`);
      setShowSuggestions(false);
      setInput("");
    }
  };

  const handleSuggestionClick = (symbol) => {
    navigate(`/stock/${encodeURIComponent(symbol)}`);
    setShowSuggestions(false);
    setInput("");
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={input}
          onChange={handleChange}
          onFocus={() => input.length > 0 && setShowSuggestions(true)}
          placeholder={t('search_placeholder')}
          style={{
            width: '100%', // 부모 크기에 맞춤
            padding: '12px 20px',
            paddingRight: '40px',
            borderRadius: '25px',
            border: '1px solid #dfe1e5',
            outline: 'none',
            fontSize: '0.95rem',
            // [추가] 모바일에서 입력 시 글씨가 작아지는 것 방지
            boxShadow: showSuggestions ? '0 2px 5px rgba(0,0,0,0.0)' : '0 2px 5px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
          }}
        />
        <button
          type="submit"
          style={{
            position: 'absolute',
            right: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1rem',
            color: '#5f6368'
          }}
        >
          
        </button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <ul style={dropdownStyle}>
          {suggestions.map((stock) => (
            <li
              key={stock.symbol}
              onClick={() => handleSuggestionClick(stock.symbol)}
              style={itemStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 'bold', color: '#2c3e50', width: '60px' }}>{stock.symbol}</span>
                {/* [핵심 3] 화면 표시: 현재 언어에 맞는 이름 렌더링 */}
                <span style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                  {getLocalizedName(stock)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- Styles ---
const dropdownStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  backgroundColor: 'white',
  borderRadius: '10px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  marginTop: '5px',
  listStyle: 'none',
  padding: '10px 0',
  zIndex: 1000,
  maxHeight: '300px',
  overflowY: 'auto'
};

const itemStyle = {
  padding: '10px 20px',
  cursor: 'pointer',
  transition: 'background-color 0.1s',
  borderBottom: '1px solid #f1f2f6'
};

export default SearchBar;