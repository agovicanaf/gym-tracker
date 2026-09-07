# DEMİR — Kişisel Antrenman Takip Sistemi

Ömer ve Efehan için özel yapılmış, haftalık antrenman programı ve ağırlık takip sistemi. Next.js + Postgres ile kurulmuştur, Vercel'de ücretsiz olarak yayınlanabilir.

## Özellikler

- **İki ayrı sistem**: Giriş ekranında "Ömer'in Sistemi" ve "Efehan'ın Sistemi" — her biri kendi verisini görür.
- **Haftalık program yönetimi**: İstediğin kadar antrenman günü (Push, Pull, Bacak vb.), her güne istediğin kadar hareket ekle.
- **Set/tekrar/ağırlık girişi**: Her antrenmanda hareketi genişlet, ağırlık ve tekrar gir, kaydet. Geçmiş kayıtlar hemen altında listelenir.
- **Hareket önerileri**: Hareket adı yazarken ("inc" gibi) hem hazır kütüphaneden (Incline Bench Press, Incline Dumbbell Curl vb.) hem de daha önce eklediğin hareketlerden anlık öneri çıkar — ok tuşlarıyla gezip Enter'la seçebilirsin.
- **Analiz paneli**: Toplam seans, toplam set, toplam hacim (kg), en ağır kaldırış, haftalık hacim grafiği, hareket bazlı ilerleme grafiği ve PR (kişisel rekor) rozetleri.
- **Bulut veritabanı**: Tüm veriler Postgres'te saklanır — telefon, bilgisayar, herhangi bir cihazdan erişilebilir.

## Teknoloji

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Vercel Postgres (Neon) — `@neondatabase/serverless`
- Recharts (grafikler)

---

## Vercel'e Yayınlama Adımları

### 1. Projeyi GitHub'a yükle

```bash
git init
git add .
git commit -m "İlk kurulum"
```

GitHub'da yeni bir repo oluşturup bu projeyi push'la.

### 2. Vercel'de projeyi import et

1. [vercel.com](https://vercel.com) → **Add New Project**
2. GitHub reponu seç → **Import**
3. Framework otomatik olarak **Next.js** algılanacak, ayar değiştirmene gerek yok
4. Henüz **Deploy**'a basma — önce veritabanını bağlamalısın (bir sonraki adım)

### 3. Postgres veritabanını bağla

1. Vercel proje sayfasında **Storage** sekmesine git
2. **Create Database** → **Postgres** (Neon tabanlı) seç
3. Veritabanını oluştur ve projene bağla (Connect Project)
4. Bu işlem `DATABASE_URL` ortam değişkenini otomatik olarak projene ekler

### 4. Deploy et

Storage bağlandıktan sonra **Deploy** butonuna bas. Birkaç dakika içinde site yayında olacak (örn: `demir-antrenman.vercel.app`).

### 5. Veritabanı tablolarını oluştur (tek seferlik)

Site ilk açıldığında hem Ömer hem Efehan'ın sayfasında **"Veritabanını Kur"** butonu görünecek. Herhangi biri bir kere tıklayınca tüm tablolar otomatik oluşur ve bir daha görünmez.

> Alternatif: Kendi bilgisayarından `vercel env pull .env.local` ile bağlantı bilgisini çekip `npm run db:init` çalıştırarak da kurabilirsin.

---

## Yerelde Çalıştırma (opsiyonel)

```bash
npm install
vercel link          # Vercel projenle eşleştir
vercel env pull .env.local   # DATABASE_URL'i çek
npm run db:init       # Tabloları oluştur
npm run dev            # http://localhost:3000
```

---

## Proje Yapısı

```
app/
  page.tsx                 → Giriş ekranı (Ömer / Efehan seçimi)
  [user]/
    layout.tsx              → Kullanıcı doğrulama + üst menü
    page.tsx                → Haftalık program (hareket/set/tekrar girişi)
    analiz/page.tsx          → Analiz paneli (grafikler, istatistikler)
  api/
    workout-days/            → Antrenman günleri CRUD
    exercises/                → Hareketler CRUD
    set-logs/                  → Ağırlık/set kayıtları CRUD
    stats/                      → Analiz paneli verisi
    init/                        → Veritabanı kurulum endpoint'i
lib/
  db.ts                      → Veritabanı bağlantısı, kullanıcı doğrulama
  types.ts                   → Ortak TypeScript tipleri
  api.ts                     → Frontend'den API'ye istek atan yardımcı fonksiyonlar
components/
  TopNav.tsx                 → Üst navigasyon
  WorkoutDayCard.tsx          → Antrenman günü kartı + hareket ekleme
  ExerciseCard.tsx             → Hareket kartı + set/tekrar/ağırlık girişi
scripts/
  schema.sql                  → Veritabanı şeması
  init-db.mjs                  → Yerel kurulum scripti
```

## Notlar

- Bu sistemde şifre koruması yoktur — sadece isim seçimi ile giriş yapılır. Site linkini yalnızca Ömer ve Efehan ile paylaşman yeterlidir.
- Vercel Postgres (Neon) ücretsiz katmanı bu ölçekte bir kullanım için fazlasıyla yeterlidir.
- Veriler kalıcıdır; tarayıcı geçmişini silmek veya farklı cihaz kullanmak veriyi etkilemez.
