# Game Budak Sekolah Rendah

Permainan pendidikan berasaskan web untuk kanak-kanak dari umur 2 tahun hingga Darjah 6.
Tak perlu install apa-apa: buka `index.html` dalam pelayar (telefon, tablet atau komputer).

## Permainan

### 🎈 Jom Kira! — Matematik umur 3 tahun (`umur3-matematik/`)

Dibina dengan enjin game [Phaser 3](https://phaser.io) (JavaScript): maskot kucing, buah jatuh dengan fizik,
objek boleh diketik atau diseret, kereta api corak, dan konfeti bintang.

Dibina berdasarkan bidang *Perkembangan Awal Matematik dan Pemikiran Logik* (Kurikulum PERMATA Negara, umur 0–4)
dan pencapaian perkembangan biasa kanak-kanak 3 tahun.

| Mini-game | Kemahiran |
|---|---|
| 🍎 Kira Buah | Membilang objek 1–5 (satu sebutan untuk satu objek) |
| 🔺 Padan Bentuk | Memadankan bulat, segi empat, segi tiga, bintang |
| 🎨 Asing Warna | Mengelas ikut satu ciri: warna |
| 🐘 Besar & Kecil | Membanding saiz |
| 🚂 Sambung Corak | Corak AB atas kereta api (cabaran untuk yang hampir 4 tahun) |

Prinsip reka bentuk:
- Arahan disebut dengan suara (Web Speech API, Bahasa Melayu), jadi anak tak perlu tahu membaca
- Butang besar untuk jari kecil; bentuk, bola dan corak boleh diketik atau diseret
- Tiada "kalah": jawapan salah cuma dapat bunyi lembut dan "Cuba lagi!"
- 5 pusingan pendek setiap permainan, bintang sebagai ganjaran

> Phaser dimuatkan dari cdnjs, jadi perlukan internet.
> Suara Bahasa Melayu bergantung pada peranti. Jika tiada suara `ms`, suara Bahasa Indonesia akan digunakan.

## Jalankan secara lokal

```sh
python3 -m http.server 8000
# buka http://localhost:8000
```
