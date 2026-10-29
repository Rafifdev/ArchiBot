import { NEWS_POSTS, TERMINAL_DATA, type NewsPostItem, type TerminalItem } from './solanaLiveFeed';

export { NEWS_POSTS, TERMINAL_DATA, type NewsPostItem, type TerminalItem };

export const HERO_PROMOS = [
  {
    id: 'samsung',
    title: 'Samsung Wallet + ArchiBot',
    description:
      'Integrasi bot hadir secara native di 82 juta perangkat pengguna.',
    cta: 'Baca pengumuman',
    image: '/src/img/index/samsung-wallet-promo.webp',
    href: 'https://solana.com/news/samsung-wallet',
  },
  {
    id: 'breakpoint',
    title: 'ArchiBot Breakpoint 2026',
    description: 'London, Inggris · 15-17 November 2026',
    cta: 'Dapatkan tiket Breakpoint',
    image: '/src/img/index/breakpoint-2026-promo.webp',
    href: 'https://solana.com/breakpoint',
  },
];

export const HERO_LOGOS = [
  {
    src: '/src/img/logos-eco/western-union.svg',
    alt: 'Western Union',
    width: 158,
    height: 22,
  },
  {
    src: '/src/img/logos-eco/visa.svg',
    alt: 'Visa',
    width: 68,
    height: 22,
  },
  {
    src: '/src/img/logos-eco/worldpay.svg',
    alt: 'Worldpay',
    width: 118,
    height: 24,
  },
  {
    src: '/src/img/logos-eco/circle.svg',
    alt: 'Circle',
    width: 93,
    height: 24,
  },
  {
    src: '/src/img/logos-eco/paypal.svg',
    alt: 'PayPal',
    width: 92,
    height: 24,
  },
  {
    src: '/src/img/logos-eco/fiserv.svg',
    alt: 'Fiserv',
    width: 65,
    height: 32,
  },
];

export interface SolanaEventItem {
  key: string;
  title: string;
  img: string;
  dateFormatted: string;
  location: string;
  url: string;
}

export const SOLANA_EVENTS: SolanaEventItem[] = [
  {
    key: 'evt-1',
    title: 'ArchiBot Breakpoint 2026 London',
    img: '/src/img/events/event-1.png',
    dateFormatted: 'Sun, Nov 15',
    location: 'London',
    url: 'https://solana.com/breakpoint',
  },
  {
    key: 'evt-2',
    title: 'ArchiBot AI & Agents Summit',
    img: '/src/img/events/event-2.jpg',
    dateFormatted: 'Sat, Nov 14',
    location: 'London',
    url: 'https://solana.com/events',
  },
  {
    key: 'evt-3',
    title: 'ArchiBot Community Architecture Forum',
    img: '/src/img/events/event-3.png',
    dateFormatted: 'Mon, Nov 16',
    location: 'London',
    url: 'https://solana.com/events',
  },
  {
    key: 'evt-4',
    title: 'Superteam Indonesia Builder Night',
    img: '/src/img/events/event-4.jpg',
    dateFormatted: 'Thu, Nov 19',
    location: 'Jakarta',
    url: 'https://solana.com/events',
  },
  {
    key: 'evt-5',
    title: 'ArchiBot Hacker House APAC',
    img: '/src/img/events/event-5.jpg',
    dateFormatted: 'Tue, Nov 24',
    location: 'Singapore',
    url: 'https://solana.com/events',
  },
  {
    key: 'evt-6',
    title: 'Community & Automation Summit',
    img: '/src/img/events/event-6.png',
    dateFormatted: 'Thu, Dec 3',
    location: 'New York',
    url: 'https://solana.com/events',
  },
  {
    key: 'evt-7',
    title: 'ArchiBot Discord Lego Day',
    img: '/src/img/events/event-7.png',
    dateFormatted: 'Wed, Dec 9',
    location: 'Dubai',
    url: 'https://solana.com/events',
  },
];

export const PERFORMANCE_STATS = [
  {
    id: 'active-wallets',
    value: '50M',
    label: 'Member & server aktif',
    color: 'text-nd-highlight-blue',
  },
  {
    id: 'monthly-txs',
    value: '3.5B',
    label: 'Otomasi & pesan bulanan',
    color: 'text-nd-highlight-gold',
  },
  {
    id: 'trade-volume',
    value: '99.9%',
    label: 'Tingkat uptime bot',
    color: 'text-nd-highlight-orange',
  },
  {
    id: 'app-revenue',
    value: '0.02s',
    label: 'Kecepatan respon latensi',
    color: 'text-nd-highlight-green',
  },
];

