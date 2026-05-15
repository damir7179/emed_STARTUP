
import { GoogleGenAI } from "@google/genai";

// --- PERSISTENCE HELPERS ---
const STORAGE_KEYS = {
    USERS: 'emed_registered_users',
    SESSION: 'emed_current_session'
};

const loadPersistedData = () => {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    return {
        registeredUsers: users ? JSON.parse(users) : [{ phone: '901234567', password: '123' }],
        session: session ? JSON.parse(session) : null
    };
};

const persistUsers = (users) => localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
const persistSession = (user) => localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
const clearSession = () => localStorage.removeItem(STORAGE_KEYS.SESSION);

// --- INITIAL STATE ---
const persisted = loadPersistedData();

window.state = {
    screen: persisted.session ? 'DASHBOARD' : 'WELCOME', 
    tab: 'APPOINTMENT', 
    registeredUsers: persisted.registeredUsers, 
    user: persisted.session || { phone: '', fullName: '', passport: '', birthDate: '', gender: '', card: '', isVerified: false },
    authError: null,
    regStep: 1, 
    tempReg: { phone: '', password: '' },
    appointment: { step: 'HOSPITALS', hospital: null, spec: null, confirmed: false, drName: '', time: '' },
    messages: [{ role: 'model', text: 'Assalomu alaykum! Men Doctor AI - sizning raqamli tibbiy yordamchingizman. Sizga qanday yordam bera olaman?' }],
    isTyping: false,
    sosActive: false,
    permissionChoice: 'PENDING', 
    userLocation: null, 
    notice: null 
};

