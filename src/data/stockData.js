// 미국 주식 & 암호화폐 전용 리스트
export const stockData = [
  // --- Big Tech (M7) ---
  { symbol: "NASDAQ:AAPL", name: "애플 (Apple)", type: "STOCK" },
  { symbol: "NASDAQ:MSFT", name: "마이크로소프트 (Microsoft)", type: "STOCK" },
  { symbol: "NASDAQ:GOOGL", name: "구글 (Alphabet)", type: "STOCK" },
  { symbol: "NASDAQ:AMZN", name: "아마존 (Amazon)", type: "STOCK" },
  { symbol: "NASDAQ:NVDA", name: "엔비디아 (NVIDIA)", type: "STOCK" },
  { symbol: "NASDAQ:TSLA", name: "테슬라 (Tesla)", type: "STOCK" },
  { symbol: "NASDAQ:META", name: "메타 (Meta)", type: "STOCK" },

  // --- Popular ETFs ---
  { symbol: "AMEX:SPY", name: "S&P 500 ETF (SPY)", type: "ETF" },
  { symbol: "NASDAQ:QQQ", name: "나스닥 100 ETF (QQQ)", type: "ETF" },
  { symbol: "AMEX:SOXL", name: "반도체 3배 레버리지 (SOXL)", type: "ETF" },
  { symbol: "NASDAQ:TQQQ", name: "나스닥 3배 레버리지 (TQQQ)", type: "ETF" },

  // --- Crypto ---
  { symbol: "BINANCE:BTCUSD", name: "비트코인 (Bitcoin)", type: "CRYPTO" },
  { symbol: "BINANCE:ETHUSD", name: "이더리움 (Ethereum)", type: "CRYPTO" },
  { symbol: "BINANCE:SOLUSD", name: "솔라나 (Solana)", type: "CRYPTO" },
  { symbol: "BINANCE:DOGEUSD", name: "도지코인 (Dogecoin)", type: "CRYPTO" },

  // --- Forex ---
  { symbol: "FX_IDC:USDKRW", name: "달러/원 환율 (USD/KRW)", type: "FOREX" },
  { symbol: "FX_IDC:USDJPY", name: "달러/엔 환율 (USD/JPY)", type: "FOREX" }
];