import { NEWS_POSTS, TERMINAL_DATA, type NewsPostItem, type TerminalItem } from './solanaLiveFeed';

export { NEWS_POSTS, TERMINAL_DATA, type NewsPostItem, type TerminalItem };

export const HERO_PROMOS = [
  {
    id: 'samsung',
    title: 'Samsung Wallet + Solana',
    description:
      'Stablecoin hadir secara native di 82 juta perangkat U.S. Galaxy.',
    cta: 'Read the announcement',
    image: '/src/img/index/samsung-wallet-promo.webp',
    href: 'https://solana.com/news/samsung-wallet',
  },
  {
    id: 'breakpoint',
    title: 'Breakpoint 2026',
    description: 'London, Inggris · 15-17 November 2026',
    cta: 'Buy Breakpoint tickets',
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
    title: 'Breakpoint 2026 London',
    img: '/src/img/events/event-1.png',
    dateFormatted: 'Sun, Nov 15',
    location: 'London',
    url: 'https://solana.com/breakpoint',
  },
  {
    key: 'evt-2',
    title: 'Solana AI & Agents Summit',
    img: '/src/img/events/event-2.png',
    dateFormatted: 'Sat, Nov 14',
    location: 'London',
    url: 'https://solana.com/events',
  },
  {
    key: 'evt-3',
    title: 'Solana Institutional Capital Markets Forum',
    img: '/src/img/events/event-3.png',
    dateFormatted: 'Mon, Nov 16',
    location: 'London',
    url: 'https://solana.com/events',
  },
  {
    key: 'evt-4',
    title: 'Superteam Indonesia Builder Night',
    img: '/src/img/events/event-4.png',
    dateFormatted: 'Thu, Nov 19',
    location: 'Jakarta',
    url: 'https://solana.com/events',
  },
  {
    key: 'evt-5',
    title: 'Solana Hacker House APAC',
    img: '/src/img/events/event-5.png',
    dateFormatted: 'Tue, Nov 24',
    location: 'Singapore',
    url: 'https://solana.com/events',
  },
  {
    key: 'evt-6',
    title: 'Payments & Stablecoin Summit',
    img: '/src/img/events/event-6.png',
    dateFormatted: 'Thu, Dec 3',
    location: 'New York',
    url: 'https://solana.com/events',
  },
  {
    key: 'evt-7',
    title: 'Solana DeFi & Liquidity Day',
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
    label: 'Alamat aktif bulanan',
    color: 'text-nd-highlight-blue',
  },
  {
    id: 'monthly-txs',
    value: '3.5B',
    label: 'Transaksi bulanan',
    color: 'text-nd-highlight-gold',
  },
  {
    id: 'trade-volume',
    value: '$3.3T',
    label: 'Volume perdagangan',
    color: 'text-nd-highlight-orange',
  },
  {
    id: 'app-revenue',
    value: '$3.4B',
    label: 'Pendapatan aplikasi',
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
    title: 'Validasi jaringan',
    description:
      'Jalankan validator untuk membantu menjaga jaringan tetap cepat dan aman bagi semua orang.',
    href: 'https://solana.com/validators',
    cols: 'md:col-span-2',
  },
  {
    id: 'stake',
    title: 'Amankan dengan staking',
    description:
      'Stake SOL dan dapatkan rewards sambil mendukung desentralisasi.',
    href: 'https://solana.com/staking',
    cols: 'md:col-span-2',
  },
  {
    id: 'build',
    title: 'Bangun aplikasi',
    description:
      'Luncurkan ide besar berikutnya di jaringan yang mendukung aplikasi terbesar di dunia kripto.',
    href: 'https://solana.com/developers',
    cols: 'md:col-span-2',
  },
  {
    id: 'contribute',
    title: 'Berkontribusi dengan kode',
    description:
      'Tulis kode open source dan dapatkan bayaran melalui hibah ekosistem.',
    href: 'https://solana.org/grants',
    cols: 'md:col-span-3',
  },
  {
    id: 'tokenize',
    title: 'Tokenisasi aset',
    description:
      'Ubah aset dunia nyata menjadi token agar lebih mudah diperdagangkan dan diakses secara global.',
    href: 'https://solana.com/solutions/real-world-assets',
    cols: 'md:col-span-3',
  },
];

