import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

function Login() {
  const navigate = useNavigate();

  // [중요] 아까 복사한 클라이언트 ID를 여기에 넣으세요!
  // 예: "123456789-abcdefg.apps.googleusercontent.com"
  const clientId = "71272653934-b7gbdcpaq6t4i7s4jq0qnsasjdj5eqph.apps.googleusercontent.com"; 

  const handleSuccess = (credentialResponse) => {
    // 1. 구글이 준 토큰을 해독해서 사용자 정보를 빼냅니다.
    const decoded = jwtDecode(credentialResponse.credential);
    console.log("로그인 성공:", decoded);

    // 2. 사용자 정보를 로컬 스토리지에 저장 (임시 세션 역할)
    // 실제로는 이 토큰을 백엔드(Spring Boot)로 보내서 검증해야 하지만, 
    // 일단 프론트엔드 완성을 위해 여기서 처리합니다.
    localStorage.setItem('token', credentialResponse.credential); // 토큰 저장
    localStorage.setItem('userEmail', decoded.email); // 이메일 저장
    localStorage.setItem('userName', decoded.name);   // 이름 저장
    localStorage.setItem('userPicture', decoded.picture); // 프로필 사진 저장

    // 3. 대시보드로 이동
    navigate('/dashboard');
  };

  const handleError = () => {
    console.log("로그인 실패");
    alert("구글 로그인에 실패했습니다. 다시 시도해 주세요.");
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div style={containerStyle}>
        <div style={cardStyle}>
          {/* 로고 영역 */}
          <div style={{ marginBottom: '30px' }}>
            <span style={{ fontSize: '3rem' }}>📊</span>
            <h1 style={{ color: '#2c3e50', margin: '10px 0', fontSize: '1.8rem' }}>AssetFlow</h1>
            <p style={{ color: '#7f8c8d' }}>당신의 자산을 스마트하게 관리하세요.</p>
          </div>

          {/* 구글 로그인 버튼 영역 */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', marginBottom: '40px' }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              size="large"
              shape="pill"
              width="300"
              theme="outline"
              text="continue_with"
            />
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', fontSize: '0.85rem', color: '#95a5a6' }}>
            © 2026 AssetFlow Corp. All rights reserved.
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

// --- Styles ---
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: '#f0f2f5',
  backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' // 배경 그라데이션 추가
};

const cardStyle = {
  backgroundColor: 'white',
  padding: '50px 40px',
  borderRadius: '16px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  width: '100%',
  maxWidth: '400px',
  textAlign: 'center'
};

export default Login;