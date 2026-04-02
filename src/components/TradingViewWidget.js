import React, { useEffect, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next'; // [추가]

function TradingViewWidget() {
  const container = useRef();
  const { i18n } = useTranslation(); // [추가]

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = "";
    }

    const isJa = i18n.language === 'ja'; // 일본어 체크

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;

    script.innerHTML = JSON.stringify({
      "symbols": [
        ["S&P 500", "FOREXCOM:SPXUSD|1M"],
        ["Nasdaq 100", "FOREXCOM:NSXUSD|1M"],
        ["Dow 30", "FOREXCOM:DJI|1M"],
        // 아까 타협하신 IWM (ETF) 그대로 유지
        ["Russell 2000", "AMEX:IWM|1M"], 
        ["Bitcoin", "BINANCE:BTCUSD|1M"]
      ],
      "chartOnly": false,
      "width": "100%",
      "height": "500",
      
      // [핵심] 언어 설정 동적 변경
      "locale": isJa ? "ja" : "kr",
      
      "colorTheme": "light",
      "autosize": true,
      "showVolume": false,
      "showMA": false,
      "hideDateRanges": false,
      "hideMarketStatus": false,
      "hideSymbolLogo": false,
      "scalePosition": "right",
      "scaleMode": "Normal",
      "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      "fontSize": "10",
      "noTimeScale": false,
      "valuesTracking": "1",
      "changeMode": "price-and-percent",
      "chartType": "area",
      "lineWidth": 2,
      "lineType": 0,
      "dateRanges": [
        "1d|1",
        "1m|30",
        "3m|60",
        "12m|1D",
        "60m|1W",
        "all|1M"
      ]
    });

    if (container.current) {
        container.current.appendChild(script);
    }

    return () => {
        if (container.current) {
            container.current.innerHTML = "";
        }
    };
  }, [i18n.language]); // [중요] 언어 변경 감지

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "500px", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
    </div>
  );
}

export default memo(TradingViewWidget);