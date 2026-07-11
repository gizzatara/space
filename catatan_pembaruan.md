# 📝 Catatan Pembaruan: Redesain Portfolio Immersif Gizzatara

> **Tanggal Pembaruan**: 11 Juli 2026  
> **Tema Desain**: Retro Pixel Arcade & Cyberpunk Neon Accent  
> **Hasil Akhir**: [index.html](file:///D:/GIZZA/PROJEK/WEBSITE%20PORTO%20GIZZA/index.html) | [style.css](file:///D:/GIZZA/PROJEK/WEBSITE%20PORTO%20GIZZA/style.css) | [script.js](file:///D:/GIZZA/PROJEK/WEBSITE%20PORTO%20GIZZA/script.js)

---

## 🎨 1. Desain & Tipografi (Design Tokens)

* **Palet Warna Utama**:
  * Phosphor Green (`#4ade80`) — Warna default kursor, batas boks, dan network grid.
  * Retro Hot Pink (`#f43f5e`) — Aksen hover, status aktif, dan outline asteroid default.
  * Cyber Cyan (`#38bdf8`) — Tautan, detail tech, dan sorotan kursor.
  * Arcade Gold (`#facc15`) — Warna judul utama, sub-judul, dan proyektil laser.
* **Tipografi Retro**:
  * Headings & Labels: `'Press Start 2P'`
  * Body & Paragraphs: `'VT323'` (ukuran di-scale minimal 22px agar mudah dibaca di layar mana pun).
* **Sudut Tumpul Mati**: Semua border-radius diatur ke `0px` untuk mempertahankan gaya arcade kotak tajam (*sharp blocky edges*).

---

## 🎛️ 2. Efek Dual-Mode CRT (ON/OFF)

Tombol **CRT** di pojok kanan atas navigasi kini memberikan transisi visual yang sangat dramatis dan kontras:
* **CRT OFF (Default)**: Tampilan bersih, kontemporer, tajam, tanpa scanline, dan tanpa vignette pinggir.
* **CRT ON**:
  * **Overlay Scanlines (5px)**: Garis horizontal pekat untuk sensasi monitor cembung tabung.
  * **Curved Bezel Vignette**: Bayangan melingkar tebal (*radial black gradient*) di sekeliling browser untuk mensimulasikan layar tabung kaca cembung monitor jadul.
  * **CRT Screen Flicker**: Kedipan halus dinamis di latar belakang monitor.
  * **Rolling Scanline Bar**: Garis pemindai horizontal yang turun perlahan dari atas ke bawah layar secara terus-menerus.
  * **Phosphor Text Glow**: Efek pendaran cahaya analog (`text-shadow`) hijau fosfor dan pink menyala di sekeliling semua teks dan tombol secara imersif.

---

## 🎯 3. Sistem TargetCursor (Kursor Kustom)

* Mengganti kursor default browser dengan **Square Crosshair** berwarna hijau fosfor (`#4ade80`) lengkap dengan target dot di tengah.
* **Parallax Elastic Lerp**: Kursor bergerak mengekor posisi mouse dengan kelenturan halus (lerp factor: `0.15`) untuk kenyamanan membaca.
* **Interactive Hover state**: Ketika melayang di atas tombol, link, atau kartu proyek (`.cursor-target`):
  * Kursor membesar.
  * Ring luar berubah warna menjadi pink (`#f43f5e`).
  * Target dot di tengah berubah menjadi biru cyan (`#38bdf8`) dan membesar.
* *(Catatan: Kursor kustom / crosshair otomatis dinonaktifkan sepenuhnya pada perangkat layar sentuh / mobile demi kenyamanan navigasi).*

---

## 🪐 4. Global Background Canvas (Constellation & Petir)

* Canvas dipasang secara **fixed background** di belakang seluruh dokumen web.
* **Green Network Grid**: Node partikel hijau fosfor bergerak lambat dan saling terhubung, serta memancarkan pendaran pink-merah menyala saat mendekati kursor mouse pemain.
* **Badai Petir Prosedural (Hue 260)**: Petir ungu piksel menyambar secara acak melintasi tinggi dokumen di belakang teks, memicu kedipan flash ungu redup pada langit latar belakang.

---

## 🎮 5. Arcade Playground (Eroding Asteroid Boss Fight)

Mekanisme permainan dirancang ulang total untuk mendukung **Mobile Touch Screen** dan memberikan tantangan Boss Fight yang seru:
* **Kemudi Otomatis & Lock-on**: Pesawat biplane neon terbang otomatis mengikuti ke mana pun kursor/sentuhan jari Anda (*touch*) bergeser. Moncong pesawat otomatis terkunci (*lock-on*) mengarah ke asteroid di tengah.
* **Tembakan Otomatis (Auto-Shoot)**: Pesawat memuntahkan double laser kuning secara otomatis setiap `185ms` tanpa perlu menekan tombol, lengkap dengan efek ledakan moncong (*muzzle flash*) pink di depan sayap.
* **Kikisan Prosedural Asteroid (Erosion)**: Asteroid batu besar mengapung di tengah layar. Setiap peluru yang mengenai tepi asteroid akan **mengikis/mendeformasi jari-jari tepi asteroid secara fisik** pada sudut tumbukan, disertai guncangan layar (*shake*) dan serpihan batu serta api.
* **Mekanisme Regen**: Asteroid secara bertahap memulihkan/menumbuhkan kembali bagian badannya yang terkikis secara perlahan jika tidak ditembak terus-menerus.
* **Generative Color Swap**: Ketika HP/ukuran asteroid terkikis di bawah **10%**, terjadi ledakan besar, skor bertambah `+100`, dan asteroid baru akan di-spawn dengan **bentuk dan warna HSL pilihan yang berbeda secara generatif** (Phosphor Green, Hot Pink, Cyber Cyan, Gold, Purple, Volcanic Orange) tanpa ada warna kembar berurutan.

---

## 🗂️ 6. Animasi Khusus Kartu Proyek (Project Cards)

* **Chromatic Split Shadow**: Saat di-hover, kartu proyek terangkat setinggi `6px` ke kiri atas dengan bayangan pixel art terpisah menjadi warna pink (`#f43f5e`) dan cyan (`#38bdf8`) untuk efek chromatic aberration 3D.
* **Glitch Shake Feedback**: Saat pointer pertama kali masuk ke kartu, terjadi getaran dan pergantian hue warna (*glitch shake*) secara patah-patah selama `0.25` detik.
* *(Catatan: Animasi scanline sweep overlay / cahaya berjalan telah dihapus demi kenyamanan visual).*

---

## 📂 7. Status Integrasi Berkas
Semua aset gambar asli (`habisin dut bgn thumnail.png`, `samudera harapan.png`, `roh-halus.png`, `creative_log_Gizza_Ardhana_compressed (1).pdf`) dan folder sub-proyek (`/habisin-duit-bgn`, `/roh-halus`) tetap berada di folder ini tanpa ada kerusakan. Website siap didorong (*push*) ke GitHub Pages.
