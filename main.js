const TICKET_PRICE = 50;
const TICKET_OFF_DAYS = [1, 2, 3]; // Пн, Вт, Ср - не працює
const SEATS_PER_WAGON = 38;

const SCHEDULE = [
    { num: '529', days: 'Субота, неділя', time: '10:00' },
    { num: '531', days: 'Четвер — неділя', time: '11:00' },
    { num: '533', days: 'Четвер — неділя', time: '12:00' },
    { num: '535', days: 'Четвер — неділя', time: '13:00' },
    { num: '537', days: 'Четвер — неділя', time: '14:00' },
    { num: '539', days: 'Четвер — неділя', time: '15:00' },
    { num: '541', days: 'Четвер — неділя', time: '16:00' },
    { num: '543', days: 'Четвер — неділя', time: '17:00' }
];

let selectedDate = new Date();
let currentTrainTime = "";
let pendingTrainTime = null; 
let currentWagon = 1;
let selectedSeats = { 1: [], 2: [] };
let occupiedSeats = { 1: [3, 14, 22], 2: [5, 6, 30, 31] }; 

document.getElementById('search-date').valueAsDate = new Date();

// Глушилка для "Дізнатися більше"
document.getElementById('dummy-btn').onclick = (e) => e.preventDefault();

// --- НАВІГАЦІЯ ---
const views = ['view-search', 'view-results', 'view-table', 'view-seats', 'view-help'];
function switchView(viewId) {
    views.forEach(v => document.getElementById(v).classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);
}

document.getElementById('logo-home').onclick = () => switchView('view-search');
document.getElementById('nav-search').onclick = () => switchView('view-search');
document.getElementById('nav-table').onclick = () => { switchView('view-table'); renderDarkBoard(); };
document.getElementById('nav-help').onclick = () => switchView('view-help');
document.getElementById('btn-buy-from-board').onclick = () => switchView('view-search');
document.getElementById('back-to-trains').onclick = (e) => { e.preventDefault(); switchView('view-results'); };

// --- ПОШУК ТА РЕЗУЛЬТАТИ ---
document.getElementById('btn-search').onclick = () => {
    const inputDate = document.getElementById('search-date').value;
    if(!inputDate) { alert("Оберіть дату!"); return; }
    selectedDate = new Date(inputDate);
    switchView('view-results');
    generateDateCarousel();
    renderTrains();
};

function generateDateCarousel() {
    const carousel = document.getElementById('date-carousel');
    carousel.innerHTML = '';
    const daysArr = ['Нд', 'Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб'];
    const monthsArr = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];

    for(let i = -1; i <= 2; i++) {
        let d = new Date(selectedDate);
        d.setDate(d.getDate() + i);
        const card = document.createElement('div');
        card.className = `date-card ${i === 0 ? 'active' : ''}`;
        card.innerHTML = `${d.getDate()} ${monthsArr[d.getMonth()]}, ${daysArr[d.getDay()]}`;
        card.onclick = () => {
            selectedDate = d;
            generateDateCarousel();
            renderTrains();
        };
        carousel.appendChild(card);
    }
}

function renderTrains() {
    const list = document.getElementById('state-trains');
    list.innerHTML = '';
    const dayOfWeek = selectedDate.getDay(); 

    if (TICKET_OFF_DAYS.includes(dayOfWeek)) {
        list.innerHTML = `
            <div style="text-align:center; padding: 40px; background: white; border-radius: 12px;">
                <h3 style="color:#233e8b;">Сьогодні Дитяча залізниця не працює</h3>
                <p>Оберіть інший день (четвер - неділя).</p>
            </div>`;
        return;
    }

    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    SCHEDULE.forEach(t => {
        if (t.num === '529' && !isWeekend) return; 
        let [h, m] = t.time.split(':');
        let arrTime = new Date(selectedDate);
        arrTime.setHours(h, parseInt(m) + 30);
        let arrStr = `${arrTime.getHours()}:${arrTime.getMinutes() === 0 ? '00' : arrTime.getMinutes()}`;

        list.innerHTML += `
            <div class="train-card">
                <div>
                    <span class="uz-accent-text">№${t.num}</span> Дитяча залізниця<br>
                    <strong style="color:#233e8b;">${t.time} Центральна</strong> → ${arrStr} Озерна
                </div>
                <button class="uz-dark-btn" onclick="checkAuthAndBuy('${t.time}')" style="padding: 10px 20px;">Купити: ${TICKET_PRICE} ₴</button>
            </div>
        `;
    });
}

// --- ТЕМНЕ ТАБЛО ---
function renderDarkBoard() {
    const tbody = document.querySelector('#trains-board tbody');
    tbody.innerHTML = '';
    SCHEDULE.forEach(t => {
        tbody.innerHTML += `
            <tr>
                <td class="yellow-text">${t.num}</td>
                <td>${t.days}</td>
                <td style="text-align: right; color:#fff;">${t.time}</td>
            </tr>
        `;
    });
}

