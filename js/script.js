document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. 스플래시(로딩) 화면 및 초기 화면 전환
    // ==========================================
    const progressBar = document.getElementById('progress-bar');
    const splashScreen = document.getElementById('splash-screen');
    const appScreens = document.getElementById('app-screens');

    // 로딩 바 애니메이션 시작
    setTimeout(() => {
        if (progressBar) progressBar.style.width = '100%';
    }, 100);

    // 2.8초 후 로딩 화면을 숨기고 메인 앱 화면을 보여줌
    setTimeout(() => {
        if (splashScreen) splashScreen.style.display = 'none';
        if (appScreens) {
            appScreens.style.display = 'flex';
            showScreen('main-screen');
            renderDictionary(); // 사전 데이터 미리 준비
        }
    }, 2800); 

    // ==========================================
    // 2. 햄버거 메뉴 열기/닫기
    // ==========================================
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

    // ==========================================
    // 3. 메인 화면 언어 선택 스크롤 기능
    // ==========================================
    const leftArrow = document.getElementById('left-arrow');
    const rightArrow = document.getElementById('right-arrow');
    const langSlider = document.getElementById('lang-slider');
    const scrollBar = document.getElementById('scroll-bar');
    
    let currentScroll = 0;
    const scrollAmount = 80; // 한 번 클릭 시 이동할 픽셀 수

    if (rightArrow && leftArrow && langSlider && scrollBar) {
        rightArrow.addEventListener('click', () => {
            currentScroll -= scrollAmount;
            if (currentScroll < -150) currentScroll = -150; 
            updateSlider();
        });

        leftArrow.addEventListener('click', () => {
            currentScroll += scrollAmount;
            if (currentScroll > 0) currentScroll = 0; 
            updateSlider();
        });

        function updateSlider() {
            langSlider.style.transform = `translateX(${currentScroll}px)`;
            let barPosition = (Math.abs(currentScroll) / 150) * 30;
            scrollBar.style.left = `${barPosition}px`;
        }
    }

    // ==========================================
    // 4. 화면 전환(네비게이션) 기능
    // ==========================================
    // ==========================================
    // 4. 화면 전환(네비게이션) 기능
    // ==========================================
    const screens = document.querySelectorAll('.screen');
    const navLinks = document.querySelectorAll('.nav-link');
    const placeholderTitle = document.getElementById('placeholder-title');
    const goHome = document.getElementById('go-home');

    function showScreen(targetId) {
        screens.forEach(screen => {
            screen.style.display = screen.id === targetId ? 'flex' : 'none';
        });
        // 화면 이동 후 메뉴 닫기
        if (sideMenu) {
            sideMenu.classList.remove('open');
            isMenuOpen = false; 
        }

        // 🌟 추가된 부분: 사전 화면이 열릴 때 동적으로 아이템 개수를 계산하고 렌더링
        if (targetId === 'dictionary-screen') {
            calculateItemsPerPage();
            renderDictionary();
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

    // ==========================================
    // 5. 학교 용어 사전 데이터 및 로직
    // ==========================================
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
    
    // 🌟 수정된 부분: const를 let으로 변경하여 유동적으로 변할 수 있게 합니다.
    let itemsPerPage = 5; 
    const maxPageButtons = 3;

    const dictList = document.getElementById('dict-list');
    const pageNumbersDiv = document.getElementById('page-numbers');
    const btnPrev = document.getElementById('page-prev');
    const btnNext = document.getElementById('page-next');
    const searchInput = document.getElementById('dict-search');

    // 🌟 추가된 함수: 화면 세로폭에 맞춰 보여줄 개수를 계산합니다.
    // 🌟 수정된 아이템 개수 계산 함수
    // 🌟 수정된 아이템 개수 계산 함수
    // 🌟 수정된 아이템 개수 계산 함수 (잘림 방지)
    // 🌟 수정된 아이템 개수 계산 함수
    // 🌟 수정된 아이템 개수 계산 함수
    // 🌟 수정된 아이템 개수 계산 함수
    function calculateItemsPerPage() {
        if (!dictList) return;
        
        const listHeight = dictList.clientHeight;
        
        // 💡 핵심: 75 -> 95로 넉넉하게 변경. 
        // 초성 제목(ㄱ,ㄴ,ㄷ)이 들어갈 공간까지 고려해 다음 페이지로 넘깁니다.
        const estimatedItemHeight = 95; 

        if (listHeight > 0) {
            itemsPerPage = Math.max(2, Math.floor(listHeight / estimatedItemHeight));
        } else {
            itemsPerPage = 4; // 기본값을 4개 정도로 여유있게 설정
        }
    }
    // 🌟 창 크기가 변할 때도 대응할 수 있도록 이벤트 추가 (선택사항이지만 추천)
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

    // 🌟 수정된 페이지네이션 렌더링 함수
    function renderPagination() {
        if (!pageNumbersDiv) return;
        pageNumbersDiv.innerHTML = '';
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);

        if (totalPages === 0) {
            btnPrev.disabled = true;
            btnNext.disabled = true;
            return;
        }

        // 현재 페이지를 중앙에 두기 위한 시작 및 끝 페이지 계산
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

    // ==========================================
    // 6. 사전 검색 기능
    // ==========================================
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
})



