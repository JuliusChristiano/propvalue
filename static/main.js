let savedPropertyIds = JSON.parse(localStorage.getItem('saved_props') || '[]');
let currentAmortizationData = [];
let kprChartInstance = null;

// Dataset Properti Simulasi
const PROPERTIES_DATA = [
    {
        id: 1,
        title: "Rumah Minimalis Modern Modernland",
        location: "Tangerang, Banten",
        price: 2450000000,
        beds: 3, baths: 2, sqft: 1800, grade: 7, yr: 2015,
        image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&q=80",
        status: "Fair Value",
        scores: { walk: 85, transit: 72, safety: 91 },
        facilities: ["🚆 Stasiun KRL Tangerang (1.2 km)", "🛣️ Tol Jakarta-Merak (2.5 km)", "🏥 RS Mayapada (800 m)", "🏫 Sekolah SPH (1.5 km)"]
    },
    {
        id: 2,
        title: "Villa Mewah Tropical Style",
        location: "BSD City, Tangerang Selatan",
        price: 4850000000,
        beds: 4, baths: 3.5, sqft: 3200, grade: 9, yr: 2019,
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&q=80",
        status: "Underpriced",
        scores: { walk: 90, transit: 85, safety: 96 },
        facilities: ["🚆 Stasiun Rawa Buntu (2.0 km)", "🛣️ Tol Serpong-Balaraja (1.0 km)", "🏥 Eka Hospital (1.1 km)", "🏫 Sinarmas World Academy (900 m)"]
    },
    {
        id: 3,
        title: "Rumah Cluster Asri Minimalis",
        location: "Jakarta Timur",
        price: 1650000000,
        beds: 2, baths: 1, sqft: 1100, grade: 6, yr: 2012,
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=80",
        status: "Overpriced",
        scores: { walk: 70, transit: 65, safety: 84 },
        facilities: ["🚆 LRT Ciracas (1.5 km)", "🛣️ Tol Jagorawi (3.0 km)", "🏥 RS Kanker Dharmais (4.0 km)", "🏫 Al-Azhar 19 (1.2 km)"]
    },
    {
        id: 4,
        title: "Townhouse Premium Menteng",
        location: "Jakarta Pusat",
        price: 8900000000,
        beds: 5, baths: 4, sqft: 4500, grade: 11, yr: 2021,
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80",
        status: "Fair Value",
        scores: { walk: 95, transit: 92, safety: 98 },
        facilities: ["🚆 MRT Cikini (800 m)", "🛣️ Tol Dalam Kota (2.0 km)", "🏥 RSCM Kencana (600 m)", "🏫 Menteng Intercultural School (500 m)"]
    }
];

// Fungsi Navigasi Tab Utama
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-gradient-to-r', 'from-indigo-600', 'to-indigo-700', 'text-white', 'shadow-md');
        btn.classList.add('text-slate-400', 'hover:bg-slate-800');
    });

    const activeTab = document.getElementById('tab-' + tabId);
    if (activeTab) activeTab.classList.remove('hidden');

    const activeNav = document.getElementById('nav-' + tabId);
    if (activeNav) {
        activeNav.classList.remove('text-slate-400', 'hover:bg-slate-800');
        activeNav.classList.add('bg-gradient-to-r', 'from-indigo-600', 'to-indigo-700', 'text-white', 'shadow-md');
    }

    const mobileMenu = document.getElementById('mobile-menu');
    if(mobileMenu) mobileMenu.classList.add('hidden');
    
    if(tabId === 'calculator') calculateKPR();
    if(tabId === 'saved') renderSavedProperties();
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
}

