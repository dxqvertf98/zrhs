const supabaseClient = supabase.createClient(
    "https://qqooqexctuznhzwuzgwg.supabase.co",
    "sb_publishable_ZhvYd3IEYCJEYEe1T-cQFw_VFjWRM7K"
);

console.log("Supabase 연결:", supabaseClient);

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

    // 3-1. 번역할 언어 선택 (버튼 클릭 시 선택 상태로 표시)
    const langButtons = document.querySelectorAll('.lang-btn');
    let selectedLangCode = null;
    let selectedLangLabel = null;

    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            langButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedLangCode = btn.dataset.code;
            selectedLangLabel = btn.textContent.trim();
        });
    });

    // 3-2. AI 맥락 번역 실행
    const inputBox = document.querySelector('.input-box');
    const outputBox = document.querySelector('.output-box');
    const translateBtn = document.getElementById('translate-btn');
    const glossaryPopover = document.getElementById('glossary-popover');
    const popoverTitle = document.getElementById('popover-title');
    const popoverBody = document.getElementById('popover-body');
    const popoverClose = document.getElementById('popover-close');

    const langNames = { vi: '베트남어', zh: '중국어', en: '영어', ja: '일본어', mn: '몽골어' };

    if (popoverClose && glossaryPopover) {
        popoverClose.addEventListener('click', () => { glossaryPopover.hidden = true; });
    }

    function showGlossaryPopover(kind, title, body) {
        if (!glossaryPopover) return;
        glossaryPopover.classList.toggle('doc', kind === 'doc');
        popoverTitle.textContent = title;
        popoverBody.textContent = body;
        glossaryPopover.hidden = false;
    }

    // "생기부 (학교생활기록부)", "e-알리미 / 하이클래스" 처럼 하나의 항목에 여러 이름이 섞여 있는 경우,
    // '/' 와 '(' ')' 를 기준으로 쪼개서 각각의 이름을 전부 뽑아냄 (예: ["생기부", "학교생활기록부"])
    function extractTermVariants(termString) {
        return termString
            .split(/[\/()]/)
            .map(part => part.trim())
            .filter(Boolean);
    }

    // 아래 5번에서 선언하는 학교 용어 사전(rawData)에서 같은 단어를 찾음.
    // (함수 선언은 호이스팅되고, 실제 호출은 버튼 클릭 시점이라 rawData가 이미 준비된 뒤이므로 문제 없음)
    function findDictionaryMatch(term) {
        if (!term) return null;
        const clean = term.trim();
        return rawData.find(item => {
            const variants = extractTermVariants(item.term);
            return variants.some(v => v === clean || v.includes(clean) || clean.includes(v));
        }) || null;
    }

    // 사전에 등록된 단어면 학교 용어 사전 화면으로 이동해서 그 단어를 바로 검색해줌
    function goToDictionaryTerm(rawTerm) {
        const match = findDictionaryMatch(rawTerm);
        showScreen('dictionary-screen');
        if (searchInput) {
            searchInput.value = match ? match.term.split(/[\/(]/)[0].trim() : rawTerm.trim();
            searchInput.dispatchEvent(new Event('input'));
        }
    }

    // 원문 안에서 우리 사전(rawData)에 실제로 등장하는 단어만 골라 AI에게 넘겨줄 컨텍스트로 만듦
    // -> 22개를 전부 보낼 필요 없이, 이 문장에 실제로 쓰인 단어의 "뜻풀이"만 참고자료로 제공
    function buildDictionaryContext(text) {
        const matched = rawData.filter(item => {
            const variants = extractTermVariants(item.term);
            return variants.some(v => text.includes(v));
        });
        if (matched.length === 0) return '(해당 없음 - 이 문장에는 사전에 매칭되는 단어가 없음)';
        return matched.map(item => `- ${item.term}: ${item.def}`).join('\n');
    }

    // AI 모델에게 내릴 지시문. 사전에 있는 단어는 뜻풀이를 참고해 "자세히" 설명하게 하고,
    // 사전에 없어도 헷갈릴 만한 단어는 짧게라도 설명하게 함.
    function buildTranslationPrompt(langName, dictionaryContext) {
        return `당신은 한국 학교/유치원 안내문을 다문화 가정 보호자가 이해할 수 있도록 ${langName}로 번역하는 전문가입니다.

[번역 규칙]
1. 입력된 한국어 문장 전체를 ${langName}로 자연스럽게 번역하세요.
2. 아래 "학교 용어 사전"에 있는 단어가 문장에 나오면, 그 뜻풀이를 참고하여 ${langName}로 자세하고 구체적으로(2~3문장) 설명을 새로 작성하고, 다음처럼 표시하세요:
   <span class="glossary has-doc" data-term="원래 한국어 단어" data-explain="여기에 자세한 설명">번역된 단어</span>
3. 사전에는 없지만 외국인 보호자가 헷갈릴 수 있는 다른 한국 학교 문화 단어(예: 현장체험학습, 생활기록부 등)가 나오면, 짧게라도 설명을 붙여 다음처럼 표시하세요:
   <span class="glossary" data-explain="여기에 설명">번역된 단어</span>
4. 그 외 인사말, 코드블록, 다른 텍스트 없이 번역 결과 HTML만 출력하세요.

[학교 용어 사전 - 이 문장에 등장하는 단어의 뜻풀이]
${dictionaryContext}`;
    }

    // 실제 AI 모델 호출.
    // Google AI Studio(Gemini) API를 브라우저에서 직접 호출합니다.
    // ⚠️ 보안 참고: API 키가 클라이언트 코드에 노출됩니다.
    // Google Cloud Console에서 이 키에 HTTP 리퍼러(도메인) 제한을 걸어두는 것을 권장합니다.
    const GOOGLE_API_KEY = window.MAEUMARI_GEMINI_API_KEY;
    const GEMINI_MODEL = "gemini-flash-latest";

    async function callAIModel(systemPrompt, userText) {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ role: "user", parts: [{ text: userText }] }],
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`AI 번역 서버 호출에 실패했습니다: ${errText}`);
        }

        const data = await response.json();
        const html = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        if (!html) {
            throw new Error('AI 응답 형식이 올바르지 않습니다.');
        }

        return html.replace(/```html/g, '').replace(/```/g, '').trim();
    }

    // AI가 돌려준 HTML(<span class="glossary [has-doc]" data-term="..." data-explain="...">)을 화면에 렌더링
    function renderTranslationResult(html) {
        const clean = window.DOMPurify
            ? DOMPurify.sanitize(html, { ADD_ATTR: ['data-term', 'data-explain'] })
            : html;

        outputBox.innerHTML = clean;
        outputBox.classList.add('has-content');

        outputBox.querySelectorAll('.glossary').forEach(span => {
            const explain = span.getAttribute('data-explain') || '';

            if (span.classList.contains('has-doc')) {
                // 학교 용어 사전에 있는 단어 -> 파란색 + 클릭 시 사전 화면으로 이동
                const term = span.getAttribute('data-term') || span.textContent;
                span.addEventListener('click', () => goToDictionaryTerm(term));
            } else if (explain) {
                // 사전에는 없지만 AI가 설명을 붙여준 단어 -> 탭하면 말풍선으로 설명
                span.addEventListener('click', () => showGlossaryPopover('term', span.textContent, explain));
            }
        });
    }

    async function translateNotice() {
        if (!inputBox || !outputBox) return;
        const text = inputBox.value.trim();

        if (!text) {
            outputBox.classList.remove('has-content');
            outputBox.textContent = '번역할 안내문을 먼저 입력해주세요.';
            return;
        }
        if (!selectedLangCode) {
            outputBox.classList.remove('has-content');
            outputBox.textContent = '번역할 언어를 먼저 선택해주세요.';
            return;
        }

        outputBox.classList.remove('has-content');
        outputBox.textContent = '번역 중입니다...';
        if (translateBtn) translateBtn.disabled = true;

        try {
            const dictionaryContext = buildDictionaryContext(text);
            const langName = langNames[selectedLangCode] || selectedLangLabel;
            const systemPrompt = buildTranslationPrompt(langName, dictionaryContext);
            const html = await callAIModel(systemPrompt, text);
            renderTranslationResult(html);
        } catch (error) {
            outputBox.classList.remove('has-content');
            outputBox.textContent = '번역 중 오류가 발생했어요: ' + error.message;
        } finally {
            if (translateBtn) translateBtn.disabled = false;
        }
    }

    if (translateBtn) {
        translateBtn.addEventListener('click', translateNotice);
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
        { term: "현장체험학습", def: "학교 밖으로 나가는 소풍·견학 형태의 수업 (참가 동의서·비용 납부 필요, 무단으로 빠지면 결석 처리될 수 있음)" },
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
            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email: formData.get('username'),
                    password: formData.get('password')
                });

            if (error) {
                throw error;
            }

            console.log(data);

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
            const { data, error } = await supabaseClient.auth.signUp({
                email: formData.get('email'),
                password: formData.get('password')
            });

            if (error) {
                throw error;
            }

            signupForm.reset();

            setMessage(
                signupMessage,
                '회원가입 성공! 이메일 인증을 확인해주세요.',
                false
            );

            console.log(data);

        } catch (error) {
            setMessage(signupMessage, error.message);
        }
    });
}

    function startSocialLogin(provider) {
        window.location.assign(`${API_BASE_URL}/oauth2/authorization/${provider}`);
    }

    googleLoginButton.addEventListener("click", async()=>{

        const {error} =
        await supabaseClient.auth.signInWithOAuth({
            provider:"google"
        });

        if(error){
            console.log(error.message);
        }
    });

    kakaoLoginButton.addEventListener("click", async()=>{

        const {error} =
        await supabaseClient.auth.signInWithOAuth({
            provider:"kakao"
        });

        if(error){
            console.log(error.message);
        }

    });

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            clearSession();
            showScreen('main-screen');
        });
    }

    function configureSocialLoginButtons() {
    if (googleLoginButton) {
        googleLoginButton.disabled = false;
    }

    if (kakaoLoginButton) {
        kakaoLoginButton.disabled = false;
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

console.log(supabaseClient);
