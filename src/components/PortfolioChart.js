import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next'; // [수정] 번역 훅 import

// 차트 사용 등록
ChartJS.register(ArcElement, Tooltip, Legend);

function PortfolioChart({ assets }) {
  const { t } = useTranslation(); // [수정] t 함수 가져오기

  // 데이터가 없으면 표시 안 함 (다국어 처리 적용)
  if (!assets || assets.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
        {t('no_data')} 
      </div>
    );
  }

  // 1. 카테고리별로 금액 합치기 (데이터 가공)
  const categorySums = assets.reduce((acc, asset) => {
    const amount = asset.quantity * asset.avgPrice;
    acc[asset.category] = (acc[asset.category] || 0) + amount;
    return acc;
  }, {});

  // 2. 차트용 데이터 형식으로 변환
  const data = {
    labels: Object.keys(categorySums), // ['STOCK', 'CASH', ...]
    datasets: [
      {
        data: Object.values(categorySums), // [12354, 1000000, ...]
        backgroundColor: [
          '#FF6384', // 빨강
          '#36A2EB', // 파랑
          '#FFCE56', // 노랑
          '#4BC0C0', // 청록
          '#9966FF', // 보라
          '#FF9F40', // 주황
        ],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right', // 범례를 오른쪽에 표시
        labels: {
          font: {
            family: "'Noto Sans JP', 'Noto Sans KR', sans-serif", // 폰트 통일감
          }
        }
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '300px', display: 'flex', justifyContent: 'center' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

export default PortfolioChart;