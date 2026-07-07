const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h1>🚀 Backend Gizzatara Aktif!</h1>
        <p>Kalau kamu melihat ini, artinya Cloudflare Tunnel bekerja dengan sempurna.</p>
        <p>Request dari internet berhasil masuk ke laptop kamu.</p>
      </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
  console.log(`🌐 Sekarang coba refresh web https://api.gizzatara.space di browser!`);
});
