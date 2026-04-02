import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
import SearchBar from './components/SearchBar';
import TickerTape from './components/TickerTape';
import TradingViewWidget from './components/TradingViewWidget';
import MacroIndicators from './components/MacroIndicators';
import MarketNews from './components/MarketNews';

function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const userPicture = localStorage.getItem('userPicture');

    if (token && userName) {
      setUser({ name: userName, picture: userPicture });
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    // 1. 로컬 스토리지 클리어
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPicture');
    localStorage.removeItem('userEmail');
    
    // 2. 상태 초기화 및 새로고침
    setUser(null);
    window.location.reload(); 
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      
      {/* Header & Ticker */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        
        <header style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row', 
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '15px' : '10px 40px',
          gap: isMobile ? '15px' : '0',
          height: 'auto',
          borderBottom: '1px solid #eee'
        }}>
          
          {/* [왼쪽] 로고 영역 */}
          <div style={{ 
            flex: isMobile ? 'auto' : 1, 
            width: isMobile ? '100%' : 'auto', 
            display: 'flex', 
            justifyContent: isMobile ? 'space-between' : 'flex-start',
            alignItems: 'center'
          }}>
            <div 
              style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} 
              onClick={() => navigate('/')}
            >
              📊 AssetFlow
            </div>

            {/* [모바일] 우측 상단 버튼들 */}
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LanguageSwitcher />
                {user ? (
                  <>
                    <button onClick={() => navigate('/dashboard')} style={dashboardBtnStyle}>Dashboard</button>
                    {/* [추가] 모바일 로그아웃 버튼 (작게) */}
                    <button onClick={handleLogout} style={mobileLogoutStyle}>Run</button>
                  </>
                ) : (
                  <button onClick={() => navigate('/login')} style={loginBtnStyle}>{t('login_btn')}</button>
                )}
              </div>
            )}
          </div>

          {/* [중앙] 검색창 */}
          <div style={{ 
            flex: isMobile ? 'auto' : 1, 
            width: isMobile ? '100%' : 'auto',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <SearchBar />
          </div>

          {/* [오른쪽] PC 버튼들 */}
          {!isMobile && (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center', 
              gap: '15px' 
            }}>
              <LanguageSwitcher />
              
              {user ? (
                <>
                  {/* 프로필 정보 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginRight: '5px' }} onClick={() => navigate('/dashboard')}>
                    {user.picture && <img src={user.picture} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #ddd' }} />}
                    <span style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '0.9rem' }}>{user.name}</span>
                  </div>
                  
                  {/* 대시보드 버튼 */}
                  <button onClick={() => navigate('/dashboard')} style={dashboardBtnStyle}>
                    Dashboard
                  </button>
                  
                  {/* [추가] 로그아웃 버튼 */}
                  <button onClick={handleLogout} style={logoutBtnStyle}>
                    {t('logout')}
                  </button>
                </>
              ) : (
                <button onClick={() => navigate('/login')} style={loginBtnStyle}>
                  {t('login_btn')}
                </button>
              )}
            </div>
          )}

        </header>
        <TickerTape />
      </div>

      {/* Main Content (기존 동일) */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '20px 10px' : '30px 20px' }}>
        <section style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '2.5fr 1fr', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>📉 Global Market Overview</h2>
            <TradingViewWidget />
          </div>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>🔑 Key Indicators</h2>
            <MacroIndicators />
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>📰 Breaking News</h2>
          <MarketNews />
        </section>
      </main>

      {/* Footer (기존 동일) */}
      <footer style={{ backgroundColor: '#2c3e50', color: 'white', padding: '40px 0', textAlign: 'center', marginTop: '50px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>AssetFlow</h3>
          <p style={{ color: '#bdc3c7', fontSize: '0.9rem' }}>
            Global Financial Data & Asset Management Service
          </p>
          <div style={{ marginTop: '20px', fontSize: '0.8rem', color: '#95a5a6' }}>
            © 2026 AssetFlow. All rights reserved. <br/>
            Data provided by TradingView.
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Styles ---
const loginBtnStyle = {
  padding: '8px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap'
};

const dashboardBtnStyle = {
  padding: '8px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap'
};

// [추가] 로그아웃 버튼 스타일 (회색 계열로 차분하게)
const logoutBtnStyle = {
  padding: '8px 15px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap', transition: '0.2s'
};

// [추가] 모바일용 작은 로그아웃 버튼
const mobileLogoutStyle = {
  padding: '8px 10px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap'
};

const cardStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  overflow: 'hidden'
};

const sectionTitleStyle = {
  fontSize: '1.2rem',
  color: '#2c3e50',
  marginBottom: '15px',
  borderLeft: '4px solid #3498db',
  paddingLeft: '10px'
};

export default LandingPage;