export const GET_STARTED_TABS = [
  {
    id: 'institution',
    title: 'Institusi',
    links: [
      {
        title: 'Pembayaran dan Alat',
        href: 'https://solana.com/solutions/SDP',
      },
      {
        title: 'Tokenisasi Aset',
        href: 'https://solana.com/solutions/real-world-assets',
      },
      {
        title: 'Penerbitan Stablecoin',
        href: 'https://solana.com/solutions/stablecoins',
      },
      {
        title: 'Keuangan Digital',
        href: 'https://solana.com/solutions/financial-infrastructure',
      },
      {
        title: 'Hubungi Tim Kami',
        href: 'https://solana.com/enterprise',
      },
    ],
  },
  {
    id: 'user',
    title: 'Pengguna',
    links: [
      {
        title: 'Pelajari Dasar-Dasar',
        href: 'https://solana.com/learn/what-is-solana',
      },
      {
        title: 'Siapkan Dompet',
        href: 'https://solana.com/learn/what-is-a-wallet',
      },
      {
        title: 'Staking SOL',
        href: 'https://solana.com/staking',
      },
      {
        title: 'Jelajahi DeFi',
        href: 'https://solana.com/learn/introduction-to-defi-on-solana',
      },
      {
        title: 'Bergabunglah dengan Komunitas',
        href: 'https://solana.com/community',
      },
    ],
  },
  {
    id: 'developer',
    title: 'Pengembang',
    links: [
      {
        title: 'Mulai Cepat',
        href: 'https://solana.com/docs/intro/quick-start',
      },
      {
        title: 'Instalasi',
        href: 'https://solana.com/docs/intro/installation',
      },
      {
        title: 'Pelajari Cara Kerja Solana',
        href: 'https://solana.com/docs/core/accounts',
      },
      {
        title: 'Template Aplikasi',
        href: 'https://solana.com/developers/templates',
      },
      {
        title: 'Alat Pengembang',
        href: 'https://solana.com/developers',
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
    label: 'Gunakan Solana',
    featured: {
      eyebrow: 'MULAI DI SINI',
      title: 'Gunakan Solana',
      description: 'Beli, simpan, stake, dan gunakan SOL di seluruh ekosistem.',
      cta: 'Mulai sekarang',
      href: 'https://solana.com/id/use-solana',
      bgImage: '/src/img/nav/nav-banner-bg.webp',
    },
    columns: [
      {
        heading: 'DOMPET DAN ORIENTASI',
        items: [
          {
            title: 'Dompet',
            subtitle: 'Temukan dompet yang tepat untuk kebutuhan Anda',
            href: 'https://solana.com/id/wallets',
          },
          {
            title: 'Beli & On-Ramp',
            subtitle: 'Dapatkan SOL dan stablecoin dengan mata uang lokal',
            href: 'https://solana.com/id/use-solana',
          },
          {
            title: 'Pelajari Solana',
            subtitle: 'Panduan langkah demi langkah untuk pemula',
            href: 'https://solana.com/id/learn',
          },
        ],
      },
      {
        heading: 'KEAMANAN, TOKEN, DAN APLIKASI',
        items: [
          {
            title: 'Staking',
            subtitle: 'Bantu amankan jaringan dan dapatkan imbalan',
            href: 'https://solana.com/id/staking',
          },
          {
            title: 'Stablecoin',
            subtitle: 'Dolar digital cepat dengan biaya hampir nol',
            href: 'https://solana.com/id/solutions/stablecoins',
          },
          {
            title: 'Token SOL',
            subtitle: 'Aset asli yang menggerakkan jaringan Solana',
            href: 'https://solana.com/id/sol',
          },
        ],
      },
    ],
  },
  {
    id: 'build',
    label: 'Bangun',
    featured: {
      eyebrow: 'PUSAT PENGEMBANG',
      title: 'Mulai membangun di Solana',
      description:
        'Dokumentasi, SDK, contoh proyek, dan kursus interaktif untuk pengembang.',
      cta: 'Buka dokumentasi',
      href: 'https://solana.com/docs',
      bgImage: '/src/img/nav/nav-banner-bg.webp',
    },
    columns: [
      {
        heading: 'MULAI MEMBANGUN',
        items: [
          {
            title: 'Dokumentasi',
            subtitle: 'Referensi inti, RPC API, dan arsitektur Solana',
            href: 'https://solana.com/docs',
          },
          {
            title: 'Mulai Cepat',
            subtitle: 'Bangun dan terapkan program pertama Anda',
            href: 'https://solana.com/docs/intro/quick-start',
          },
          {
            title: 'Solana Cookbook',
            subtitle: 'Resep kode dan pola pengembangan praktis',
            href: 'https://solana.com/developers/cookbook',
          },
        ],
      },
      {
        heading: 'ALAT DAN KASUS PENGGUNAAN',
        items: [
          {
            title: 'Template Pengembang',
            subtitle: 'Starter kit siap pakai untuk aplikasi Web3',
            href: 'https://solana.com/developers/templates',
          },
          {
            title: 'Ekstensi Token',
            subtitle: 'Fungsi kepatuhan dan privasi tingkat lanjut',
            href: 'https://solana.com/solutions/token-extensions',
          },
          {
            title: 'Pembayaran & Commerce',
            subtitle: 'Integrasikan penyelesaian USDC instan',
            href: 'https://solana.com/docs/payments',
          },
        ],
      },
    ],
  },
  {
    id: 'enterprise',
    label: 'Perusahaan',
    featured: {
      eyebrow: 'INSTITUSI & FINTECH',
      title: 'Solana untuk Perusahaan',
      description:
        'Infrastruktur blockchain berkinerja tinggi untuk pembayaran, tokenisasi, dan pasar modal.',
      cta: 'Jelajahi solusi perusahaan',
      href: 'https://solana.com/id/enterprise',
      bgImage: '/src/img/nav/nav-banner-bg.webp',
    },
    columns: [
      {
        heading: 'SOLUSI BISNIS',
        items: [
          {
            title: 'Pembayaran Institusional',
            subtitle: 'Penyelesaian global 24/7 dalam hitungan milidetik',
            href: 'https://solana.com/id/solutions/institutional-payments',
          },
          {
            title: 'Tokenisasi & RWA',
            subtitle: 'Bawa dana, ekuitas, dan obligasi ke on-chain',
            href: 'https://solana.com/id/solutions/real-world-assets',
          },
          {
            title: 'Penerbitan Stablecoin',
            subtitle: 'Luncurkan stablecoin patuh regulasi dengan ekstensi token',
            href: 'https://solana.com/id/solutions/stablecoins',
          },
        ],
      },
      {
        heading: 'VALIDASI DAN BUKTI',
        items: [
          {
            title: 'Infrastruktur Keuangan',
            subtitle: 'Arsitektur pasar modal internet berskala tinggi',
            href: 'https://solana.com/id/solutions/financial-infrastructure',
          },
          {
            title: 'Laporan & Riset',
            subtitle: 'Analisis mendalam tentang adopsi institusional',
            href: 'https://solana.com/id/reports',
          },
        ],
      },
    ],
  },
  {
    id: 'products',
    label: 'Produk',
    featured: {
      eyebrow: 'PLATFORMS & TOOLS',
      title: 'Ekosistem Produk Solana',
      description:
        'Alat pembayaran agen AI, registri on-chain, dan platform pengembang kelas perusahaan.',
      cta: 'Lihat semua produk',
      href: 'https://solana.com/id/products',
      bgImage: '/src/img/nav/nav-banner-bg.webp',
    },
    columns: [
      {
        heading: 'PLATFORM DAN PERMUKAAN PRODUK',
        items: [
          {
            title: 'Solana Developer Platform (SDP)',
            subtitle: 'Penerbitan aset dan orkestrasi pembayaran perusahaan',
            href: 'https://solana.com/id/solutions/sdp',
          },
          {
            title: 'Solana Mobile',
            subtitle: 'Perangkat keras Web3 dan dApp Store bebas biaya',
            href: 'https://solanamobile.com',
          },
        ],
      },
      {
        heading: 'AGEN AI DAN PEMBAYARAN',
        items: [
          {
            title: 'Protokol x402',
            subtitle: 'Standar pembayaran mikro terbuka untuk agen AI',
            href: 'https://solana.com/id/x402',
          },
          {
            title: 'Agent Registry',
            subtitle: 'Identitas dan verifikasi on-chain untuk agen otonom',
            href: 'https://solana.com/id/agent-registry',
          },
          {
            title: 'Skills',
            subtitle: 'Kemampuan pembayaran dan perdagangan untuk LLM',
            href: 'https://solana.com/id/skills',
          },
        ],
      },
    ],
  },
  {
    id: 'ecosystem',
    label: 'Ekosistem',
    featured: {
      eyebrow: '15–17 NOVEMBER 2026 · LONDON',
      title: 'Breakpoint 2026',
      description:
        'Konferensi tahunan terbesar untuk pembangun, institusi, dan pemimpin ekosistem Solana.',
      cta: 'Dapatkan tiket',
      href: 'https://solana.com/breakpoint',
      bgImage: '/src/img/nav/bp26-nav-banner-bg.webp',
    },
    columns: [
      {
        heading: 'JARINGAN & KOMUNITAS',
        items: [
          {
            title: 'Status & Performa Jaringan',
            subtitle: 'Statistik validator, desentralisasi, dan klien',
            href: 'https://solana.com/id/network',
          },
          {
            title: 'Komunitas Global',
            subtitle: 'Bergabunglah dengan ratusan ribu kreator dan pembangun',
            href: 'https://solana.com/id/community',
          },
          {
            title: 'Acara (Events)',
            subtitle: 'Temui komunitas Solana secara langsung di seluruh dunia',
            href: 'https://solana.com/id/events',
          },
        ],
      },
      {
        heading: 'MEDIA & BERITA',
        items: [
          {
            title: 'Berita & Blog',
            subtitle: 'Pengumuman terbaru dari Solana Foundation',
            href: 'https://solana.com/id/news',
          },
          {
            title: 'Solana Terminal',
            subtitle: 'Umpan langsung peluncuran dan tonggak ekosistem',
            href: 'https://solana.com/id/terminal',
          },
          {
            title: 'Buletin (Newsletter)',
            subtitle: 'Pembaruan bulanan langsung ke kotak masuk Anda',
            href: 'https://solana.com/id/newsletter',
          },
        ],
      },
    ],
  },
];

export const FOOTER_COLUMNS = [
  {
    heading: 'Gunakan Solana',
    links: [
      { label: 'Ikhtisar Gunakan Solana', href: 'https://solana.com/id/use-solana' },
      { label: 'Dompet', href: 'https://solana.com/id/wallets' },
      { label: 'Pelajari', href: 'https://solana.com/id/learn' },
      { label: 'Staking', href: 'https://solana.com/id/staking' },
    ],
  },
  {
    heading: 'Bangun',
    links: [
      { label: 'Pengembang', href: 'https://solana.com/id/developers' },
      { label: 'Dokumentasi', href: 'https://solana.com/docs' },
      { label: 'Template', href: 'https://solana.com/developers/templates' },
    ],
  },
  {
    heading: 'Perusahaan',
    links: [
      { label: 'Solana untuk Perusahaan', href: 'https://solana.com/id/enterprise' },
      {
        label: 'Pembayaran Institusional',
        href: 'https://solana.com/id/solutions/institutional-payments',
      },
      {
        label: 'Tokenisasi',
        href: 'https://solana.com/id/solutions/tokenization',
      },
      { label: 'Laporan', href: 'https://solana.com/id/reports' },
    ],
  },
  {
    heading: 'Produk',
    links: [
      { label: 'Ikhtisar Produk', href: 'https://solana.com/id/products' },
      {
        label: 'Solana Developer Platform',
        href: 'https://solana.com/id/solutions/sdp',
      },
      { label: 'x402', href: 'https://solana.com/id/x402' },
      { label: 'Agent Registry', href: 'https://solana.com/id/agent-registry' },
      { label: 'Skills', href: 'https://solana.com/id/skills' },
    ],
  },
  {
    heading: 'Ekosistem',
    links: [
      { label: 'Ikhtisar Ekosistem', href: 'https://solana.com/id/ecosystem' },
      { label: 'Jaringan', href: 'https://solana.com/id/network' },
      { label: 'Acara', href: 'https://solana.com/id/events' },
      { label: 'Komunitas', href: 'https://solana.com/id/community' },
      { label: 'Berita', href: 'https://solana.com/id/news' },
      { label: 'Buletin', href: 'https://solana.com/id/newsletter' },
    ],
  },
  {
    heading: 'Agen AI',
    links: [
      { label: 'llms.txt', href: 'https://solana.com/llms.txt' },
      { label: 'llms-full.txt', href: 'https://solana.com/llms-full.txt' },
      { label: 'SKILL.md', href: 'https://solana.com/SKILL.md' },
      { label: 'Skills', href: 'https://solana.com/id/skills' },
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
