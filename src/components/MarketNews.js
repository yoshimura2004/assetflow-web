import React, { useEffect, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next'; // [추가]

function MarketNews() {
  const container = useRef();
  const { i18n } = useTranslation(); // [추가]

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = "";
    }
    
    const isJa = i18n.language === 'ja';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "feedMode": "all_symbols",
      "colorTheme": "light",
      "isTransparent": false,
      "displayMode": "regular",
      "width": "100%",
      "height": "600",
      
      // [핵심] 언어에 따라 뉴스 소스가 바뀝니다! (한국 뉴스 vs 일본 뉴스)
      "locale": isJa ? "ja" : "kr",
      
      "largeChartUrl": ""
    });
    container.current.appendChild(script);
  }, [i18n.language]); // [중요] 언어 변경 감지

  return (
    <div className="tradingview-widget-container" ref={container} style={{ width: "100%", height: "600px" }}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

export default memo(MarketNews);