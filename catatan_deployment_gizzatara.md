# 🚀 Catatan Proyek: Deployment & Infrastruktur gizzatara.space

> **Tanggal dibuat**: 7 Juli 2026  
> **Domain**: `gizzatara.space` (dibeli di Hostinger)  
> **Proyek utama**: Website Portfolio Gizzatara  

---

## 📋 Ringkasan Arsitektur

```
gizzatara.space (Hostinger Domain)
│
├── gizzatara.space              → Portfolio (GitHub Pages)
│   File: index.html, style.css, script.js
│   Hosting: GitHub Pages (GRATIS)
│
├── api.gizzatara.space          → Backend API (Cloudflare Tunnel → Laptop)
│   Server: Node.js / Python / dll di localhost
│   Tunnel: cloudflared → Cloudflare → domain
│
├── app.gizzatara.space          → Project web app lain
│   Hosting: Cloudflare Tunnel / Vercel / Railway
│
└── [subdomain-lain].gizzatara.space → Project masa depan
```

---

## FASE 1: Deploy Portfolio ke GitHub Pages

### Checkpoint 1.1 — Persiapan Repository GitHub
- [ ] Buat akun GitHub (jika belum punya)
- [ ] Buat repository baru di [github.com/new](https://github.com/new)
  - Nama repo: misalnya `portfolio` atau `gizzatara.space`
  - Set ke **Public** (wajib untuk GitHub Pages free)
- [ ] Pastikan Git sudah terinstall di laptop
  ```powershell
  git --version
  ```
  Jika belum ada, install: `winget install Git.Git`

### Checkpoint 1.2 — Upload Kode ke GitHub
- [ ] Buka terminal di folder proyek `D:\GIZZA\PROJEK\WEBSITE PORTO GIZZA`
- [ ] Buat file `.gitignore` untuk exclude file yang tidak perlu:
  ```
  .firebase/
  node_modules/
  *.pdf
  ```
- [ ] Jalankan perintah berikut:
  ```powershell
  git init
  git add .
  git commit -m "Initial commit - portfolio website"
  git branch -M main
  git remote add origin https://github.com/USERNAME/NAMA-REPO.git
  git push -u origin main
  ```
> ⚠️ Ganti `USERNAME` dan `NAMA-REPO` sesuai akun GitHub kamu

### Checkpoint 1.3 — Aktifkan GitHub Pages
- [ ] Buka repo di GitHub → **Settings** → **Pages**
- [ ] Branch: pilih `main`, folder: `/ (root)`
- [ ] Klik **Save**
- [ ] Tunggu beberapa menit, cek URL: `https://USERNAME.github.io/NAMA-REPO`
- [ ] Verifikasi website tampil dengan benar

### Checkpoint 1.4 — File CNAME
- [ ] Pastikan file `CNAME` sudah ada di root proyek (✅ sudah dibuat)
  - Isi: `gizzatara.space`
- [ ] Commit dan push file CNAME ke GitHub
  ```powershell
  git add CNAME
  git commit -m "Add CNAME for custom domain"
  git push
  ```

---

## FASE 2: Setting Domain di Hostinger → GitHub Pages

### Checkpoint 2.1 — Konfigurasi DNS di Hostinger

> ⚠️ **PENTING**: Fase ini dilakukan **SEBELUM** pindah ke Cloudflare.  
> Kalau kamu mau langsung pakai Cloudflare (untuk backend juga), **SKIP ke FASE 3** dan atur DNS-nya di Cloudflare.

- [ ] Login ke [Hostinger](https://www.hostinger.co.id)
- [ ] Buka **Domains** → `gizzatara.space` → **DNS / Nameservers**
- [ ] Tambah DNS record berikut:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| `A` | `@` | `185.199.108.153` | 3600 |
| `A` | `@` | `185.199.109.153` | 3600 |
| `A` | `@` | `185.199.110.153` | 3600 |
| `A` | `@` | `185.199.111.153` | 3600 |
| `CNAME` | `www` | `USERNAME.github.io` | 3600 |

### Checkpoint 2.2 — Set Custom Domain di GitHub
- [ ] Buka repo GitHub → **Settings** → **Pages**
- [ ] Di **Custom domain**, ketik: `gizzatara.space`
- [ ] Klik **Save**
- [ ] Centang **Enforce HTTPS** (tunggu beberapa menit sampai aktif)

### Checkpoint 2.3 — Verifikasi
- [ ] Cek propagasi DNS di [whatsmydns.net](https://www.whatsmydns.net)
- [ ] Buka `https://gizzatara.space` di browser
- [ ] Pastikan HTTPS aktif (gembok hijau di address bar)
- [ ] Test di HP juga

---

## FASE 3: Setup Cloudflare (Untuk Backend + CDN)

> **Kenapa Cloudflare?** Gratis, bisa Tunnel ke laptop, CDN global, DDoS protection, SSL otomatis.

### Checkpoint 3.1 — Pindahkan DNS ke Cloudflare
- [ ] Daftar di [dash.cloudflare.com](https://dash.cloudflare.com)
- [ ] Klik **Add a site** → masukkan `gizzatara.space`
- [ ] Pilih plan **Free**
- [ ] Cloudflare akan memberikan **2 nameserver** baru, contoh:
  ```
  ada.ns.cloudflare.com
  rick.ns.cloudflare.com
  ```
- [ ] Buka **Hostinger** → **Domains** → `gizzatara.space` → **Nameservers**
- [ ] Ganti nameserver default ke nameserver Cloudflare
- [ ] Tunggu propagasi (1–24 jam, biasanya ~1 jam)
- [ ] Verifikasi di Cloudflare dashboard: status domain = **Active**

### Checkpoint 3.2 — Atur Ulang DNS di Cloudflare
Setelah domain aktif, tambahkan DNS records di **Cloudflare Dashboard → DNS**:

**Untuk Portfolio (GitHub Pages):**

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| `A` | `@` | `185.199.108.153` | DNS only (grey) |
| `A` | `@` | `185.199.109.153` | DNS only (grey) |
| `A` | `@` | `185.199.110.153` | DNS only (grey) |
| `A` | `@` | `185.199.111.153` | DNS only (grey) |
| `CNAME` | `www` | `USERNAME.github.io` | DNS only (grey) |

> ⚠️ Untuk GitHub Pages, matikan proxy (set ke **DNS only / grey cloud**), karena GitHub perlu verifikasi domain langsung.

---

## FASE 4: Setup Cloudflare Tunnel (Backend di Laptop)

### Checkpoint 4.1 — Install cloudflared
- [ ] Buka PowerShell (Admin) dan jalankan:
  ```powershell
  winget install cloudflare.cloudflared
  ```
- [ ] Verifikasi:
  ```powershell
  cloudflared --version
  ```

### Checkpoint 4.2 — Login & Buat Tunnel
- [ ] Login ke Cloudflare:
  ```powershell
  cloudflared tunnel login
  ```
  (Browser akan terbuka, pilih domain `gizzatara.space`)
  
- [ ] Buat tunnel baru:
  ```powershell
  cloudflared tunnel create gizza-backend
  ```
  Catat **Tunnel ID** yang muncul.

### Checkpoint 4.3 — Konfigurasi Tunnel
- [ ] Buat file config: `C:\Users\User\.cloudflared\config.yml`
  ```yaml
  tunnel: gizza-backend
  credentials-file: C:\Users\User\.cloudflared\<TUNNEL-ID>.json

  ingress:
    # Backend API
    - hostname: api.gizzatara.space
      service: http://localhost:3000

    # Project web app lain (opsional)
    - hostname: app.gizzatara.space
      service: http://localhost:5173

    # Fallback — wajib ada di paling bawah
    - service: http_status:404
  ```

### Checkpoint 4.4 — Hubungkan DNS ke Tunnel
- [ ] Jalankan perintah:
  ```powershell
  cloudflared tunnel route dns gizza-backend api.gizzatara.space
  cloudflared tunnel route dns gizza-backend app.gizzatara.space
  ```

### Checkpoint 4.5 — Jalankan Tunnel
- [ ] Test manual dulu:
  ```powershell
  cloudflared tunnel run gizza-backend
  ```
- [ ] Pastikan backend sudah jalan di `localhost:3000`
- [ ] Buka `https://api.gizzatara.space` di browser — harus bisa diakses

### Checkpoint 4.6 — Jadikan Windows Service (Auto-start)
- [ ] Jalankan PowerShell sebagai **Administrator**:
  ```powershell
  cloudflared service install
  ```
- [ ] Tunnel akan otomatis jalan saat laptop boot
- [ ] Verifikasi di **Services** (Win+R → `services.msc`) → cari "Cloudflared"

---

## FASE 5: Cleanup & Migrasi dari Firebase

### Checkpoint 5.1 — Bersihkan Konfigurasi Firebase Lama
- [ ] Setelah semua berjalan di GitHub Pages, hapus/arsipkan file Firebase:
  - `firebase.json`
  - `.firebaserc`
  - `.firebase/` (folder)
- [ ] Atau simpan di branch terpisah kalau mau backup

### Checkpoint 5.2 — Update .gitignore Final
- [ ] Pastikan `.gitignore` sudah rapi:
  ```
  .firebase/
  node_modules/
  *.pdf
  .cloudflared/
  ```

---

## 📊 Status Tracker

| Fase | Deskripsi | Status |
|------|-----------|--------|
| **1** | Deploy portfolio ke GitHub Pages | ⬜ Belum mulai |
| **2** | Setting domain Hostinger → GitHub | ⬜ Belum mulai |
| **3** | Pindah DNS ke Cloudflare | ⬜ Belum mulai |
| **4** | Setup Cloudflare Tunnel (backend laptop) | ⬜ Belum mulai |
| **5** | Cleanup Firebase & finalisasi | ⬜ Belum mulai |

---

## 🔧 Tool & Akun yang Dibutuhkan

| Tool / Akun | Kegunaan | Status |
|-------------|----------|--------|
| **Git** | Version control | ❓ Cek dulu |
| **GitHub** | Hosting kode + GitHub Pages | ❓ Cek dulu |
| **Hostinger** | Domain registrar | ✅ Sudah punya |
| **Cloudflare** | DNS + Tunnel + CDN | ⬜ Perlu daftar |
| **cloudflared** | CLI tunnel ke laptop | ⬜ Perlu install |
| **Node.js** (opsional) | Untuk backend project | ❓ Cek dulu |

---

## 💡 Tips Penting

> [!WARNING]
> **Laptop sebagai server**: Kalau laptop mati, sleep, atau WiFi putus — semua subdomain yang lewat Cloudflare Tunnel akan down. Portfolio di GitHub Pages **tidak terpengaruh** karena di-hosting oleh GitHub.

> [!TIP]
> **Urutan yang disarankan**: Kerjakan FASE 1 → 2 → 3 → 4 secara berurutan. Jangan loncat-loncat karena setiap fase tergantung fase sebelumnya.

> [!TIP]
> **Quick test tanpa setup domain**: Kalau mau cepat test backend, bisa pakai `cloudflared tunnel --url http://localhost:3000` untuk dapat temporary URL gratis tanpa konfigurasi domain.

> [!NOTE]
> **Biaya**: Semua setup ini **GRATIS** kecuali domain `gizzatara.space` yang sudah kamu beli. GitHub Pages gratis, Cloudflare free tier, Cloudflare Tunnel gratis.
