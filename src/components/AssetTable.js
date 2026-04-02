import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // [추가]

function AssetTable({ assets, exchangeRates, onEdit }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate(); // [추가]
  // (formatTotalValue, formatUSD 함수는 기존 유지...)
  const formatTotalValue = (usdPrice) => {
    if (!usdPrice) return '-';
    if (i18n.language === 'ko') {
      const krw = Math.floor(usdPrice * exchangeRates.KRW);
      return `₩ ${krw.toLocaleString()}`;
    }
    if (i18n.language === 'ja') {
      const jpy = Math.floor(usdPrice * exchangeRates.JPY);
      return `¥ ${jpy.toLocaleString()}`;
    }
    return `$ ${usdPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatUSD = (usdPrice) => {
    if (!usdPrice) return '-';
    return `$ ${usdPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (!assets || assets.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>{t('no_data')}</div>;
  }

  // [NEW] 행 클릭 핸들러
  const handleRowClick = (asset) => {
    // 현금(CASH)은 차트 페이지가 없으므로 입출금 모달을 띄움
    if (asset.category === 'CASH') {
      onEdit(asset);
    } else {
      // 주식/코인은 상세 차트 페이지로 이동
      navigate(`/stock/${asset.symbol}`);
    }
  };

  // [NEW] 버튼 클릭 핸들러 (이벤트 전파 중단)
  const handleButtonClick = (e, asset) => {
    e.stopPropagation(); // 부모(tr)의 onClick이 실행되지 않도록 막음
    onEdit(asset);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* [수정 1] table-layout: fixed 추가 (칸 너비 고정) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f1f2f6', textAlign: 'left' }}>
            {/* [수정 2] 각 컬럼에 적절한 width 할당 (합계 100% 되도록 조절 추천) */}
            <th style={{ ...thStyle, width: '20%' }}>{t('asset_name')}</th>
            <th style={{ ...thStyle, width: '10%' }}>{t('category')}</th>
            <th style={{ ...thStyle, width: '12%' }}>{t('quantity')}</th>
            <th style={{ ...thStyle, color: '#2980b9', width: '15%' }}>{t('total_value')}</th>
            <th style={{ ...thStyle, width: '12%' }}>{t('avg_price')} ($)</th>
            <th style={{ ...thStyle, width: '12%' }}>{t('current_price')} ($)</th>
            <th style={{ ...thStyle, width: '10%' }}>{t('profit_rate')}</th>
            <th style={{ ...thStyle, width: '9%' }}>{t('action')}</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset, index) => {
            const profitRate = asset.avgPrice > 0
              ? ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100
              : 0;
            const isProfit = profitRate > 0;
            const totalValueUSD = asset.quantity * asset.currentPrice;
            const isCash = asset.category === 'CASH';

            return (
              <tr
                key={asset.id || index}
                style={{ borderBottom: '1px solid #f8f9fa', cursor: 'pointer', transition: 'background 0.2s' }}
                onClick={() => handleRowClick(asset)} // [수정] 행 클릭 시 이동
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                {/* 1. 종목명 (말줄임표 적용) */}
                <td style={tdStyle}>
                  <div style={nameContainerStyle}>
                    <div style={textEllipsisStyle} title={asset.assetName}>
                      {asset.assetName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#95a5a6' }}>{asset.symbol}</div>
                  </div>
                </td>

                <td style={tdStyle}><span style={getCategoryBadgeStyle(asset.category)}>{t(`cat_${asset.category.toLowerCase()}`)}</span></td>

                {/* 숫자가 길어질 경우 줄바꿈 방지 (whiteSpace: 'nowrap') */}
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  {asset.quantity.toLocaleString()} {isCash ? asset.symbol : ''}
                </td>

                <td style={{ ...tdStyle, fontWeight: 'bold', color: '#2c3e50', backgroundColor: '#fcfcfc', whiteSpace: 'nowrap' }}>
                  {formatTotalValue(totalValueUSD)}
                </td>

                <td style={tdStyle}>
                  {isCash ? <span style={{ color: '#bdc3c7' }}>-</span> : formatUSD(asset.avgPrice)}
                </td>
                <td style={tdStyle}>
                  {isCash ? <span style={{ color: '#bdc3c7' }}>-</span> : formatUSD(asset.currentPrice)}
                </td>

                <td style={tdStyle}>
                  {isCash ? <span style={{ color: '#bdc3c7' }}>-</span> : (
                    <span style={{ color: Math.abs(profitRate) < 0.01 ? '#95a5a6' : (isProfit ? '#e74c3c' : '#2980b9'), fontWeight: 'bold' }}>
                      {Math.abs(profitRate) < 0.01 ? '0.00%' : `${profitRate > 0 ? '+' : ''}${profitRate.toFixed(2)}%`}
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  <button
                    style={tradeBtnStyle}
                    onClick={(e) => handleButtonClick(e, asset)} // [수정] 별도 핸들러 사용
                  >
                    {t('action')}
                  </button>                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- Styles 수정 ---
const thStyle = { padding: '15px 10px', fontSize: '0.85rem', color: '#7f8c8d', fontWeight: '600', whiteSpace: 'nowrap' };
const tdStyle = { padding: '15px 10px', fontSize: '0.95rem', color: '#2c3e50', overflow: 'hidden' };

// [핵심] 긴 텍스트 자르기 스타일
const nameContainerStyle = { display: 'flex', flexDirection: 'column', maxWidth: '100%' };
const textEllipsisStyle = {
  fontWeight: 'bold', color: '#2c3e50',
  whiteSpace: 'nowrap',       // 줄바꿈 금지
  overflow: 'hidden',         // 넘치는 부분 숨김
  textOverflow: 'ellipsis',   // ... 으로 표시
  maxWidth: '100%'            // 부모 너비를 넘지 않음
};

const tradeBtnStyle = { padding: '5px 10px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' };

const getCategoryBadgeStyle = (category) => {
  const baseStyle = { padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' };
  switch (category) {
    case 'STOCK': return { ...baseStyle, backgroundColor: '#e3f2fd', color: '#2196f3' };
    case 'CRYPTO': return { ...baseStyle, backgroundColor: '#fff3e0', color: '#ff9800' };
    case 'CASH': return { ...baseStyle, backgroundColor: '#e8f5e9', color: '#4caf50' };
    case 'BOND': return { ...baseStyle, backgroundColor: '#f3e5f5', color: '#9c27b0' };
    default: return { ...baseStyle, backgroundColor: '#f5f5f5', color: '#9e9e9e' };
  }
};

export default AssetTable;