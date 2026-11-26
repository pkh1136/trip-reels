/* 제휴(파트너스) 설정
   각 제휴 프로그램에서 받은 추적 파라미터를 "이름=값" 형태로 넣으면 해당 사이트 링크에 자동으로 붙고,
   하나라도 입력되면 화면 아래에 제휴 고지 문구가 표시됩니다. 비워 두면 일반 링크로 동작합니다.
   예) klook: 'aid=12345',  agoda: 'cid=1234567',  booking: 'aid=1234567'
   마이리얼트립 파트너스처럼 전용 링크 형식이면 안내받은 파라미터를 그대로 넣으세요.
   ※ 제휴 수익이 생기면 '상업적 이용'으로 볼 수 있어요. 날씨에 쓰는 Open-Meteo 무료 API는 비상업용이라,
     제휴 ID를 넣기 전에 Open-Meteo 약관(https://open-meteo.com/en/terms)과 유료 플랜을 먼저 확인하세요. */
const AFFILIATE = {
  myrealtrip: '',
  klook: '',
  agoda: '',
  booking: '',
  skyscanner: ''
};
