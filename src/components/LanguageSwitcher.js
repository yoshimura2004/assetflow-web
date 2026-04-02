import React from 'react';
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div style={{ display: 'flex', gap: '5px' }}>
      <button onClick={() => changeLanguage('ko')} style={btnStyle}>🇰🇷 KO</button>
      <button onClick={() => changeLanguage('ja')} style={btnStyle}>🇯🇵 JA</button>
    </div>
  );
}

const btnStyle = {
  padding: '5px 10px',
  cursor: 'pointer',
  backgroundColor: '#ecf0f1',
  border: '1px solid #bdc3c7',
  borderRadius: '3px',
  fontSize: '0.8rem'
};

export default LanguageSwitcher;