// --- АВТОРИЗАЦІЯ ---
const loginModal = document.getElementById('login-modal');
const authStatus = document.getElementById('auth-status');

document.addEventListener('DOMContentLoaded', checkUserLoggedIn);

function checkUserLoggedIn() {
    const user = JSON.parse(localStorage.getItem('uzUser'));
    if (user) {
        authStatus.innerHTML = `
            <span style="color:white; font-weight:bold; margin-right: 15px;">${user.name}</span> 
            <button class="uz-outline-white-btn" id="btn-my-tickets-logged">Мої квитки</button>
            <button class="uz-outline-white-btn" onclick="performLogout()" style="border-color:transparent;">Вийти</button>
        `;
        document.getElementById('btn-my-tickets-logged').onclick = openAccountModal;
    } else {
        authStatus.innerHTML = `<button id="my-account-btn" class="uz-outline-white-btn">Увійти</button>`;
        document.getElementById('my-account-btn').onclick = () => { loginModal.style.display = "block"; };
    }
}

window.checkAuthAndBuy = function(time) {
    const user = JSON.parse(localStorage.getItem('uzUser'));
    if (!user) {
        pendingTrainTime = time; 
        loginModal.style.display = "block";
    } else {
        openSeatSelection(time);
    }
};

document.getElementById('btn-perform-login').onclick = () => {
    const name = document.getElementById('auth-name').value;
    const phone = document.getElementById('auth-phone').value;
    if (!name || !phone) { return; }

    localStorage.setItem('uzUser', JSON.stringify({ name: name, phone: phone }));
    loginModal.style.display = "none";
    checkUserLoggedIn();
    
    if (pendingTrainTime) {
        openSeatSelection(pendingTrainTime);
        pendingTrainTime = null;
    }
};

function performLogout() {
    localStorage.removeItem('uzUser');
    checkUserLoggedIn();
    switchView('view-search');
}

// --- ВИБІР МІСЦЬ ---
function openSeatSelection(time) {
    currentTrainTime = time;
    document.getElementById('selected-train-info').innerText = `Рейс о ${time} (ст. Центральна)`;
    selectedSeats = { 1: [], 2: [] }; 
    renderWagon(currentWagon);
    updateOrderSummary();
    switchView('view-seats');
}

const seatMap = document.getElementById('seat-map');
const tabBtns = document.querySelectorAll('.tab-btn');

function renderWagon(wagonId) {
    seatMap.innerHTML = '';
    for (let i = 1; i <= SEATS_PER_WAGON; i++) {
        const seat = document.createElement('div');
        seat.className = 'seat';
        seat.innerText = i;

        if (occupiedSeats[wagonId].includes(i)) {
            seat.classList.add('occupied');
        } else {
            seat.onclick = () => toggleSeat(wagonId, i, seat);
            if (selectedSeats[wagonId].includes(i)) seat.classList.add('selected');
        }

        seatMap.appendChild(seat);
        if (i % 3 === 1) { 
            const spacer = document.createElement('div');
            spacer.className = 'spacer';
            seatMap.appendChild(spacer);
        }
    }
}

function toggleSeat(wagonId, seatNum, element) {
    const index = selectedSeats[wagonId].indexOf(seatNum);
    if (index > -1) {
        selectedSeats[wagonId].splice(index, 1);
        element.classList.remove('selected');
    } else {
        selectedSeats[wagonId].push(seatNum);
        element.classList.add('selected');
    }
    updateOrderSummary();
}

function updateOrderSummary() {
    const arr = selectedSeats[currentWagon];
    document.getElementById('selected-seats-list').innerText = arr.length > 0 ? arr.sort((a,b)=>a-b).join(', ') : '—';
    const totalCount = selectedSeats[1].length + selectedSeats[2].length;
    document.getElementById('total-price').innerText = totalCount * TICKET_PRICE;
}

tabBtns.forEach(btn => {
    btn.onclick = (e) => {
        tabBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentWagon = parseInt(e.target.dataset.wagon);
        document.getElementById('current-wagon-display').innerText = currentWagon;
        renderWagon(currentWagon);
        updateOrderSummary();
    };
});

// --- ОФОРМЛЕННЯ КВИТКА З АНІМАЦІЄЮ ---
const loadingModal = document.getElementById('loading-modal');
const successModal = document.getElementById('success-modal');