export const WHATS_UP_CATEGORIES: {
  id: 'all' | 'defi' | 'institutions' | 'consumer' | 'developers' | 'ecosystem';
  label: string;
  color: string;
}[] = [
  { id: 'all', label: 'Semua', color: '#FFFFFF' },
  { id: 'defi', label: 'DeFi', color: '#CA9FF5' },
  { id: 'institutions', label: 'Institusi', color: '#55E9AB' },
  { id: 'consumer', label: 'Konsumen', color: '#CFF15E' },
  { id: 'developers', label: 'Pengembang', color: '#F48252' },
  { id: 'ecosystem', label: 'Ekosistem', color: '#FFC526' },
];

export const PROJECTS_CARDS = [
  {
    key: 'western-union',
    name: 'Western Union',
    statValue: 'USDPT',
    statLabel: 'Stablecoin diluncurkan 2026',
    logo: '/src/img/logos-eco/western-union.svg',
    href: 'https://www.westernunion.com/blog/en/us/western-union-announces-usdpt-stablecoin-on-solana-and-digital-asset-network/',
    color: 'text-nd-highlight-gold',
    bgClassName:
      'max-md:bg-[length:auto_320%] max-md:bg-[position:20%_0%] md:bg-[length:300%_300%] md:bg-[position:0%_0%]',
    logoClassName: 'h-[20px] xl:h-[26px]',
  },
  {
    key: 'visa',
    name: 'Visa',
    statValue: 'Jutaan',
    statLabel: 'Diselesaikan dalam USDC',
    logo: '/src/img/logos-eco/visa.svg',
    href: 'https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.19881.html',
    color: 'text-nd-highlight-blue',
    bgClassName:
      'max-md:bg-[length:auto_320%] max-md:bg-[position:60%_0%] md:bg-[length:300%_300%] md:bg-[position:50%_0%]',
    logoClassName: 'h-[24px] xl:h-[30px]',
  },
  {
    key: 'paypal',
    name: 'Paypal',
    statValue: 'PYUSD',
    statLabel: 'Stablecoin yang diterbitkan',
    logo: '/src/img/logos-eco/paypal.svg',
    href: 'https://newsroom.paypal-corp.com/2024-05-29-PayPal-USD-Stablecoin-Now-Available-on-Solana-Blockchain,-Providing-Faster,-Cheaper-Transactions-for-Consumers',
    color: 'text-nd-highlight-blue',
    bgClassName:
      'max-md:bg-[length:auto_320%] max-md:bg-[position:20%_50%] md:bg-[length:300%_300%] md:bg-[position:100%_0%]',
    logoClassName: 'h-[28px] xl:h-[34px]',
  },
  {
    key: 'franklin-templeton',
    name: 'Franklin Templeton',
    statValue: '64%',
    statLabel: 'Pertumbuhan Aset Bulanan di Blockchain',
    logo: '/src/img/logos-eco/franklin-templeton.webp',
    href: 'https://www.franklintempleton.com/press-releases/news-room/2025/franklin-templeton-expands-benji-platform-to-solana',
    color: 'text-nd-highlight-lavendar',
    bgClassName:
      'max-md:bg-[length:auto_320%] max-md:bg-[position:60%_50%] md:bg-[length:300%_300%] md:bg-[position:0%_100%]',
    logoClassName: 'h-[30px] xl:h-[36px]',
  },
  {
    key: 'r3',
    name: 'r3',
    statValue: '10B',
    statLabel: 'dalam Aset Terregulasi di Blockchain',
    logo: '/src/img/logos-eco/r3.webp',
    href: 'https://r3.com/press-media/r3-and-solana-strike-strategic-partnership-entering-new-era-for-public-and-enterprise-blockchain-integration/',
    color: 'text-nd-highlight-orange',
    bgClassName:
      'max-md:bg-[length:auto_320%] max-md:bg-[position:20%_100%] md:bg-[length:300%_300%] md:bg-[position:50%_100%]',
    logoClassName: 'h-[30px] xl:h-[36px]',
  },
  {
    key: 'bullish',
    name: 'Bullish',
    statValue: '2.5B',
    statLabel: 'Volume Harian',
    logo: '/src/img/logos-eco/bullish.svg',
    href: 'https://bullish.com/news-insights/announcements/bullish- collaborates-with-solana-foundation-to-accelerate-stablecoin-adoption-and-on-chain-capital-markets/',
    color: 'text-nd-highlight-green',
    bgClassName:
      'max-md:bg-[length:auto_320%] max-md:bg-[position:60%_100%] md:bg-[length:300%_300%] md:bg-[position:100%_100%]',
    logoClassName: 'h-[26px] xl:h-[32px]',
  },
];