// Menghubungkan Form ke Backend API Server Flask (/predict_api)
async function runPrediction() {
    const payload = {
        sqft_living: parseFloat(document.getElementById('pred_sqft').value) || 1800,
        grade: parseFloat(document.getElementById('pred_grade').value) || 7,
        bedrooms: parseFloat(document.getElementById('pred_beds').value) || 3,
        bathrooms: parseFloat(document.getElementById('pred_baths').value) || 2,
        floors: parseFloat(document.getElementById('pred_floors').value) || 2,
        yr_built: parseFloat(document.getElementById('pred_yr').value) || 2015
    };

    try {
        const response = await fetch('/predict_api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const resData = await response.json();

        if(resData.success) {
            document.getElementById('result-price').innerText = formatRupiah(resData.predicted_price);
            document.getElementById('result-sqft-price').innerText = formatRupiah(resData.price_per_sqft) + ' / sqft';
            
            const statusEl = document.getElementById('result-status');
            statusEl.innerText = resData.status;
            statusEl.className = `inline-block px-3.5 py-1.5 rounded-full text-xs font-bold ${resData.status_class}`;
        }
    } catch (e) {
        console.error("Gagal terhubung ke server Flask backend API", e);
    }
}

// Simulasi Perhitungan KPR & Tabel Amortisasi
function calculateKPR() {
    const price = parseFloat(document.getElementById('kpr_price').value) || 0;
    const dpPercent = parseFloat(document.getElementById('kpr_dp_percent').value) || 0;
    const annualRate = parseFloat(document.getElementById('kpr_rate').value) || 0;
    const tenureYears = parseInt(document.getElementById('kpr_tenure').value) || 20;
    const userIncome = parseFloat(document.getElementById('user_income').value) || 0;

    const dpAmount = price * (dpPercent / 100);
    const principal = price - dpAmount;
    const monthlyRate = (annualRate / 100) / 12;
    const totalMonths = tenureYears * 12;

    let monthlyPayment = 0;
    if(monthlyRate > 0) {
        monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    } else {
        monthlyPayment = principal / totalMonths;
    }

    document.getElementById('kpr-monthly').innerText = formatRupiah(Math.round(monthlyPayment));
    document.getElementById('kpr-dp-val').innerText = formatRupiah(Math.round(dpAmount));
    document.getElementById('kpr-principal').innerText = formatRupiah(Math.round(principal));

    let balance = principal;
    const tbody = document.getElementById('amortization-tbody');
    if(tbody) tbody.innerHTML = '';
    currentAmortizationData = [];

    for(let year = 1; year <= tenureYears; year++) {
        let yearInterest = 0;
        let yearPrincipal = 0;

        for(let month = 1; month <= 12; month++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            yearInterest += interestPayment;
            yearPrincipal += principalPayment;
            balance -= principalPayment;
        }

        currentAmortizationData.push({ year, principal: yearPrincipal, interest: yearInterest, balance: Math.max(0, balance) });

        if(tbody) {
            tbody.innerHTML += `
                <tr>
                    <td class="p-3.5 font-bold">Tahun ${year}</td>
                    <td class="p-3.5 text-indigo-400 font-semibold">${formatRupiah(Math.round(yearPrincipal))}</td>
                    <td class="p-3.5 text-rose-400 font-semibold">${formatRupiah(Math.round(yearInterest))}</td>
                    <td class="p-3.5 text-slate-300 font-semibold">${formatRupiah(Math.round(Math.max(0, balance)))}</td>
                </tr>
            `;
        }
    }

    const statusEl = document.getElementById('eligibility-status');
    const maxAllowedCicilan = userIncome * 0.35;
    
    if(statusEl) {
        if(userIncome <= 0) {
            statusEl.innerText = "Masukkan penghasilan untuk cek kelayakan";
            statusEl.className = "text-xs font-bold px-4 py-2.5 rounded-xl text-center bg-slate-900 text-slate-400 border border-slate-800";
        } else if(monthlyPayment <= maxAllowedCicilan) {
            statusEl.innerText = `✅ Gaji Memenuhi Syarat (Batas Aman: ${formatRupiah(Math.round(maxAllowedCicilan))}/bln)`;
            statusEl.className = "text-xs font-bold px-4 py-2.5 rounded-xl text-center bg-emerald-500/10 text-emerald-300 border border-emerald-500/30";
        } else {
            statusEl.innerText = `⚠️ Risiko Tinggi: Cicilan Melebihi 35% Gaji`;
            statusEl.className = "text-xs font-bold px-4 py-2.5 rounded-xl text-center bg-rose-500/10 text-rose-300 border border-rose-500/30";
        }
    }

    renderKPRChart(dpAmount, principal);
}

// Chart Visual KPR
function renderKPRChart(dp, principal) {
    const ctx = document.getElementById('kprChart');
    if(!ctx) return;

    if(kprChartInstance) kprChartInstance.destroy();

    kprChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Uang Muka (DP)', 'Pokok Pinjaman KPR'],
            datasets: [{
                data: [dp, principal],
                backgroundColor: ['#6366f1', '#10b981'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } }
            }
        }
    });
}

// Perhitungan ROI & Yield Investasi
function calculateROI() {
    const price = parseFloat(document.getElementById('inv_price').value) || 0;
    const rentMonth = parseFloat(document.getElementById('inv_rent').value) || 0;
    const maintYear = parseFloat(document.getElementById('inv_maint').value) || 0;
    const taxYear = parseFloat(document.getElementById('inv_tax').value) || 0;

    const annualGrossRent = rentMonth * 12;
    const annualNetCashflow = annualGrossRent - (maintYear + taxYear);

    const grossYield = price > 0 ? (annualGrossRent / price) * 100 : 0;
    const netYield = price > 0 ? (annualNetCashflow / price) * 100 : 0;

    document.getElementById('roi-gross').innerText = grossYield.toFixed(2) + '%';
    document.getElementById('roi-net').innerText = netYield.toFixed(2) + '%';
    document.getElementById('roi-cashflow').innerText = formatRupiah(Math.round(annualNetCashflow));
}

// Rendering Favorit & Listing Properti
function toggleSaveProperty(id, event) {
    if(event) event.stopPropagation();
    if(savedPropertyIds.includes(id)) {
        savedPropertyIds = savedPropertyIds.filter(pid => pid !== id);
    } else {
        savedPropertyIds.push(id);
    }
    localStorage.setItem('saved_props', JSON.stringify(savedPropertyIds));
    updateSavedBadge();
    renderProperties(PROPERTIES_DATA);
    renderSavedProperties();
}

