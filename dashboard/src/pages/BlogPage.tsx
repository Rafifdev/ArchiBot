import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './landing/antigravity.css';
import { DiscordMark } from '../components/ui';
import { UserProfile } from '../types/api';

interface BlogPageProps {
  user?: UserProfile | null;
}

/* ==========================================================================
   ArchiBot Pure Brand Mark SVG
   ========================================================================== */
const ArchiBrandMark: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, display: 'block' }}
  >
    <rect width="36" height="36" rx="10" fill="#121317" />
    <path
      d="M18 7.5L27.5 26.5H23.1L20.9 21.8H15.1L12.9 26.5H8.5L18 7.5ZM18 13.6L16.3 17.8H19.7L18 13.6Z"
      fill="#ffffff"
    />
    <circle cx="18" cy="25.5" r="2" fill="#3279f9" />
  </svg>
);

const ChevronDownSvg: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
  </svg>
);

const ArrowUpRightSvg: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M7 17L17 7M8 7h9v9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
];

/* ==========================================================================
   Blog Posts Data (Adapted from Landing Page & 1:1 Antigravity structure)
   ========================================================================== */
interface BlogPostItem {
  id: string;
  title: string;
  date: string;
  readTime: string;
  tags: string[];
  gradient: string;
  icon: string;
}

const FEATURED_POST: BlogPostItem = {
  id: 'featured-1',
  title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore',
  date: '6 Nov 2026',
  readTime: '7 min read',
  tags: ['Product'],
  gradient: 'linear-gradient(135deg, #1e2230 0%, #0f1015 100%)',
  icon: 'auto_awesome',
};

const BLOG_POSTS: BlogPostItem[] = [
  {
    id: 'post-1',
    title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor',
    date: '6 Nov 2026',
    readTime: '7 min read',
    tags: ['Product'],
    gradient: 'linear-gradient(135deg, #2b3248 0%, #171922 100%)',
    icon: 'record_voice_over',
  },
  {
    id: 'post-2',
    title: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip',
    date: '3 Nov 2026',
    readTime: '9 min read',
    tags: ['Research', 'Engineering'],
    gradient: 'linear-gradient(135deg, #213547 0%, #131d27 100%)',
    icon: 'science',
  },
  {
    id: 'post-3',
    title: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat',
    date: '29 Oct 2026',
    readTime: '6 min read',
    tags: ['Product', 'Architecture'],
    gradient: 'linear-gradient(135deg, #322b48 0%, #191427 100%)',
    icon: 'extension',
  },
  {
    id: 'post-4',
    title: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt',
    date: '26 Oct 2026',
    readTime: '10 min read',
    tags: ['Research', 'Engineering'],
    gradient: 'linear-gradient(135deg, #1f3b34 0%, #11241f 100%)',
    icon: 'hub',
  },
  {
    id: 'post-5',
    title: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque',
    date: '23 Oct 2026',
    readTime: '5 min read',
    tags: ['Engineering', 'Architecture'],
    gradient: 'linear-gradient(135deg, #3b2a1f 0%, #241911 100%)',
    icon: 'memory',
  },
  {
    id: 'post-6',
    title: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit sed quia',
    date: '19 Oct 2026',
    readTime: '8 min read',
    tags: ['Community', 'Product'],
    gradient: 'linear-gradient(135deg, #2a203b 0%, #181224 100%)',
    icon: 'diversity_3',
  },
  {
    id: 'post-7',
    title: 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium',
    date: '14 Oct 2026',
    readTime: '6 min read',
    tags: ['Announcements'],
    gradient: 'linear-gradient(135deg, #1e3345 0%, #101e2b 100%)',
    icon: 'campaign',
  },
  {
    id: 'post-8',
    title: 'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus',
    date: '9 Oct 2026',
    readTime: '4 min read',
    tags: ['Architecture'],
    gradient: 'linear-gradient(135deg, #233b2a 0%, #132418 100%)',
    icon: 'account_tree',
  },
  {
    id: 'post-9',
    title: 'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe',
    date: '2 Oct 2026',
    readTime: '7 min read',
    tags: ['Engineering'],
    gradient: 'linear-gradient(135deg, #3d2a35 0%, #24171f 100%)',
    icon: 'terminal',
  },
  {
    id: 'post-10',
    title: 'Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores',
    date: '24 Sep 2026',
    readTime: '5 min read',
    tags: ['Research'],
    gradient: 'linear-gradient(135deg, #272c42 0%, #151827 100%)',
    icon: 'biotech',
  },
  {
    id: 'post-11',
    title: 'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae',
    date: '15 Sep 2026',
    readTime: '6 min read',
    tags: ['Community'],
    gradient: 'linear-gradient(135deg, #383421 0%, #242112 100%)',
    icon: 'groups',
  },
  {
    id: 'post-12',
    title: 'Et harum quidem rerum facilis est et expedita distinctio nam libero tempore cum soluta',
    date: '5 Sep 2026',
    readTime: '8 min read',
    tags: ['Product', 'Announcements'],
    gradient: 'linear-gradient(135deg, #2c3821 0%, #1a2412 100%)',
    icon: 'rocket_launch',
  },
];

