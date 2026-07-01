function tambahKeKeranjang(id) {
    let produk = DB.produkList.find(p => p.id === id && p.kios === kiosAktif);
    if (!produk || produk.stok <= 0) { playAudioError(); Swal.fire('Gagal', 'Stok kosong atau ID tidak valid!', 'error'); return; }
    
    let item = keranjang.find(k => k.id === id && k.kios === kiosAktif);
    if (item) { if(item.qty < produk.stok) item.qty++; } else { keranjang.push({ ...produk, qty: 1 }); }
    renderKeranjang();
}

function renderKeranjang() {
    let tbody = document.querySelector('#cart-table tbody'); tbody.innerHTML = '';
    let total = 0;
    keranjang.forEach((item, idx) => {
        let subtotal = item.harga * item.qty; total += subtotal;
        tbody.innerHTML += `<tr>
            <td><b>${item.nama}</b><br><small>${item.kios}</small></td>
            <td>Rp ${item.harga.toLocaleString('id-ID')}</td>
            <td>
                <button onclick="ubahQty(${idx}, -1)">-</button> <b>${item.qty}</b> <button onclick="ubahQty(${idx}, 1)">+</button>
            </td>
            <td>Rp ${subtotal.toLocaleString('id-ID')}</td>
            <td><button onclick="ubahQty(${idx}, -${item.qty})" style="background:red;color:white;">X</button></td>
        </tr>`;
    });
    document.getElementById('grand-total').innerText = total.toLocaleString('id-ID');
}

function ubahQty(idx, delta) {
    let item = keranjang[idx]; let maxStok = DB.produkList.find(p => p.id === item.id).stok;
    item.qty += delta;
    if(item.qty <= 0) keranjang.splice(idx, 1);
    else if(item.qty > maxStok) item.qty = maxStok;
    renderKeranjang();
}

// FILTER KATEGORI DI QUICK GRID
function renderQuickGrid() {
    let grid = document.getElementById('quick-product-grid'); grid.innerHTML = '';
    let filterKat = document.getElementById('kategori-filter').value;
    
    let filtered = DB.produkList.filter(p => p.kios === kiosAktif && p.stok > 0);
    if(filterKat !== "ALL") filtered = filtered.filter(p => p.kategori === filterKat);

    filtered.slice(0, 20).forEach(p => {
        grid.innerHTML += `<div class="product-card" onclick="tambahKeKeranjang('${p.id}')">
            <div style="font-size:13px; font-weight:bold;">${p.nama}</div>
            <div style="font-size:12px; color:var(--success);">Rp ${p.harga.toLocaleString('id-ID')}</div>
        </div>`;
    });
}

// FITUR: HOLD ORDER (Simpan Tagihan Sementara)
function simpanHoldOrder() {
    if(keranjang.length === 0) return Swal.fire('Kosong', 'Keranjang masih kosong!', 'info');
    Swal.fire({
        title: 'Hold Pesanan', text: 'Masukkan nama pelanggan/meja untuk pesanan ini:',
        input: 'text', showCancelButton: true
    }).then(res => {
        if(res.isConfirmed && res.value) {
            DB.holdOrders.push({ id: Date.now(), nama: res.value, cart: [...keranjang] });
            saveDatabase(); keranjang = []; renderKeranjang();
            Swal.fire('Berhasil', 'Pesanan di-hold!', 'success');
        }
    });
}

function bukaHoldOrder() {
    if(DB.holdOrders.length === 0) return Swal.fire('Kosong', 'Tidak ada pesanan yang di-hold.', 'info');
    let options = {}; DB.holdOrders.forEach((h, i) => options[i] = h.nama + " (" + h.cart.length + " item)");
    
    Swal.fire({
        title: 'Pilih Pesanan Hold', input: 'select', inputOptions: options, showCancelButton: true
    }).then(res => {
        if(res.isConfirmed && res.value !== "") {
            let index = parseInt(res.value);
            keranjang = DB.holdOrders[index].cart;
            DB.holdOrders.splice(index, 1);
            saveDatabase(); renderKeranjang(); renderQuickGrid();
        }
    });
}

// FITUR: SPLIT BILL (Patungan)
function hitungSplitBill() {
    let total = keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    if(total === 0) return Swal.fire('Info', 'Keranjang kosong.', 'warning');
    
    Swal.fire({
        title: 'Split Bill', text: 'Berapa orang yang ikut patungan?',
        input: 'number', inputAttributes: { min: 2 }, showCancelButton: true
    }).then(res => {
        if(res.isConfirmed && res.value > 1) {
            let perOrang = Math.ceil(total / res.value);
            Swal.fire('Hasil Patungan', `Total Tagihan: Rp ${total.toLocaleString('id-ID')}<br>Dibagi ${res.value} orang = <b>Rp ${perOrang.toLocaleString('id-ID')} / orang</b>`, 'info');
        }
    });
}

// PROSES PEMBAYARAN
function prosesPembayaran() {
    let total = keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    let bayar = parseInt(document.getElementById('input-bayar').value || 0);
    if(bayar < total) return Swal.fire('Kurang', 'Uang pembayaran kurang!', 'error');
    
    playAudioSuccess();
    // Potong Stok
    keranjang.forEach(item => { DB.produkList.find(p => p.id === item.id).stok -= item.qty; });
    DB.riwayatPenjualan.push({ idNota: "PJ-"+Date.now(), totalNota: total, bayar: bayar, items: [...keranjang] });
    
    saveDatabase();
    keranjang = []; document.getElementById('input-bayar').value = ''; renderKeranjang();
    Swal.fire('Sukses', `Kembalian: Rp ${(bayar - total).toLocaleString('id-ID')}`, 'success');
}