function updateSavedBadge() {
    const badge = document.getElementById('saved-count-badge');
    const mobileBadge = document.getElementById('mobile-saved-badge');
    if(badge) badge.innerText = savedPropertyIds.length;
    if(mobileBadge) mobileBadge.innerText = savedPropertyIds.length;
}

function renderSavedProperties() {
    const grid = document.getElementById('saved-properties-grid');
    if(!grid) return;
    const savedList = PROPERTIES_DATA.filter(p => savedPropertyIds.includes(p.id));
    
    if(savedList.length === 0) {
        grid.innerHTML = `<div class="col-span-3 text-center py-16 text-slate-500">Belum ada properti favorit yang disimpan. Klik ikon hati pada katalog untuk menyimpan.</div>`;
        return;
    }
    grid.innerHTML = savedList.map(item => `
        <div class="glass-card rounded-3xl border border-slate-800 overflow-hidden p-4">
            <img src="${item.image}" class="w-full h-44 object-cover rounded-2xl mb-4">
            <h3 class="font-bold text-white text-base">${item.title}</h3>
            <div class="text-xl font-black text-emerald-400 mt-1">${formatRupiah(item.price)}</div>
            <button onclick="toggleSaveProperty(${item.id})" class="mt-4 w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold py-2.5 rounded-xl transition">
                <i class="fa-solid fa-trash mr-1.5"></i> Hapus dari Favorit
            </button>
        </div>
    `).join('');
}

function getStatusBadgeClass(status) {
    if (status === 'Underpriced') return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    if (status === 'Overpriced') return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
}

function renderProperties(data) {
    const grid = document.getElementById('properties-grid');
    if(!grid) return;

    grid.innerHTML = data.map(item => {
        const isSaved = savedPropertyIds.includes(item.id);
        return `
        <div class="glass-card rounded-3xl overflow-hidden hover:border-indigo-500/40 transition duration-300 flex flex-col justify-between group">
            <div>
                <div class="relative overflow-hidden">
                    <img src="${item.image}" alt="${item.title}" class="w-full h-52 object-cover group-hover:scale-105 transition duration-500">
                    <span class="absolute top-4 right-4 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md shadow-lg ${getStatusBadgeClass(item.status)}">
                        ${item.status}
                    </span>
                    <button onclick="toggleSaveProperty(${item.id}, event)" class="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md p-2.5 rounded-full text-slate-300 hover:text-rose-400 transition">
                        <i class="fa-${isSaved?'solid text-rose-500':'regular'} fa-heart text-sm"></i>
                    </button>
                </div>
                <div class="p-6">
                    <span class="text-xs text-indigo-400 font-bold uppercase tracking-wider block mb-1"><i class="fa-solid fa-location-dot mr-1"></i> ${item.location}</span>
                    <h3 class="font-bold text-white text-lg leading-snug">${item.title}</h3>
                    <div class="text-2xl font-black text-emerald-400 mt-3 tracking-tight">${formatRupiah(item.price)}</div>
                    
                    <div class="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-800 text-xs text-slate-400">
                        <div><i class="fa-solid fa-bed text-indigo-400 mr-1"></i> ${item.beds} Kamar</div>
                        <div><i class="fa-solid fa-bath text-indigo-400 mr-1"></i> ${item.baths} Mandi</div>
                        <div><i class="fa-solid fa-maximize text-indigo-400 mr-1"></i> ${item.sqft} sqft</div>
                    </div>
                </div>
            </div>
            <div class="p-6 pt-0">
                <button onclick="openDetailModal(${item.id})" class="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2 border border-slate-700/80">
                    <i class="fa-solid fa-circle-info text-indigo-400"></i> Detail Radar & Investasi
                </button>
            </div>
        </div>
    `}).join('');
}

// Inisialisasi Aplikasi Saat Dimenit Pertama Halaman Dimuat
window.addEventListener('DOMContentLoaded', () => {
    renderProperties(PROPERTIES_DATA);
    updateSavedBadge();
    calculateROI();
    runPrediction();

    const homeFeatured = document.getElementById('home-featured-properties');
    if(homeFeatured) {
        homeFeatured.innerHTML = PROPERTIES_DATA.slice(0, 3).map(item => `
            <div class="glass-card rounded-2xl p-5 cursor-pointer hover:border-indigo-500/40 transition duration-300" onclick="switchTab('properties'); openDetailModal(${item.id})">
                <img src="${item.image}" class="w-full h-40 object-cover rounded-xl mb-4">
                <span class="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">${item.location}</span>
                <h4 class="font-bold text-white text-base mt-1 leading-snug">${item.title}</h4>
                <div class="text-xl font-black text-emerald-400 mt-2">${formatRupiah(item.price)}</div>
            </div>
        `).join('');
    }
});