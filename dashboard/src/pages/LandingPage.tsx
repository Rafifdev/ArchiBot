import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../types/api';
import { EarthAnimation } from './landing/EarthAnimation';
import { SafeUnicornScene } from './landing/SafeUnicornScene';
import { LiveTotalTxCounter, LiveTpsCounter } from './landing/LiveCounters';
import {
  COMMUNITY_CARDS,
  FOOTER_COLUMNS,
  FOOTER_META_LINKS,
  GET_STARTED_TABS,
  HEADER_MEGA_MENUS,
  HERO_LOGOS,
  HERO_PROMOS,
  NEWS_POSTS,
  PERFORMANCE_STATS,
  PROJECTS_CARDS,
  PROJECTS_LOGOS,
  SOLANA_EVENTS,
  SOLANA_LANGUAGES,
  SOLANA_VIDEOS,
  TERMINAL_DATA,
  WHATS_UP_CATEGORIES,
  type SolanaVideoItem,
  type TerminalItem,
} from './landing/solanaData';

interface LandingPageProps {
  user?: UserProfile | null;
}

const ArrowUpRightIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 17L17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);

const SolanaMonoIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = 'w-4 h-3.5',
  style,
}) => (
  <svg
    viewBox="0 0 16 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    <path
      d="M2.62851 10.6789C2.72895 10.5819 2.86694 10.5256 3.01105 10.5256H15.4694C15.702 10.5256 15.8184 10.7995 15.6539 10.9585L13.3715 13.1647C13.2711 13.2617 13.1331 13.318 12.989 13.318H0.530612C0.29803 13.318 0.181556 13.0441 0.346066 12.8851L2.62851 10.6789Z"
      fill="currentColor"
    />
    <path
      d="M2.62851 0.835291C2.73297 0.738275 2.87096 0.682007 3.01105 0.682007H15.4694C15.702 0.682007 15.8184 0.955913 15.6539 1.11488L13.3715 3.32109C13.2711 3.41811 13.1331 3.47438 12.989 3.47438H0.530612C0.29803 3.47438 0.181556 3.20047 0.346066 3.04151L2.62851 0.835291Z"
      fill="currentColor"
    />
    <path
      d="M13.3715 5.72546C13.2711 5.62845 13.1331 5.57217 12.989 5.57217H0.530612C0.29803 5.57217 0.181556 5.84608 0.346066 6.00505L2.62851 8.21126C2.72895 8.30827 2.86694 8.36454 3.01105 8.36454H15.4694C15.702 8.36454 15.8184 8.09064 15.6539 7.93167L13.3715 5.72546Z"
      fill="currentColor"
    />
  </svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({ user }) => {
  // Header mega-menu & mobile menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [footerLangOpen, setFooterLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('id');

  // Modals state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [getStartedOpen, setGetStartedOpen] = useState(false);
  const [getStartedTab, setGetStartedTab] = useState('institution');
  const [activeVideo, setActiveVideo] = useState<SolanaVideoItem | null>(null);

  // Hero rotating promo banner state
  const [promoIndex, setPromoIndex] = useState(0);

  // What's Up Terminal state
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'defi' | 'institutions' | 'consumer' | 'developers' | 'ecosystem'
  >('all');
  const [liveTerminalFeed, setLiveTerminalFeed] = useState(TERMINAL_DATA);
  const [mobilePage, setMobilePage] = useState(0);
  const [curtainKey, setCurtainKey] = useState(0);

  // Carousel refs
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const newsScrollRef = useRef<HTMLDivElement>(null);
  const videosScrollRef = useRef<HTMLDivElement>(null);

  // Footer mouse glow ref
  const footerRef = useRef<HTMLDivElement>(null);
  const footerGlowRef = useRef<HTMLDivElement>(null);

  // Rotate Hero Promo every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % HERO_PROMOS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut Cmd+K / Ctrl+K for Search Modal, Escape to close modals
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setGetStartedOpen(false);
        setActiveVideo(null);
        setOpenMenuId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Scroll entry reveal IntersectionObserver fallback (Modern Web Guidance: scroll-entry-exit-effects)
  useEffect(() => {
    if (
      typeof CSS !== 'undefined' &&
      CSS.supports('(animation-timeline: view()) and (animation-range: entry)')
    ) {
      return;
    }
    const elements = document.querySelectorAll('.solana-scroll-reveal');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Footer mouse-tracking glow effect (throttled with RAF, no forced reflows)
  useEffect(() => {
    const container = footerRef.current;
    const glow = footerGlowRef.current;
    if (!container || !glow) return;

    let rafId: number | null = null;
    let cachedRect: DOMRect | null = null;

    const handleMouseEnter = () => {
      cachedRect = container.getBoundingClientRect();
      glow.style.visibility = 'visible';
      glow.style.opacity = '1';
    };

    const handleMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!cachedRect) {
          cachedRect = container.getBoundingClientRect();
        }
        const x = e.clientX - cachedRect.left;
        const y = e.clientY - cachedRect.top;
        glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };

    const handleLeave = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      cachedRect = null;
      glow.style.opacity = '0';
    };

    container.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    container.addEventListener('mousemove', handleMove, { passive: true });
    container.addEventListener('mouseleave', handleLeave, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  const handleSelectCategory = (
    catId: 'all' | 'defi' | 'institutions' | 'consumer' | 'developers' | 'ecosystem'
  ) => {
    if (catId === selectedCategory) return;
    setSelectedCategory(catId);
    setMobilePage(0);
    setCurtainKey((prev) => prev + 1);
  };

  const scrollCarousel = (
    ref: React.RefObject<HTMLDivElement>,
    direction: 'prev' | 'next',
    amount = 520
  ) => {
    if (!ref.current) return;
    ref.current.scrollBy({
      left: direction === 'next' ? amount : -amount,
      behavior: 'smooth',
    });
  };

  const currentPromo = HERO_PROMOS[promoIndex];
  const currentTerminalItems: TerminalItem[] =
    liveTerminalFeed[selectedCategory] || TERMINAL_DATA[selectedCategory] || [];

  const getCategoryMeta = (catId: string) =>
    WHATS_UP_CATEGORIES.find((c) => c.id === catId);

  return (
    <div className="min-h-screen bg-nd-bg text-nd-high-em-text font-brand selection:bg-[#9945FF]/40 selection:text-white overflow-x-hidden">
      {/* =====================================================================
          1. FIXED HEADER (packages/ui-chrome/src/header.tsx)
          ===================================================================== */}
      <header
        className="fixed top-0 left-0 right-0 w-full z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl backdrop-saturate-150"
        onMouseLeave={() => setOpenMenuId(null)}
      >
        <div className="w-full max-w-[1440px] mx-auto px-[20px] md:px-[32px] xl:px-[40px] h-14 flex items-center justify-between gap-4">
          {/* Left: Official ArchiBot Logo + Desktop Navigation */}
          <div className="flex items-center gap-6 xl:gap-8">
            <a
              href="#top"
              aria-label="ArchiBot"
              className="inline-flex items-center gap-3 shrink-0 focus:outline-none !no-underline"
            >
              <div className="relative size-8 rounded-xl bg-gradient-to-tr from-[#5865F2] via-[#9945FF] to-[#19FB9B] p-[1.5px] shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-[#08070B] rounded-[10px] flex items-center justify-center">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2V5M12 5C7.58172 5 4 8.58172 4 13V18C4 19.6569 5.34315 21 7 21H17C18.6569 21 20 19.6569 20 18V13C20 8.58172 16.4183 5 12 5ZM9 12H9.01M15 12H15.01M9 16C10 17 14 17 15 16"
                      stroke="url(#archibot_header_grad)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <defs>
                      <linearGradient id="archibot_header_grad" x1="4" y1="5" x2="20" y2="21" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#5865F2" />
                        <stop offset="0.5" stopColor="#9945FF" />
                        <stop offset="1" stopColor="#19FB9B" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              <span className="font-brand font-bold text-[18px] tracking-[0.06em] text-white">
                ARCHI<span className="bg-gradient-to-r from-[#9945FF] to-[#19FB9B] bg-clip-text text-transparent">BOT</span>
              </span>
            </a>

            {/* Desktop Mega-Menu Triggers */}
            <nav className="hidden xl:flex items-center gap-1">
              {HEADER_MEGA_MENUS.map((menu) => {
                const isOpen = openMenuId === menu.id;
                return (
                  <button
                    key={menu.id}
                    type="button"
                    onMouseEnter={() => setOpenMenuId(menu.id)}
                    onClick={() => setOpenMenuId(isOpen ? null : menu.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-normal transition-colors cursor-pointer ${
                      isOpen
                        ? 'text-white bg-white/[0.08]'
                        : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{menu.label}</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      className={`transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-white' : 'text-white/50'
                      }`}
                    >
                      <path
                        d="M4 6L8 10L12 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Search (⌘K), Language Selector (ID), Dashboard/Login CTA, Mobile Menu Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Search Button */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="inline-flex items-center gap-2.5 h-8 px-2.5 md:px-3 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-white/60 hover:text-white text-xs transition-colors cursor-pointer"
              aria-label="Cari"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span className="hidden sm:inline text-[13px]">Cari</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-brand-mono text-white/45 bg-white/[0.06] rounded border border-white/10">
                ⌘K
              </kbd>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-white/65 hover:text-white hover:bg-white/[0.06] text-xs font-brand-mono uppercase tracking-wider transition-colors cursor-pointer"
                aria-label="Pilih bahasa"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
                <span>{selectedLang.toUpperCase()}</span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 max-h-72 overflow-y-auto rounded-xl border border-white/15 bg-[#0D0C11]/95 backdrop-blur-xl p-1.5 shadow-2xl z-50">
                  {SOLANA_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLang(lang.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        selectedLang === lang.code
                          ? 'bg-white/15 text-white font-medium'
                          : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <span>{lang.label}</span>
                      <span className="font-brand-mono uppercase text-[10px] text-white/45">
                        {lang.code}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ArchiBot Dashboard / Login CTA */}
            <Link
              to={user ? '/servers' : '/login'}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-medium tracking-tight transition-colors shrink-0 !no-underline"
            >
              <span>{user ? 'Buka Dashboard' : 'Masuk Dashboard'}</span>
              <ArrowUpRightIcon className="size-3.5" />
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="xl:hidden inline-flex items-center justify-center size-8 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Mega-Menu Panel */}
        {openMenuId && (
          <div
            className="hidden xl:block absolute left-0 right-0 top-full border-b border-white/10 bg-[#08070B]/95 backdrop-blur-2xl shadow-2xl z-50 animate-fade-in-up"
            onMouseEnter={() => setOpenMenuId(openMenuId)}
            onMouseLeave={() => setOpenMenuId(null)}
          >
            {(() => {
              const activeMenu = HEADER_MEGA_MENUS.find((m) => m.id === openMenuId);
              if (!activeMenu) return null;
              return (
                <div className="max-w-[1440px] mx-auto px-[40px] py-8 grid grid-cols-12 gap-8">
                  {/* Left Featured Promo Card */}
                  {activeMenu.featured && (
                    <a
                      href={activeMenu.featured.href}
                      target="_blank"
                      rel="noreferrer"
                      className="col-span-4 group relative overflow-hidden rounded-2xl border border-white/10 p-6 flex flex-col justify-between min-h-[220px] !no-underline text-white"
                      style={{
                        backgroundImage: `url(${activeMenu.featured.bgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 group-hover:from-black/80 transition-colors" />
                      <div className="relative z-10">
                        {activeMenu.featured.eyebrow && (
                          <div className="font-brand-mono text-[11px] uppercase tracking-[0.14em] text-[#55E9AB] mb-2">
                            {activeMenu.featured.eyebrow}
                          </div>
                        )}
                        <div className="text-xl font-medium tracking-tight text-white mb-2">
                          {activeMenu.featured.title}
                        </div>
                        <p className="text-sm text-white/75 leading-relaxed">
                          {activeMenu.featured.description}
                        </p>
                      </div>
                      <div className="relative z-10 mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-white group-hover:translate-x-1 transition-transform">
                        <span>{activeMenu.featured.cta}</span>
                        <ArrowUpRightIcon className="size-3.5" />
                      </div>
                    </a>
                  )}

                  {/* Right Menu Columns */}
                  <div className="col-span-8 grid grid-cols-2 gap-8">
                    {activeMenu.columns.map((col) => (
                      <div key={col.heading}>
                        <div className="font-brand-mono text-[11px] uppercase tracking-[0.14em] text-white/45 mb-4">
                          {col.heading}
                        </div>
                        <div className="space-y-2">
                          {col.items.map((item) => (
                            <a
                              key={item.title}
                              href={item.href}
                              target="_blank"
                              rel="noreferrer"
                              className="group block rounded-xl p-3 hover:bg-white/[0.06] transition-colors !no-underline"
                            >
                              <div className="flex items-center justify-between text-sm font-medium text-white group-hover:text-[#55E9AB] transition-colors">
                                <span>{item.title}</span>
                                <ArrowUpRightIcon className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              {item.subtitle && (
                                <p className="text-xs text-white/55 mt-1 leading-relaxed">
                                  {item.subtitle}
                                </p>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-white/10 bg-[#08070B] px-5 py-6 max-h-[calc(100vh-56px)] overflow-y-auto space-y-6">
            {HEADER_MEGA_MENUS.map((menu) => (
              <div key={menu.id} className="space-y-3 border-b border-white/10 pb-5 last:border-none">
                <div className="font-brand-mono text-xs uppercase tracking-wider text-white/50">
                  {menu.label}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {menu.columns
                    .flatMap((c) => c.items)
                    .map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg px-3 py-2 bg-white/[0.03] hover:bg-white/[0.08] text-sm text-white !no-underline"
                      >
                        <div className="font-medium">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-xs text-white/55 mt-0.5">{item.subtitle}</div>
                        )}
                      </a>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* =====================================================================
          2. HERO SECTION (apps/web/src/components/index/hero.tsx)
          ===================================================================== */}
      <section
        id="top"
        className="relative overflow-hidden bg-nd-bg text-nd-high-em-text pt-14"
      >
        {/* Background Image + Interactive WebGL UnicornScene */}
        <div className="absolute left-0 top-0 bottom-14 md:bottom-0 w-full overflow-hidden pointer-events-none">
          <img
            src="/src/img/index/hero-bg.webp"
            alt=""
            decoding="async"
            className="w-full h-full object-cover select-none"
          />
          <SafeUnicornScene
            projectId="hero"
            jsonFilePath="/src/img/index/hero-bg.json"
            width="100%"
            height="100%"
            scale={1}
            dpi={1}
            fps={30}
            lazyLoad={true}
            production={true}
            className="!absolute inset-0"
          />
          {/* Subtle gradient overlay on bottom */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,0) 70%, rgba(0,0,0,0.8) 100%)',
            }}
          />
        </div>

        {/* Main Hero Container */}
        <div className="flex flex-col justify-between max-w-[1440px] mx-auto pt-[48px] md:pt-[96px] xl:pt-[108px] min-h-[calc(100vh-56px-73px)] xl:min-h-[calc(100vh-56px-123px)] relative z-10">
          <div className="px-[20px] md:px-[32px] xl:px-[40px] max-w-[1024px]">
            <h1 className="nd-heading-2xl text-nd-high-em-text tracking-tight">
              Arsitektur server
              <br />
              <span className="font-light">untuk setiap komunitas di Discord.</span>
            </h1>
            <p className="nd-body-xl text-nd-mid-em-text max-w-[440px] xl:max-w-[580px] mt-4 md:mt-6">
              ArchiBot adalah bot dan platform manajemen berkinerja tinggi terkemuka yang mendukung
              otomasi server Discord, manajemen peran, template lego, dan voice hub.
            </p>
            <div className="mt-6 md:mt-10 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setGetStartedOpen(true)}
                className="group inline-flex items-center justify-center rounded-full font-medium transition-colors cursor-pointer bg-nd-cta text-nd-inverse hover:bg-nd-cta/90 text-base md:text-lg px-5 py-2.5 md:px-6 md:py-4 leading-[1.33] md:leading-[1.22] tracking-[-0.16px] md:tracking-[-0.18px]"
              >
                <span>Mulai</span>
                <span className="ml-2 -mr-1 md:ml-3 md:-mr-2 rounded-full size-6 p-1 inline-flex items-center justify-center bg-nd-inverse text-nd-cta relative overflow-hidden">
                  <ArrowUpRightIcon className="size-4 block transition-transform duration-200 group-hover:translate-x-5 group-hover:-translate-y-5" />
                  <ArrowUpRightIcon className="size-4 block absolute transition-transform duration-200 -translate-x-5 translate-y-5 group-hover:translate-x-0 group-hover:translate-y-0" />
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Promo Banner Card (Samsung Wallet / Breakpoint 2026) */}
          <div className="md:px-[32px] xl:px-[40px] md:pb-[32px] xl:pb-[40px] flex flex-row justify-end mt-12">
            <a
              href={currentPromo.href}
              target="_blank"
              rel="noreferrer"
              className="bg-[#DFCDF5] text-black md:rounded-xl p-5 md:p-6 flex flex-row items-stretch gap-5 w-full md:w-[504px] group relative overflow-hidden !no-underline"
            >
              <div className="flex flex-col items-start justify-between gap-2 grow">
                <div>
                  <div className="text-[18px] xl:text-[20px] leading-[1.33] xl:leading-[1.2] font-medium tracking-[-0.18px]">
                    {currentPromo.title}
                  </div>
                  <p className="text-[14px] xl:text-[16px] leading-[1.28] xl:leading-[1.25] text-black/70 mt-1">
                    {currentPromo.description}
                  </p>
                </div>

                {/* Progress dots */}
                <div className="flex flex-row gap-1 pt-1">
                  {HERO_PROMOS.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPromoIndex(idx);
                      }}
                      className={`h-1 rounded-full transition-all cursor-pointer ${
                        idx === promoIndex ? 'w-6 bg-black' : 'w-2 bg-black/25'
                      }`}
                      aria-label={item.title}
                    />
                  ))}
                </div>

                <div className="inline-flex items-center gap-1.5 text-[14px] xl:text-[16px] font-medium mt-2">
                  <span>{currentPromo.cta}</span>
                  <ArrowUpRightIcon className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>

              <div className="w-[100px] md:w-[138px] shrink-0 relative flex items-center justify-center">
                <img
                  src={currentPromo.image}
                  alt={currentPromo.title}
                  decoding="async"
                  className="w-full h-auto max-h-[112px] object-contain select-none"
                />
              </div>
            </a>
          </div>
        </div>

        {/* ===================================================================
            3. PARTNER LOGOS BAR (Western Union, Visa, Worldpay, Circle, PayPal, Fiserv)
            =================================================================== */}
        <div className="border-t border-nd-border-light relative z-10 bg-black/60 backdrop-blur-sm">
          <div className="max-w-[1440px] mx-auto px-[20px] md:px-[32px] xl:px-[40px]">
            <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-nd-border-light border-x border-nd-border-light">
              {HERO_LOGOS.map((logo, idx) => (
                <div
                  key={logo.alt}
                  className={`flex items-center justify-center h-[73px] xl:h-[123px] p-4 ${
                    idx < 3 ? 'max-md:border-b max-md:border-nd-border-light' : ''
                  }`}
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    width={logo.width}
                    height={logo.height}
                    decoding="async"
                    loading="lazy"
                    className="max-h-full max-w-full object-contain opacity-90 hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. EVENTS CAROUSEL SECTION (Temui ArchiBot secara langsung. Bangun koneksi.)
          ===================================================================== */}
      <section className="border-t border-nd-border-light solana-scroll-reveal">
        <div className="max-w-[1440px] mx-auto py-[56px] md:py-[112px] xl:py-[160px] px-[20px] md:px-[32px] xl:px-[40px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-11 xl:mb-12 gap-6">
            <h2 className="nd-heading-xl">
              Temui ArchiBot secara langsung.
              <br />
              <span className="font-light">Bangun koneksi.</span>
            </h2>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://solana.com/id/events"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center rounded-full font-medium transition-colors bg-nd-cta text-nd-inverse hover:bg-nd-cta/90 text-sm md:text-base px-4 py-2 md:py-2.5 !no-underline"
              >
                <span>Lihat semua</span>
                <span className="ml-2 -mr-1 rounded-full size-5 p-1 inline-flex items-center justify-center bg-nd-inverse text-nd-cta">
                  <ArrowUpRightIcon className="size-3.5" />
                </span>
              </a>
              <button
                type="button"
                onClick={() => scrollCarousel(eventsScrollRef, 'prev', 360)}
                className="inline-flex items-center justify-center rounded-full size-9 md:size-10 bg-nd-border-light hover:bg-nd-border-hovered text-nd-primary transition-colors cursor-pointer"
                aria-label="Sebelumnya"
              >
                <ArrowLeftIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(eventsScrollRef, 'next', 360)}
                className="inline-flex items-center justify-center rounded-full size-9 md:size-10 bg-nd-border-light hover:bg-nd-border-hovered text-nd-primary transition-colors cursor-pointer"
                aria-label="Berikutnya"
              >
                <ArrowRightIcon className="size-4" />
              </button>
            </div>
          </div>

          <div
            ref={eventsScrollRef}
            className="flex gap-4 md:gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {SOLANA_EVENTS.map((evt) => (
              <a
                key={evt.key}
                href={evt.url}
                target="_blank"
                rel="noreferrer"
                className="snap-start shrink-0 w-[260px] md:w-[300px] xl:w-[320px] group block !no-underline text-white"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white/5 border border-nd-border-light">
                  <img
                    src={evt.img}
                    alt={evt.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/15 font-brand-mono text-[11px] uppercase tracking-wider text-white">
                      {evt.dateFormatted}
                    </span>
                    {evt.location && (
                      <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/15 text-xs text-white/85 truncate">
                        {evt.location}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                    <div className="text-base md:text-lg font-medium leading-snug text-white group-hover:text-[#55E9AB] transition-colors">
                      {evt.title}
                    </div>
                    <span className="shrink-0 size-7 rounded-full bg-white/15 backdrop-blur-md inline-flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                      <ArrowUpRightIcon className="size-3.5" />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. PERFORMANCE SECTION (apps/web/src/components/index/performance.tsx)
          ===================================================================== */}
      <section className="relative overflow-hidden bg-nd-bg text-nd-high-em-text border-t border-nd-border-light solana-scroll-reveal solana-section-contained">
        {/* Background WebGL Shader + Fallback */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/src/img/index/performance-bg.webp"
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover select-none"
          />
          <SafeUnicornScene
            projectId="performance"
            jsonFilePath="/src/img/index/performance-bg.json"
            width="100%"
            height="100%"
            scale={1}
            dpi={1}
            fps={30}
            lazyLoad={true}
            production={true}
            className="!absolute inset-0"
          />
        </div>

        <div className="flex flex-col justify-between max-w-[1440px] mx-auto pt-[56px] md:pt-[112px] xl:pt-[160px] relative z-10">
          {/* Top Heading + Live Counters */}
          <div className="px-[20px] md:px-[32px] xl:px-[40px] grid grid-cols-1 xl:grid-cols-12 gap-10 pb-[80px] md:pb-[160px] xl:pb-[248px]">
            <div className="xl:col-span-8">
              <h2 className="nd-heading-xl">
                Platform manajemen server
                <br />
                <span className="font-light">
                  terkemuka dengan pertumbuhan tercepat
                </span>
              </h2>
              <p className="nd-body-xl text-nd-mid-em-text max-w-[660px] mt-4 xl:mt-6 font-normal">
                Platform nomor satu untuk komunitas dan server Discord, dengan
                pengguna terbanyak, modul arsitektur terlengkap, aktivitas otomasi
                tertinggi, dan latensi terendah.
              </p>
            </div>

            {/* Live Counters on Right */}
            <div className="xl:col-span-4 flex flex-col gap-6 xl:items-end justify-end">
              <div className="flex flex-row gap-5 items-stretch xl:w-[340px]">
                <div className="w-1.5 rounded-full bg-gradient-to-b from-[#D884F0] to-[#44EBA6] shrink-0" />
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="text-[28px] md:text-[36px] leading-[1.11] font-brand-mono font-medium tracking-tight text-white tabular-nums">
                      <LiveTotalTxCounter />
                    </div>
                    <div className="text-xs md:text-sm text-nd-mid-em-text-alpha mt-1">
                      Total otomasi hingga saat ini
                    </div>
                  </div>
                  <div>
                    <div className="text-[28px] md:text-[36px] leading-[1.11] font-brand-mono font-medium tracking-tight text-white tabular-nums">
                      <LiveTpsCounter />
                    </div>
                    <div className="text-xs md:text-sm text-nd-mid-em-text-alpha mt-1">
                      Eksekusi per detik
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 4-Column Stats Grid */}
          <div className="border-t border-nd-border-light bg-black/35 backdrop-blur-sm">
            <div className="px-[20px] md:px-[32px] xl:px-[40px]">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-nd-border-light border-x border-nd-border-light">
                {PERFORMANCE_STATS.map((stat, i) => (
                  <div
                    key={stat.id}
                    className={`p-6 md:p-8 xl:p-10 flex flex-col justify-between gap-6 ${
                      i < 2 ? 'md:max-xl:border-b md:max-xl:border-nd-border-light' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="nd-body-l text-nd-mid-em-text">
                        {stat.label}
                      </span>
                      <SolanaMonoIcon className={`w-4 h-3.5 ${stat.color}`} />
                    </div>
                    <div className="text-[48px] md:text-[64px] xl:text-[72px] leading-none font-light tracking-[-0.04em] text-white">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. WHAT'S UP / TERMINAL SECTION (apps/web/src/components/index/whats-up.tsx)
          ===================================================================== */}
      <section className="relative overflow-hidden bg-nd-bg text-nd-high-em-text border-t border-nd-border-light solana-scroll-reveal solana-section-contained">
        <div className="flex flex-col justify-between max-w-[1440px] mx-auto py-[56px] md:py-[112px] xl:py-[160px] px-[20px] md:px-[32px] xl:px-[40px]">
          {/* Section Title + CTA */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-11 xl:mb-12 gap-6">
            <h2 className="nd-heading-xl">
              Apa yang terjadi
              <br />
              <span className="font-light">di ArchiBot saat ini</span>
            </h2>
            <a
              href="/servers"
              className="group inline-flex items-center rounded-full font-medium transition-colors bg-nd-cta text-nd-inverse hover:bg-nd-cta/90 text-sm md:text-base px-4 py-2 md:py-2.5 !no-underline"
            >
              <span>Lihat semua</span>
              <span className="ml-2 -mr-1 rounded-full size-5 p-1 inline-flex items-center justify-center bg-nd-inverse text-nd-cta">
                <ArrowUpRightIcon className="size-3.5" />
              </span>
            </a>
          </div>

          {/* Interactive TERMINAL Box */}
          <div className="border border-nd-border-prominent flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-nd-border-prominent">
            {/* Left Categories Column */}
            <div className="xl:w-[220px] flex flex-col shrink-0 divide-y divide-nd-border-prominent">
              {/* TERMINAL Header with animated green bar */}
              <div className="px-4 xl:px-5 h-16 flex flex-row items-center justify-between font-brand-mono text-nd-mid-em-text text-[14px] leading-[1.14] tracking-[1px] uppercase">
                <span>TERMINAL</span>
                <div className="overflow-hidden relative w-5 h-1 bg-nd-highlight-green/20">
                  <div className="w-5 h-1 bg-nd-highlight-green animate-terminal-loader" />
                </div>
              </div>

              <div className="p-4 xl:p-5 flex flex-col justify-between grow">
                <div className="nd-body-l font-medium max-xl:hidden">
                  <span className="text-nd-mid-em-text">Jelajahi</span>
                  <br />
                  Kategori
                </div>

                {/* Category Buttons */}
                <div className="flex flex-col gap-0.5 max-xl:flex-row max-xl:flex-wrap mt-0 xl:mt-8">
                  {WHATS_UP_CATEGORIES.map((category) => {
                    const isSelected = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleSelectCategory(category.id)}
                        className={`rounded-sm p-2.5 text-left cursor-pointer flex items-center justify-between gap-3 transition-colors group ${
                          isSelected
                            ? 'bg-white/15 text-nd-high-em-text'
                            : 'text-nd-mid-em-text hover:bg-white/5 hover:text-nd-high-em-text'
                        }`}
                      >
                        <span className="text-[14px] leading-[1.42] tracking-[-0.14px] font-medium">
                          {category.label}
                        </span>
                        <SolanaMonoIcon
                          className={`w-4 h-3.5 transition-opacity ${
                            isSelected
                              ? 'opacity-100'
                              : 'opacity-80 group-hover:opacity-100 max-xl:hidden'
                          }`}
                          style={{ color: category.color }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Middle Numbers Column (Desktop) */}
            <div className="w-16 flex flex-col shrink-0 divide-y divide-nd-border-light max-xl:hidden">
              {Array.from({ length: 10 }, (_, index) => (
                <div
                  key={index}
                  className="h-16 flex items-center justify-center font-brand-mono text-[12px]"
                >
                  <div className="border border-nd-border-prominent rounded-full size-7 flex items-center justify-center text-white/80">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Feed Items Column */}
            <div className="flex flex-col grow divide-y divide-nd-border-light relative">
              {Array.from({ length: 10 }, (_, index) => {
                const item = currentTerminalItems[index];
                const catMeta = item ? getCategoryMeta(item.categoryId) : undefined;
                const hideOnMobile =
                  mobilePage === 0 ? index >= 5 : index < 5;

                return (
                  <div
                    key={item?.id ?? index}
                    className={`min-h-16 px-4 xl:px-5 max-xl:py-2.5 flex items-center justify-between relative overflow-hidden ${
                      hideOnMobile ? 'max-xl:hidden' : ''
                    }`}
                  >
                    {/* Curtain transition overlay when switching categories */}
                    {curtainKey > 0 && (
                      <div
                        key={`curtain-${curtainKey}-${index}`}
                        className="bg-nd-cta absolute inset-0 z-10 pointer-events-none animate-curtain-ltr"
                      />
                    )}

                    {item ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col xl:flex-row xl:items-center justify-between w-full nd-body-m hover:opacity-80 transition-opacity gap-2.5 font-medium group !no-underline text-white"
                      >
                        <span className="truncate flex items-center min-w-0">
                          <span className="truncate">{item.title}</span>
                          <span className="inline-block ml-1.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0">
                            <ArrowUpRightIcon className="size-4" />
                          </span>
                        </span>

                        {catMeta && selectedCategory === 'all' && (
                          <span
                            className="shrink-0 font-brand-mono text-[14px] leading-[1.28]"
                            style={{ color: catMeta.color }}
                          >
                            {catMeta.label}
                          </span>
                        )}
                      </a>
                    ) : (
                      <span className="text-nd-mid-em-text text-sm">—</span>
                    )}
                  </div>
                );
              })}

              {/* Mobile Pagination Footer */}
              <div className="h-16 px-4 flex items-center justify-between xl:hidden">
                <span className="font-brand-mono text-xs text-nd-mid-em-text">
                  {mobilePage === 0 ? '1–5 / 10' : '6–10 / 10'}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={mobilePage === 0}
                    onClick={() => setMobilePage(0)}
                    className="rounded-full size-8 bg-nd-border-light hover:bg-nd-border-hovered text-nd-primary disabled:opacity-30 inline-flex items-center justify-center cursor-pointer"
                    aria-label="Sebelumnya"
                  >
                    <ArrowLeftIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={mobilePage === 1}
                    onClick={() => setMobilePage(1)}
                    className="rounded-full size-8 bg-nd-border-light hover:bg-nd-border-hovered text-nd-primary disabled:opacity-30 inline-flex items-center justify-center cursor-pointer"
                    aria-label="Berikutnya"
                  >
                    <ArrowRightIcon className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. PROJECTS / INSTITUTIONS SECTION (apps/web/src/components/index/projects.tsx)
          ===================================================================== */}
      <section className="relative overflow-hidden bg-nd-bg text-nd-high-em-text border-t border-nd-border-light solana-scroll-reveal solana-section-contained">
        <div className="flex flex-col justify-between max-w-[1440px] mx-auto pt-[56px] md:pt-[112px] xl:pt-[160px]">
          <div className="px-[20px] md:px-[32px] xl:px-[40px] flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-11 xl:mb-12 gap-6">
            <h2 className="nd-heading-xl max-w-[920px]">
              Komunitas dan server Discord terbesar{' '}
              <br className="max-md:hidden" />
              <span className="font-light">sedang membangun di ArchiBot.</span>
            </h2>
            <a
              href="/servers"
              className="group inline-flex items-center rounded-full font-medium transition-colors bg-nd-cta text-nd-inverse hover:bg-nd-cta/90 text-sm md:text-base px-4 py-2 md:py-2.5 shrink-0 !no-underline"
            >
              <span>Lihat semua</span>
              <span className="ml-2 -mr-1 rounded-full size-5 p-1 inline-flex items-center justify-center bg-nd-inverse text-nd-cta">
                <ArrowUpRightIcon className="size-3.5" />
              </span>
            </a>
          </div>

          {/* 6 Institution Cards Grid with Parallelogram Overlays */}
          <div className="border-t border-nd-border-light relative">
            <img
              src="/src/img/index/pattern-parallelogram-r.svg"
              alt=""
              width={716}
              height={160}
              className="max-xl:hidden absolute right-[40px] top-0 -translate-y-full pointer-events-none select-none"
            />
            <div className="max-w-[1440px] mx-auto px-[20px] md:px-[32px] xl:px-[40px] relative">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-nd-border-light border-x border-nd-border-light relative">
                {PROJECTS_CARDS.map((project, index) => (
                  <a
                    key={project.key}
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`group relative overflow-hidden p-6 md:p-8 xl:p-10 min-h-[260px] xl:min-h-[340px] flex flex-col justify-between !no-underline text-white ${
                      index < 3 ? 'md:border-b md:border-nd-border-light' : ''
                    }`}
                  >
                    {/* Blurred projects-bg slice */}
                    <div
                      className={`absolute inset-0 opacity-65 group-hover:opacity-95 transition-opacity duration-500 pointer-events-none ${project.bgClassName}`}
                      style={{
                        backgroundImage: 'url(/src/img/index/projects-bg.webp)',
                      }}
                    />
                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/15 transition-colors duration-300 pointer-events-none" />

                    {/* Top: Logo + External Arrow */}
                    <div className="relative z-10 flex items-center justify-between gap-4">
                      <img
                        src={project.logo}
                        alt={project.name}
                        loading="lazy"
                        decoding="async"
                        className={`${project.logoClassName} w-auto object-contain`}
                      />
                      <span className="size-8 rounded-full border border-white/20 bg-black/30 inline-flex items-center justify-center text-white/80 group-hover:bg-white group-hover:text-black transition-colors">
                        <ArrowUpRightIcon className="size-4" />
                      </span>
                    </div>

                    {/* Bottom: Stat Value + Stat Label */}
                    <div className="relative z-10 mt-12">
                      <div
                        className={`text-[40px] md:text-[48px] xl:text-[64px] leading-none font-light tracking-[-0.03em] ${project.color}`}
                      >
                        {project.statValue}
                      </div>
                      <div className="nd-body-m text-nd-mid-em-text mt-2">
                        {project.statLabel}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              <img
                src="/src/img/index/pattern-parallelogram-l.svg"
                alt=""
                width={716}
                height={160}
                className="max-xl:hidden absolute left-[40px] bottom-0 translate-y-full pointer-events-none z-20 select-none"
              />
            </div>
          </div>

          {/* Secondary Institutional Logos Bar */}
          <div className="border-t border-nd-border-light">
            <div className="max-w-[1440px] mx-auto px-[20px] md:px-[32px] xl:px-[40px]">
              <div className="grid grid-cols-1 md:grid-cols-6 divide-x divide-nd-border-light border-x border-nd-border-light">
                <div className="col-span-2 hidden xl:block" />
                <div className="col-span-1 md:col-span-6 xl:col-span-4 grid grid-cols-2 md:grid-cols-5 divide-x divide-nd-border-light">
                  {PROJECTS_LOGOS.map((logo, index) => (
                    <div
                      key={logo.alt}
                      className={`flex items-center justify-center h-[88px] md:h-[92px] xl:h-[160px] p-3 ${
                        index < 3
                          ? 'max-md:border-b max-md:border-nd-border-light'
                          : ''
                      } ${index === 4 ? 'max-md:col-span-2' : ''}`}
                    >
                      <img
                        src={logo.src}
                        alt={logo.alt}
                        loading="lazy"
                        decoding="async"
                        style={{ height: `${logo.height}px` }}
                        className="w-auto max-w-full object-contain opacity-90 hover:opacity-100 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          8. DECOR DIVIDER (apps/web/src/components/index/decor.tsx)
          ===================================================================== */}
      <div className="relative overflow-hidden bg-nd-bg border-t border-nd-border-light">
        <div
          className="h-[180px] md:h-[260px] xl:h-[380px] relative select-none pointer-events-none"
          style={{
            backgroundImage:
              'url(/src/img/index/decor-bg.webp), url(/src/img/index/decor-bg.webp)',
            backgroundPosition: 'left bottom, right top',
            backgroundSize: '52% 100%, 52% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <img
            src="/src/img/index/decor-part-top.webp"
            alt=""
            width={620}
            height={280}
            loading="lazy"
            decoding="async"
            className="absolute right-[50%] top-0 translate-x-[48.7%] h-[74%] w-auto mix-blend-plus-lighter"
          />
          <img
            src="/src/img/index/decor-part-bottom.webp"
            alt=""
            width={630}
            height={302}
            loading="lazy"
            decoding="async"
            className="absolute left-[50%] bottom-0 -translate-x-[56.8%] h-[79.5%] w-auto mix-blend-plus-lighter"
          />
        </div>
      </div>

      {/* =====================================================================
          9. NEWS CAROUSEL SECTION (Ikuti perkembangan terbaru Solana)
          ===================================================================== */}
      <section className="border-t border-nd-border-light solana-scroll-reveal solana-section-contained">
        <div className="max-w-[1440px] mx-auto py-[56px] md:py-[112px] xl:py-[160px] px-[20px] md:px-[32px] xl:px-[40px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-11 xl:mb-12 gap-6">
            <h2 className="nd-heading-xl">
              Ikuti
              <br />
              <span className="font-light">perkembangan terbaru ArchiBot</span>
            </h2>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => scrollCarousel(newsScrollRef, 'prev', 960)}
                className="inline-flex items-center justify-center rounded-full size-9 md:size-10 bg-nd-border-light hover:bg-nd-border-hovered text-nd-primary transition-colors cursor-pointer"
                aria-label="Sebelumnya"
              >
                <ArrowLeftIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(newsScrollRef, 'next', 960)}
                className="inline-flex items-center justify-center rounded-full size-9 md:size-10 bg-nd-border-light hover:bg-nd-border-hovered text-nd-primary transition-colors cursor-pointer"
                aria-label="Berikutnya"
              >
                <ArrowRightIcon className="size-4" />
              </button>
            </div>
          </div>

          <div
            ref={newsScrollRef}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {NEWS_POSTS.map((post) => (
              <a
                key={post.id}
                href={`https://solana.com${post.url}`}
                target="_blank"
                rel="noreferrer"
                className="snap-start shrink-0 w-[300px] sm:w-[540px] md:w-[704px] xl:w-[1280px] rounded-xl overflow-hidden border border-nd-border-light flex flex-col md:flex-row bg-[#0D0C11] group !no-underline text-white"
              >
                {/* Left 2/3 Hero Image */}
                <div className="md:w-7/12 xl:w-2/3 aspect-[16/10] md:aspect-auto relative overflow-hidden bg-black">
                  <img
                    src={post.heroImage}
                    alt={post.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>

                {/* Right 1/3 Dark Content Panel */}
                <div className="md:w-5/12 xl:w-1/3 p-6 md:p-8 xl:p-10 flex flex-col justify-between gap-6 bg-[#0D0C11]">
                  <div>
                    <div className="flex items-center gap-2 font-brand-mono text-xs text-nd-mid-em-text uppercase tracking-wider mb-3">
                      <span>{post.published}</span>
                      {post.categories?.[0] && (
                        <>
                          <span>·</span>
                          <span className="text-[#55E9AB]">{post.categories[0]}</span>
                        </>
                      )}
                    </div>
                    <h3 className="nd-heading-s text-white group-hover:text-[#55E9AB] transition-colors line-clamp-3">
                      {post.title}
                    </h3>
                    <p className="nd-body-m text-nd-mid-em-text mt-3 line-clamp-4">
                      {post.description}
                    </p>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-nd-border-prominent group-hover:border-white px-4 py-2 text-sm font-medium text-white transition-colors">
                      <span>Pelajari lebih lanjut</span>
                      <ArrowUpRightIcon className="size-4" />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          10. VIDEOS CAROUSEL SECTION (Bagaimana kami membangunnya)
          ===================================================================== */}
      <section className="border-t border-nd-border-light solana-scroll-reveal solana-section-contained">
        <div className="max-w-[1440px] mx-auto py-[56px] md:py-[112px] xl:py-[160px] px-[20px] md:px-[32px] xl:px-[40px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-11 xl:mb-12 gap-6">
            <div>
              <h2 className="nd-heading-xl">Bagaimana kami membangunnya</h2>
              <p className="nd-body-xl text-nd-mid-em-text mt-3 md:mt-4">
                Dengarkan dari para kreator dan arsitek yang merancang masa depan komunitas{' '}
                <br className="max-xl:hidden" />
                Discord global.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => scrollCarousel(videosScrollRef, 'prev', 640)}
                className="inline-flex items-center justify-center rounded-full size-9 md:size-10 bg-nd-border-light hover:bg-nd-border-hovered text-nd-primary transition-colors cursor-pointer"
                aria-label="Sebelumnya"
              >
                <ArrowLeftIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(videosScrollRef, 'next', 640)}
                className="inline-flex items-center justify-center rounded-full size-9 md:size-10 bg-nd-border-light hover:bg-nd-border-hovered text-nd-primary transition-colors cursor-pointer"
                aria-label="Berikutnya"
              >
                <ArrowRightIcon className="size-4" />
              </button>
            </div>
          </div>

          <div
            ref={videosScrollRef}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {SOLANA_VIDEOS.map((vid) => (
              <div
                key={vid.id}
                onClick={() => setActiveVideo(vid)}
                className="snap-start shrink-0 w-[300px] sm:w-[480px] md:w-[620px] xl:w-[880px] group cursor-pointer"
              >
                {/* Video Thumbnail Card */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-nd-border-light bg-white/5">
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                  {vid.badge && (
                    <span className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/15 font-brand-mono text-[11px] uppercase tracking-wider text-white">
                      {vid.badge}
                    </span>
                  )}

                  {/* Frosted Glass Play Button in Bottom-Left */}
                  <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 size-12 md:size-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black group-hover:scale-105 transition-all">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-5 md:size-6 ml-0.5"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* Title & Description Below Thumbnail */}
                <div className="mt-4 md:mt-5 flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <h3 className="nd-heading-s text-white group-hover:text-[#55E9AB] transition-colors md:max-w-[55%]">
                    {vid.title}
                  </h3>
                  <p className="nd-body-m text-nd-mid-em-text md:max-w-[42%]">
                    {vid.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          11. COMMUNITY SECTION + WIREFRAME EARTH GLOBE (community.tsx)
          ===================================================================== */}
      <section className="relative overflow-hidden bg-nd-bg text-nd-high-em-text border-t border-nd-border-light solana-scroll-reveal solana-section-contained">
        {/* WebGL Background + Interactive Wireframe EarthAnimation */}
        <div className="absolute inset-0 pointer-events-none">
          <SafeUnicornScene
            projectId="community"
            jsonFilePath="/src/img/index/community-bg.json"
            width="100%"
            height="100%"
            scale={1}
            dpi={1}
            fps={30}
            lazyLoad={true}
            production={true}
            className="!absolute inset-0"
          />
        </div>

        <div className="max-w-[1440px] mx-auto pt-[56px] md:pt-[112px] xl:pt-[160px] pb-[64px] md:pb-[120px] px-[20px] md:px-[32px] xl:px-[40px] relative z-10">
          {/* Centered Heading */}
          <div className="text-center max-w-[760px] mx-auto">
            <h2 className="nd-heading-2xl">
              Bangun bersama
              <br />
              <span className="font-light">komunitas global ArchiBot.</span>
            </h2>
            <p className="nd-body-xl text-nd-mid-em-text mt-4 md:mt-6 max-w-[540px] mx-auto">
              Baik Anda seorang pemilik server, moderator, kreator template, atau pengembang,
              ada tempat bagi Anda untuk berkontribusi.
            </p>
          </div>

          {/* Interactive SVG Wireframe Earth Globe */}
          <div className="-mt-4 md:-mt-12 xl:-mt-20 mb-8 md:mb-12">
            <EarthAnimation className="w-full max-w-[1360px] mx-auto" />
          </div>

          {/* 5 Community Action Cards (3 top + 2 bottom in 6-col grid) */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4 relative z-20 -mt-12 md:-mt-28 xl:-mt-40">
            {COMMUNITY_CARDS.map((card) => (
              <a
                key={card.id}
                href={card.href}
                target="_blank"
                rel="noreferrer"
                className={`${card.cols} group rounded-xl bg-[#0e0c14]/90 hover:bg-[#16131f] border border-white/10 hover:border-white/25 p-5 md:p-6 xl:p-8 flex flex-col justify-between gap-6 transition-all !no-underline text-white`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="nd-heading-s text-white group-hover:text-[#55E9AB] transition-colors">
                    {card.title}
                  </h3>
                  <span className="size-8 rounded-full bg-white/10 group-hover:bg-white group-hover:text-black inline-flex items-center justify-center text-white transition-colors shrink-0">
                    <ArrowUpRightIcon className="size-4" />
                  </span>
                </div>
                <p className="nd-body-m text-nd-mid-em-text">
                  {card.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          12. FOOTER (packages/ui-chrome/src/footer.tsx)
          ===================================================================== */}
      <footer
        ref={footerRef}
        className="relative bg-black text-base text-white border-t border-white/[0.08] overflow-hidden"
      >
        {/* Mouse-following subtle glow */}
        <div
          ref={footerGlowRef}
          className="pointer-events-none absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[370px] h-[290px] rounded-full blur-[64px] mix-blend-screen transition-opacity duration-300 z-0"
          style={{
            visibility: 'hidden',
            opacity: 0,
            background:
              'radial-gradient(circle, rgba(153,69,255,0.28) 0%, rgba(25,251,155,0.18) 60%, rgba(0,0,0,0) 100%)',
          }}
        />

        <div
          className="w-full max-w-[1440px] px-5 md:px-8 xl:px-[72px] pt-16 md:pt-20 xl:pt-24 pb-[136px] md:pb-[164px] xl:pb-[300px] mx-auto bg-[length:100%_auto] bg-bottom bg-no-repeat relative z-10"
          style={{ backgroundImage: 'url(/src/img/solana-bg.svg)' }}
        >
          {/* Top Bar: ArchiBot Logo + Language Selector */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-10 md:pb-14 xl:pb-16 border-b border-white/[0.08]">
            <a
              href="#top"
              aria-label="ArchiBot"
              className="!no-underline !text-white inline-flex items-center gap-3.5"
            >
              <div className="relative size-10 rounded-2xl bg-gradient-to-tr from-[#5865F2] via-[#9945FF] to-[#19FB9B] p-[2px] shadow-xl">
                <div className="w-full h-full bg-[#08070B] rounded-[14px] flex items-center justify-center">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2V5M12 5C7.58172 5 4 8.58172 4 13V18C4 19.6569 5.34315 21 7 21H17C18.6569 21 20 19.6569 20 18V13C20 8.58172 16.4183 5 12 5ZM9 12H9.01M15 12H15.01M9 16C10 17 14 17 15 16"
                      stroke="url(#archibot_footer_grad)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <defs>
                      <linearGradient id="archibot_footer_grad" x1="4" y1="5" x2="20" y2="21" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#5865F2" />
                        <stop offset="0.5" stopColor="#9945FF" />
                        <stop offset="1" stopColor="#19FB9B" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-brand font-bold text-xl tracking-[0.06em] text-white">
                  ARCHI<span className="bg-gradient-to-r from-[#9945FF] to-[#19FB9B] bg-clip-text text-transparent">BOT</span>
                </span>
                <span className="font-brand-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
                  Discord Architecture Platform
                </span>
              </div>
            </a>

            {/* Footer Language Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setFooterLangOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 text-white/55 hover:text-white text-xs font-brand-mono uppercase tracking-wider transition-colors cursor-pointer"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
                <span>{selectedLang.toUpperCase()}</span>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {footerLangOpen && (
                <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-48 max-h-64 overflow-y-auto rounded-xl border border-white/15 bg-[#0D0C11] p-1.5 shadow-2xl z-50">
                  {SOLANA_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLang(lang.code);
                        setFooterLangOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        selectedLang === lang.code
                          ? 'bg-white/15 text-white font-medium'
                          : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <span>{lang.label}</span>
                      <span className="font-brand-mono uppercase text-[10px] text-white/45">
                        {lang.code}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 6 Footer Columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-x-6 gap-y-12 md:gap-y-14 pt-10 md:pt-14 xl:pt-16">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading} className="col-span-1">
                <div className="mb-5 md:mb-6 font-brand-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
                  {col.heading}
                </div>
                <ul className="list-none m-0 p-0 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-sm md:text-[15px] font-normal leading-[1.5] !no-underline text-white/70 hover:text-white transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Meta Links + Social Icons + Copyright */}
          <div className="mt-14 md:mt-20 xl:mt-24 pt-6 border-t border-white/[0.08]">
            <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-x-8 gap-y-5">
              <ul className="list-none m-0 p-0 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                {FOOTER_META_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="!no-underline text-white/55 hover:text-white transition-colors duration-200 whitespace-nowrap"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>

              {/* Social Icons */}
              <div className="flex flex-wrap items-center -ml-2.5">
                <a
                  href="https://solana.com/youtube"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="inline-flex p-2.5 rounded-full text-white/55 hover:text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.3 7.3c0-.2-.3-1.8-1-2.5-.9-1-1.9-1.1-2.4-1.1h-.1c-3.1-.2-7.7-.2-7.8-.2 0 0-4.7 0-7.8.2h-.1c-.5 0-1.5.1-2.4 1.1-.7.8-1 2.4-1 2.6 0 .1-.2 1.9-.2 3.8v1.7c0 1.9.2 3.7.2 3.8 0 .2.3 1.8 1 2.5.8.9 1.8 1 2.4 1.1h.3c1.8.2 7.3.2 7.5.2 0 0 4.7 0 7.8-.2h.1c.5-.1 1.5-.2 2.4-1.1.7-.8 1-2.4 1-2.6 0-.1.2-1.9.2-3.8v-1.7c-.1-1.8-.3-3.6-.3-3.8zm-13.9 8V8.1l6.5 3.6-6.5 3.6z" />
                  </svg>
                </a>
                <a
                  href="https://solana.com/twitter"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X / Twitter"
                  className="inline-flex p-2.5 rounded-full text-white/55 hover:text-white transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://solana.com/discord"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Discord"
                  className="inline-flex p-2.5 rounded-full text-white/55 hover:text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
                <a
                  href="https://solana.com/reddit"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Reddit"
                  className="inline-flex p-2.5 rounded-full text-white/55 hover:text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M16.6337 2.90098C16.6337 4.04282 15.708 4.96846 14.5662 4.96846C13.5883 4.96846 12.769 4.28961 12.5539 3.37748C11.3544 3.54223 10.4276 4.57369 10.4276 5.81768L10.4275 5.82548C12.2767 5.89411 13.9672 6.41499 15.3066 7.24371C15.7984 6.86598 16.4141 6.64145 17.0822 6.64145C18.6936 6.64145 20 7.94781 20 9.55929C20 10.7214 19.3206 11.7249 18.3373 12.1941C18.2458 15.5851 14.5521 18.3129 10.0089 18.3129C5.46956 18.3129 1.77825 15.5897 1.68081 12.2027C0.687757 11.7372 0 10.7286 0 9.55929C0 7.94781 1.30636 6.64145 2.91785 6.64145C3.58954 6.64145 4.20823 6.86841 4.70139 7.24984C6.02803 6.42642 7.70059 5.90546 9.53121 5.82783L9.531 5.81884C9.531 4.08424 10.853 2.652 12.5422 2.477C12.7378 1.53853 13.5697 0.833496 14.5662 0.833496C15.708 0.833496 16.6337 1.75914 16.6337 2.90098ZM5.97607 12.9006C6.79403 12.9006 7.49631 12.5188 7.5449 11.4682V11.4694C7.59349 10.4189 6.96989 9.54191 6.15192 9.54191C5.33395 9.54191 4.63168 10.2291 4.58309 11.2797C4.5345 12.3302 5.1581 12.9006 5.97607 12.9006ZM14.0371 12.9006C13.2192 12.9006 12.5169 12.5188 12.4683 11.4682V11.4694C12.4197 10.4189 13.0433 9.54191 13.8613 9.54191C14.6793 9.54191 15.3815 10.2291 15.4301 11.2797C15.4787 12.3302 14.8551 12.9006 14.0371 12.9006ZM10.0057 13.7174C8.99218 13.7174 8.02034 13.7672 7.12254 13.8586C6.96866 13.8736 6.87148 14.0333 6.93164 14.1756C7.43492 15.3776 8.62195 16.2222 10.0057 16.2222C11.3894 16.2222 12.5776 15.3776 13.0797 14.1756C13.1399 14.0333 13.0415 13.8736 12.8888 13.8586C11.9899 13.7672 11.0192 13.7174 10.0057 13.7174Z"
                    />
                  </svg>
                </a>
                <a
                  href="https://solana.com/github"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  className="inline-flex p-2.5 rounded-full text-white/55 hover:text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 48 48" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M24 0C10.747 0 0 11.017 0 24.607c0 10.873 6.877 20.097 16.413 23.35 1.2.228 1.64-.533 1.64-1.183 0-.587-.023-2.525-.033-4.581-6.677 1.488-8.086-2.904-8.086-2.904-1.092-2.844-2.665-3.6-2.665-3.6-2.177-1.528.165-1.496.165-1.496 2.41.173 3.679 2.535 3.679 2.535 2.14 3.762 5.614 2.675 6.984 2.046.215-1.59.837-2.676 1.523-3.29-5.33-.623-10.934-2.733-10.934-12.162 0-2.686.937-4.882 2.473-6.605-.25-.62-1.071-3.123.232-6.512 0 0 2.016-.661 6.602 2.522 1.914-.545 3.968-.818 6.007-.828 2.04.01 4.095.283 6.013.828 4.58-3.183 6.593-2.522 6.593-2.522 1.306 3.39.484 5.892.235 6.512 1.54 1.723 2.47 3.919 2.47 6.605 0 9.452-5.614 11.533-10.959 12.142.861.764 1.628 2.261 1.628 4.557 0 3.292-.027 5.942-.027 6.753 0 .655.432 1.422 1.648 1.18C41.132 44.697 48 35.476 48 24.607 48 11.017 37.255 0 24 0Z"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div className="mt-5">
              <span className="text-white/45 text-xs leading-relaxed">
                © {new Date().getFullYear()} ArchiBot. Semua hak dilindungi.
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          MODAL 1: GET STARTED MODAL (apps/web/src/components/index/get-started.tsx)
          ===================================================================== */}
      {getStartedOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setGetStartedOpen(false)}
        >
          <div
            className="w-full max-w-[680px] rounded-2xl bg-[#16151C] border border-nd-border-prominent p-6 md:p-10 text-white shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="nd-heading-m">Mulai dengan ArchiBot</h3>
              <button
                type="button"
                onClick={() => setGetStartedOpen(false)}
                className="rounded-full size-9 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/75 hover:text-white cursor-pointer"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            {/* 3 Tabs: Institusi, Pengguna, Pengembang */}
            <div className="grid grid-cols-3 gap-1.5 mt-6 p-1 rounded-xl bg-black/50 border border-white/10">
              {GET_STARTED_TABS.map((tab) => {
                const active = getStartedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setGetStartedTab(tab.id)}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-white text-black'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.title}
                  </button>
                );
              })}
            </div>

            {/* Numbered Links List */}
            <div className="mt-6 divide-y divide-nd-border-light border-y border-nd-border-light">
              {GET_STARTED_TABS.find((t) => t.id === getStartedTab)?.links.map(
                (link, idx) => (
                  <a
                    key={link.title}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="py-4 px-2 flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-colors group !no-underline text-white"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-brand-mono text-xs text-white/50 size-6 rounded-full border border-white/20 inline-flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="nd-body-l font-medium group-hover:text-[#55E9AB] transition-colors">
                        {link.title}
                      </span>
                    </div>
                    <ArrowUpRightIcon className="size-4 text-white/50 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: YOUTUBE VIDEO PLAYER MODAL
          ===================================================================== */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="w-full max-w-[1024px] rounded-2xl overflow-hidden bg-[#0D0C11] border border-white/15 shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
              <div className="text-sm font-medium text-white truncate pr-4">
                {activeVideo.title}
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="rounded-full size-8 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer shrink-0"
                aria-label="Tutup video"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: SEARCH MODAL (⌘K)
          ===================================================================== */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-20 p-4"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-[640px] rounded-2xl bg-[#121118] border border-white/15 overflow-hidden shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white/50 shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari dokumentasi, modul, berita ArchiBot..."
                className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="px-2 py-1 rounded text-[11px] font-brand-mono text-white/50 bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                ESC
              </button>
            </div>

            <div className="max-h-[380px] overflow-y-auto p-3 space-y-4">
              <div>
                <div className="px-2 pb-1.5 font-brand-mono text-[10px] uppercase tracking-wider text-white/45">
                  TAUTAN CEPAT ARCHIBOT
                </div>
                <div className="space-y-1">
                  {HEADER_MEGA_MENUS.flatMap((m) =>
                    m.columns.flatMap((c) => c.items)
                  )
                    .filter(
                      (item) =>
                        !searchQuery.trim() ||
                        item.title
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        (item.subtitle &&
                          item.subtitle
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()))
                    )
                    .slice(0, 7)
                    .map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setSearchModalOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.06] text-white !no-underline group"
                      >
                        <div>
                          <div className="text-sm font-medium group-hover:text-[#55E9AB] transition-colors">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-xs text-white/50">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                        <ArrowUpRightIcon className="size-4 text-white/40 group-hover:text-white" />
                      </a>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
