// Konfigurasi Keamanan
const NEW_SALT = "POS_KUSNADI_V2_SALT";

// State Global
let DB = {
    kiosList: [], produkList: [], riwayatPenjualan: [],
    karyawanList: [], settingStruk: {}, kartuPelanggan: [], settingToko: {}, holdOrders: []
};
let keranjang = [];
let userAktif = null;
let kiosAktif = "";
let activeDashboard = 'homepage-dashboard'; 

async function hashPIN(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + NEW_SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function initDatabase() {
    DB.kiosList = JSON.parse(localStorage.getItem('kios_list')) || ["Kios Utama"];
    DB.produkList = JSON.parse(localStorage.getItem('produk_multikios')) || [];
    
    // Migrasi data lama agar memiliki kategori default
    DB.produkList = DB.produkList.map(p => ({ ...p, kategori: p.kategori || 'Makanan' }));
    
    DB.riwayatPenjualan = JSON.parse(localStorage.getItem('riwayat_multikios')) || [];
    DB.holdOrders = JSON.parse(localStorage.getItem('pos_hold_orders')) || [];
    
    DB.karyawanList = JSON.parse(localStorage.getItem('karyawan'));
    if(!DB.karyawanList) {
        let defaultHash = await hashPIN("1234");
        DB.karyawanList = [{nama: "Kasir Pusat (Owner)", pinHash: defaultHash, role: "Owner"}];
    }
    DB.settingStruk = JSON.parse(localStorage.getItem('setting_struk')) || { namaToko: "KASIR KUSNADI", alamat: "-", footer: "Terima Kasih" };
    DB.kartuPelanggan = JSON.parse(localStorage.getItem('kartu_pelanggan')) || [];
    saveDatabase();
}

function saveDatabase() {
    localStorage.setItem('kios_list', JSON.stringify(DB.kiosList));
    localStorage.setItem('produk_multikios', JSON.stringify(DB.produkList));
    localStorage.setItem('riwayat_multikios', JSON.stringify(DB.riwayatPenjualan));
    localStorage.setItem('karyawan', JSON.stringify(DB.karyawanList));
    localStorage.setItem('pos_hold_orders', JSON.stringify(DB.holdOrders));
    localStorage.setItem('setting_struk', JSON.stringify(DB.settingStruk));
}
