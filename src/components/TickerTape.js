import React, { useEffect, useRef } from 'react';

function TickerTape() {
  const container = useRef();

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = "";
    }
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        { "proName": "FOREXCOM:SPXUSD", "title": "S&P 500" },
        { "proName": "FOREXCOM:NSXUSD", "title": "Nasdaq 100" },
        { "proName": "FOREXCOM:DJI", "title": "Dow 30" },
        { "proName": "FX_IDC:USDJPY", "title": "USD/JPY" },
        { "proName": "BINANCE:BTCUSD", "title": "Bitcoin" },
        { "proName": "BINANCE:ETHUSD", "title": "Ethereum" }
      ],
      "showSymbolLogo": true,
      "colorTheme": "light",
      "isTransparent": false,
      "displayMode": "adaptive",
      "locale": "kr"
    });
    container.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ width: "100%" }}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

export default TickerTape;