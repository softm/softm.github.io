export const SITE_INTEGRATIONS=Object.freeze({
  "weatherhannun": {
    "name": "날씨한눈",
    "keys": [
      "weatherhannun_places_v2",
      "weatherhannun_location",
      "weatherhannun_activity_v1",
      "weatherhannun:plus-personalization:v1",
      "weatherhannun:screen-weather:v1"
    ],
    "label": "저장한 지역·선택 위치·활동 설정·맞춤 설정",
    "target": ".topbar .topbar-actions, .topbar .header-actions, .topbar"
  },
  "juyuhannun": {
    "name": "주유한눈",
    "keys": [
      "juyu:favorites:v1",
      "juyu:fuel:v1",
      "juyu:route-destinations:v1"
    ],
    "label": "찜한 주유소·유종·직접 저장한 최근 목적지",
    "target": ".header-actions"
  },
  "evchargingstation": {
    "name": "충전한눈",
    "keys": [
      "evchargingstation:favorites:v1"
    ],
    "label": "관심 충전소",
    "target": ".app-header"
  },
  "hydrogenstation": {
    "name": "수소충전한눈",
    "keys": [
      "h2-favorites-v1"
    ],
    "label": "관심 수소충전소",
    "target": ".topbar"
  },
  "foodhannun": {
    "name": "음식한눈",
    "keys": [
      "foodhannun:v1"
    ],
    "label": "저장한 레시피·장보기·최근 검색·개인 메모",
    "target": ".site-header .container, .site-header"
  },
  "matjiphannun": {
    "name": "맛집한눈",
    "keys": [
      "matjiphannun:v1:favorites",
      "matjiphannun:v1:reviews",
      "matjiphannun:v1:savedLocations",
      "matjiphannun:v1:settings"
    ],
    "label": "즐겨찾기·방문기록·저장한 동네·검색 설정",
    "target": ".panel-footer > div"
  },
  "goldsignal": {
    "name": "금시그널",
    "keys": [
      "goldSignalPriceUnitV1",
      "goldSignalTargetPerGramV1"
    ],
    "label": "가격 표시 단위·목표가",
    "target": ".topbar-actions"
  },
  "calc": {
    "name": "계산기",
    "keys": [
      "calc.history.v1",
      "calc.settings.v1",
      "calc.notes.v1"
    ],
    "label": "계산 기록·설정·계산노트",
    "target": ".header-actions"
  },
  "policyfundfinder": {
    "name": "지원한눈",
    "keys": [
      "jiwonhannun-v1"
    ],
    "label": "사업 프로필·관심사업·신청 준비·메모",
    "target": ".header-actions, .topbar-actions, header"
  },
  "homecare": {
    "name": "돌봄한눈",
    "keys": [],
    "label": "유형별 담은 기관과 방문 순서",
    "target": ".stitch-app-header",
    "sessionKeys": [
      "careCompare:v1:facility",
      "careCompare:v1:daycare",
      "careCompare:v1:home-care",
      "careCompare:v1:home-nursing",
      "careCompare:v1:home-bath",
      "careCompare:v1:short-stay",
      "careCompare:v1:welfare-equipment",
      "careCompare:v1:dementia",
      "careCompare:v1:nursing-hospital"
    ]
  },
  "auctionhannun": {
    "name": "경매한눈",
    "keys": [],
    "label": "현재 작업공간의 등록 사건·관심물건·체크·메모·조사 기록",
    "target": ".topbar-inner",
    "bridge": true
  },
  "bizhannun": {
    "name": "사업자한눈",
    "keys": [],
    "label": "현재 작업공간의 거래처·사업 프로필·확인 기록",
    "target": ".header-actions, .topbar-actions, header",
    "bridge": true
  },
  "norn": {
    "name": "노른",
    "keys": [],
    "label": "현재 프로젝트의 편집 설정·장면·SNS 문구 (원본 사진·영상 제외)",
    "target": ".header-actions, .top-actions, header",
    "bridge": true
  },
  "seolgyehaeyo": {
    "name": "설계해요",
    "keys": [],
    "label": "현재 프로젝트의 의뢰·계약·일정·질문 기록 (원본 첨부파일 제외)",
    "target": "[data-suite-vault-anchor], header",
    "bridge": true
  }
});