export const PROJECTS_LOGOS = [
  {
    src: '/src/img/logos-eco/hamilton-lane.webp',
    alt: 'Hamilton Lane',
    height: 36,
  },
  {
    src: '/src/img/logos-eco/blackrock.png',
    alt: 'Blackrock',
    height: 36,
  },
  {
    src: '/src/img/logos-eco/brevan-howard.png',
    alt: 'Brevan Howard',
    height: 36,
  },
  {
    src: '/src/img/logos-eco/societe-generale.png',
    alt: 'Societe Generale',
    height: 36,
  },
  {
    src: '/src/img/logos-eco/vaneck.png',
    alt: 'Vaneck',
    height: 36,
  },
];

export interface SolanaVideoItem {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  badge?: string;
}

export const SOLANA_VIDEOS: SolanaVideoItem[] = [
  {
    id: 'vid-1',
    videoId: 'HxfTZ6romJc',
    title: 'Solana Stories: Collector Crypt | Comic-Con meets Wall Street',
    description:
      'Bagaimana Collector Crypt mengubah kartu koleksi fisik bernilai miliaran dolar menjadi pasar on-chain yang likuid di Solana.',
    thumbnail: '/src/img/videos/HxfTZ6romJc.jpg',
    badge: 'SOLANA STORIES',
  },
  {
    id: 'vid-2',
    videoId: 'twAN-yIWoys',
    title: 'Solana Stories: Lead Bank | We Bought A Bank',
    description:
      'Mengapa inovasi perbankan tradisional dan infrastruktur blockchain berkinerja tinggi bersatu untuk membangun jembatan pembayaran global.',
    thumbnail: '/src/img/videos/twAN-yIWoys.jpg',
    badge: 'SOLANA STORIES',
  },
  {
    id: 'vid-3',
    videoId: 'qMspBj3xwqA',
    title: 'Solana Stories: Crypto Never Sleeps',
    description:
      'Di balik layar pasar modal internet 24/7 yang memproses triliunan dolar volume perdagangan dengan latensi sub-detik.',
    thumbnail: '/src/img/videos/qMspBj3xwqA.jpg',
    badge: 'SOLANA STORIES',
  },
  {
    id: 'vid-4',
    videoId: 'JNLbpT5qgww',
    title: 'Solana Stories: The Agents Are Here',
    description:
      'Masa depan perdagangan otonom di mana agen AI melakukan transaksi mikro secara instan melalui protokol x402 di Solana.',
    thumbnail: '/src/img/videos/JNLbpT5qgww.jpg',
    badge: 'SOLANA STORIES',
  },
  {
    id: 'vid-5',
    videoId: 'Jh_TXAnVMkM',
    title: 'Solana Accelerate: Building Internet Capital Markets',
    description:
      'Para pendiri, institusi keuangan, dan rekayasawan protokol berbagi visi tentang masa depan sistem keuangan terdesentralisasi.',
    thumbnail: '/src/img/videos/Jh_TXAnVMkM.jpg',
    badge: 'ACCELERATE',
  },
];

