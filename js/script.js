document.addEventListener('DOMContentLoaded', () => {
    
    // 1. 스플래시(로딩) 화면 및 초기 화면 전환
    const progressBar = document.getElementById('progress-bar');
    const splashScreen = document.getElementById('splash-screen');
    const appScreens = document.getElementById('app-screens');
    let requestedInitialScreen = 'main-screen';

    // 로딩 바 애니메이션 시작
    setTimeout(() => {
        if (progressBar) progressBar.style.width = '100%';
    }, 100);

    // 2.8초 후 로딩 화면을 숨기고 메인 앱 화면을 보여줌
    setTimeout(() => {
        if (splashScreen) splashScreen.style.display = 'none';
        if (appScreens) {
            appScreens.style.display = 'flex';
            showScreen(requestedInitialScreen);
            renderDictionary(); // 사전 데이터 미리 준비
        }
    }, 2800); 

    // 2. 햄버거 메뉴 열기/닫기
    const menuBtn = document.getElementById('menu-btn');
    const sideMenu = document.getElementById('side-menu');
    let isMenuOpen = false;

    if (menuBtn && sideMenu) {
        menuBtn.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                sideMenu.classList.add('open');
            } else {
                sideMenu.classList.remove('open');
            }
        });
    }

    // 3. 메인 화면 언어 선택 스크롤 기능
    const leftArrow = document.getElementById('left-arrow');
    const rightArrow = document.getElementById('right-arrow');
    const langSlider = document.getElementById('lang-slider');
    const scrollBar = document.getElementById('scroll-bar');
    
    let currentScroll = 0;
    const scrollAmount = 100;
    const maxScroll = -250;   

    if (rightArrow && leftArrow && langSlider && scrollBar) {
        rightArrow.addEventListener('click', () => {
            currentScroll -= scrollAmount;
            if (currentScroll < maxScroll) currentScroll = maxScroll; 
            updateSlider();
        });

        leftArrow.addEventListener('click', () => {
            currentScroll += scrollAmount;
            if (currentScroll > 0) currentScroll = 0; 
            updateSlider();
        });

        function updateSlider() {
            langSlider.style.transform = `translateX(${currentScroll}px)`;
            // 바 이동 비율도 최대 이동 거리(250)에 맞춰 조정
            let barPosition = (Math.abs(currentScroll) / Math.abs(maxScroll)) * 30;
            scrollBar.style.left = `${barPosition}px`;
        }
    }

    // 4. 화면 전환(네비게이션) 기능
    const screens = document.querySelectorAll('.screen');
    const navLinks = document.querySelectorAll('.nav-link');
    const placeholderTitle = document.getElementById('placeholder-title');
    const goHome = document.getElementById('go-home');

    function showScreen(targetId) {
        screens.forEach(screen => {
            screen.style.display = screen.id === targetId ? 'flex' : 'none';
        });

        if (sideMenu) {
            sideMenu.classList.remove('open');
            isMenuOpen = false; 
        }

        if (targetId === 'dictionary-screen') {
            calculateItemsPerPage();
            renderDictionary();
        }

        if (targetId === 'placeholder-screen') {
            loadConversationHistory();
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            
            if (targetId === 'placeholder-screen' && placeholderTitle) {
                placeholderTitle.textContent = link.getAttribute('data-title') + " 페이지 준비 중입니다.";
            }
            showScreen(targetId);
        });
    });

    if (goHome) {
        goHome.addEventListener('click', () => showScreen('main-screen'));
    }


    // 5. 학교 용어 사전 데이터 및 로직
    const rawData = [
        { term: "e-알리미 / 하이클래스", def: "학교 공식 소통 앱 (종이 가정통신문 대체 - 알림 반드시 켜둘 것)" },
        { term: "공개수업", def: "학부모가 수업을 지켜봄 (의무는 아니나 참여율 높음)" },
        { term: "나이스(NEIS)", def: "교육부 교육정보 종합 서비스 (성적·출결 실시간 조회 가능)" },
        { term: "녹색어머니회", def: "등교 시간 교통안전 봉사 (학부모 순번제)" },
        { term: "모둠/모둠활동", def: "소규모 조별 협동 학습 (참여도와 태도가 수행평가에 직결)" },
        { term: "생기부 (학교생활기록부)", def: "학교 생활 전반 공식 기록 문서 (수시 입시의 핵심)" },
        { term: "서술형/논술형 문항", def: "문장으로 답하는 주관식 시험" },
        { term: "수행평가", def: "과제·발표·태도 등 상시 평가 (비중 40~50% 이상 — 매우 중요)" },
        { term: "수익(수학익힘책)", def: "수학 교과서 세트 문제집 ('수익'은 돈이 아님!)" },
        { term: "시정표", def: "공식 일과 시간표 (8시 40분까지 교실 입실 = 정시 등교)" },
        { term: "실내화", def: "교실에서 쓰는 전용 신발 (매주 금요일 집에 가져가 세탁)" },
        { term: "안심알리미", def: "등·하교 문자 알림 서비스" },
        { term: "임원 선거", def: "반장·부반장 선출 (저학년부터 진행, 생기부에 기록)" },
        { term: "재량휴업일", def: "학교장 지정 특별 휴일 (공휴일 아님)" },
        { term: "정기고사 이의신청", def: "채점 오류 공식 이의 제기 기간" },
        { term: "지각/조퇴/결과", def: "출결 세부 용어 (생기부에 기록, 누적 시 진학에 불리)" },
        { term: "지필평가", def: "중간·기말고사 (정기 필기시험)" },
        { term: "창체(창의적 체혐활동)", def: "정규 교과 외 필수 활동 (자율·동아리·봉사·진로)" },
        { term: "체육복 등교", def: "체육 수업 있는 날 복장 규정" },
        { term: "학기 초 개인 준비물", def: "물티슈와 빗자루 등 (공용이 아님 - 개인 사물함에 보관)" },
        { term: "학부모 상담 주간", def: "담임교사와 1:1 정기 면담 (문제가 있어서 부르는 게 아님)" },
        { term: "학부모회/총회", def: "공식 학부모 기구 (매년 3월, 단순 친목 모임 아님)" }
    ];

    rawData.sort((a, b) => a.term.localeCompare(b.term));

    function getInitial(str) {
        const charCode = str.charCodeAt(0);
        if (charCode >= 44032 && charCode <= 55203) {
            const initials = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
            return initials[Math.floor((charCode - 44032) / 588)];
        }
        return str.charAt(0).toUpperCase();
    }

    let filteredData = [...rawData];
    let currentPage = 1;
    let pageWindowStart = 1;
    
    let itemsPerPage = 5; 
    const maxPageButtons = 3;

    const dictList = document.getElementById('dict-list');
    const pageNumbersDiv = document.getElementById('page-numbers');
    const btnPrev = document.getElementById('page-prev');
    const btnNext = document.getElementById('page-next');
    const searchInput = document.getElementById('dict-search');

    function calculateItemsPerPage() {
        if (!dictList) return;
        
        const listHeight = dictList.clientHeight;
        
        const estimatedItemHeight = 95; 

        if (listHeight > 0) {
            itemsPerPage = Math.max(2, Math.floor(listHeight / estimatedItemHeight));
        } else {
            itemsPerPage = 4; // 기본값을 4개 정도로 여유있게 설정
        }
    }

    window.addEventListener('resize', () => {
        if (document.getElementById('dictionary-screen').style.display === 'flex') {
            calculateItemsPerPage();
            renderDictionary();
        }
    });

    function renderDictionary() {
        if (!dictList) return;
        dictList.innerHTML = '';
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const pageData = filteredData.slice(startIndex, startIndex + itemsPerPage);

        let currentInitial = '';

        pageData.forEach(item => {
            const initial = getInitial(item.term);
            if (initial !== currentInitial) {
                const initialDiv = document.createElement('div');
                initialDiv.className = 'dict-initial';
                initialDiv.textContent = initial;
                dictList.appendChild(initialDiv);
                currentInitial = initial;
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = 'dict-item';
            itemDiv.innerHTML = `
                <div class="dict-term">${item.term}</div>
                <div class="dict-def">${item.def}</div>
            `;
            dictList.appendChild(itemDiv);
        });

        renderPagination();
    }

    function renderPagination() {
        if (!pageNumbersDiv) return;
        pageNumbersDiv.innerHTML = '';
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);

        if (totalPages === 0) {
            btnPrev.disabled = true;
            btnNext.disabled = true;
            return;
        }

        let startPage, endPage;
        if (totalPages <= 3) {
            startPage = 1;
            endPage = totalPages;
        } else {
            if (currentPage === 1) {
                startPage = 1;
                endPage = 3;
            } else if (currentPage === totalPages) {
                startPage = totalPages - 2;
                endPage = totalPages;
            } else {
                // 현재 페이지가 중앙에 오도록 설정 (예: 2 3 4)
                startPage = currentPage - 1;
                endPage = currentPage + 1;
            }
        }

        // 계산된 범위만큼 번호 버튼 생성
        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            // 현재 페이지면 'active' 클래스를 붙여 색상을 칠함
            btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
            btn.textContent = i;
            
            btn.addEventListener('click', () => {
                currentPage = i;
                renderDictionary(); // 목록과 페이지네이션 동시 갱신
            });
            pageNumbersDiv.appendChild(btn);
        }

        // 첫 페이지나 마지막 페이지일 때 화살표 버튼 비활성화
        btnPrev.disabled = (currentPage === 1);
        btnNext.disabled = (currentPage === totalPages);
    }

    // 🌟 수정된 이전(<) / 다음(>) 버튼 이벤트
    if (btnPrev && btnNext) {
        // 기존 이벤트를 덮어쓰거나 기존 코드를 지우고 아래 코드를 넣으세요.
        
        // 이전 버튼 클릭 시
        btnPrev.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderDictionary();
            }
        };

        // 다음 버튼 클릭 시
        btnNext.onclick = () => {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderDictionary();
            }
        };
    }


    // 6. 사전 검색 기능
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            // 사용자가 입력한 검색어 (공백 제거 및 소문자 변환)
            const keyword = e.target.value.trim().toLowerCase();

            // 검색어가 포함된 항목만 필터링 (단어 이름이나 뜻풀이에 포함되어 있으면 됨)
            filteredData = rawData.filter(item => 
                item.term.toLowerCase().includes(keyword) || 
                item.def.toLowerCase().includes(keyword)
            );

            // 검색 결과가 나오면 무조건 1페이지부터 보여주기
            currentPage = 1; 
            
            // 화면 다시 그리기
            renderDictionary(); 
        });
    }

    // 7. 회원가입, 로그인, 소셜 로그인
    // 배포 환경에서는 index.html 전에 window.MAEUM_API_BASE_URL을 지정해 API 주소를 바꿀 수 있습니다.
    const API_BASE_URL = window.MAEUM_API_BASE_URL || 'http://localhost:8080';
    const accessTokenKey = 'maeumari.accessToken';
    const userKey = 'maeumari.user';
    const loginForm = document.getElementById('id-login-form');
    const signupForm = document.getElementById('signup-form');
    const loginMessage = document.getElementById('login-message');
    const signupMessage = document.getElementById('signup-message');
    const socialMessage = document.getElementById('social-login-message');
    const googleLoginButton = document.getElementById('google-login-btn');
    const kakaoLoginButton = document.getElementById('kakao-login-btn');
    const menuLoginButton = document.getElementById('menu-login-btn');
    const menuSignupLink = document.getElementById('menu-signup-link');
    const logoutButton = document.getElementById('logout-btn');
    const signedInUser = document.getElementById('signed-in-user');
    const historyStatus = document.getElementById('history-status');
    const historyList = document.getElementById('history-list');

    function getAccessToken() {
        return sessionStorage.getItem(accessTokenKey);
    }

    function getStoredUser() {
        try {
            return JSON.parse(sessionStorage.getItem(userKey));
        } catch {
            return null;
        }
    }

    function saveSession(authResponse) {
        sessionStorage.setItem(accessTokenKey, authResponse.accessToken);
        sessionStorage.setItem(userKey, JSON.stringify(authResponse.user));
        updateAuthArea();
    }

    function clearSession() {
        sessionStorage.removeItem(accessTokenKey);
        sessionStorage.removeItem(userKey);
        updateAuthArea();
    }

    function updateAuthArea() {
        const user = getStoredUser();
        const isLoggedIn = Boolean(getAccessToken() && user);
        if (signedInUser) {
            signedInUser.hidden = !isLoggedIn;
            signedInUser.textContent = isLoggedIn ? `${user.displayName}님` : '';
        }
        if (menuLoginButton) menuLoginButton.hidden = isLoggedIn;
        if (menuSignupLink) menuSignupLink.hidden = isLoggedIn;
        if (logoutButton) logoutButton.hidden = !isLoggedIn;
    }

    async function apiRequest(path, options = {}) {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || '요청을 처리하지 못했습니다.');
        }
        return data;
    }

    function setMessage(element, message, isError = true) {
        if (!element) return;
        element.textContent = message;
        element.style.color = isError ? '#d23b3b' : '#287a3c';
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            setMessage(loginMessage, '');
            const formData = new FormData(loginForm);
            try {
                const result = await apiRequest('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        username: formData.get('username'),
                        password: formData.get('password')
                    })
                });
                saveSession(result);
                loginForm.reset();
                showScreen('main-screen');
            } catch (error) {
                setMessage(loginMessage, error.message);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            setMessage(signupMessage, '');
            const formData = new FormData(signupForm);
            if (formData.get('password') !== formData.get('passwordConfirm')) {
                setMessage(signupMessage, '비밀번호와 비밀번호 확인이 일치하지 않습니다.');
                return;
            }
            try {
                const result = await apiRequest('/api/auth/signup', {
                    method: 'POST',
                    body: JSON.stringify({
                        username: formData.get('username'),
                        password: formData.get('password'),
                        displayName: formData.get('displayName'),
                        preferredLanguage: formData.get('preferredLanguage'),
                        email: formData.get('email'),
                        termsAccepted: formData.get('termsAccepted') === 'on'
                    })
                });
                signupForm.reset();
                if (result.emailVerificationRequired) {
                    setMessage(signupMessage, result.message, false);
                    return;
                }
                saveSession(result.authentication);
                showScreen('main-screen');
            } catch (error) {
                setMessage(signupMessage, error.message);
            }
        });
    }

    function startSocialLogin(provider) {
        window.location.assign(`${API_BASE_URL}/oauth2/authorization/${provider}`);
    }

    if (googleLoginButton) googleLoginButton.addEventListener('click', () => startSocialLogin('google'));
    if (kakaoLoginButton) kakaoLoginButton.addEventListener('click', () => startSocialLogin('kakao'));

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            clearSession();
            showScreen('main-screen');
        });
    }

    async function configureSocialLoginButtons() {
        try {
            const providers = await apiRequest('/api/auth/social/providers');
            const enabled = new Set(providers);
            [
                ['google', googleLoginButton],
                ['kakao', kakaoLoginButton]
            ].forEach(([provider, button]) => {
                if (!button) return;
                button.disabled = !enabled.has(provider);
                if (button.disabled) button.title = '소셜 로그인 설정이 아직 완료되지 않았습니다.';
            });
            if (providers.length === 0) {
                setMessage(socialMessage, '소셜 로그인은 현재 준비 중입니다. 아이디 로그인을 이용해 주세요.');
            }
        } catch {
            setMessage(socialMessage, '로그인 서버에 연결할 수 없습니다.');
        }
    }

    async function loadConversationHistory() {
        if (!historyStatus || !historyList) return;
        const token = getAccessToken();
        historyList.replaceChildren();
        if (!token) {
            historyStatus.textContent = '로그인하면 번역 기록을 확인할 수 있어요.';
            return;
        }

        historyStatus.textContent = '이전 번역을 불러오는 중이에요.';
        try {
            const conversations = await apiRequest('/api/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (conversations.length === 0) {
                historyStatus.textContent = '아직 저장된 번역 기록이 없어요.';
                return;
            }

            historyStatus.textContent = `${conversations.length}개의 번역 기록이 있어요.`;
            conversations.forEach((conversation) => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'history-item';

                const original = document.createElement('p');
                original.className = 'history-original';
                original.textContent = conversation.originalText;
                const translation = document.createElement('p');
                translation.className = 'history-translation';
                translation.textContent = conversation.translatedText;
                const date = document.createElement('time');
                date.className = 'history-date';
                date.dateTime = conversation.createdAt;
                date.textContent = new Date(conversation.createdAt).toLocaleString('ko-KR');
                item.append(original, translation, date);
                item.addEventListener('click', () => {
                    const input = document.querySelector('.input-box');
                    const output = document.querySelector('.output-box');
                    if (input) input.value = conversation.originalText;
                    if (output) output.textContent = conversation.translatedText;
                    showScreen('main-screen');
                });
                historyList.appendChild(item);
            });
        } catch (error) {
            if (error.message.includes('로그인') || error.message.includes('인증')) clearSession();
            historyStatus.textContent = error.message;
        }
    }

    async function completeOAuthLogin() {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const token = params.get('access_token');
        const oauthError = params.get('oauth_error');
        if (!token && !oauthError) return;
        window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
        if (oauthError) {
            setMessage(socialMessage, oauthError);
            requestedInitialScreen = 'login-screen';
            if (appScreens && appScreens.style.display === 'flex') showScreen(requestedInitialScreen);
            return;
        }
        try {
            const user = await apiRequest('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            saveSession({ accessToken: token, user });
            requestedInitialScreen = 'main-screen';
            if (appScreens && appScreens.style.display === 'flex') showScreen(requestedInitialScreen);
        } catch (error) {
            setMessage(socialMessage, '소셜 로그인 정보를 확인하지 못했습니다. 다시 시도해 주세요.');
            requestedInitialScreen = 'login-screen';
            if (appScreens && appScreens.style.display === 'flex') showScreen(requestedInitialScreen);
        }
    }

    updateAuthArea();
    configureSocialLoginButtons();
    completeOAuthLogin();
})



