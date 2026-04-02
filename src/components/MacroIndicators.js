import React, { useEffect, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next'; // [추가] 언어 감지 훅

function MacroIndicators() {
  const container = useRef();
  const { i18n } = useTranslation(); // [추가] 현재 언어 가져오기

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = "";
    }

    // 1. 현재 언어가 일본어('ja')인지 확인
    const isJa = i18n.language === 'ja';

    // 2. 언어에 따른 텍스트 설정 (삼항 연산자 사용)
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "colorTheme": "light",
      "dateRange": "12M",
      "showChart": true,
      
      // [핵심] 위젯 자체 언어 설정 (차트 메뉴 등)
      "locale": isJa ? "ja" : "kr", 
      
      "width": "100%",
      "height": "500",
      "largeChartUrl": "",
      "isTransparent": false,
      "showSymbolLogo": true,
      "showFloatingTooltip": false,
      "plotLineColorGrowing": "rgba(41, 98, 255, 1)",
      "plotLineColorFalling": "rgba(41, 98, 255, 1)",
      "gridLineColor": "rgba(240, 243, 250, 0)",
      "scaleFontColor": "rgba(106, 109, 120, 1)",
      "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)",
      "belowLineFillColorFalling": "rgba(41, 98, 255, 0.12)",
      "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
      "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)",
      "symbolActiveColor": "rgba(41, 98, 255, 0.12)",
      "tabs": [
        {
          "title": isJa ? "コモディティ (Commodities)" : "원자재 (Commodities)",
          "symbols": [
            { "s": "TVC:GOLD", "d": isJa ? "金 (Gold)" : "금 (Gold)" },
            { "s": "TVC:SILVER", "d": isJa ? "銀 (Silver)" : "은 (Silver)" },
            { "s": "TVC:USOIL", "d": isJa ? "WTI 原油" : "WTI 원유" }
          ]
        },
        {
          "title": isJa ? "為替 (Forex)" : "환율 (Forex)",
          "symbols": [
            { "s": "FX_IDC:USDKRW", "d": isJa ? "ドル/ウォン (USD/KRW)" : "달러/원 (USD/KRW)" },
            { "s": "FX_IDC:JPYKRW", "d": isJa ? "円/ウォン (JPY/KRW)" : "엔/원 (JPY/KRW)" },
            { "s": "FX_IDC:USDJPY", "d": isJa ? "ドル/円 (USD/JPY)" : "달러/엔 (USD/JPY)" }
          ]
        },
        {
          "title": isJa ? "債券 & ドル (Bonds)" : "채권 & 달러 (Bonds)",
          "symbols": [
            { "s": "CAPITALCOM:DXY", "d": isJa ? "ドルインデックス (DXY)" : "달러 인덱스 (DXY)" },
            // 미국 채권 ETF (직관적인 이름으로 표시)
            { "s": "NASDAQ:SHY", "d": isJa ? "米国債 2年 (Short)" : "미국 단기채 2Y (Short)" }, 
            { "s": "NASDAQ:IEF", "d": isJa ? "米国債 10年 (Mid)" : "미국 중기채 10Y (Mid)" },
            { "s": "NASDAQ:TLT", "d": isJa ? "米国債 20年+ (Long)" : "미국 장기채 20Y+ (Long)" }
          ]
        }
      ]
    });
    container.current.appendChild(script);
  }, [i18n.language]); // [중요] 언어가 바뀔 때마다 useEffect 재실행

  return (
    <div className="tradingview-widget-container" ref={container} style={{ width: "100%", height: "500px" }}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

export default memo(MacroIndicators);