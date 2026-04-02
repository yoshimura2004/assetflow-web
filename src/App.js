import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import LandingPage from './LandingPage'; // [추가] 방금 만든 페이지
import StockDetail from './StockDetail';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. 메인 주소(/)는 이제 랜딩 페이지입니다. */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. 로그인 페이지는 별도 주소(/login)로 분리합니다. */}
        <Route path="/login" element={<Login />} />

        {/* 3. 대시보드(/dashboard)는 그대로 유지 */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* [추가] 상세 페이지 라우트 (:symbol 부분은 변수처럼 쓰입니다) */}
        <Route path="/stock/:symbol" element={<StockDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;