const CATEGORY_TABS = ['All', 'Product', 'Engineering', 'Architecture', 'Announcements', 'Community', 'Research'];

export const BlogPage: React.FC<BlogPageProps> = ({ user }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const openDropdownRef = useRef<string | null>(null);
  openDropdownRef.current = openDropdown;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuOpenRef = useRef(false);
  mobileMenuOpenRef.current = mobileMenuOpen;

  const headerHiddenRef = useRef(false);
  const headerScrolledRef = useRef(false);
  const isScrollingRef = useRef(false);
  const headerRef = useRef<HTMLElement>(null);

  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownOpenRef = useRef(false);
  langDropdownOpenRef.current = langDropdownOpen;

  const [activeCategory, setActiveCategory] = useState('All');
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const tabsListRef = useRef<HTMLUListElement>(null);

  const footerWordmarkRef = useRef<HTMLDivElement>(null);

  const dashboardHref = user ? '/servers' : '/auth/discord';
  const isID = selectedLang === 'id';
  const activeLanguageObj = LANGUAGE_OPTIONS.find((l) => l.value === selectedLang) || LANGUAGE_OPTIONS[0];

  // Initialize Smooth Scrolling (Lenis) with Sticky Navigation & Footer Wordmark Scrub
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });

    let anchorY = window.scrollY;
    let isHidden = false;
    let isScrolled = false;
    let scrollIdleTimer: number;

    const vh = window.innerHeight;
    let footerDocTop = 0;
    let lastFooterProgress = -1;

    const getOffsetTop = (elem: HTMLElement | null): number => {
      let top = 0;
      let curr = elem;
      while (curr) {
        top += curr.offsetTop;
        curr = curr.offsetParent as HTMLElement | null;
      }
      return top;
    };

    const measureOffsets = () => {
      footerDocTop = getOffsetTop(footerWordmarkRef.current);
    };

    measureOffsets();
    window.addEventListener('resize', measureOffsets, { passive: true });

    const updateScrubs = (currentY: number) => {
      if (footerWordmarkRef.current && footerDocTop > 0) {
        const rectTop = footerDocTop - currentY;
        if (rectTop <= vh + 100) {
          const raw = (vh - rectTop) / (vh * 0.45);
          const p = Math.round(Math.max(0, Math.min(1, raw)) * 1000) / 1000;
          if (p !== lastFooterProgress) {
            lastFooterProgress = p;
            footerWordmarkRef.current.style.opacity = String(0.2 + p * 0.8);
            footerWordmarkRef.current.style.transform = `translate3d(0, ${((1 - p) * 28).toFixed(1)}px, 0) scale(${(0.96 + p * 0.04).toFixed(3)})`;
          }
        }
      }
    };

    const handleScrollPosition = (currentY: number) => {
      if (mobileMenuOpenRef.current) return;

      isScrollingRef.current = true;
      window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 120);

      const header = headerRef.current;
      if (header) {
        const shouldBeScrolled = currentY > 10;
        if (shouldBeScrolled !== isScrolled) {
          isScrolled = shouldBeScrolled;
          headerScrolledRef.current = shouldBeScrolled;
          header.classList.toggle('is-scrolled', shouldBeScrolled);
        }

        const deltaY = currentY - anchorY;

        if (currentY <= 60) {
          if (isHidden) {
            isHidden = false;
            headerHiddenRef.current = false;
            header.classList.remove('is-hidden');
          }
          anchorY = currentY;
        } else if (deltaY > 60 && !isHidden && !openDropdownRef.current && !langDropdownOpenRef.current) {
          isHidden = true;
          headerHiddenRef.current = true;
          header.classList.add('is-hidden');
          anchorY = currentY;
        } else if (deltaY < -25 && isHidden) {
          isHidden = false;
          headerHiddenRef.current = false;
          header.classList.remove('is-hidden');
          anchorY = currentY;
        }
      }

      updateScrubs(currentY);
    };

    lenis.on('scroll', (e: { scroll: number }) => {
      handleScrollPosition(e.scroll);
    });

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(scrollIdleTimer);
      window.removeEventListener('resize', measureOffsets);
      lenis.destroy();
    };
  }, []);

  // Update tab indicator underline position
  useEffect(() => {
    if (!tabsListRef.current) return;
    const activeItem = tabsListRef.current.querySelector('li.active') as HTMLElement | null;
    if (activeItem) {
      setTabIndicatorStyle({
        left: activeItem.offsetLeft,
        width: activeItem.offsetWidth,
      });
    }
  }, [activeCategory]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown') && !target.closest('.header-language-selector')) {
        setOpenDropdown(null);
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const filteredPosts = activeCategory === 'All'
    ? BLOG_POSTS
    : BLOG_POSTS.filter((post) => post.tags.includes(activeCategory));

  return (
    <div className="agy-landing">
      {/* ====================================================================
          FIXED HEADER & NAVIGATION
          ==================================================================== */}
      <header
        ref={headerRef}
        className={`header ${openDropdown ? 'has-dropdown-open' : ''}`}
        data-header
      >
        <div className="grid-container">
          <div className="main-content">
            {/* Logo */}
            <div className="logo-container">
              <Link to="/" className="logo-link" aria-label="ArchiBot Home">
                <ArchiBrandMark size={28} />
                <span className="brand-wordmark">ArchiBot</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="call-to-action--nav nav">
              {/* Product Mega Menu */}
              <div className="nav-item">
                <button
                  type="button"
                  className={`call-to-action--nav button button-nav button-compact nav-trigger-btn dropdown-nav ${
                    openDropdown === 'product' ? 'active' : ''
                  }`}
                  aria-haspopup="true"
                  aria-expanded={openDropdown === 'product'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === 'product' ? null : 'product');
                    setLangDropdownOpen(false);
                  }}
                >
                  <span>Product</span>
                  <ChevronDownSvg
                    style={{
                      transform: openDropdown === 'product' ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
              </div>

              {/* Use Cases Mega Menu */}
              <div className="nav-item">
                <button
                  type="button"
                  className={`call-to-action--nav button button-nav button-compact nav-trigger-btn dropdown-nav ${
                    openDropdown === 'usecases' ? 'active' : ''
                  }`}
                  aria-haspopup="true"
                  aria-expanded={openDropdown === 'usecases'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === 'usecases' ? null : 'usecases');
                    setLangDropdownOpen(false);
                  }}
                >
                  <span>Use Cases</span>
                  <ChevronDownSvg
                    style={{
                      transform: openDropdown === 'usecases' ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
              </div>

              {/* Resources Mega Menu */}
              <div className="nav-item">
                <button
                  type="button"
                  className={`call-to-action--nav button button-nav button-compact nav-trigger-btn dropdown-nav ${
                    openDropdown === 'resources' ? 'active' : ''
                  }`}
                  aria-haspopup="true"
                  aria-expanded={openDropdown === 'resources'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === 'resources' ? null : 'resources');
                    setLangDropdownOpen(false);
                  }}
                >
                  <span>Resources</span>
                  <ChevronDownSvg
                    style={{
                      transform: openDropdown === 'resources' ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
              </div>

              {/* Pricing */}
              <div className="nav-item">
                <a
                  href={dashboardHref}
                  className="call-to-action--nav button button-nav button-compact nav-trigger-btn"
                >
                  <span>Pricing</span>
                </a>
              </div>
            </nav>

            {/* Right Actions */}
            <div className="header-actions">
              <div className="header-actions-right">
                {/* Language Selector */}
                <div className="language-selector header-language-selector">
                  <button
                    type="button"
                    className="lang-selector-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLangDropdownOpen(!langDropdownOpen);
                      setOpenDropdown(null);
                    }}
                    aria-expanded={langDropdownOpen}
                    aria-label="Select Language"
                  >
                    <span className="lang-flag">{activeLanguageObj.flag}</span>
                    <span className="lang-code">{activeLanguageObj.value.toUpperCase()}</span>
                    <ChevronDownSvg
                      style={{
                        transform: langDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>

                  {langDropdownOpen && (
                    <div
                      className="lang-dropdown-menu"
                      data-lenis-prevent
                      onWheel={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    >
                      {LANGUAGE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`lang-option ${option.value === selectedLang ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedLang(option.value);
                            setLangDropdownOpen(false);
                          }}
                        >
                          <span className="lang-flag">{option.flag}</span>
                          <span className="lang-label">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Primary CTA */}
                <div className="header-cta-group">
                  <a href={dashboardHref} className="call-to-action button button-primary">
                    <DiscordMark className="w-4 h-4" />
                    <span>Dashboard</span>
                  </a>
                </div>

                {/* Mobile Menu Hamburger */}
                <button
                  type="button"
                  className="mobile-menu-trigger"
                  aria-label="Toggle mobile menu"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
                  <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mega Menu Dropdowns */}
        {openDropdown === 'product' && (
          <div className="dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="grid-container">
              <div className="grid-row">
                <div className="grid-col col-md-4">
                  <p className="heading-7 dropdown-title">ArchiBot Platform</p>
                  <nav className="subnav">
                    <Link to="/#feature-explorer" className="subnav-link" onClick={() => setOpenDropdown(null)}>
                      <span className="subnav-title">Server Architect</span>
                      <span className="caption subnav-desc">AI-powered layout & channel blueprinting</span>
                    </Link>
                    <Link to="/#feature-explorer" className="subnav-link" onClick={() => setOpenDropdown(null)}>
                      <span className="subnav-title">Dynamic Voice</span>
                      <span className="caption subnav-desc">Zero-latency disposable voice rooms</span>
                    </Link>
                    <Link to="/#feature-explorer" className="subnav-link" onClick={() => setOpenDropdown(null)}>
                      <span className="subnav-title">Giveaway Studio</span>
                      <span className="caption subnav-desc">High-engagement role-restricted giveaways</span>
                    </Link>
                  </nav>
                </div>
                <div className="grid-col col-md-4">
                  <p className="heading-7 dropdown-title">Enterprise</p>
                  <nav className="subnav">
                    <Link to="/#use-cases-section" className="subnav-link" onClick={() => setOpenDropdown(null)}>
                      <span className="subnav-title">Security &amp; Anti-Raid</span>
                      <span className="caption subnav-desc">Instant quarantine &amp; snapshot restore</span>
                    </Link>
                    <Link to="/#use-cases-section" className="subnav-link" onClick={() => setOpenDropdown(null)}>
                      <span className="subnav-title">Audit Logs &amp; Analytics</span>
                      <span className="caption subnav-desc">Real-time health telemetry &amp; CSV logs</span>
                    </Link>
                  </nav>
                </div>
                <div className="grid-col col-md-4">
                  <div className="dropdown-promo-card">
                    <span className="caption promo-badge">New Release</span>
                    <p className="body-strong promo-title">ArchiBot Studio 2.0</p>
                    <p className="caption promo-desc">
                      Full Web Studio with live visual canvas and 1-click cloud sync.
                    </p>
                    <a href={dashboardHref} className="call-to-action button button-secondary button-compact">
                      <span>Open Studio</span>
                      <ArrowUpRightSvg />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {openDropdown === 'resources' && (
          <div className="dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="grid-container">
              <div className="grid-row">
                <div className="grid-col col-md-4">
                  <p className="heading-7 dropdown-title">Learn &amp; Docs</p>
                  <nav className="subnav">
                    <Link to="/#feature-explorer" className="subnav-link" onClick={() => setOpenDropdown(null)}>
                      <span className="subnav-title">Documentation</span>
                      <span className="caption subnav-desc">Setup guides, permissions &amp; quickstart</span>
                    </Link>
                    <Link to="/blog" className="subnav-link is-active" onClick={() => setOpenDropdown(null)}>
                      <span className="subnav-title">Blog</span>
                      <span className="caption subnav-desc">Latest news, releases &amp; engineering posts</span>
                    </Link>
                    <Link to="/#latest-blogs" className="subnav-link" onClick={() => setOpenDropdown(null)}>
                      <span className="subnav-title">Changelog</span>
                      <span className="caption subnav-desc">Weekly updates and platform release notes</span>
                    </Link>
                  </nav>
                </div>
                <div className="grid-col col-md-4">
                  <p className="heading-7 dropdown-title">Community</p>
                  <nav className="subnav">
                    <a href="https://discord.gg" target="_blank" rel="noreferrer" className="subnav-link">
                      <span className="subnav-title">Discord Community</span>
                      <span className="caption subnav-desc">Join 50k+ server owners and developers</span>
                    </a>
                    <a href="https://github.com/Rafifdev/ArchiBot" target="_blank" rel="noreferrer" className="subnav-link">
                      <span className="subnav-title">GitHub Repository</span>
                      <span className="caption subnav-desc">Contribute to open modules &amp; architecture</span>
                    </a>
                  </nav>
                </div>
                <div className="grid-col col-md-4">
                  <div className="dropdown-promo-card">
                    <span className="caption promo-badge">Engineering</span>
                    <p className="body-strong promo-title">ArchiBot Blog</p>
                    <p className="caption promo-desc">
                      Explore in-depth architectural breakdowns and release updates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ====================================================================
          MAIN BLOG CONTENT (1:1 Antigravity /blog)
          ==================================================================== */}
      <main className="main">
        <div className="grid-container blog" data-blog-page>
          {/* 1. Featured Article Header Section (Sticky / 2-Column Showcase) */}
          <section className="main-left-container" data-analytics-section="blog_featured">
            <div className="main-element">
              <div>
                <h2 className="heading-2 featured-label">Featured</h2>
                <a href="#featured" className="featured-title-link">
                  <h3 className="heading-4 featured-title">{FEATURED_POST.title}</h3>
                </a>

                <div className="tags-section">
                  <div className="tags-caption">
                    <span className="caption">{FEATURED_POST.date}</span>
                    <span className="caption dot">·</span>
                    <span className="caption">{FEATURED_POST.readTime}</span>
                    {FEATURED_POST.tags.map((tag) => (
                      <span key={tag} className="caption tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <a href={dashboardHref} className="call-to-action button button-secondary" style={{ alignSelf: 'flex-start' }}>
                    <span>Read blog</span>
                  </a>
                </div>
              </div>

              {/* 16:9 Featured Article Banner */}
              <a href="#featured" className="featured-article-image">
                <div
                  className="featured-img-inner"
                  style={{
                    background: FEATURED_POST.gradient,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Subtle Geometric Background Rings */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(49, 134, 255, 0.15) 0%, transparent 60%)',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '14px',
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '20px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#55E9AB',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '38px' }}>
                        {FEATURED_POST.icon}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: "'Google Sans Flex', 'Google Sans', sans-serif",
                        fontSize: '15px',
                        fontWeight: 500,
                        color: 'rgba(255, 255, 255, 0.85)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      ArchiBot Architecture Release
                    </span>
                  </div>
                </div>
              </a>
            </div>
          </section>

          {/* 2. Latest Blogs Section with Category Toolbar & 2-Col Grid */}
          <section className="latest-blogs" data-analytics-section="blog_latest_list">
            {/* Toolbar Header (Category Tabs + RSS Feed Button) */}
            <div className="toolbar-header">
              <div className="tabs" data-tab-list>
                <ul ref={tabsListRef} role="tablist">
                  {CATEGORY_TABS.map((cat) => {
                    const isActive = activeCategory === cat;
                    return (
                      <li key={cat} className={isActive ? 'active' : ''} role="presentation">
                        <button
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setActiveCategory(cat)}
                        >
                          {cat}
                        </button>
                      </li>
                    );
                  })}
                  <div
                    className="tab-indicator-line"
                    style={{
                      left: `${tabIndicatorStyle.left}px`,
                      width: `${tabIndicatorStyle.width}px`,
                    }}
                  />
                </ul>
              </div>

              {/* RSS Feed Button */}
              <a
                href="#rss"
                className="rss-feed-button"
                title="Subscribe to RSS Feed"
                aria-label="Subscribe to RSS Feed"
                onClick={(e) => e.preventDefault()}
              >
                <svg
                  viewBox="0 0 24 24"
                  height="16"
                  width="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 11a9 9 0 0 1 9 9" />
                  <path d="M4 4a16 16 0 0 1 16 16" />
                  <circle cx="5" cy="19" r="1" fill="currentColor" />
                </svg>
                <span>RSS Feed</span>
              </a>
            </div>

            {/* 2-Column Responsive Blog Cards Grid */}
            <div className="blog-cards" role="tabpanel" id="blog-content-panel">
              {filteredPosts.map((post) => (
                <div key={post.id} className="card-wrapper" data-card-tags={JSON.stringify(post.tags)}>
                  <div className="featured-card">
                    <div className="texts">
                      <a href={dashboardHref} className="card-title-link">
                        <h3 className="heading-6">{post.title}</h3>
                      </a>

                      <div className="tags-section">
                        <div className="tags-caption">
                          <span className="caption">{post.date}</span>
                          <span className="caption dot">·</span>
                          <span className="caption">{post.readTime}</span>
                          {post.tags.map((tag) => (
                            <span key={tag} className="caption tag-chip">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <a href={dashboardHref} className="call-to-action button button-secondary" style={{ alignSelf: 'flex-start' }}>
                          <span>Read blog</span>
                        </a>
                      </div>
                    </div>

                    {/* Square 1:1 Architectural Image Link */}
                    <a href={dashboardHref} className="card-img-link img">
                      <div
                        className="img-inner"
                        style={{
                          background: post.gradient,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.9 }}>
                          {post.icon}
                        </span>
                      </div>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* ====================================================================
          SECTION 3: FOOTER & GIANT CENTERED "ARCHIBOT" WORDMARK (1:1 Antigravity)
          ==================================================================== */}
      <footer className="footer">
        <div className="footer-main-content">
          <div className="grid-container">
            <div className="grid-row footer-inner">
              <div className="grid-col col-xs-4 col-sm-8 col-md-4">
                <p className="footer-title heading-5">Experience liftoff</p>
              </div>

              <div className="grid-col col-xs-4 col-sm-4 col-md-3 col-md-offset-2">
                <div className="footer-nav-section">
                  <p className="caption">Product</p>
                  <Link to="/#feature-explorer" className="call-to-action call-to-action--nav">Product</Link>
                  <a href={dashboardHref} className="call-to-action call-to-action--nav">Download</a>
                  <Link to="/#feature-explorer" className="call-to-action call-to-action--nav">ArchiBot App</Link>
                  <Link to="/#feature-explorer" className="call-to-action call-to-action--nav">ArchiBot Extensions</Link>
                  <Link to="/#feature-explorer" className="call-to-action call-to-action--nav">ArchiBot CLI</Link>
                  <Link to="/#feature-explorer" className="call-to-action call-to-action--nav">ArchiBot IDE</Link>
                  <Link to="/#feature-explorer" className="call-to-action call-to-action--nav">ArchiBot SDK</Link>
                </div>
              </div>

              <div className="grid-col col-xs-4 col-sm-4 col-md-3">
                <div className="footer-nav-section">
                  <p className="caption">Resources</p>
                  <Link to="/#feature-explorer" className="call-to-action call-to-action--nav">Docs</Link>
                  <Link to="/#latest-blogs" className="call-to-action call-to-action--nav">Changelog</Link>
                  <Link to="/#latest-blogs" className="call-to-action call-to-action--nav">Releases</Link>
                  <Link to="/blog" className="call-to-action call-to-action--nav" style={{ color: 'var(--palette-blue-600, #3186ff)' }}>Blog</Link>
                  <Link to="/#latest-blogs" className="call-to-action call-to-action--nav">Newsletter</Link>
                  <a href={dashboardHref} className="call-to-action call-to-action--nav">Pricing</a>
                  <Link to="/#use-cases-section" className="call-to-action call-to-action--nav">Use Cases</Link>
                  <Link to="/#latest-blogs" className="call-to-action call-to-action--nav">Press</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Giant Full-Bleed Centered "ArchiBot" Wordmark */}
        <div className="footer-img-container">
          <div className="grid-container">
            <div id="antigravity-footer-wrapper" ref={footerWordmarkRef}>
              <svg
                className="footer-antigravity"
                viewBox="0 0 946 250"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="ArchiBot"
              >
                <text
                  x="0"
                  y="198"
                  fill="#121317"
                  style={{
                    fontFamily: "'Google Sans Flex', 'Google Sans', sans-serif",
                    fontSize: '252px',
                    fontWeight: 650,
                    letterSpacing: '-0.015em',
                    fontVariationSettings: '"wdth" 100, "wght" 650, "opsz" 144',
                    userSelect: 'none',
                  }}
                >
                  ArchiBot
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Legal / Brand Bar */}
        <div className="footer-google-links">
          <div className="grid-container">
            <div className="grid-row" style={{ alignItems: 'center' }}>
              <div className="grid-col col-xs-4 col-sm-3 col-md-5">
                <Link to="/" className="footer-google-logo" aria-label="ArchiBot">
                  <ArchiBrandMark size={20} />
                  <span>ArchiBot</span>
                </Link>
              </div>
              <div className="footer-google-nav grid-col col-xs-4 col-sm-5 col-md-7">
                <Link to="/#hero" className="caption">
                  <span>About ArchiBot</span>
                </Link>
                <Link to="/#feature-explorer" className="caption">
                  <span>Modules</span>
                </Link>
                <a href={dashboardHref} className="caption">
                  <span>Web Studio</span>
                </a>
                <Link to="/#latest-blogs" className="caption">
                  <span>Privacy &amp; Security</span>
                </Link>
                <Link to="/#latest-blogs" className="caption">
                  <span>Terms</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogPage;