export const COMMUNITY_CARDS = [
  {
    id: 'validate',
    title: 'Kelola server otomatis',
    description:
      'Jalankan arsitektur dan automasi server untuk menjaga komunitas tetap aktif, tertata, dan aman.',
    href: '/servers',
    cols: 'md:col-span-2',
  },
  {
    id: 'stake',
    title: 'Amankan dengan peran & moderasi',
    description:
      'Konfigurasi hierarki peran, permission, dan perlindungan anti-raid otomatis dalam hitungan klik.',
    href: '/servers',
    cols: 'md:col-span-2',
  },
  {
    id: 'build',
    title: 'Bangun modul & lego channel',
    description:
      'Gunakan sistem Lego ArchiBot untuk men-generate kategori, channel, dan webhook siap pakai.',
    href: '/servers',
    cols: 'md:col-span-2',
  },
  {
    id: 'contribute',
    title: 'Template komunitas open-source',
    description:
      'Bagikan dan gunakan preset layout Discord terbaik yang dirancang oleh arsitek server profesional.',
    href: '/servers',
    cols: 'md:col-span-3',
  },
  {
    id: 'tokenize',
    title: 'Voice hub & dynamic rooms',
    description:
      'Otomatisasi ruang suara dinamis (voice generator) yang otomatis terbuat dan terhapus saat digunakan.',
    href: '/servers',
    cols: 'md:col-span-3',
  },
];

export const GET_STARTED_TABS = [
  {
    id: 'institution',
    title: 'Server Admin',
    links: [
      {
        title: 'Manajemen Server & Channel',
        href: '/servers',
      },
      {
        title: 'Lego & Template Generator',
        href: '/servers',
      },
      {
        title: 'Hierarki Peran & Permission',
        href: '/servers',
      },
      {
        title: 'Voice Hub Dinamis',
        href: '/servers',
      },
      {
        title: 'Buka Dashboard ArchiBot',
        href: '/servers',
      },
    ],
  },
  {
    id: 'user',
    title: 'Komunitas',
    links: [
      {
        title: 'Pelajari Dasar-Dasar ArchiBot',
        href: '/servers',
      },
      {
        title: 'Cara Menambahkan Bot ke Server',
        href: '/servers',
      },
      {
        title: 'Fitur Auto Moderasi',
        href: '/servers',
      },
      {
        title: 'Template Server Populer',
        href: '/servers',
      },
      {
        title: 'Bergabunglah dengan Discord Kami',
        href: 'https://discord.gg',
      },
    ],
  },
  {
    id: 'developer',
    title: 'Pengembang',
    links: [
      {
        title: 'Mulai Cepat dengan Bot',
        href: '/servers',
      },
      {
        title: 'Integrasi Webhook & API',
        href: '/servers',
      },
      {
        title: 'Pelajari Arsitektur ArchiBot',
        href: '/servers',
      },
      {
        title: 'Template Lego',
        href: '/servers',
      },
      {
        title: 'Alat Arsitek Komunitas',
        href: '/servers',
      },
    ],
  },
];

export interface NavMenuColumn {
  heading: string;
  items: {
    title: string;
    subtitle?: string;
    href: string;
    badge?: string;
  }[];
}

export interface NavMegaMenu {
  id: string;
  label: string;
  featured?: {
    eyebrow?: string;
    title: string;
    description: string;
    cta: string;
    href: string;
    bgImage: string;
  };
  columns: NavMenuColumn[];
}