document.getElementById('book-btn').onclick = () => {
    const totalCount = selectedSeats[1].length + selectedSeats[2].length;
    if (totalCount === 0) { alert('Оберіть хоча б одне місце!'); return; }

    // Показуємо завантаження
    loadingModal.style.display = "block";

    // Імітація запиту на сервер (1.5 секунди)
    setTimeout(() => {
        const dateStr = selectedDate.toLocaleDateString('uk-UA');
        let myTickets = JSON.parse(localStorage.getItem('rdzTickets')) || [];
        
        [1, 2].forEach(wagon => {
            if (selectedSeats[wagon].length > 0) {
                myTickets.push({
                    date: dateStr,
                    time: currentTrainTime,
                    wagon: wagon,
                    seats: selectedSeats[wagon].join(', '),
                    total: selectedSeats[wagon].length * TICKET_PRICE,
                    id: Math.floor(10000 + Math.random() * 90000)
                });
                occupiedSeats[wagon].push(...selectedSeats[wagon]);
            }
        });
        
        localStorage.setItem('rdzTickets', JSON.stringify(myTickets));
        
        // Ховаємо завантаження, показуємо успіх
        loadingModal.style.display = "none";
        successModal.style.display = "block";

    }, 1500);
};

document.getElementById('close-success-btn').onclick = () => {
    successModal.style.display = "none";
    switchView('view-search'); // Повертаємо на головну
};


// --- ОСОБИСТИЙ КАБІНЕТ ТА ПОВЕРНЕННЯ КОШТІВ ---
const accModal = document.getElementById('account-modal');
const refundModal = document.getElementById('refund-modal');
let ticketToRefundId = null;

function openAccountModal() {
    const list = document.getElementById('tickets-list');
    let myTickets = JSON.parse(localStorage.getItem('rdzTickets')) || [];
    list.innerHTML = '';
    
    if (myTickets.length === 0) {
        list.innerHTML = '<p>Немає куплених квитків.</p>';
    } else {
        // Рендер квитків (нові зверху)
        myTickets.reverse().forEach(t => {
            list.innerHTML += `
                <div class="ticket-card">
                    <button class="refund-btn" onclick="openRefundModal(${t.id})">Повернути</button>
                    <strong style="color:#233e8b;">Квиток #${t.id}</strong><br>
                    📅 ${t.date} | ⏰ ${t.time} | ст. Центральна<br>
                    Вагон: ${t.wagon} | Місця: ${t.seats}<br>
                    <strong>Сума: ${t.total} ₴</strong>
                </div>`;
        });
    }
    accModal.style.display = "block";
}

// Відкриття модалки повернення
window.openRefundModal = function(id) {
    const myTickets = JSON.parse(localStorage.getItem('rdzTickets')) || [];
    const ticket = myTickets.find(t => t.id === id);
    if (!ticket) return;

    ticketToRefundId = id;
    const seatCount = ticket.seats.split(',').length;
    const refundSum = Math.floor(ticket.total / 3); // Сума в 3 рази менше
    const ticketWord = seatCount > 1 ? 'квитки' : 'квиток';
    const btnWord = seatCount > 1 ? 'Повернути квитки' : 'Повернути квиток';

    document.getElementById('refund-question').innerText = `Ви дійсно хочете повернути ${ticketWord}?`;
    document.getElementById('refund-date').innerText = `${ticket.date} о ${ticket.time}`;
    document.getElementById('refund-amount').innerText = refundSum;
    document.getElementById('confirm-refund-btn').innerText = btnWord;

    refundModal.style.display = "block";
};

// Підтвердження повернення
document.getElementById('confirm-refund-btn').onclick = () => {
    let myTickets = JSON.parse(localStorage.getItem('rdzTickets')) || [];
    const ticketIndex = myTickets.findIndex(t => t.id === ticketToRefundId);
    
    if (ticketIndex > -1) {
        const ticket = myTickets[ticketIndex];
        // Звільняємо місця у вагоні
        const seatsArr = ticket.seats.split(', ').map(Number);
        occupiedSeats[ticket.wagon] = occupiedSeats[ticket.wagon].filter(s => !seatsArr.includes(s));
        
        // Видаляємо з історії
        myTickets.splice(ticketIndex, 1);
        localStorage.setItem('rdzTickets', JSON.stringify(myTickets));
    }

    refundModal.style.display = "none";
    openAccountModal(); // Оновлюємо список
};

document.getElementById('cancel-refund-btn').onclick = () => refundModal.style.display = "none";


// Закриття всіх модалок по кліку на хрестик/фон
document.getElementById('close-login').onclick = () => loginModal.style.display = "none";
document.getElementById('close-account').onclick = () => accModal.style.display = "none";

window.onclick = (e) => { 
    if (e.target == loginModal) loginModal.style.display = "none"; 
    if (e.target == accModal) accModal.style.display = "none";
    if (e.target == refundModal) refundModal.style.display = "none";
};

// Акордеон FAQ
document.querySelectorAll('.faq-trigger').forEach(trigger => {
    trigger.onclick = function() { this.parentElement.classList.toggle('active'); }
});

switchView('view-search');