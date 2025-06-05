document.addEventListener('DOMContentLoaded', () => {
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');
    const eventDateInput = document.getElementById('eventDate');
    const eventNameInput = document.getElementById('eventName');
    const eventDescriptionInput = document.getElementById('eventDescription');
    const addEventBtn = document.getElementById('addEventBtn');
    const deleteEventBtn = document.getElementById('deleteEventBtn');
    const eventsList = document.getElementById('eventsList');

    let currentYear = 2025; // 2025년으로 고정
    let currentMonth = 0; // 0 = January, 1 = February, ... (Date 객체에서 사용)

    // 로컬 스토리지에서 이벤트 로드 (새로고침 시 데이터 유지)
    // 각 날짜에 여러 수행평가가 있을 수 있으므로 배열로 관리
    let events = JSON.parse(localStorage.getItem('performanceEvents')) || {};
    // events = {
    //   '2025-01-15': [{ name: '국어 수행평가', description: '독서 감상문' }],
    //   '2025-01-20': [{ name: '수학 수행평가', description: '미적분 과제' }]
    // }

    let selectedDayElement = null; // 현재 선택된 달력 날짜 DOM 요소
    let selectedDateString = ''; // 현재 선택된 날짜 (YYYY-MM-DD 형식)
    let selectedEventIndex = -1; // 선택된 날짜에 여러 이벤트가 있을 경우를 대비 (지금은 사용 안 함)

    const keywordColors = {
        '국어': 'blue',     // 파란색
        '영어': 'skyblue',  // 하늘색
        '수학': 'orange',   // 주황색
        '과학': 'green',    // 초록색
        '음악': 'pink',     // 분홍색
        '물리학': 'yellowgreen', // 연두색
        '중국어': 'red',    // 빨간색
        '국사': 'gold'      // 황색
    };

    // 달력 렌더링 함수
    function renderCalendar() {
        calendarDays.innerHTML = ''; // 기존 날짜 초기화

        const today = new Date();
        today.setHours(0, 0, 0, 0); // 시간 정보를 제거하여 날짜만 비교

        // 현재 월의 첫째 날과 마지막 날 계산
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();

        // 현재 월과 년도 표시 (스크린샷처럼 YYYY.MM 형식)
        currentMonthYear.textContent = `${currentYear}.${String(currentMonth + 1).padStart(2, '0')}`;

        // 해당 월의 첫 날이 무슨 요일인지 계산 (0: 일요일, 1: 월요일, ..., 6: 토요일)
        let firstDayOfWeek = firstDayOfMonth.getDay();

        // 이전 달의 날짜 채우기
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('empty', 'prev-month');
            dayDiv.innerHTML = `<span class="day-number">${prevMonthLastDay - i}</span>`;
            calendarDays.appendChild(dayDiv);
        }

        // 현재 달의 날짜 채우기
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('current-month');

            // 날짜 문자열 생성 (YYYY-MM-DD 형식)
            const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayDiv.dataset.date = dateString;

            dayDiv.innerHTML = `<span class="day-number">${day}</span>`; // 날짜 숫자 표시

            // 오늘 날짜인 경우 'today' 클래스 추가
            if (currentYear === today.getFullYear() &&
                currentMonth === today.getMonth() &&
                day === today.getDate()) {
                dayDiv.classList.add('today');
            }

            // 이벤트가 있는 날짜에 점 및 텍스트 표시
            if (events[dateString] && events[dateString].length > 0) {
                events[dateString].forEach(event => {
                    const eventText = document.createElement('span');
                    eventText.classList.add('event-text');
                    eventText.textContent = event.name; // 수행평가 제목 표시
                    dayDiv.appendChild(eventText);
                });
            }

            // 날짜 클릭 이벤트 리스너
            dayDiv.addEventListener('click', () => {
                // 이전에 선택된 날짜가 있다면 selected 클래스 제거
                if (selectedDayElement) {
                    selectedDayElement.classList.remove('selected');
                }
                dayDiv.classList.add('selected'); // 현재 날짜에 selected 클래스 추가
                selectedDayElement = dayDiv; // 선택된 날짜 DOM 요소 업데이트

                selectedDateString = dayDiv.dataset.date;
                selectedDateDisplay.textContent = selectedDateString;
                eventDateInput.value = selectedDateString; // Input date 필드에 설정

                // 선택된 날짜에 이벤트가 있는지 확인하고 입력 필드 채우기
                const eventForSelectedDate = events[selectedDateString];
                if (eventForSelectedDate && eventForSelectedDate.length > 0) {
                    // 현재는 첫 번째 이벤트만 표시/수정
                    eventNameInput.value = eventForSelectedDate[0].name;
                    eventDescriptionInput.value = eventForSelectedDate[0].description;
                    addEventBtn.textContent = '수정';
                    deleteEventBtn.classList.remove('hidden');
                } else {
                    eventNameInput.value = '';
                    eventDescriptionInput.value = '';
                    addEventBtn.textContent = '수행평가 추가';
                    deleteEventBtn.classList.add('hidden');
                }
            });

            calendarDays.appendChild(dayDiv);
        }

        // 다음 달의 날짜 채우기 (달력을 항상 6주로 맞춰 일관된 높이를 유지)
        let nextDay = 1;
        const totalCells = firstDayOfWeek + daysInMonth;
        const remainingCells = 42 - totalCells; // 6주(42칸)를 채우기 위한 남은 칸 수

        for (let i = 0; i < remainingCells; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('empty', 'next-month');
            dayDiv.innerHTML = `<span class="day-number">${nextDay}</span>`;
            nextDay++;
            calendarDays.appendChild(dayDiv);
        }

        renderEventsList(); // 달력 렌더링 후 이벤트 목록 업데이트
    }

    // 이전 달로 이동
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        // 2025년 이전으로 가지 못하게 막음 (요청에 따라 2025년 고정)
        if (currentYear < 2025) {
            currentYear = 2025;
            currentMonth = 0;
            alert("2025년 이전으로는 이동할 수 없습니다.");
            return;
        }
        renderCalendar();
    });

    // 다음 달로 이동
    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        // 2025년 이후로 가지 못하게 막음 (요청에 따라 2025년 고정)
        if (currentYear > 2025) {
            currentYear = 2025;
            currentMonth = 11; // 12월로 고정 (0부터 시작하므로 11)
            alert("2025년 이후로는 이동할 수 없습니다.");
            return;
        }
        renderCalendar();
    });

    // 수행평가 추가/수정
    addEventBtn.addEventListener('click', () => {
        const date = eventDateInput.value;
        const name = eventNameInput.value.trim();
        const description = eventDescriptionInput.value.trim();

        if (!date) {
            alert('날짜를 선택해주세요.');
            return;
        }
        if (!name) {
            alert('수행평가 제목을 입력해주세요.');
            return;
        }

        // 해당 날짜에 이미 이벤트가 있는지 확인 (현재는 덮어쓰는 방식)
        // 여러 이벤트 허용 시: events[date] = events[date] || []; events[date].push(...)
        events[date] = [{ name: name, description: description }];
        localStorage.setItem('performanceEvents', JSON.stringify(events));

        alert('수행평가가 ' + (addEventBtn.textContent === '수정' ? '수정되었습니다!' : '추가되었습니다!'));
        renderCalendar(); // 달력 다시 렌더링하여 이벤트 표시 업데이트
        clearEventInput();
    });

    // 수행평가 삭제
    deleteEventBtn.addEventListener('click', () => {
        const dateToDelete = eventDateInput.value;
        if (dateToDelete && confirm('정말로 이 날짜의 수행평가를 삭제하시겠습니까?')) {
            delete events[dateToDelete]; // 해당 날짜의 모든 이벤트 삭제
            localStorage.setItem('performanceEvents', JSON.stringify(events));

            alert('수행평가가 삭제되었습니다.');
            renderCalendar();
            clearEventInput();
        }
    });

    // 이벤트 입력 필드 초기화
    function clearEventInput() {
        eventDateInput.value = '';
        eventNameInput.value = '';
        eventDescriptionInput.value = '';
        selectedDateDisplay.textContent = '날짜를 선택해주세요.';
        if (selectedDayElement) {
            selectedDayElement.classList.remove('selected');
            selectedDayElement = null;
        }
        addEventBtn.textContent = '수행평가 추가';
        deleteEventBtn.classList.add('hidden');
    }

    // 수행평가 목록 및 D-Day 렌더링
    function renderEventsList() {
        eventsList.innerHTML = '';
        // 날짜순으로 정렬
        const sortedDates = Object.keys(events).sort((a, b) => new Date(a) - new Date(b));
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 시간 정보를 제거하여 날짜만 비교

        if (sortedDates.length === 0) {
            eventsList.innerHTML = '<li>등록된 수행평가가 없습니다.</li>';
            return;
        }

        sortedDates.forEach(dateString => {
            const eventDetailsArray = events[dateString]; // 해당 날짜의 모든 이벤트
            eventDetailsArray.forEach(eventDetail => {
                const eventDate = new Date(dateString);
                eventDate.setHours(0, 0, 0, 0); // 시간 정보를 제거

                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>${dateString} - ${eventDetail.name}</strong>
                    <p>${eventDetail.description}</p>
                `;

                const dDayElement = document.createElement('div');
                dDayElement.classList.add('d-day');

                const timeDiff = eventDate.getTime() - today.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // 밀리초를 일로 변환

                if (daysDiff === 0) {
                    dDayElement.textContent = 'D-Day!';
                    dDayElement.style.color = '#f39c12'; // 오늘 D-Day 색상
                } else if (daysDiff > 0) {
                    dDayElement.textContent = `D-${daysDiff}`;
                    dDayElement.style.color = '#e74c3c'; // 남은 D-Day 색상
                } else {
                    dDayElement.textContent = `D+${Math.abs(daysDiff)} (완료)`;
                    dDayElement.classList.add('passed');
                }
                listItem.appendChild(dDayElement);
                eventsList.appendChild(listItem);
            });
        });
    }

    // 초기 렌더링 (2025년 1월부터 시작)
    renderCalendar();
    renderEventsList();
});