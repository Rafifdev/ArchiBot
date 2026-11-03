import { NEWS_POSTS, TERMINAL_DATA, type NewsPostItem, type TerminalItem } from './solanaLiveFeed';

export { NEWS_POSTS, TERMINAL_DATA, type NewsPostItem, type TerminalItem };

export interface SolanaEventItem {
  key: string;
  title: string;
  img: string;
  dateFormatted?: string;
  location?: string;
  category?: string;
  memberCount?: string;
  url: string;
}

export const SOLANA_EVENTS: SolanaEventItem[] = [
  {
    key: 'srv-1',
    title: "Yoapipp's server",
    img: '/src/img/events/yoapipp-server.svg',
    category: 'Komunitas',
    memberCount: '150 Member Aktif',
    url: '/servers',
  },
  {
    key: 'srv-2',
    title: 'The JAWIR',
    img: '/src/img/events/the-jawir.png',
    category: 'Gaming',
    memberCount: '1.2K Member Aktif',
    url: '/servers',
  },
  {
    key: 'srv-3',
    title: "Yoapipp's server",
    img: '/src/img/events/yoapipp-server.svg',
    category: 'Komunitas',
    memberCount: '150 Member Aktif',
    url: '/servers',
  },
  {
    key: 'srv-4',
    title: 'The JAWIR',
    img: '/src/img/events/the-jawir.png',
    category: 'Gaming',
    memberCount: '1.2K Member Aktif',
    url: '/servers',
  },
  {
    key: 'srv-5',
    title: "Yoapipp's server",
    img: '/src/img/events/yoapipp-server.svg',
    category: 'Komunitas',
    memberCount: '150 Member Aktif',
    url: '/servers',
  },
  {
    key: 'srv-6',
    title: 'The JAWIR',
    img: '/src/img/events/the-jawir.png',
    category: 'Gaming',
    memberCount: '1.2K Member Aktif',
    url: '/servers',
  },
  {
    key: 'srv-7',
    title: "Yoapipp's server",
    img: '/src/img/events/yoapipp-server.svg',
    category: 'Komunitas',
    memberCount: '150 Member Aktif',
    url: '/servers',
  },
  {
    key: 'srv-8',
    title: 'The JAWIR',
    img: '/src/img/events/the-jawir.png',
    category: 'Gaming',
    memberCount: '1.2K Member Aktif',
    url: '/servers',
  },
];

export interface PerformanceStatItem {
  id: string;
  value: string;
  label: string;
  color: string;
  apiKey?: 'uptime' | 'latency' | 'activeUsers' | 'servers';
}

export const PERFORMANCE_STATS: PerformanceStatItem[] = [
  {
    id: 'bot-uptime',
    value: '99.9%',
    label: 'Tingkat Uptime Bot',
    color: 'text-nd-highlight-blue',
    apiKey: 'uptime',
  },
  {
    id: 'bot-latency',
    value: '18ms',
    label: 'Latensi & Respons Bot',
    color: 'text-nd-highlight-gold',
    apiKey: 'latency',
  },
  {
    id: 'active-users',
    value: '52',
    label: 'Pengguna aktif',
    color: 'text-nd-highlight-orange',
    apiKey: 'activeUsers',
  },
  {
    id: 'total-servers',
    value: '2',
    label: 'Server terhubung',
    color: 'text-nd-highlight-green',
    apiKey: 'servers',
  },
];

export const WHATS_UP_CATEGORIES: {
  id: 'all' | 'developers' | 'defi' | 'consumer' | 'institutions' | 'ecosystem';
  label: string;
  color: string;
}[] = [
  { id: 'all', label: 'Semua', color: '#FFFFFF' },
  { id: 'developers', label: 'Arsitektur', color: '#F48252' },
  { id: 'defi', label: 'Suara & Otomasi', color: '#CA9FF5' },
  { id: 'consumer', label: 'Keamanan', color: '#CFF15E' },
  { id: 'institutions', label: 'Komunitas', color: '#55E9AB' },
  { id: 'ecosystem', label: 'Manajemen & Peran', color: '#FFC526' },
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
    title: 'ArchiBot Stories: Membangun Komunitas Gaming 100.000 Member',
    description:
      'Bagaimana arsitek komunitas merancang puluhan kategori, antrean voice room, dan sistem peran otomatis dalam waktu kurang dari 5 menit.',
    thumbnail: '/src/img/videos/HxfTZ6romJc.jpg',
    badge: 'ARCHIBOT STORIES',
  },
  {
    id: 'vid-2',
    videoId: 'twAN-yIWoys',
    title: 'ArchiBot Stories: Transformasi Server Edukasi & Kampus',
    description:
      'Mengapa universitas dan komunitas belajar beralih ke sistem Template Lego ArchiBot untuk mengelola ratusan kelas diskusi secara rapi.',
    thumbnail: '/src/img/videos/twAN-yIWoys.jpg',
    badge: 'ARCHIBOT STORIES',
  },
  {
    id: 'vid-3',
    videoId: 'qMspBj3xwqA',
    title: 'ArchiBot Stories: Moderasi Otomatis Tanpa Henti 24/7',
    description:
      'Di balik layar infrastruktur keamanan ArchiBot yang menangkal serangan spam dan raid pada ribuan server Discord dengan latensi sub-detik.',
    thumbnail: '/src/img/videos/qMspBj3xwqA.jpg',
    badge: 'ARCHIBOT STORIES',
  },
  {
    id: 'vid-4',
    videoId: 'JNLbpT5qgww',
    title: 'ArchiBot Stories: Era Baru AI Server Architect',
    description:
      'Masa depan pengelolaan Discord di mana asisten AI merancang struktur channel, permission, dan pesan embed hanya dari perintah teks.',
    thumbnail: '/src/img/videos/JNLbpT5qgww.jpg',
    badge: 'ARCHIBOT STORIES',
  },
  {
    id: 'vid-5',
    videoId: 'Jh_TXAnVMkM',
    title: 'ArchiBot Summit: Standar Baru Arsitektur Komunitas Digital',
    description:
      'Para pemilik server terbesar, moderator profesional, dan tim pengembang ArchiBot berbagi visi tentang masa depan ekosistem Discord.',
    thumbnail: '/src/img/videos/Jh_TXAnVMkM.jpg',
    badge: 'SUMMIT',
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
            href: '/api/auth/login',
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
    heading: 'Fitur & Modul',
    links: [
      { label: 'AI Server Architect', href: '/servers' },
      { label: 'Template Lego', href: '/servers' },
      { label: 'Dynamic Voice Hub', href: '/servers' },
      { label: 'Custom Embed Builder', href: '/servers' },
      { label: 'Role & Permission Manager', href: '/servers' },
      { label: 'Server Backup & Restore', href: '/servers' },
    ],
  },
  {
    heading: 'Akses & Navigasi',
    links: [
      { label: 'Pilih Server Discord', href: '/servers' },
      { label: 'Tambah Bot ke Server', href: '/servers' },
      { label: 'Masuk dengan Discord', href: '/api/auth/login' },
      { label: 'Ringkasan & Statistik Server', href: '/servers' },
    ],
  },
  {
    heading: 'Komunitas & Dukungan',
    links: [
      { label: 'Komunitas Discord Resmi', href: 'https://discord.gg' },
      { label: 'GitHub Repository', href: 'https://github.com/Rafifdev/ArchiBot' },
      { label: 'Panduan Memulai', href: '/servers' },
      { label: 'Laporkan Masalah & Feedback', href: 'https://github.com/Rafifdev/ArchiBot/issues' },
    ],
  },
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