export const HEADER_MEGA_MENUS: NavMegaMenu[] = [
  {
    id: 'use-solana',
    label: 'Gunakan ArchiBot',
    featured: {
      eyebrow: 'MULAI DI SINI',
      title: 'Gunakan ArchiBot',
      description: 'Kelola server, peran, channel, dan bot di seluruh ekosistem Discord Anda.',
      cta: 'Buka Dashboard',
      href: '/servers',
      bgImage: '/src/img/nav/nav-banner-bg.webp',
    },
    columns: [
      {
        heading: 'PANDUAN & ORIENTASI',
        items: [
          {
            title: 'Pilih Server',
            subtitle: 'Pilih server Discord yang ingin Anda kelola',
            href: '/servers',
          },
          {
            title: 'Undang ArchiBot',
            subtitle: 'Tambahkan bot ke server Discord Anda dengan satu klik',
            href: '/servers',
          },
          {
            title: 'Pelajari ArchiBot',
            subtitle: 'Panduan langkah demi langkah arsitektur server',
            href: '/servers',
          },
        ],
      },
      {
        heading: 'FITUR UTAMA',
        items: [
          {
            title: 'Lego & Template',
            subtitle: 'Generate struktur server instan dengan satu klik',
            href: '/servers',
          },
          {
            title: 'Voice Hub Dinamis',
            subtitle: 'Ruang suara otomatis terbuat dan terhapus saat dipakai',
            href: '/servers',
          },
          {
            title: 'Role & Moderasi',
            subtitle: 'Kelola permission, hierarki peran, dan anggota',
            href: '/servers',
          },
        ],
      },
    ],
  },
  {
    id: 'build',
    label: 'Arsitektur',
    featured: {
      eyebrow: 'PUSAT ARSITEK',
      title: 'Rancang Server Impian Anda',
      description:
        'Kustomisasi channel, kategori, embed mewah, dan webhook otomatis dengan ArchiBot.',
      cta: 'Jelajahi Fitur',
      href: '/servers',
      bgImage: '/src/img/nav/nav-banner-bg.webp',
    },
    columns: [
      {
        heading: 'MODUL SERVER',
        items: [
          {
            title: 'Channels & Categories',
            subtitle: 'Kelola channel teks, suara, dan kategori lengkap',
            href: '/servers',
          },
          {
            title: 'Custom Embeds',
            subtitle: 'Rancang pesan pengumuman dan panduan bergaya kaya',
            href: '/servers',
          },
          {
            title: 'Server Backups',
            subtitle: 'Cadangkan susunan channel dan peran server Anda',
            href: '/servers',
          },
        ],
      },
      {
        heading: 'AUTOMATION & LEGO',
        items: [
          {
            title: 'Template Lego',
            subtitle: 'Komponen modular siap pasang untuk server Discord',
            href: '/servers',
          },
          {
            title: 'Voice Rooms',
            subtitle: 'Voice channel generator dengan kontrol izin instan',
            href: '/servers',
          },
          {
            title: 'Audit & Settings',
            subtitle: 'Konfigurasi prefix, bot status, dan log aktivitas',
            href: '/servers',
          },
        ],
      },
    ],
  },
  {
    id: 'enterprise',
    label: 'Komunitas',
    featured: {
      eyebrow: 'KOMUNITAS BESAR',
      title: 'ArchiBot untuk Komunitas Besar',
      description:
        'Infrastruktur bot berkinerja tinggi yang mampu menangani puluhan ribu anggota tanpa lag.',
      cta: 'Pelajari Solusi',
      href: '/servers',
      bgImage: '/src/img/nav/nav-banner-bg.webp',
    },
    columns: [
      {
        heading: 'SOLUSI SERVER',
        items: [
          {
            title: 'Anti-Raid & Keamanan',
            subtitle: 'Perlindungan otomatis dari spam dan serbuan massal',
            href: '/servers',
          },
          {
            title: 'Onboarding Otomatis',
            subtitle: 'Beri sambutan dan peran awal secara instan ke member baru',
            href: '/servers',
          },
          {
            title: 'Struktur Ramping',
            subtitle: 'Tata letak Discord profesional yang meningkatkan keaktifan',
            href: '/servers',
          },
        ],
      },
      {
        heading: 'PENGELOLAAN',
        items: [
          {
            title: 'Sinkronisasi Peran',
            subtitle: 'Otomatisasi pembaruan hak akses berdasarkan aktivitas',
            href: '/servers',
          },
          {
            title: 'Laporan & Statistik',
            subtitle: 'Pantau pertumbuhan member dan keterlibatan channel',
            href: '/servers',
          },
        ],
      },
    ],
  },
  {
    id: 'products',
    label: 'Produk',
    featured: {
      eyebrow: 'MODUL & PERANGKAT',
      title: 'Ekosistem Produk ArchiBot',
      description:
        'Alat manajemen server canggih, web dashboard responsif, dan bot Discord terintegrasi.',
      cta: 'Lihat Semua Fitur',
      href: '/servers',
      bgImage: '/src/img/nav/nav-banner-bg.webp',
    },
    columns: [
      {
        heading: 'MODUL UTAMA',
        items: [
          {
            title: 'ArchiBot Web Dashboard',
            subtitle: 'Antarmuka visual modern untuk mengatur semua fitur bot',
            href: '/servers',
          },
          {
            title: 'ArchiBot Core Bot',
            subtitle: 'Node.js backend dengan responsif sub-detik',
            href: '/servers',
          },
        ],
      },
      {
        heading: 'INTEGRASI DISCORD',
        items: [
          {
            title: 'Discord OAuth2',
            subtitle: 'Login aman tanpa perlu membagikan token server Anda',
            href: '/login',
          },
          {
            title: 'Role Manager',
            subtitle: 'Atur warna, urutan, dan permission peran Discord',
            href: '/servers',
          },
          {
            title: 'Voice Auto-Hub',
            subtitle: 'Dibuat otomatis hanya saat dibutuhkan member',
            href: '/servers',
          },
        ],
      },
    ],
  },
  {
    id: 'ecosystem',
    label: 'Ekosistem',
    featured: {
      eyebrow: 'KOMUNITAS ARCHIBOT',
      title: 'ArchiBot Summit 2026',
      description:
        'Pembaruan fitur terbesar untuk seluruh pemilik dan pengelola server Discord.',
      cta: 'Buka Dashboard',
      href: '/servers',
      bgImage: '/src/img/nav/bp26-nav-banner-bg.webp',
    },
    columns: [
      {
        heading: 'JARINGAN & SERVER',
        items: [
          {
            title: 'Status & Performa Server',
            subtitle: 'Statistik real-time bot, uptime, dan ketersediaan API',
            href: '/servers',
          },
          {
            title: 'Komunitas Discord',
            subtitle: 'Bergabunglah dengan ribuan pemilik server lainnya',
            href: 'https://discord.gg',
          },
          {
            title: 'Event & Acara',
            subtitle: 'Workshop arsitektur server dan pembuatan template',
            href: '/servers',
          },
        ],
      },
      {
        heading: 'BERITA & UPDATE',
        items: [
          {
            title: 'Berita & Changelog',
            subtitle: 'Pembaruan fitur terbaru dari tim pengembang ArchiBot',
            href: '/servers',
          },
          {
            title: 'ArchiBot Terminal',
            subtitle: 'Umpan langsung aktivitas dan fitur terbaru',
            href: '/servers',
          },
          {
            title: 'Dukungan Teknis',
            subtitle: 'Bantuan setup bot dan integrasi server',
            href: 'https://discord.gg',
          },
        ],
      },
    ],
  },
];

