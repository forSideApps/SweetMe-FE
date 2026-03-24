# SweetMe FE — CLAUDE.md

상위 디렉토리의 `/SweetMe/CLAUDE.md` 참고.

## 기술 스택
- React 18 + Vite
- Vanilla CSS (UI 프레임워크 없음, `src/index.css` 단일 파일)
- Axios (`src/api/client.js`)
- react-router-dom v6
- react-fast-marquee (홈 기업 슬라이드)

## 파일 구조
```
src/
├── api/
│   ├── client.js       # Axios 인스턴스 (baseURL: /api, withCredentials: true)
│   ├── auth.js         # 인증·마이페이지
│   ├── rooms.js        # 스터디방
│   ├── review.js       # 포폴·이력서·서로보기
│   ├── community.js    # 커뮤니티
│   └── themes.js       # 기업 테마
├── components/
│   ├── Navbar.jsx      # 상단 네비게이션 + 모바일 햄버거 메뉴
│   ├── Footer.jsx
│   ├── ThemeLogo.jsx   # 기업 로고
│   ├── Pagination.jsx
│   ├── StatusBadge.jsx
│   ├── EmptyState.jsx
│   ├── Alert.jsx
│   └── LockedField.jsx
├── pages/
│   ├── Home.jsx            # 홈 (기업 마퀴 슬라이드 + 최근 스터디)
│   ├── RoomBrowse.jsx      # 스터디 전체 목록
│   ├── RoomList.jsx        # 테마별 스터디 목록
│   ├── RoomDetail.jsx      # 스터디 상세
│   ├── RoomCreate.jsx      # 스터디 개설
│   ├── Review.jsx          # 포폴·이력서 목록 (비회원 팝업 포함)
│   ├── ReviewDetail.jsx    # 포폴·이력서 상세
│   ├── ReviewCreate.jsx    # 포폴·이력서 작성
│   ├── ReviewEdit.jsx      # 포폴·이력서 수정
│   ├── Community.jsx       # 커뮤니티 목록 (COMPANY_SCHEDULE 카드 뷰)
│   ├── CommunityDetail.jsx # 커뮤니티 상세
│   ├── CommunityCreate.jsx # 커뮤니티 글쓰기 (COMPANY_SCHEDULE 구조화 폼)
│   ├── MyPage.jsx          # 마이페이지 (탭: profile/rooms/applications/reviews/exchanges/posts)
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Admin.jsx
│   ├── ManageDashboard.jsx
│   └── ManageLogin.jsx
├── constants/
│   └── jobRoles.js
├── hooks/
│   ├── useDebounce.js
│   └── useTheme.js
└── utils/
    └── date.js
```

## CSS 주요 클래스 (index.css)

| 클래스 | 용도 |
|--------|------|
| `.container` | 최대 너비 컨테이너 |
| `.btn .btn-accent .btn-ghost .btn-sm` | 버튼 |
| `.room-card` | 스터디방 카드 |
| `.post-row` | 커뮤니티 게시글 행 |
| `.schedule-card` | 채용일정 카드 |
| `.guest-review-banner` | 비회원 포폴 배너 |
| `.mobile-menu` | 모바일 햄버거 메뉴 |
| `.company-carousel-border` | 기업 마퀴 래퍼 |
| `.company-pill` | 기업 선택 버튼 |

## 채용일정(COMPANY_SCHEDULE) 포맷
글쓰기 시 구조화 폼 → content 자동 생성:
```
📅 결과 공개: 2026년 5월 4일 (월) 15:00
🏢 기업명: 삼성전자
📋 채용 유형: 신입공채
🎯 전형 단계: 서류
📝 메모: ...
```

## 비회원 포폴·이력서 배너
- `/reviews` 접속 시 비로그인이면 배너 표시
- "다시 보지 않기" 클릭 → `localStorage['review_guest_banner_hidden'] = 'true'`

## 개발 서버
```bash
npm install
npm run dev  # localhost:5173, /api → localhost:21001 프록시
```

## 빌드
```bash
npm run build  # dist/ 생성
```