// --- DATA ---
const HOSPITALS = [
    { id: 'h1', name: 'Akfa Medline Hospital', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400', address: 'Yunusobod dist., Toshkent' },
    { id: 'h2', name: 'Shox Med Center', img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=400', address: 'Oybek metrosi, Toshkent' },
    { id: 'h3', name: 'Era Med Diagnostic', img: 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?q=80&w=400', address: 'M.Ulugbek dist., Toshkent' }
];

const SPECS = [
    { id: 's1', name: 'Terapevt', icon: '🩺' },
    { id: 's2', name: 'Kardiolog', icon: '❤️' },
    { id: 's3', name: 'Nevrolog', icon: '🧠' },
    { id: 's4', name: 'Stomatolog', icon: '🦷' }
];

const DOCTORS = [
    { id: 'd1', hId: 'h1', sId: 's1', name: 'Dr. Abror Azimov', times: ['09:00', '11:30', '15:00'] },
    { id: 'd2', hId: 'h1', sId: 's2', name: 'Dr. Nigora Karimova', times: ['10:00', '14:00', '16:30'] },
    { id: 'd3', hId: 'h2', sId: 's1', name: 'Dr. Jamshid Polatov', times: ['08:30', '12:00'] }
];

const ANALYSES = [
    { id: 'a1', name: 'Qon umumiy tahlili', date: '12.03.2024', status: 'Tayyor', result: 'Normal' },
    { id: 'a2', name: 'Glikolizlangan gemoglobin', date: '10.03.2024', status: 'Tayyor', result: '5.4%' },
    { id: 'a3', name: 'Vitamin D (25-OH)', date: '05.03.2024', status: 'Tayyor', result: '28 ng/ml' }
];

// --- ICONS ---
const Icons = {
    Logo: () => `<div class="flex items-center font-black tracking-tighter text-3xl"><span class="text-sky-500">e</span><span class="text-blue-900">Med</span></div>`,
    Shield: () => `<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
    Back: () => `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"/></svg>`,
    Hospital: () => `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
    Lab: () => `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>`,
    Sos: () => `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    Chat: () => `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>`,
    User: () => `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
    Send: () => `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>`,
    Permission: () => `<svg class="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
    Location: () => `<svg class="w-12 h-12 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
};

// --- RENDER ENGINE ---
function render() {
    const app = document.getElementById('app');
    const { screen, appointment, regStep, tempReg, tab, user, authError, isTyping, sosActive, messages, permissionChoice, userLocation, notice } = window.state;
    
    const noticeHtml = notice ? `
        <div class="fixed top-6 left-6 right-6 z-[100] animate-slideDown">
            <div class="bg-blue-900 text-white p-5 rounded-[2.5rem] shadow-2xl border border-white/20 flex items-center space-x-4">
                <div class="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                    <span class="text-xl">✨</span>
                </div>
                <div class="flex-1">
                    <p class="text-[9px] font-black uppercase tracking-[0.2em] text-sky-300">Doctor AI Bildirishnoma</p>
                    <p class="text-[11px] font-bold leading-tight">${notice}</p>
                </div>
            </div>
        </div>
    ` : '';

    if (screen === 'WELCOME') {
        app.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center p-8 bg-white h-full animate-fadeIn text-center">
                <div class="mb-10">${Icons.Logo()}</div>
                <div class="bg-slate-50 border border-slate-100 p-8 rounded-[3rem] shadow-xl space-y-8 w-full">
                    <div class="flex justify-center space-x-6">
                        <div class="p-4 bg-white rounded-3xl shadow-sm">${Icons.Permission()}</div>
                        <div class="p-4 bg-white rounded-3xl shadow-sm">${Icons.Location()}</div>
                    </div>
                    <div class="space-y-3">
                        <h2 class="text-2xl font-black text-slate-800 leading-tight">Xush kelibsiz!</h2>
                        <p class="text-xs text-slate-500 font-bold uppercase tracking-wide">Analiz va SOS uchun bildirishnoma va geolokatsiya kerak</p>
                    </div>
                    <button onclick="window.handlePermissionAction('ALLOW')" class="w-full py-5 bg-blue-900 text-white font-black rounded-[2rem] shadow-lg active:scale-95 transition-all">Ruxsat berish va Boshlash</button>
                    <button onclick="window.updateState({screen: 'AUTH'})" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keyinroq</button>
                </div>
            </div>
        `;
    } 
    else if (screen === 'AUTH') {
        app.innerHTML = `
            <div class="flex-1 flex flex-col p-8 bg-white h-full animate-fadeIn relative">
                ${authError ? `<div class="absolute top-0 left-0 right-0 bg-red-600 text-white p-4 text-[11px] font-black uppercase text-center animate-slideDown z-50">${authError}</div>` : ''}
                <div class="flex justify-center py-6">
                    <h2 class="px-8 py-3 bg-slate-50 text-blue-900 font-black text-xs uppercase tracking-[0.3em] rounded-full">Kirish</h2>
                </div>
                <div class="flex-1 flex flex-col justify-center space-y-8">
                    <div class="space-y-4">
                        <div class="relative">
                            <span class="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">+998</span>
                            <input id="auth-phone" type="tel" placeholder="00 000 00 00" class="w-full pl-20 p-5 bg-slate-50 rounded-[2rem] outline-none font-black text-xl shadow-inner">
                        </div>
                        <input id="auth-pass" type="password" placeholder="Parol" class="w-full p-5 bg-slate-50 rounded-[2rem] outline-none font-medium shadow-inner tracking-widest">
                    </div>
                    <button onclick="window.handleLogin()" class="w-full py-5 bg-blue-900 text-white font-bold rounded-[2rem] shadow-xl">Kirish</button>
                    <button onclick="window.updateState({screen: 'REGISTER'})" class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ro'yxatdan o'tish</button>
                </div>
            </div>
        `;
    }
    else if (screen === 'REGISTER') {
        app.innerHTML = `
            <div class="flex-1 flex flex-col p-8 bg-white h-full animate-fadeIn">
                <button onclick="window.updateState({screen: 'AUTH'})" class="self-start p-3 bg-slate-50 rounded-2xl text-slate-400 mb-6">${Icons.Back()}</button>
                <div class="text-center space-y-2 mb-10">
                    <h2 class="text-3xl font-black text-slate-800">Ro'yxatdan o'tish</h2>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Qadam ${regStep} / 3</p>
                </div>
                <div class="flex-1">
                    ${regStep === 1 ? `
                        <div class="space-y-6">
                            <div class="relative">
                                <span class="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">+998</span>
                                <input id="reg-phone" type="tel" placeholder="00 000 00 00" class="w-full pl-20 p-5 bg-slate-50 rounded-[2rem] font-black text-xl shadow-inner outline-none">
                            </div>
                            <button onclick="window.handleRegNext(1)" class="w-full py-5 bg-blue-900 text-white font-bold rounded-[2rem] shadow-xl">SMS Kodni Yuborish</button>
                        </div>
                    ` : regStep === 2 ? `
                        <div class="space-y-6">
                            <input id="reg-code" type="text" maxlength="4" placeholder="0000" class="w-full p-6 bg-slate-50 rounded-[2rem] font-black text-4xl text-center shadow-inner tracking-[0.5em] outline-none">
                            <p class="text-center text-[10px] text-slate-400 font-bold uppercase">Kod: 0000 (demo)</p>
                            <button onclick="window.handleRegNext(2)" class="w-full py-5 bg-blue-900 text-white font-bold rounded-[2rem] shadow-xl">Tasdiqlash</button>
                        </div>
                    ` : `
                        <div class="space-y-6">
                            <input id="reg-pass" type="password" placeholder="Parol yarating" class="w-full p-6 bg-slate-50 rounded-[2rem] font-black text-xl text-center shadow-inner tracking-widest outline-none">
                            <button onclick="window.handleRegComplete()" class="w-full py-5 bg-blue-900 text-white font-bold rounded-[2rem] shadow-xl">Davom etish</button>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    else if (screen === 'PASSPORT') {
        app.innerHTML = `
            <div class="flex-1 flex flex-col p-8 h-full bg-white animate-fadeIn overflow-y-auto no-scrollbar">
                <div class="text-center space-y-2 mb-6">
                    <h2 class="text-2xl font-black text-slate-800">Pasport ma'lumotlari</h2>
                    <p class="text-[10px] text-slate-400 font-bold uppercase">Tibbiy xizmatlar uchun majburiy identifikatsiya</p>
                </div>
                <div class="space-y-4 mb-8">
                    <div class="space-y-1">
                        <label class="text-[10px] font-black uppercase text-slate-400 ml-4">F.I.SH (Pasport bo'yicha)</label>
                        <input id="pass-name" type="text" placeholder="ALIEV VALI AKRAMOVICH" class="w-full p-4 bg-slate-50 rounded-[1.5rem] shadow-inner font-bold uppercase outline-none">
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Pasport Seriya va Raqami</label>
                        <input id="pass-id" type="text" placeholder="AA 1234567" class="w-full p-4 bg-slate-50 rounded-[1.5rem] shadow-inner font-black uppercase tracking-widest outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Tug'ilgan sana</label>
                            <input id="pass-birth" type="date" class="w-full p-4 bg-slate-50 rounded-[1.5rem] font-bold outline-none">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Jinsi</label>
                            <select id="pass-gender" class="w-full p-4 bg-slate-50 rounded-[1.5rem] font-bold outline-none">
                                <option value="Erkak">Erkak</option>
                                <option value="Ayol">Ayol</option>
                            </select>
                        </div>
                    </div>
                </div>
                <button onclick="window.handlePassport()" class="w-full py-5 bg-green-600 text-white font-bold rounded-[2rem] shadow-xl active:scale-95 transition-all">Tasdiqlash va Kirish</button>
            </div>
        `;
    }
    else if (screen === 'DASHBOARD') {
        app.innerHTML = `
            ${noticeHtml}
            <div class="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
                <header class="p-5 bg-white border-b flex items-center justify-between z-20 shadow-sm">
                    ${Icons.Logo()}
                    <div onclick="window.updateState({tab: 'PROFILE'})" class="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 border border-sky-100 cursor-pointer">${Icons.User()}</div>
                </header>
                <main id="tab-content" class="flex-1 overflow-y-auto pb-32 no-scrollbar">
                    ${renderTab()}
                </main>
                <nav class="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t px-4 py-4 flex justify-between items-center z-30 shadow-2xl">
                    ${renderNav()}
                </nav>
            </div>
        `;
        postRender();
    }
}

function renderTab() {
    const { tab, appointment, userLocation, user } = window.state;
    if (tab === 'APPOINTMENT') {
        if (appointment && appointment.confirmed) {
            return `
                <div class="p-10 flex flex-col items-center justify-center text-center space-y-6 h-full animate-fadeIn">
                    <div class="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                        <svg class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div>
                        <h3 class="text-3xl font-black text-slate-800">Muvaffaqiyatli!</h3>
                        <p class="text-slate-500 font-bold mt-2">${appointment.drName} qabuliga yozildingiz.</p>
                        <div class="mt-4 p-4 bg-sky-50 rounded-2xl border border-sky-100 font-black text-sky-700">${appointment.time}</div>
                    </div>
                    <button onclick="window.updateState({appointment: {step: 'HOSPITALS', hospital: null, spec: null, confirmed: false}})" class="px-10 py-4 bg-blue-900 text-white rounded-[2rem] font-bold">Yopish</button>
                </div>
            `;
        }
        if (appointment && appointment.step === 'HOSPITALS') {
            return `
                <div class="p-6 space-y-6 animate-fadeIn">
                    <h3 class="text-2xl font-black text-slate-800">Kasalxonalar</h3>
                    <div class="space-y-4">
                        ${HOSPITALS.map(h => `
                            <div onclick="window.selectHospital('${h.id}')" class="group relative h-48 rounded-[2.5rem] overflow-hidden shadow-lg cursor-pointer active:scale-95 transition-all">
                                <img src="${h.img}" class="absolute inset-0 w-full h-full object-cover">
                                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 p-6 flex flex-col justify-end">
                                    <h5 class="text-white font-black text-xl">${h.name}</h5>
                                    <p class="text-white/60 text-xs font-bold uppercase">${h.address}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        if (appointment.step === 'SPECS') {
            return `
                <div class="p-6 space-y-6 animate-slideInRight">
                    <button onclick="window.updateState({appointment: {...window.state.appointment, step: 'HOSPITALS'}})" class="p-3 bg-white rounded-2xl shadow-sm border">${Icons.Back()}</button>
                    <h3 class="text-2xl font-black text-slate-800">Mutaxassislik</h3>
                    <div class="grid grid-cols-2 gap-4">
                        ${SPECS.map(s => `
                            <div onclick="window.selectSpec('${s.id}')" class="bg-white p-8 rounded-[2.5rem] border shadow-xl text-center space-y-3 cursor-pointer active:scale-95 transition-all">
                                <div class="text-5xl">${s.icon}</div>
                                <div class="font-black text-slate-800 text-sm uppercase">${s.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        if (appointment.step === 'DOCTORS') {
            const docs = DOCTORS.filter(d => d.hId === appointment.hospital && d.sId === appointment.spec);
            return `
                <div class="p-6 space-y-6 animate-slideInRight">
                    <button onclick="window.updateState({appointment: {...window.state.appointment, step: 'SPECS'}})" class="p-3 bg-white rounded-2xl shadow-sm border">${Icons.Back()}</button>
                    <h3 class="text-2xl font-black text-slate-800">Shifokorlar</h3>
                    <div class="space-y-4">
                        ${docs.map(d => `
                            <div class="bg-white p-6 rounded-[2.5rem] border shadow-xl space-y-6">
                                <div class="flex items-center space-x-4">
                                    <div class="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center text-3xl">👨‍⚕️</div>
                                    <div class="font-black text-lg text-slate-800">${d.name}</div>
                                </div>
                                <div class="grid grid-cols-3 gap-2">
                                    ${d.times.map(t => `<button onclick="window.book('${d.name}', '${t}')" class="py-3 bg-slate-50 rounded-xl text-xs font-black text-slate-600 hover:bg-sky-500 hover:text-white transition-all">${t}</button>`).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }
    if (tab === 'ANALYSIS') {
        return `<div class="p-6 space-y-6 animate-fadeIn"><h3 class="text-2xl font-black text-slate-800">Tahlillarim</h3><div class="space-y-4">${ANALYSES.map(a => `<div class="bg-white p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between"><div class="space-y-1"><h5 class="font-black text-slate-800">${a.name}</h5><p class="text-[10px] font-bold text-slate-400 uppercase">${a.date}</p></div><div class="px-4 py-1.5 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase border border-green-100">${a.result}</div></div>`).join('')}</div></div>`;
    }
    if (tab === 'SOS') {
        return `<div class="h-full flex flex-col items-center justify-center p-8 space-y-12 animate-fadeIn">${window.state.sosActive ? `<div class="text-center space-y-8 animate-fadeIn"><div class="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center border-4 border-red-500 mx-auto animate-pulse"><span class="text-5xl">🚑</span></div><div class="space-y-2"><h3 class="text-3xl font-black text-red-600">YUBORILDI!</h3><p class="text-slate-800 font-bold">Joylashuvingiz aniqlandi.</p>${userLocation ? `<div class="text-[10px] font-black text-slate-400 uppercase bg-slate-100 p-4 rounded-3xl">Lat: ${userLocation.lat.toFixed(6)}<br>Long: ${userLocation.lng.toFixed(6)}</div>` : ''}</div><button onclick="window.updateState({sosActive: false})" class="px-10 py-4 bg-slate-100 text-slate-500 font-black rounded-full uppercase text-xs">Bekor qilish</button></div>` : `<div class="text-center space-y-4"><h3 class="text-4xl font-black text-slate-800">SOS</h3><p class="text-slate-500 font-bold px-10">Tugmani 3 soniya bosib turing.</p>${userLocation ? `<div class="text-[10px] text-green-600 font-black uppercase">GPS Aktiv ✅</div>` : '<div class="text-[10px] text-red-500 font-black uppercase">GPS Kutilmoqda...</div>'}</div><div class="relative w-80 h-80 flex items-center justify-center"><svg class="absolute w-full h-full -rotate-90 z-10" viewBox="0 0 320 320"><circle id="sos-progress" cx="160" cy="160" r="145" fill="transparent" stroke="#ef4444" stroke-width="14" stroke-dasharray="911" stroke-dashoffset="911" stroke-linecap="round"></circle></svg><button id="sos-btn" class="relative z-20 w-64 h-64 bg-red-500 rounded-full flex flex-col items-center justify-center text-white shadow-2xl active:scale-95 outline-none border-[10px] border-white/20">${Icons.Sos()}<span class="text-3xl font-black mt-2">SOS</span></button></div>`}</div>`;
    }
    if (tab === 'CHAT') {
        return `<div class="flex flex-col h-[calc(100vh-170px)] bg-slate-50 relative"><div id="chat-messages" class="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar pb-10">${window.state.messages.map(m => `<div class="flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}"><div class="max-w-[85%] p-5 rounded-[2rem] text-sm ${m.role === 'user' ? 'bg-sky-500 text-white shadow-lg shadow-sky-100' : 'bg-white text-slate-700 border shadow-sm'}">${m.text}</div></div>`).join('')}${window.state.isTyping ? '<div class="text-[10px] text-slate-400 animate-pulse font-black ml-4 uppercase">Doctor AI o\'ylamoqda...</div>' : ''}</div><div class="p-4 bg-white border-t flex items-center space-x-3 pb-8"><input id="chat-input" type="text" placeholder="Doctor AI ga savol..." class="flex-1 bg-slate-50 p-5 rounded-[1.5rem] outline-none shadow-inner"><button id="chat-send" class="w-16 h-16 bg-sky-500 text-white rounded-[1.2rem] flex items-center justify-center active:scale-90">${Icons.Send()}</button></div></div>`;
    }
    if (tab === 'PROFILE') {
        return `<div class="p-8 space-y-8 text-center h-full animate-fadeIn"><div class="flex flex-col items-center space-y-4 py-6"><div class="w-32 h-32 bg-sky-100 rounded-[3.5rem] flex items-center justify-center text-sky-600 text-5xl font-black border-4 border-white shadow-xl">${user.fullName ? user.fullName.charAt(0) : 'U'}</div><div><h3 class="text-3xl font-black text-slate-800">${user.fullName || 'Foydalanuvchi'}</h3><p class="text-sky-500 font-black text-[10px] uppercase mt-1">+998 ${user.phone}</p></div></div><div class="bg-white rounded-[3rem] border shadow-sm divide-y text-left overflow-hidden"><div class="p-6 flex justify-between items-center"><span class="text-slate-400 font-bold text-xs uppercase">Pasport</span><span class="font-black text-slate-800 uppercase">${user.passport || '---'}</span></div><div class="p-6 flex justify-between items-center"><span class="text-slate-400 font-bold text-xs uppercase">Karta</span><span class="font-black text-green-500 uppercase text-[9px]">${user.card ? 'Ulandi' : 'Yo\'q'}</span></div><div class="p-6 flex justify-between items-center"><span class="text-slate-400 font-bold text-xs uppercase">Xavfsizlik</span><div class="flex items-center space-x-1">${Icons.Shield()}<span class="font-black text-blue-600 text-[9px] uppercase">SSL Aktiv</span></div></div></div><button onclick="window.handleLogout()" class="w-full py-5 bg-red-50 text-red-500 font-black rounded-[2rem] active:scale-95 uppercase text-xs mt-10">Chiqish (Logout)</button></div>`;
    }
}

function renderNav() {
    const tabs = [{ id: 'APPOINTMENT', icon: Icons.Hospital, label: 'Ko\'rik' }, { id: 'ANALYSIS', icon: Icons.Lab, label: 'Analiz' }, { id: 'SOS', icon: Icons.Sos, special: true }, { id: 'CHAT', icon: Icons.Chat, label: 'Doctor AI' }, { id: 'PROFILE', icon: Icons.User, label: 'Profil' }];
    return tabs.map(t => {
        const active = window.state.tab === t.id;
        if (t.special) return `<button onclick="window.updateState({tab: 'SOS'})" class="bg-red-500 w-16 h-16 rounded-[2rem] -mt-16 shadow-2xl text-white flex items-center justify-center border-[6px] border-white active:scale-90 z-40">${t.icon()}</button>`;
        return `<button onclick="window.updateState({tab: '${t.id}'})" class="flex flex-col items-center flex-1 space-y-1 ${active ? 'text-sky-600 scale-110' : 'text-slate-400'}">${t.icon()}<span class="text-[9px] font-black uppercase tracking-widest">${t.label}</span></button>`;
    }).join('');
}

// --- LOGIC FUNCTIONS ---
window.updateState = (newState) => {
    window.state = { ...window.state, ...newState };
    render();
};

window.handlePermissionAction = async (action) => {
    if (action === 'ALLOW') {
        try {
            if ('Notification' in window) await Notification.requestPermission();
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    window.updateState({ 
                        userLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                        permissionChoice: 'ALLOWED',
                        screen: 'AUTH' 
                    });
                }, () => {
                    window.updateState({ permissionChoice: 'ALLOWED', screen: 'AUTH' });
                });
            } else {
                window.updateState({ screen: 'AUTH' });
            }
        } catch (e) { window.updateState({ screen: 'AUTH' }); }
    } else {
        window.updateState({ screen: 'AUTH' });
    }
};

window.handleLogin = () => {
    const phoneInput = document.getElementById('auth-phone');
    const passInput = document.getElementById('auth-pass');
    const phone = phoneInput?.value;
    const pass = passInput?.value;
    const found = window.state.registeredUsers.find(u => u.phone === phone && u.password === pass);
    
    if (found) {
        if (found.fullName && found.passport) {
            window.updateState({ user: found, screen: 'DASHBOARD', authError: null });
            persistSession(found);
        } else {
            window.updateState({ user: { ...window.state.user, phone: found.phone }, screen: 'PASSPORT', authError: null });
        }
    } else {
        window.updateState({ authError: "Ma'lumotlar noto'g'ri!" });
        setTimeout(() => window.updateState({ authError: null }), 3000);
    }
};

window.handleRegNext = (step) => {
    if (step === 1) {
        const phone = document.getElementById('reg-phone')?.value;
        if (phone?.length < 9) return alert('Xato raqam');
        window.state.tempReg.phone = phone;
        window.updateState({ regStep: 2 });
    } else if (step === 2) {
        if (document.getElementById('reg-code')?.value === '0000') window.updateState({ regStep: 3 });
        else alert('Kod xato');
    }
};

window.handleRegComplete = () => {
    const pass = document.getElementById('reg-pass')?.value;
    if (pass?.length < 3) return alert('Parol qisqa');
    const newUser = { phone: window.state.tempReg.phone, password: pass };
    const updated = [...window.state.registeredUsers, newUser];
    window.updateState({ registeredUsers: updated, user: { ...window.state.user, phone: newUser.phone }, screen: 'PASSPORT' });
    persistUsers(updated);
};

window.handlePayment = () => {
    const num = document.getElementById('card-num')?.value;
    if (!num || num.length < 12) return alert('To\'g\'ri karta raqami kerak');
    window.updateState({ user: { ...window.state.user, card: num }, screen: 'PASSPORT' });
};

window.handlePassport = async () => {
    const name = document.getElementById('pass-name')?.value;
    const id = document.getElementById('pass-id')?.value;
    const birth = document.getElementById('pass-birth')?.value;
    const gender = document.getElementById('pass-gender')?.value;
    
    if (name && id && birth) {
        const finalUser = { ...window.state.user, fullName: name, passport: id, birthDate: birth, gender: gender, isVerified: true };
        const updatedUsers = window.state.registeredUsers.map(u => u.phone === finalUser.phone ? { ...u, ...finalUser } : u);
        
        window.updateState({ user: finalUser, registeredUsers: updatedUsers, screen: 'DASHBOARD' });
        persistUsers(updatedUsers);
        persistSession(finalUser);

        // Generate Registration Welcome via AI
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const resp = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Foydalanuvchi ${name} eMed ilovasidan muvaffaqiyatli ro'yxatdan o'tdi. Doctor AI nomidan juda samimiy va professional O'zbek tilida tabrik yozing.`
            });
            window.state.messages.push({ role: 'model', text: resp.text || `Xush kelibsiz, ${name}! Doctor AI sizning xizmatingizda.` });
        } catch (e) {
            window.state.messages.push({ role: 'model', text: `Tabriklaymiz, ${name}! Siz muvaffaqiyatli ro'yxatdan o'tdingiz. Men Doctor AI, sizning salomatlik yordamchingizman.` });
        }
        render();
    } else alert("Ma'lumotlarni to'ldiring!");
};

window.handleLogout = () => {
    clearSession();
    location.reload(); 
};

window.selectHospital = (id) => window.updateState({ appointment: { ...window.state.appointment, hospital: id, step: 'SPECS' } });
window.selectSpec = (id) => window.updateState({ appointment: { ...window.state.appointment, spec: id, step: 'DOCTORS' } });

window.showNotice = (text) => {
    window.updateState({ notice: text });
    setTimeout(() => { window.updateState({ notice: null }); }, 6000);
};

window.book = async (drName, time) => {
    window.updateState({ appointment: { ...window.state.appointment, confirmed: true, drName, time } });
    
    // UI Notice
    window.showNotice(`Tasdiqlandi: ${drName} (${time})`);
    
    // AI Chat History Message
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const specName = SPECS.find(s => s.id === window.state.appointment.spec)?.name || 'mutaxassis';
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Foydalanuvchi ${drName} (${specName}) qabuliga ${time} da muvaffaqiyatli yozildi. Doctor AI nomidan qisqa, xushmuomala O'zbekcha tasdiq va eslatma yozing (chat tarixi uchun).`
        });
        
        const aiText = response.text || `Muvaffaqiyatli: Siz ${drName} qabuliga ${time} da yozildingiz. Salomatligingiz biz uchun muhim!`;
        window.state.messages.push({ role: 'model', text: `📅 Qabul tasdiqlandi: ${aiText}` });
        render();
    } catch (e) {
        window.state.messages.push({ role: 'model', text: `📅 Qabul tasdiqlandi: ${drName} bilan uchrashuv ${time} da belgilandi.` });
        render();
    }
};

