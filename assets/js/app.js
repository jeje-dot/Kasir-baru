window.onload = async () => {
    await initDatabase();
    let session = sessionStorage.getItem('pos_session');
    if(session) { userAktif = JSON.parse(session); lanjutkanLogin(); }
};

async function actionLogin() {
    let pin = document.getElementById('input-pin').value;
    let hash = await hashPIN(pin);
    let user = DB.karyawanList.find(u => u.pinHash === hash);
    
    if(user) {
        userAktif = user;
        sessionStorage.setItem('pos_session', JSON.stringify(user));
        lanjutkanLogin();
    } else {
        Swal.fire('Gagal', 'PIN Salah', 'error');
    }
}

function lanjutkanLogin() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('homepage-dashboard').style.display = 'block';
    if(DB.kiosList.length > 0) kiosAktif = DB.kiosList[0];
    
    // Terapkan otoritas Admin/Owner
    if(userAktif.role === 'Owner') {
        document.getElementById('owner-menu-stock').style.display = 'block';
        document.getElementById('owner-menu-sales').style.display = 'block';
    }
    buildKiosDropdowns();
}

function showSection(id, title) {
    document.getElementById(activeDashboard).style.display = 'none';
    document.getElementById('main-header').style.display = 'flex';
    document.getElementById('main-content').style.display = 'block';
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    
    document.getElementById(id).style.display = 'block';
    if(id === 'pos') { renderKeranjang(); renderQuickGrid(); }
    if(id === 'stock') renderStokList(); // Tambahkan logika render stok di sini
}

function backToDashboard() {
    document.getElementById('main-header').style.display = 'none';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('homepage-dashboard').style.display = 'block';
}

function buildKiosDropdowns() {
    let html = DB.kiosList.map(k => `<button class="btn-kios-select" onclick="kiosAktif='${k}'; renderQuickGrid()">${k}</button>`).join('');
    document.getElementById('pos-kios-selector-group').innerHTML = html;
}

function logout() { sessionStorage.removeItem('pos_session'); location.reload();}


// ... (kode-kode Anda yang ada di atas) ..
// ==========================================
// 👇 SILAKAN PASTE KODENYA MULAI DI SINI 👇
// ==========================================
let adminClickCount = 0;
let adminClickTimeout;

function triggerSuperAdmin() {
    adminClickCount++;
    
    clearTimeout(adminClickTimeout);
    adminClickTimeout = setTimeout(() => {
        adminClickCount = 0;
    }, 1500);

    if (adminClickCount === 3) {
        adminClickCount = 0; 
        
        document.getElementById('homepage-dashboard').style.display = 'none';
        document.getElementById('super-admin-dashboard').style.display = 'block';
        activeDashboard = 'super-admin-dashboard';
        
        if (typeof playAudioSuccess === 'function') playAudioSuccess();
        
        Swal.fire({
            title: '👑 Pintu Rahasia Terbuka',
            text: 'Masuk ke Mode Super Admin Panel!',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    }
}

function keluarSuperAdmin() {
    document.getElementById('super-admin-dashboard').style.display = 'none';
    document.getElementById('homepage-dashboard').style.display = 'block';
    activeDashboard = 'homepage-dashboard';
}
