// 1 KRW = 0.11 JPY (약 100엔 = 900원 가정)
const EXCHANGE_RATE = 0.11; 

export const convertAndFormat = (amount, language) => {
  if (!amount) return 0;

  // 1. 일본어(ja)라면 환율 적용
  if (language === 'ja') {
    // 소수점 버림 (엔화는 보통 소수점 안 씀)
    const converted = Math.floor(amount * EXCHANGE_RATE);
    return converted.toLocaleString(); 
  }

  // 2. 한국어(ko)라면 그대로 콤마만 찍기
  return amount.toLocaleString();
};