let chatSession = null;
async function handleChat() {
    const input = document.getElementById('chat-input');
    const text = input?.value?.trim();
    if (!text || window.state.isTyping) return;
    window.state.messages.push({ role: 'user', text });
    if (input) input.value = '';
    window.updateState({ isTyping: true });
    try {
        if (!chatSession) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            chatSession = ai.chats.create({
                model: 'gemini-3-flash-preview',
                config: { systemInstruction: "Siz Doctor AI - eMed aqlli tibbiy yordamchisisiz. Faqat tibbiyotga oid savollarga javob bering. Siyosat va o'yin-kulgini rad eting. Har doim do'stona va professional bo'ling. Faqat O'zbek tilida gapiring." }
            });
        }
        const result = await chatSession.sendMessage({ message: text });
        window.state.messages.push({ role: 'model', text: result.text });
    } catch (e) {
        window.state.messages.push({ role: 'model', text: 'Doctor AI bilan aloqa uzildi.' });
    } finally { window.updateState({ isTyping: false }); }
}

function postRender() {
    const msgs = document.getElementById('chat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
    const input = document.getElementById('chat-input');
    if (input) input.onkeydown = (e) => { if (e.key === 'Enter') handleChat(); };
    const sendBtn = document.getElementById('chat-send');
    if (sendBtn) sendBtn.onclick = handleChat;
    
    const sosBtn = document.getElementById('sos-btn');
    const ring = document.getElementById('sos-progress');
    if (sosBtn && ring) {
        let timer = null, progress = 0;
        const start = (e) => {
            e.preventDefault();
            timer = setInterval(() => {
                progress += 2;
                ring.style.strokeDashoffset = 911 - (911 * progress / 100);
                if (progress >= 100) { clearInterval(timer); window.updateState({ sosActive: true }); }
            }, 50);
        };
        const stop = () => { clearInterval(timer); progress = 0; ring.style.strokeDashoffset = 911; };
        sosBtn.onmousedown = sosBtn.ontouchstart = start;
        sosBtn.onmouseup = sosBtn.onmouseleave = sosBtn.ontouchend = stop;
    }
}

render();