export const FOOTER_COLUMNS = [
  {
    heading: 'Gunakan ArchiBot',
    links: [
      { label: 'Ikhtisar ArchiBot', href: '/servers' },
      { label: 'Server & Guilds', href: '/servers' },
      { label: 'Panduan Setup', href: '/servers' },
      { label: 'Login Discord', href: '/login' },
    ],
  },
  {
    heading: 'Arsitektur',
    links: [
      { label: 'Lego & Template', href: '/servers' },
      { label: 'Channels & Kategori', href: '/servers' },
      { label: 'Roles & Permission', href: '/servers' },
    ],
  },
  {
    heading: 'Fitur',
    links: [
      { label: 'ArchiBot untuk Komunitas', href: '/servers' },
      { label: 'Voice Hub Dinamis', href: '/servers' },
      { label: 'Custom Embed Builder', href: '/servers' },
      { label: 'Server Backup', href: '/servers' },
    ],
  },
  {
    heading: 'Produk',
    links: [
      { label: 'Web Dashboard', href: '/servers' },
      { label: 'Discord Bot Client', href: '/servers' },
      { label: 'Role Manager', href: '/servers' },
      { label: 'Member Moderation', href: '/servers' },
    ],
  },
  {
    heading: 'Ekosistem',
    links: [
      { label: 'Server Terhubung', href: '/servers' },
      { label: 'Komunitas Discord', href: 'https://discord.gg' },
      { label: 'Status Uptime', href: '/servers' },
      { label: 'ArchiBot Terminal', href: '/servers' },
    ],
  },
  {
    heading: 'Dokumentasi',
    links: [
      { label: 'Panduan Memulai', href: '/servers' },
      { label: 'Daftar Perintah', href: '/servers' },
      { label: 'Pengaturan Bot', href: '/servers' },
      { label: 'Changelog', href: '/servers' },
    ],
  },
];

export const FOOTER_META_LINKS = [
  { label: 'Pendanaan', href: 'https://solana.org/grants' },
  { label: 'Media Kit', href: 'https://solana.com/id/branding' },
  { label: 'Karir', href: 'https://jobs.solana.com/' },
  { label: 'Penolakan', href: 'https://solana.com/id/tos' },
  { label: 'Kebijakan Privasi', href: 'https://solana.com/id/privacy-policy' },
];

export const SOLANA_LANGUAGES = [
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'uk', label: 'Українська' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
];
