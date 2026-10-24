

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    limit,
    getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdrQZ895mBVXjNkbbHgoTefuZkSIa1AQM",
  authDomain: "web-undangan-e3102.firebaseapp.com",
  projectId: "web-undangan-e3102",
  storageBucket: "web-undangan-e3102.firebasestorage.app",
  messagingSenderId: "195449879589",
  appId: "1:195449879589:web:726a502a637c5027e093cc",
  measurementId: "G-JNSHR481TR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// AMBIL ELEMEN
const videoHero = document.getElementById("videoHero");

const btnBuka = document.getElementById("btnBuka");
const cover = document.getElementById("cover");
const isi = document.getElementById("isi");
const musik = document.getElementById("musik");
const namaTamu = document.getElementById("namaTamu");
videoHero.addEventListener("ended", function () {
    videoHero.currentTime = 0;
    videoHero.play().catch(function () {});
});

videoHero.addEventListener("pause", function () {
    if (!isi.classList.contains("hidden") && !document.hidden) {
        videoHero.play().catch(function () {});
    }
});


// 1. NAMA TAMU DARI LINK
const params = new URLSearchParams(window.location.search);
namaTamu.textContent = params.get("to") || "Tamu Undangan";

// 2. TOMBOL BUKA UNDANGAN
const opening = document.getElementById("opening");
const videoOpening = document.getElementById("videoOpening");
const teksOpening = document.getElementById("teksOpening");
const btnLewati = document.getElementById("btnLewati");

const DURASI = 12; //detik video di putar sebelum masuk ke isi
let sudahMasuk = false;

function masukIsi() {
    if (sudahMasuk) return;
    sudahMasuk = true;
    videoOpening.pause();
    opening.classList.add("hidden");
    isi.classList.remove("hidden");
    videoHero.currentTime = 0;
    videoHero.play().catch(function () {});
    window.scrollTo(0, 0);
}

btnBuka.addEventListener("click", function () {
    opening.classList.remove("hidden");
    musik.play().catch(function () {});
    videoOpening.currentTime = 0;
    videoOpening.play().catch(function () {});

    setTimeout(function () {cover.classList.add("hidden"); }, 1000);
    setTimeout(function () { teksOpening.classList.add("tampil"); }, 6000)
});

videoOpening.addEventListener("timeupdate", function (){
    if (videoOpening.currentTime >= DURASI) masukIsi();
});

videoOpening.addEventListener("ended", masukIsi);
btnLewati.addEventListener("click", masukIsi);

// 3. COUNTDOWN
const hariH = new Date("2026-10-24T08:00:00+07:00");

function updateCountdown() {
    const sekarang = new Date();
    const selisih =hariH - sekarang;

    if (selisih <= 0) {
        document.getElementById("timer").textContent = "Hari bahagia telah tiba!";
        return;
    }

    const hari = Math.floor(selisih / (1000 * 60 * 60 *24));
    const jam = Math.floor((selisih / (1000 * 60 * 60)) % 24);
    const menit = Math.floor((selisih / (1000 * 60)) % 60);
    const detik = Math.floor((selisih / 1000) % 60);

    document.getElementById("hari").textContent = hari;
    document.getElementById("jam").textContent = jam;
    document.getElementById("menit").textContent = menit;
    document.getElementById("detik").textContent = detik;
}

updateCountdown();
setInterval(updateCountdown, 1000);

// 4. ANIMASI SCROLL
const items = document.querySelectorAll("#isi h2, #isi h3, #isi p, #isi .kartu, #isi #timer, #isi .peta, #isi .grid-foto img, #isi #formRsvp, #isi .pria, #isi .wanita, #isi .dan");

items.forEach(function (el) {
    el.classList.add("reveal");
});

const observer = new IntersectionObserver(
    function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.2}
);

items.forEach(function (el, i) {
    el.style.transitionDelay = (i % 4) * 0.2 + "s";
    observer.observe(el);
});

const obsOrnamen = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (entry.isIntersecting) {
            entry.target.parentElement.classList.add(entry.target.dataset.kelas);
            obsOrnamen.unobserve(entry.target);
        }
    });
}, { rootMargin: "0px 0px -15% 0px" });

document.querySelectorAll(".ornamen-canva").forEach(function (sec) {
    const a = document.createElement("span");
    a.className = "penanda penanda-atas";
    a.dataset.kelas = "atas-muncul";
    const b = document.createElement("span");
    b.className = "penanda penanda-bawah";
    b.dataset.kelas= "bawah-muncul";
    sec.append(a, b);
    obsOrnamen.observe(a);
    obsOrnamen.observe(b);
})

