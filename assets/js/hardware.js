// --- AUDIO FEEDBACK (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type, duration) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.start(); gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
}
function playAudioSuccess() { playTone(800, 'sine', 0.1); setTimeout(() => playTone(1200, 'sine', 0.15), 100); }
function playAudioError() { playTone(300, 'square', 0.3); }

// --- WEBNFC DENGAN FALLBACK ---
let isScanningNFC = false; let nfcAbortController = null;
async function scanNFCToInput(targetInputId, callback = null, customText = 'Dekatkan kartu ke sensor perangkat.') {
    // FALLBACK JIKA BROWSER TIDAK MENDUKUNG NFC
    if (!('NDEFReader' in window)) {
        Swal.fire({
            title: 'NFC Tidak Didukung',
            text: 'Perangkat/Browser ini tidak memiliki fitur Web NFC. Gunakan Scanner / Ketik ID Manual:',
            input: 'text', inputPlaceholder: 'Masukkan ID Kartu...',
            showCancelButton: true, confirmButtonText: 'Proses'
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                if(targetInputId) document.getElementById(targetInputId).value = result.value;
                if(callback) callback(result.value);
            }
        });
        return;
    }

    // NFC SUPPORTED
    if(isScanningNFC) return;
    isScanningNFC = true;
    Swal.fire({ title: 'Menunggu Kartu...', text: customText, showCancelButton: true,
        didOpen: async () => {
            Swal.showLoading();
            try {
                nfcAbortController = new AbortController();
                const ndef = new NDEFReader();
                await ndef.scan({ signal: nfcAbortController.signal });
                ndef.addEventListener("reading", (event) => {
                    isScanningNFC = false; nfcAbortController.abort(); Swal.close();
                    playAudioSuccess(); // Sukses Suara
                    let cardId = event.serialNumber.toUpperCase().replaceAll(':', '');
                    if(targetInputId) document.getElementById(targetInputId).value = cardId;
                    if(callback) callback(cardId);
                });
            } catch (error) {
                isScanningNFC = false; playAudioError(); // Error Suara
                if(error.name !== 'AbortError') Swal.fire('Gagal NFC', error.message, 'error');
            }
        }
    }).then((res) => { if(res.isDismissed && nfcAbortController) { nfcAbortController.abort(); isScanningNFC = false; }});
}

// --- BLUETOOTH PRINTER DENGAN FALLBACK ---
let printerCharacteristics = {};
async function hubungkanPrinterKios(kiosName) {
    if (!navigator.bluetooth) {
        Swal.fire('Tidak Didukung', 'Browser ini tidak mendukung Web Bluetooth (iOS / Browser lama). Sistem akan menggunakan mode Cetak Standar (PDF/WiFi).', 'info');
        return;
    }
    try {
        const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb'] });
        const server = await device.gatt.connect();
        const services = await server.getPrimaryServices();
        let characteristic = (await services[0].getCharacteristics())[0];
        printerCharacteristics[kiosName] = characteristic;
        Swal.fire('Berhasil', `Printer ditautkan ke ${kiosName}!`, 'success');
    } catch(e) { Swal.fire('Gagal', e.message, 'error'); }
}

function eksekusiCetakOtomatisSistem(nota) {
    let adaBt = false;
    // Logika pengiriman BT disederhanakan untuk contoh
    if(!adaBt) window.print(); // Fallback standar browser print
}
