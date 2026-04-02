import React from 'react';
import { useTranslation } from 'react-i18next';

// [수정] exchangeRates props 추가
function HistoryTable({ history, exchangeRates }) {
  const { t, i18n } = useTranslation();

  if (!history || history.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#95a5a6', marginTop: '30px' }}>거래 내역이 없습니다.</div>;
  }

  // 화폐 변환 함수 (수익금용)
  const formatProfit = (usdProfit) => {
    if (usdProfit === null) return '-';
    
    let value, symbol;
    if (i18n.language === 'ko') {
      value = Math.floor(usdProfit * exchangeRates.KRW);
      symbol = '₩';
    } else if (i18n.language === 'ja') {
      value = Math.floor(usdProfit * exchangeRates.JPY);
      symbol = '¥';
    } else {
      value = usdProfit.toFixed(2);
      symbol = '$';
    }
    return `${symbol} ${value.toLocaleString()}`;
  };

  const sortedHistory = [...history].reverse();

  return (
    <div style={{ overflowX: 'auto', marginTop: '30px', backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>📜 {t('history_title')}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f1f2f6', textAlign: 'left', fontSize: '0.85rem', color: '#7f8c8d' }}>
            <th style={thStyle}>{t('trans_date')}</th>
            <th style={thStyle}>{t('category')}</th>
            <th style={thStyle}>{t('asset_name')}</th>
            <th style={thStyle}>{t('quantity')}</th>
            <th style={thStyle}>{t('trans_price')}</th>
            <th style={thStyle}>{t('trans_amount')}</th>
            <th style={thStyle}>{t('realized_profit')}</th>
          </tr>
        </thead>
        <tbody>
          {sortedHistory.map((log) => {
            // [계산] 실현 수익률 계산
            // 매도금액(amount) - 이익(profit) = 원금(cost)
            // 이익 / 원금 * 100
            let profitRate = 0;
            if (log.profit !== null && log.amount) {
               const cost = log.amount - log.profit;
               profitRate = cost > 0 ? (log.profit / cost) * 100 : 0;
            }

            return (
              <tr key={log.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#95a5a6' }}>
                  {new Date(log.date).toLocaleString()}
                </td>
                <td style={tdStyle}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                    backgroundColor: log.type === 'BUY' ? '#ffebee' : '#e3f2fd',
                    color: log.type === 'BUY' ? '#e74c3c' : '#2196f3'
                  }}>
                    {log.type === 'BUY' ? t('type_buy') : t('type_sell')}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{log.name}</td>
                <td style={tdStyle}>{log.quantity.toLocaleString()}</td>
                <td style={tdStyle}>${log.price.toLocaleString()}</td>
                <td style={tdStyle}>${log.amount.toLocaleString()}</td>
                
                {/* [핵심] 수익률 %와 (금액) 표시 */}
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>
                  {log.profit !== null ? (
                    <span style={{ color: log.profit > 0 ? '#e74c3c' : '#2980b9' }}>
                      {log.profit > 0 ? '+' : ''}{profitRate.toFixed(2)}% 
                      <span style={{ fontSize: '0.8rem', color: '#7f8c8d', fontWeight: 'normal', marginLeft: '5px' }}>
                        ({formatProfit(log.profit)})
                      </span>
                    </span>
                  ) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: '10px' };
const tdStyle = { padding: '12px 10px', fontSize: '0.9rem', color: '#2c3e50' };

export default HistoryTable;