// VIDEO LATAR: MAIN CUMA PAS KELIATAN
const obsVideo = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (entry.isIntersecting) {
            entry.target.play().catch(function () {});
        } else {
            entry.target.pause();
        }
    });
}, {threshold: 0.1 });

document.querySelectorAll(".latar-video").forEach(function (v) {
    obsVideo.observe(v);
});

// 5. KIRIM RSVP KE FIRESTORE
const formRsvp = document.getElementById("formRsvp");
const daftarUcapan = document.getElementById("daftarUcapan");

let semuaUcapan = [];
let halamanAktif = 1;
const PER_HALAMAN = 5;
const jumlahUcapan = document.getElementById("jumlahUcapan");
const halamanUcapan = document.getElementById("halamanUcapan");

function waktuLalu(tgl) {
    const detik = Math.floor((Date.now() - tgl.getTime()) / 1000);
    if (detik < 60) return "Baru saja";
    if (detik < 3600) return Math.floor(detik / 60) + " menit yang lalu";
    if (detik < 86400) return Math.floor(detik / 3600) + " jam yang lalu";
    return Math.floor(detik / 86400) + " hari yang lalu";
}

function tampilkanUcapan() {
    daftarUcapan.textContent = "";
    halamanUcapan.textContent = "";
    jumlahUcapan.textContent = semuaUcapan.length + " Ucapan";

    if (semuaUcapan.length === 0) {
        const kosong = document.createElement("p");
        kosong.textContent = "Belum ada ucapan. Jadilah yang pertama!";
        daftarUcapan.append(kosong);
        return; 
    }

    const total = Math.ceil(semuaUcapan.length / PER_HALAMAN);
    const mulai = (halamanAktif - 1) * PER_HALAMAN;

    semuaUcapan.slice(mulai, mulai + PER_HALAMAN).forEach(function (x) {
        const kartu = document.createElement("div");
        kartu.className = "ucapan-item";
        const nama = document.createElement("strong");
        nama.textContent = x.nama;
        const teks = document.createElement("p");
        teks.textContent = x.ucapan;
        const waktu = document.createElement("small");
        waktu.textContent = x.waktu ? waktuLalu(x.waktu.toDate()) : "";
        kartu.append(nama, teks, waktu);
        daftarUcapan.append(kartu);
    });

    if (total <= 1) return;

    function tombol(label, tujuan, aktif) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        if (aktif) b.className = "aktif";
        b.addEventListener("click", function () {
            halamanAktif = tujuan;
            tampilkanUcapan();
            daftarUcapan.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        halamanUcapan.append(b);
    }
    if (halamanAktif > 1) tombol("← Sebelumnya", halamanAktif - 1, false);
    for (let i = 1; i <= total; i++) tombol(String(i), i, i === halamanAktif);
    if (halamanAktif < total) tombol("Berikutnya →", halamanAktif + 1, false);
}

async function muatUcapan() {
    try {
        const q = query(collection(db, "ucapan"), orderBy("waktu", "desc"), limit(100));
        const snap = await getDocs(q);
        semuaUcapan = snap.docs.map(function (d) { return d.data(); });
        halamanAktif = 1;
        tampilkanUcapan();
    }catch (err) {
        console.error(err);
    }
}

muatUcapan();

formRsvp.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nama = document.getElementById("nama").value.trim();
    const ucapan = document.getElementById("ucapan").value.trim();

    const data = {
        nama: nama,
        kehadiran: document.getElementById("kehadiran").value,
        ucapan: ucapan,
        waktu: serverTimestamp(),
    };

    try { 
        await addDoc(collection(db, "rsvp"), data);
        if (ucapan) {
            await addDoc(collection(db, "ucapan"), {
                nama: nama,
                ucapan: ucapan,
                waktu: serverTimestamp(),
            });
            muatUcapan();
        }
        alert("Terima kasih, konfirmasi kamu sudah terkirim!");
        formRsvp.reset();
    } catch (err) {
        console.error(err);
        alert("Gagal mengirim: " + err.code +  " | " + err.message);
    }
});

// 6. SALIN NOMOR REKENING
document.querySelectorAll(".btn-salin").forEach(function (btn) {
    btn.addEventListener("click", function () {
        const nomor = btn.dataset.salin;

        navigator.clipboard.writeText(nomor).then(function () {
            const teksAwal = btn.textContent;
            btn.textContent = "Tersalin ✓";
            setTimeout(function () {
                btn.textContent = teksAwal;
            }, 2000);
        }).catch(function () {
            alert("Salin manual ya: " + nomor);
        });
    });
}) ;
