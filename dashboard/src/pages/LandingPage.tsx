import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './landing/antigravity.css';
import { DiscordMark } from '../components/ui';
import { UserProfile } from '../types/api';
import { AntigravityParticles } from './landing/AntigravityParticles';

interface LandingPageProps {
  user?: UserProfile | null;
}

/* ==========================================================================
   ArchiBot Pure Brand Mark SVG (No Antigravity Logo)
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

/* ==========================================================================
   Exact 15 Language Options from SettingsPage.tsx
   ========================================================================== */
const LANGUAGE_OPTIONS = [
  {
    value: 'en',
    label: 'English (US)',
    short: 'EN',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><g fill="#b22234"><rect width="60" height="3.08" y="0"/><rect width="60" height="3.08" y="6.15"/><rect width="60" height="3.08" y="12.31"/><rect width="60" height="3.08" y="18.46"/><rect width="60" height="3.08" y="24.62"/><rect width="60" height="3.08" y="30.77"/><rect width="60" height="3.08" y="36.92"/></g><rect width="26" height="21.54" fill="#3c3b6e"/></svg>')}`,
  },
  {
    value: 'id',
    label: 'Bahasa Indonesia',
    short: 'ID',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="20" fill="#e70011"/><rect width="60" height="20" y="20" fill="#ffffff"/></svg>')}`,
  },
  {
    value: 'es',
    label: 'Español',
    short: 'ES',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#aa151b"/><rect width="60" height="20" y="10" fill="#f1bf00"/></svg>')}`,
  },
  {
    value: 'fr',
    label: 'Français',
    short: 'FR',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="20" height="40" x="0" fill="#002395"/><rect width="20" height="40" x="20" fill="#ffffff"/><rect width="20" height="40" x="40" fill="#ed2939"/></svg>')}`,
  },
  {
    value: 'de',
    label: 'Deutsch',
    short: 'DE',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="13.33" y="0" fill="#000000"/><rect width="60" height="13.33" y="13.33" fill="#dd0000"/><rect width="60" height="13.34" y="26.66" fill="#ffce00"/></svg>')}`,
  },
  {
    value: 'pt-BR',
    label: 'Português (Brasil)',
    short: 'PT-BR',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#009b3a"/><polygon points="30,5 54,20 30,35 6,20" fill="#fedf00"/><circle cx="30" cy="20" r="8" fill="#002776"/></svg>')}`,
  },
  {
    value: 'pt-PT',
    label: 'Português (Portugal)',
    short: 'PT',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="24" height="40" x="0" fill="#006600"/><rect width="36" height="40" x="24" fill="#ff0000"/><circle cx="24" cy="20" r="7" fill="#ffcc00"/></svg>')}`,
  },
  {
    value: 'zh',
    label: '中文 (简体)',
    short: 'ZH',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#de2910"/><polygon points="12,6 14,12 20,12 15,15.5 17,21.5 12,18 7,21.5 9,15.5 4,12 10,12" fill="#ffde00"/></svg>')}`,
  },
  {
    value: 'ja',
    label: '日本語',
    short: 'JA',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#ffffff"/><circle cx="30" cy="20" r="11" fill="#bc002d"/></svg>')}`,
  },
  {
    value: 'ko',
    label: '한국어',
    short: 'KO',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#ffffff"/><circle cx="30" cy="20" r="10" fill="#cd2e3a"/><path d="M20,20 a10,10 0 0,0 20,0 a5,5 0 0,1 -10,0 a5,5 0 0,0 -10,0" fill="#0047a0"/></svg>')}`,
  },
  {
    value: 'it',
    label: 'Italiano',
    short: 'IT',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="20" height="40" x="0" fill="#009246"/><rect width="20" height="40" x="20" fill="#ffffff"/><rect width="20" height="40" x="40" fill="#ce2b37"/></svg>')}`,
  },
  {
    value: 'nl',
    label: 'Nederlands',
    short: 'NL',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="13.33" y="0" fill="#ae1c28"/><rect width="60" height="13.33" y="13.33" fill="#ffffff"/><rect width="60" height="13.34" y="26.66" fill="#21468b"/></svg>')}`,
  },
  {
    value: 'ru',
    label: 'Русский',
    short: 'RU',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="13.33" y="0" fill="#ffffff"/><rect width="60" height="13.33" y="13.33" fill="#0039a6"/><rect width="60" height="13.34" y="26.66" fill="#d52b1e"/></svg>')}`,
  },
  {
    value: 'sv',
    label: 'Svenska',
    short: 'SV',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#006aa7"/><rect width="60" height="8" y="16" fill="#fecc02"/><rect width="8" height="40" x="18" fill="#fecc02"/></svg>')}`,
  },
  {
    value: 'no',
    label: 'Norsk',
    short: 'NO',
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#ba0c2f"/><rect width="60" height="10" y="15" fill="#ffffff"/><rect width="10" height="40" x="17" fill="#ffffff"/><rect width="60" height="5" y="17.5" fill="#00205b"/><rect width="5" height="40" x="19.5" fill="#00205b"/></svg>')}`,
  },
];

/* ==========================================================================
   1:1 Character-by-Character Typing Component (TypedHeader.js equivalent)
   ========================================================================== */
const TypedText: React.FC<{
  text: string;
  charDelayMs?: number;
  startDelayMs?: number;
  triggerOnView?: boolean;
}> = ({ text, charDelayMs = 34, startDelayMs = 200, triggerOnView = false }) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [started, setStarted] = useState(!triggerOnView);

  useEffect(() => {
    if (!triggerOnView) {
      setStarted(true);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerOnView]);

  useEffect(() => {
    setVisibleCount(0);
    if (!started) return;
    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setVisibleCount((prev) => {
          if (prev >= text.length) {
            if (intervalId) window.clearInterval(intervalId);
            return prev;
          }
          return prev + 1;
        });
      }, charDelayMs);
    }, startDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [text, charDelayMs, startDelayMs, started]);

  const typedSlice = text.slice(0, visibleCount);
  const remainingSlice = text.slice(visibleCount);

  return (
    <span ref={containerRef} style={{ position: 'relative' }}>
      <span>{typedSlice}</span>
      <span style={{ opacity: 0, userSelect: 'none' }} aria-hidden="true">
        {remainingSlice}
      </span>
    </span>
  );
};

/* ==========================================================================
   1:1 Scroll-Triggered Character/Word Stagger Reveal (FeatureExplorerNew.js)
   ========================================================================== */
const ScrollRevealText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { rootMargin: '0px 0px -15% 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const words = text.split(' ');
  return (
    <p ref={ref} className={className}>
      {words.map((word, idx) => (
        <span
          key={idx}
          style={{
            display: 'inline-block',
            opacity: revealed ? 1 : 0.12,
            transform: revealed ? 'translateY(0)' : 'translateY(4px)',
            transition: `opacity 0.28s ease ${idx * 0.018}s, transform 0.28s ease ${idx * 0.018}s`,
            marginRight: '0.28em',
          }}
        >
          {word}
        </span>
      ))}
    </p>
  );
};

const BOUNCER_ICONS = [
  'architecture',
  'celebration',
  'graphic_eq',
  'shield_lock',
  'dashboard_customize',
  'waving_hand',
  'workspace_premium',
  'backup',
  'terminal',
  'bolt',
  'auto_awesome',
  'verified_user',
  'analytics',
  'forum',
  'tune',
  'group_add',
  'notifications_active',
  'palette',
  'lock_reset',
  'cloud_done',
  'smart_toy',
  'dns',
  'hub',
  'security',
];

const USE_CASES = [
  {
    id: 'gaming',
    title: 'Gaming & Esports Hubs',
    badge: '100K+ Members Ready',
    summary:
      'Automate tournament lobbies, dynamic Join-to-Create squad voice channels, and high-conversion skin & Nitro giveaways without manual moderation overhead.',
    stats: [
      { label: 'Auto-Spawned Voice Rooms', value: '0ms lag' },
      { label: 'Giveaway Entry Throughput', value: '12,000/min' },
      { label: 'Raid Mitigation', value: '99.98%' },
    ],
    accent: '#3279f9',
    channels: ['🏆・tournament-brackets', '🎁・mega-giveaways', '➕・Join to Create Squad', '🎮・Apex Trio #1 (3/3)'],
  },
  {
    id: 'developers',
    title: 'Developer & Open-Source Communities',
    badge: 'Structured Knowledge',
    summary:
      'Deploy clean support category blueprints, protect contributor channels with interactive CAPTCHA verification, and publish rich release changelogs via the Embed Studio.',
    stats: [
      { label: 'Blueprint Deployment', value: '< 4.2 sec' },
      { label: 'Bot & Spam Filtering', value: 'Automated' },
      { label: 'Full JSON Snapshots', value: '1-Click' },
    ],
    accent: '#34a853',
    channels: ['📢・release-notes', '🛡️・verify-contributor', '💻・typescript-help', '📦・v2-5-changelog'],
  },
  {
    id: 'creators',
    title: 'Creator, Study & Web3 Ecosystems',
    badge: 'Retention & Engagement',
    summary:
      'Greet every newcomer with custom canvas welcome banners, reward loyal members automatically at milestone thresholds, and manage everything from a unified Material 3 web dashboard.',
    stats: [
      { label: 'Custom Welcome Canvas', value: 'HD Render' },
      { label: 'Role Milestones', value: 'Real-time' },
      { label: 'Audit Trail Visibility', value: '100%' },
    ],
    accent: '#fbbc04',
    channels: ['👋・welcome-lounge', '🌟・hall-of-fame', '🎨・creator-showcase', '🔊・Study Room #4 (5/8)'],
  },
];

/* ==========================================================================
   Latest Blogs Placeholder Data (Lorem Ipsum + Clean Placeholders)
   ========================================================================== */
const LATEST_BLOGS = [
  {
    title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor',
    date: 'Nov 7, 2026',
    category: 'Product',
  },
  {
    title: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip',
    date: 'Nov 2, 2026',
    category: 'Engineering',
  },
  {
    title: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat',
    date: 'Oct 28, 2026',
    category: 'Architecture',
  },
  {
    title: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt',
    date: 'Oct 19, 2026',
    category: 'Announcements',
  },
  {
    title: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque',
    date: 'Oct 11, 2026',
    category: 'Community',
  },
  {
    title: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit sed quia',
    date: 'Oct 3, 2026',
    category: 'Research',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ user }) => {
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

  // Language Dropdown State (matches SettingsPage.tsx 15 languages & MdSelect animation)
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownOpenRef = useRef(false);
  langDropdownOpenRef.current = langDropdownOpen;
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Hero & Showcase Scroll-Scrub Refs
  const heroParticlesRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const videoCursorRef = useRef<HTMLDivElement>(null);

  // Agent-First Bouncer Refs (1:1 Sine Wave + Horizontal Scroll Scrub)
  const agentSectionRef = useRef<HTMLElement>(null);
  const iconListRef = useRef<HTMLUListElement>(null);
  const bouncerRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Footer Wordmark Scroll-Scrub Ref
  const footerWordmarkRef = useRef<HTMLDivElement>(null);

  // Auto-playing Motion Loop State for Dashboard Feature Previews (0..3 steps every 2.2s)
  const [motionStep, setMotionStep] = useState(0);

  // Interactive Showcase tab inside Section 2 (.landing-video-section)
  const [showcaseTab, setShowcaseTab] = useState<'architect' | 'giveaways' | 'voice' | 'security'>('architect');
  const [showcaseAutoPlay, setShowcaseAutoPlay] = useState(true);

  // Interactive Giveaway demo counter in Section 4
  const [demoParticipants, setDemoParticipants] = useState(128);
  const [hasParticipated, setHasParticipated] = useState(false);

  // Interactive Voice Room lock toggle in Section 4
  const [voiceLocked, setVoiceLocked] = useState(false);
  const [voiceLimit, setVoiceLimit] = useState(5);

  // Use-Case Carousel state in Section 5 + slide transition key
  const [activeUseCase, setActiveUseCase] = useState(0);

  // Latest Blogs Horizontal Slider state
  const [blogSlideIndex, setBlogSlideIndex] = useState(0);
  const [visibleBlogCols, setVisibleBlogCols] = useState(4);

  const dashboardHref = user ? '/servers' : '/auth/discord';
  const isID = selectedLang === 'id';
  const activeLanguageObj = LANGUAGE_OPTIONS.find((l) => l.value === selectedLang) || LANGUAGE_OPTIONS[0];

  // Auto-advance motionStep (paused during active scroll to prevent mid-scroll re-render jank)
  useEffect(() => {
    const id = window.setInterval(() => {
      if (isScrollingRef.current || document.hidden) return;
      setMotionStep((prev) => (prev + 1) % 4);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  // Auto-cycle Showcase Tab when showcaseAutoPlay is active (paused during active scroll)
  useEffect(() => {
    if (!showcaseAutoPlay) return;
    const tabs: ('architect' | 'giveaways' | 'voice' | 'security')[] = [
      'architect',
      'giveaways',
      'voice',
      'security',
    ];
    const id = window.setInterval(() => {
      if (isScrollingRef.current || document.hidden) return;
      setShowcaseTab((prev) => tabs[(tabs.indexOf(prev) + 1) % tabs.length]);
    }, 5200);
    return () => window.clearInterval(id);
  }, [showcaseAutoPlay]);

  // Close language dropdown on outside click or Escape
  useEffect(() => {
    if (!langDropdownOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangDropdownOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [langDropdownOpen]);

  // Responsive column count for Latest Blogs slider
  useEffect(() => {
    const updateCols = () => {
      const w = window.innerWidth;
      if (w < 600) setVisibleBlogCols(1);
      else if (w < 840) setVisibleBlogCols(2);
      else if (w < 1200) setVisibleBlogCols(3);
      else setVisibleBlogCols(4);
    };
    updateCols();
    window.addEventListener('resize', updateCols, { passive: true });
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  const maxBlogSlide = Math.max(0, LATEST_BLOGS.length - visibleBlogCols);

  // 1:1 Antigravity.google Smooth Scroll (Lenis) + Reactive Header + Zero-Reflow Scrubbing
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.088,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });

    let anchorY = window.scrollY;
    let isHidden = false;
    let isScrolled = window.scrollY > 0;
    let scrollIdleTimer = 0;

    // Cached static layout offsets (computed only on mount/resize — zero getBoundingClientRect during scroll!)
    let vh = window.innerHeight;
    let vw = window.innerWidth;
    let videoDocTop = 0;
    let agentDocTop = 0;
    let agentHeight = 600;
    let footerDocTop = 0;

    let lastHeroOpacity = -1;
    let lastVideoScale = -1;
    let lastAgentShift = -9999;
    let lastFooterProgress = -1;

    const getOffsetTop = (el: HTMLElement | null): number => {
      let top = 0;
      let curr: HTMLElement | null = el;
      while (curr) {
        top += curr.offsetTop;
        curr = curr.offsetParent as HTMLElement | null;
      }
      return top;
    };

    const measureOffsets = () => {
      vh = window.innerHeight;
      vw = window.innerWidth;
      videoDocTop = getOffsetTop(videoSectionRef.current);
      agentDocTop = getOffsetTop(agentSectionRef.current);
      agentHeight = agentSectionRef.current?.offsetHeight || 600;
      footerDocTop = getOffsetTop(footerWordmarkRef.current);
    };

    measureOffsets();
    window.addEventListener('resize', measureOffsets, { passive: true });

    const updateScrubs = (currentY: number) => {
      // 1. Hero WebGL 3D sculpture fade out on scroll
      if (heroParticlesRef.current && currentY <= vh * 1.2) {
        const fade = Math.max(0, Math.min(1, 1 - currentY / (vh * 0.85)));
        const roundedFade = Math.round(fade * 1000) / 1000;
        if (roundedFade !== lastHeroOpacity) {
          lastHeroOpacity = roundedFade;
          heroParticlesRef.current.style.opacity = String(roundedFade);
        }
      }

      // 2. Showcase video section scroll-scrubbed scale (0.58 -> 1.0)
      if (videoSectionRef.current && videoDocTop > 0) {
        const rectTop = videoDocTop - currentY;
        const minScale = vw < 768 ? 0.92 : 0.58;
        const rawProgress = (vh - rectTop) / (vh * 0.58);
        const clamped = Math.max(0, Math.min(1, rawProgress));
        const eased = 1 - (1 - clamped) * (1 - clamped);
        const scale = Math.round((minScale + (1 - minScale) * eased) * 1000) / 1000;
        if (scale !== lastVideoScale) {
          lastVideoScale = scale;
          videoSectionRef.current.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
        }
      }

      // 3. Horizontal scroll scrub on Agent-First .icon-list (0px -> -250px)
      if (iconListRef.current && agentDocTop > 0) {
        const rectTop = agentDocTop - currentY;
        if (rectTop <= vh + 100 && rectTop + agentHeight >= -100) {
          const totalTravel = vh + agentHeight;
          const progress = Math.max(0, Math.min(1, (vh - rectTop) / totalTravel));
          const shiftX = Math.round(-250 * progress * 10) / 10;
          if (shiftX !== lastAgentShift) {
            lastAgentShift = shiftX;
            iconListRef.current.style.transform = `translate3d(${shiftX}px, 0px, 0px)`;
          }
        }
      }

      // 4. Footer giant wordmark scroll-scrubbed entrance
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
      }, 180);

      const scrolledState = currentY > 0;

      // Exact 1:1 Header.astro.js scroll state toggle
      if (scrolledState !== isScrolled) {
        isScrolled = scrolledState;
        headerScrolledRef.current = scrolledState;
        headerRef.current?.classList.toggle('scrolled', scrolledState);
      }

      // Exact 1:1 Header.astro.js hide/show threshold (r > 5 hides, r < -5 shows)
      const diff = currentY - anchorY;
      if (diff > 5) {
        if (!isHidden) {
          isHidden = true;
          headerHiddenRef.current = true;
          headerRef.current?.classList.add('header-hidden');
          if (openDropdownRef.current !== null) setOpenDropdown(null);
          if (langDropdownOpenRef.current) setLangDropdownOpen(false);
        }
      } else if (diff < -5 && isHidden) {
        isHidden = false;
        headerHiddenRef.current = false;
        headerRef.current?.classList.remove('header-hidden');
      }

      if (currentY <= 5 && isHidden) {
        isHidden = false;
        headerHiddenRef.current = false;
        headerRef.current?.classList.remove('header-hidden');
      }

      if (Math.abs(diff) > 5) {
        anchorY = currentY;
      }

      updateScrubs(currentY);
    };

    lenis.on('scroll', (e) => {
      handleScrollPosition(e.scroll);
    });

    updateScrubs(window.scrollY);

    return () => {
      window.clearTimeout(scrollIdleTimer);
      window.removeEventListener('resize', measureOffsets);
      lenis.destroy();
    };
  }, []);

  // 1:1 AgentFirst.js Travelling Sine-Wave Oscillation (Viewport-Gated via IntersectionObserver)
  useEffect(() => {
    const sectionEl = agentSectionRef.current;
    if (!sectionEl) return;

    let rafId = 0;
    let isVisible = false;
    let isRunning = false;
    const startTime = performance.now();

    const animateBouncers = (now: number) => {
      if (!isVisible) {
        isRunning = false;
        return;
      }

      const vw = Math.max(window.innerWidth, 320);
      const elapsedSec = (now - startTime) / 1000;
      const phase = ((elapsedSec % 7) / 7) * vw;

      const count = bouncerRefs.current.length;
      const itemSpan = 106;
      const totalWidth = count * itemSpan;
      const startX = (vw - totalWidth) / 2;

      for (let i = 0; i < count; i++) {
        const el = bouncerRefs.current[i];
        if (!el) continue;
        const centerX = startX + i * itemSpan + 49;
        const angle = ((centerX + phase) / vw) * Math.PI * 2;
        const y = Math.sin(angle) * 35;
        el.style.transform = `translate3d(0px, ${y.toFixed(1)}px, 0px)`;
      }

      rafId = requestAnimationFrame(animateBouncers);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isVisible = entry.isIntersecting;
        if (isVisible && !isRunning) {
          isRunning = true;
          rafId = requestAnimationFrame(animateBouncers);
        } else if (!isVisible && isRunning) {
          cancelAnimationFrame(rafId);
          isRunning = false;
        }
      },
      { rootMargin: '100px 0px' }
    );

    observer.observe(sectionEl);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="agy-landing">
      {/* ====================================================================
          SECTION 0: FIXED HEADER & ANNOUNCEMENT PILL
          ==================================================================== */}
      <header
        ref={headerRef}
        className={`header ${headerHiddenRef.current ? 'header-hidden' : ''} ${
          headerScrolledRef.current ? 'scrolled' : ''
        } ${openDropdown ? 'dropdown-open' : ''} ${mobileMenuOpen ? 'menu-open' : ''}`}
        onMouseLeave={() => setOpenDropdown(null)}
      >
        <div className="grid-container">
          <div className="main-content">
            {/* Pure ArchiBot Brand Logo */}
            <div className="logo-container">
              <Link to="/" className="logo-link" aria-label="ArchiBot">
                <ArchiBrandMark size={26} />
                <span
                  style={{
                    fontSize: '20.5px',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    color: '#121317',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  ArchiBot
                </span>
              </Link>
            </div>

            {/* Desktop Nav + CTA (Use Cases & Communities Removed, Rocket Removed) */}
            <div className="header-actions" style={{ display: mobileMenuOpen ? 'none' : undefined }}>
              <nav className="call-to-action--nav nav" aria-label="Main Navigation">
                <div
                  className="nav-item"
                  onMouseEnter={() => setOpenDropdown('modules')}
                >
                  <button
                    type="button"
                    className={`call-to-action--nav button button-nav button-compact dropdown-nav ${
                      openDropdown === 'modules' ? 'dropdown-open' : ''
                    }`}
                    aria-expanded={openDropdown === 'modules'}
                    onClick={() => setOpenDropdown(openDropdown === 'modules' ? null : 'modules')}
                  >
                    <span>{isID ? 'Modul' : 'Modules'}</span>
                    <span className="dropdown-icon">
                      <ChevronDownSvg />
                    </span>
                  </button>
                </div>

                <div
                  className="nav-item"
                  onMouseEnter={() => setOpenDropdown(null)}
                >
                  <a
                    href="#feature-explorer"
                    className="call-to-action--nav button button-nav button-compact"
                    onClick={() => setOpenDropdown(null)}
                  >
                    <span>{isID ? 'Fitur Unggulan' : 'Capabilities'}</span>
                  </a>
                </div>

                <div
                  className="nav-item"
                  onMouseEnter={() => setOpenDropdown('resources')}
                >
                  <button
                    type="button"
                    className={`call-to-action--nav button button-nav button-compact dropdown-nav ${
                      openDropdown === 'resources' ? 'dropdown-open' : ''
                    }`}
                    aria-expanded={openDropdown === 'resources'}
                    onClick={() => setOpenDropdown(openDropdown === 'resources' ? null : 'resources')}
                  >
                    <span>{isID ? 'Sumber Daya' : 'Resources'}</span>
                    <span className="dropdown-icon">
                      <ChevronDownSvg />
                    </span>
                  </button>
                </div>
              </nav>

              <div className="header-cta-group">
                <a
                  href={dashboardHref}
                  className="call-to-action--nav button button-primary button-compact download-button"
                >
                  <DiscordMark className="w-4 h-4" />
                  <span>
                    {user
                      ? isID
                        ? 'Buka Dashboard'
                        : 'Open Dashboard'
                      : isID
                      ? 'Masuk'
                      : 'Sign in'}
                  </span>
                </a>
              </div>
            </div>

            {/* Right Language Dropdown (Exact 15 Languages from SettingsPage + MdSelect Animation) */}
            <div className="header-actions-right" ref={langDropdownRef}>
              <button
                type="button"
                className={`language-selector ${langDropdownOpen ? 'open' : ''}`}
                onClick={() => setLangDropdownOpen((prev) => !prev)}
                aria-expanded={langDropdownOpen}
                aria-haspopup="listbox"
                title="Select Language"
              >
                <img
                  src={activeLanguageObj.iconUrl}
                  alt=""
                  style={{
                    width: '18px',
                    height: '13px',
                    objectFit: 'cover',
                    borderRadius: '2px',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                  }}
                />
                <span>{activeLanguageObj.short}</span>
                <ChevronDownSvg
                  style={{
                    width: '15px',
                    height: '15px',
                    transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
                    transform: langDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              <div
                role="listbox"
                className={`lang-dropdown-menu ${langDropdownOpen ? 'open' : 'closed'}`}
              >
                {LANGUAGE_OPTIONS.map((option) => {
                  const isSelected = option.value === selectedLang;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`lang-dropdown-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedLang(option.value);
                        setLangDropdownOpen(false);
                      }}
                    >
                      <img
                        src={option.iconUrl}
                        alt=""
                        style={{
                          width: '20px',
                          height: '14px',
                          objectFit: 'cover',
                          borderRadius: '2px',
                          flexShrink: 0,
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
                        }}
                      />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: '17px', color: '#3279f9', flexShrink: 0 }}
                        >
                          check
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mega-Menu Dropdown Panels */}
        {openDropdown && (
          <div className="dropdown">
            <div className="grid-container">
              {openDropdown === 'modules' && (
                <div className="dropdown-panel">
                  <div className="col-md-4">
                    <p className="heading-7 dropdown-title">
                      {isID
                        ? 'Jelajahi modul arsitektur server generasi baru'
                        : 'Explore our next-generation Discord modules'}
                    </p>
                    <p className="caption dropdown-info">
                      {isID
                        ? 'Konfigurasi, pratinjau, dan otomatisasi seluruh ekosistem Discord Anda dari satu studio web terpadu.'
                        : 'Configure, preview, and automate your entire Discord server from one unified web studio.'}
                    </p>
                    <a
                      href="#feature-explorer"
                      className="call-to-action--nav nav-button"
                      onClick={() => setOpenDropdown(null)}
                    >
                      <span>{isID ? 'Lihat dokumentasi' : 'See documentation'}</span>
                    </a>
                  </div>

                  {/* Products Simple Clean List (1:1 with Reference Screenshot) */}
                  <div className="col-md-4 subnav-column">
                    <p className="caption subnav-label">Products</p>
                    <nav className="subnav">
                      {[
                        {
                          icon: (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                              <path d="M4 19C4 11 8 5 12 5C16 5 20 11 20 19M7.5 15C9.5 13.2 14.5 13.2 16.5 15" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ),
                          title: 'ArchiBot App',
                          href: dashboardHref,
                          external: false,
                        },
                        {
                          icon: (
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', fontWeight: 300 }}>
                              extension
                            </span>
                          ),
                          title: 'ArchiBot Extensions',
                          href: dashboardHref,
                          external: true,
                        },
                        {
                          icon: (
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', fontWeight: 300 }}>
                              terminal
                            </span>
                          ),
                          title: 'ArchiBot CLI',
                          href: '#feature-explorer',
                          external: false,
                        },
                        {
                          icon: (
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', fontWeight: 300 }}>
                              code
                            </span>
                          ),
                          title: 'ArchiBot IDE',
                          href: '#feature-explorer',
                          external: false,
                        },
                        {
                          icon: (
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', fontWeight: 300 }}>
                              deployed_code
                            </span>
                          ),
                          title: 'ArchiBot SDK',
                          href: '#feature-explorer',
                          external: false,
                        },
                      ].map((item, idx) => (
                        <a
                          key={item.title}
                          href={item.href}
                          className="body subnav-link"
                          style={{
                            animationDelay: `${0.14 + idx * 0.075}s`,
                            justifyContent: 'space-between',
                          }}
                          onClick={() => setOpenDropdown(null)}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', color: '#121317' }}>
                              {item.icon}
                            </span>
                            <span style={{ fontSize: '15.5px', fontWeight: 400, color: '#121317' }}>{item.title}</span>
                          </span>
                          {item.external && (
                            <span style={{ color: '#5f6368', display: 'flex', alignItems: 'center' }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          )}
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>
              )}

              {openDropdown === 'resources' && (
                <div className="dropdown-panel">
                  <div className="col-md-4">
                    <p className="heading-7 dropdown-title">
                      {isID
                        ? 'Semua yang Anda butuhkan untuk membangun dan mengelola server'
                        : 'Everything you need to configure and scale your server'}
                    </p>
                    <p className="caption dropdown-info">
                      {isID
                        ? 'Pelajari panduan modul, catatan rilis, dan spesifikasi pencadangan server.'
                        : 'Explore module guides, latest blogs, and server backup specifications.'}
                    </p>
                  </div>
                  <div className="col-md-4 subnav-column">
                    <p className="caption subnav-label">Resources</p>
                    <nav className="subnav">
                      {[
                        { label: 'Web Dashboard Studio', href: dashboardHref, external: true },
                        { label: 'Interactive Showcase', href: '#showcase-section', external: false },
                        { label: 'Latest Blogs', href: '#latest-blogs', external: false },
                        { label: 'Server Snapshots & Backups', href: '#feature-explorer', external: false },
                      ].map((item, idx) => (
                        <a
                          key={item.label}
                          href={item.href}
                          className="body subnav-link"
                          style={{
                            animationDelay: `${0.14 + idx * 0.08}s`,
                            justifyContent: 'space-between',
                          }}
                          onClick={() => setOpenDropdown(null)}
                        >
                          <span>{item.label}</span>
                          {item.external && <ArrowUpRightSvg />}
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {openDropdown && (
        <div
          className="dropdown-overlay"
          onClick={() => setOpenDropdown(null)}
          aria-hidden="true"
        />
      )}

      {/* ====================================================================
          MAIN SMOOTH CONTENT
          ==================================================================== */}
      <main>
        {/* ==================================================================
            SECTION 1: HERO (.welcome-wrapper)
            ================================================================== */}
        <section className="welcome-wrapper" id="hero">
          <div className="hero-video-wrapper" ref={heroParticlesRef}>
            <AntigravityParticles theme="light" variant="ring" density={230} />
          </div>

          <div className="welcome-section">
            <div className="grid-container">
              <div className="grid-row">
                <div className="grid-col col-xs-4 col-sm-8 col-md-9">
                  {/* Monumental Hero Headline with 1:1 Character Typing Animation */}
                  <div className="header-container">
                    <h1 className="landing-main-header">
                      <span className="landing-main">
                        <TypedText
                          text={
                            isID
                              ? 'Bangun ekosistem Discord dengan platform arsitek generasi baru'
                              : 'Experience liftoff with the next-gen Discord architect'
                          }
                          charDelayMs={36}
                          startDelayMs={250}
                        />
                      </span>
                    </h1>
                  </div>

                  {/* Single Primary Hero Pill CTA */}
                  <div className="welcome-cta">
                    <a href={dashboardHref} className="call-to-action button button-primary">
                      <DiscordMark className="w-5 h-5" />
                      <span>
                        {user
                          ? isID
                            ? 'Buka Dashboard'
                            : 'Open Dashboard'
                          : isID
                          ? 'Masuk dengan Discord'
                          : 'Sign in with Discord'}
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 2: SCROLL-SCRUBBED MOTION SHOWCASE (.landing-video-section)
            ================================================================== */}
        <section
          ref={videoSectionRef}
          className="landing-video-section"
          id="showcase-section"
          style={{
            transform: 'scale(0.58)',
            transformOrigin: 'center top',
          }}
        >
          <div className="grid-container">
            <div className="grid-row">
              <div className="grid-col col-md-12">
                <div
                  ref={videoWrapperRef}
                  className="video-wrapper"
                  onMouseMove={(e) => {
                    const cursorEl = videoCursorRef.current;
                    if (!cursorEl) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    cursorEl.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(1)`;
                  }}
                  onMouseLeave={() => {
                    const cursorEl = videoCursorRef.current;
                    if (!cursorEl) return;
                    cursorEl.style.transform = 'translate3d(0px, 0px, 0) translate(-50%, -50%) scale(0)';
                  }}
                >
                  {/* Floating Custom Pill Cursor (1:1 YoutubeVideoSection.js, Zero-Rerender Ref) */}
                  <div
                    ref={videoCursorRef}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      transform: 'translate3d(0px, 0px, 0) translate(-50%, -50%) scale(0)',
                      transition: 'transform 0.14s cubic-bezier(0.22, 1, 0.36, 1)',
                      willChange: 'transform',
                      pointerEvents: 'none',
                      zIndex: 40,
                      background: 'rgba(255, 255, 255, 0.94)',
                      color: '#121317',
                      padding: '6px 14px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: showcaseAutoPlay ? '#34a853' : '#fbbc04',
                      }}
                    />
                    <span>{showcaseAutoPlay ? 'Live Studio Motion' : 'Interactive Mode'}</span>
                  </div>

                  {/* Top Studio Chrome Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 24px',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      background: '#18191d',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ea4335' }} />
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fbbc04' }} />
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#34a853' }} />
                      <span
                        style={{
                          marginLeft: '10px',
                          fontSize: '13px',
                          color: '#b2bbc5',
                          fontFamily: "'Google Sans Code', monospace",
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>archibot://dashboard/{showcaseTab}</span>
                        <button
                          type="button"
                          onClick={() => setShowcaseAutoPlay((p) => !p)}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            border: '1px solid rgba(255,255,255,0.14)',
                            background: showcaseAutoPlay ? 'rgba(52,168,83,0.16)' : 'rgba(255,255,255,0.06)',
                            color: showcaseAutoPlay ? '#4ade80' : '#b2bbc5',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          {showcaseAutoPlay ? '● AUTO-MOTION' : '❚❚ PAUSED'}
                        </button>
                      </span>
                    </div>

                    {/* Interactive Module Switcher Tabs */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        background: '#121317',
                        padding: '4px',
                        borderRadius: '999px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        flexWrap: 'wrap',
                      }}
                    >
                      {[
                        { id: 'architect', icon: 'architecture', label: 'AI Server Architect' },
                        { id: 'giveaways', icon: 'celebration', label: 'Giveaways 2.5' },
                        { id: 'voice', icon: 'graphic_eq', label: 'Dynamic Voice' },
                        { id: 'security', icon: 'shield_lock', label: 'Anti-Raid & Backups' },
                      ].map((tab) => {
                        const active = showcaseTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setShowcaseTab(tab.id as typeof showcaseTab);
                              setShowcaseAutoPlay(false);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: '999px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: 500,
                              background: active ? '#ffffff' : 'transparent',
                              color: active ? '#121317' : '#b2bbc5',
                              transition: 'all 0.2s',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                              {tab.icon}
                            </span>
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Motion Progress Bar */}
                  <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${((motionStep + 1) / 4) * 100}%`,
                        background: 'linear-gradient(90deg, #3279f9, #34a853, #fbbc04)',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>

                  {/* Authentic ArchiBot Dashboard Split Workspace Preview */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '24px',
                      padding: '32px',
                      color: '#ffffff',
                      minHeight: '440px',
                      alignItems: 'stretch',
                    }}
                  >
                    {/* Left Panel: Real ArchiBot Dashboard Controls */}
                    <div
                      style={{
                        background: '#18191d',
                        borderRadius: '24px',
                        padding: '28px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      {showcaseTab === 'architect' && (
                        <>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                              <span
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: '999px',
                                  background: 'rgba(50, 121, 249, 0.16)',
                                  color: '#60a5fa',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                }}
                              >
                                ARCHITECTPAGE.TSX • BLUEPRINT ENGINE
                              </span>
                              <span style={{ fontSize: '12px', color: '#34a853', fontFamily: "'Google Sans Code', monospace" }}>
                                ● Step {motionStep + 1}/4
                              </span>
                            </div>
                            <h3 className="heading-6" style={{ color: '#fff', marginBottom: '10px' }}>
                              Prompt-to-Server Blueprints
                            </h3>
                            <p className="caption" style={{ color: '#b2bbc5', marginBottom: '20px' }}>
                              Describe your community and watch ArchiBot generate categories, channels, and permission overwrites automatically.
                            </p>
                            <div
                              style={{
                                background: '#121317',
                                borderRadius: '14px',
                                padding: '16px',
                                border: '1px solid rgba(50, 121, 249, 0.35)',
                                fontFamily: "'Google Sans Code', monospace",
                                fontSize: '13px',
                                color: '#e6eaf0',
                                lineHeight: 1.6,
                              }}
                            >
                              <div style={{ color: '#60a5fa', marginBottom: '6px' }}>
                                $ /architect build template=&quot;Competitive Esports &amp; Community Hub&quot;
                              </div>
                              <div style={{ color: '#34a853', opacity: motionStep >= 0 ? 1 : 0.3, transition: 'opacity 0.3s' }}>
                                ✓ Created 6 Categories &amp; 22 Channels (0.8s)
                              </div>
                              <div style={{ color: '#34a853', opacity: motionStep >= 1 ? 1 : 0.3, transition: 'opacity 0.3s' }}>
                                ✓ Configured 10 Hierarchical Roles &amp; Permissions
                              </div>
                              <div style={{ color: '#fbbc04', opacity: motionStep >= 2 ? 1 : 0.3, transition: 'opacity 0.3s' }}>
                                ✓ Bound Join-to-Create Voice Hub &amp; Anti-Raid Gate
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                            <a href={dashboardHref} className="button button-primary-inverse button-compact">
                              <span>Open Architect Studio</span>
                            </a>
                          </div>
                        </>
                      )}

                      {showcaseTab === 'giveaways' && (
                        <>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                              <span
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: '999px',
                                  background: 'rgba(251, 188, 4, 0.16)',
                                  color: '#fbbc04',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                }}
                              >
                                GIVEAWAYSPAGE.TSX • EMBED STUDIO
                              </span>
                              <span style={{ fontSize: '12px', color: '#34a853', fontFamily: "'Google Sans Code', monospace" }}>
                                ● Live Counter ({128 + motionStep * 3})
                              </span>
                            </div>
                            <h3 className="heading-6" style={{ color: '#fff', marginBottom: '10px' }}>
                              High-Conversion Giveaways &amp; Custom Embeds
                            </h3>
                            <p className="caption" style={{ color: '#b2bbc5', marginBottom: '20px' }}>
                              Customize embed color, thumbnail, banner image, and footer branding with live Discord preview and instant winner rerolls.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div style={{ background: '#121317', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '12px', color: '#b2bbc5' }}>Embed Color Swatch</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                  <span
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: '6px',
                                      background: ['#3279f9', '#8b5cf6', '#10b981', '#f59e0b'][motionStep],
                                      transition: 'background 0.4s ease',
                                    }}
                                  />
                                  <strong style={{ fontSize: '14px', fontFamily: "'Google Sans Code', monospace" }}>
                                    {['#3279F9', '#8B5CF6', '#10B981', '#F59E0B'][motionStep]}
                                  </strong>
                                </div>
                              </div>
                              <div style={{ background: '#121317', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '12px', color: '#b2bbc5' }}>Button Label</div>
                                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '6px', color: '#60a5fa' }}>
                                  🎉 Participate ({128 + motionStep * 3})
                                </div>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <a href={dashboardHref} className="button button-primary-inverse button-compact">
                              <span>Launch a Giveaway</span>
                            </a>
                          </div>
                        </>
                      )}

                      {showcaseTab === 'voice' && (
                        <>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                              <span
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: '999px',
                                  background: 'rgba(52, 168, 83, 0.16)',
                                  color: '#4ade80',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                }}
                              >
                                VOICEPAGE.TSX • JOIN-TO-CREATE ENGINE
                              </span>
                              <span style={{ fontSize: '12px', color: '#4ade80', fontFamily: "'Google Sans Code', monospace" }}>
                                ● Auto-Cleanup Active
                              </span>
                            </div>
                            <h3 className="heading-6" style={{ color: '#fff', marginBottom: '10px' }}>
                              Self-Healing Temporary Voice Channels
                            </h3>
                            <p className="caption" style={{ color: '#b2bbc5', marginBottom: '20px' }}>
                              When members join your master hub, ArchiBot spawns a personal voice room with full owner controls and removes it when empty.
                            </p>
                            <div
                              style={{
                                background: '#121317',
                                padding: '16px',
                                borderRadius: '14px',
                                border: '1px solid rgba(255,255,255,0.07)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                                <span style={{ color: '#b2bbc5' }}>Master Trigger Hub</span>
                                <span style={{ color: '#fff', fontWeight: 500 }}>➕ Join to Create</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                                <span style={{ color: '#b2bbc5' }}>Room Naming Template</span>
                                <span style={{ color: '#4ade80', fontFamily: "'Google Sans Code', monospace" }}>
                                  🎮 {'{username}'}&apos;s Squad
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <a href={dashboardHref} className="button button-primary-inverse button-compact">
                              <span>Configure Voice Hubs</span>
                            </a>
                          </div>
                        </>
                      )}

                      {showcaseTab === 'security' && (
                        <>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                              <span
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: '999px',
                                  background: 'rgba(234, 67, 53, 0.18)',
                                  color: '#f87171',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                }}
                              >
                                BACKUPSPAGE.TSX • ANTI-RAID SHIELD
                              </span>
                              <span style={{ fontSize: '12px', color: '#4ade80', fontFamily: "'Google Sans Code', monospace" }}>
                                ● Shield Armed
                              </span>
                            </div>
                            <h3 className="heading-6" style={{ color: '#fff', marginBottom: '10px' }}>
                              Real-Time Raid Lockdown &amp; JSON Snapshots
                            </h3>
                            <p className="caption" style={{ color: '#b2bbc5', marginBottom: '20px' }}>
                              Stop token-bot waves with automatic join-velocity triggers, CAPTCHA gates, and complete 1-click server structure backups.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div style={{ background: '#121317', padding: '14px', borderRadius: '12px' }}>
                                <div style={{ fontSize: '12px', color: '#b2bbc5' }}>Join Velocity Threshold</div>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#f87171', marginTop: '4px' }}>
                                  10 joins / 8 sec
                                </div>
                              </div>
                              <div style={{ background: '#121317', padding: '14px', borderRadius: '12px' }}>
                                <div style={{ fontSize: '12px', color: '#b2bbc5' }}>Latest Snapshot</div>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#4ade80', marginTop: '4px' }}>
                                  snap_2026_11.json
                                </div>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <a href={dashboardHref} className="button button-primary-inverse button-compact">
                              <span>Manage Security &amp; Backups</span>
                            </a>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Right Panel: Live Discord Guild Preview */}
                    <div
                      style={{
                        background: '#1e1f22',
                        borderRadius: '24px',
                        padding: '24px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <ArchiBrandMark size={22} />
                          <strong style={{ fontSize: '15px', color: '#f2f3f5' }}>ArchiBot Live Discord Preview</strong>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '3px 9px',
                            borderRadius: '999px',
                            background: 'rgba(52,168,83,0.18)',
                            color: '#4ade80',
                            fontWeight: 600,
                          }}
                        >
                          ● WebSocket Connected
                        </span>
                      </div>

                      {/* Discord Message / Embed Simulation */}
                      <div
                        style={{
                          margin: '20px 0',
                          background: '#2b2d31',
                          borderRadius: '12px',
                          borderLeft: `4px solid ${
                            showcaseTab === 'architect'
                              ? '#3279f9'
                              : showcaseTab === 'giveaways'
                              ? ['#3279f9', '#8b5cf6', '#10b981', '#f59e0b'][motionStep]
                              : showcaseTab === 'voice'
                              ? '#34a853'
                              : '#ea4335'
                          }`,
                          padding: '18px',
                          transition: 'border-color 0.35s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>ArchiBot</span>
                          <span
                            style={{
                              background: '#5865f2',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '4px',
                            }}
                          >
                            APP
                          </span>
                          <span style={{ fontSize: '11px', color: '#949ba4' }}>Today at 19:20</span>
                        </div>

                        {showcaseTab === 'architect' && (
                          <div>
                            <div style={{ fontWeight: 600, color: '#f2f3f5', marginBottom: '6px' }}>
                              🏗️ Server Blueprint Deployed Successfully
                            </div>
                            <div style={{ fontSize: '13px', color: '#dbdee1', lineHeight: 1.5 }}>
                              Created <strong>#announcements</strong>, <strong>#rules-and-verify</strong>,{' '}
                              <strong>#general-chat</strong>, <strong>#giveaways</strong>, and{' '}
                              <strong>➕ Join to Create</strong> with role hierarchy locked.
                            </div>
                          </div>
                        )}

                        {showcaseTab === 'giveaways' && (
                          <div>
                            <div style={{ fontWeight: 600, color: '#f2f3f5', marginBottom: '6px' }}>
                              🎁 Discord Nitro Yearly &amp; Custom Role Bundle
                            </div>
                            <div style={{ fontSize: '13px', color: '#dbdee1', marginBottom: '12px' }}>
                              Click the button below to enter! Winners are drawn automatically and announced in real time.
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#5865f2', color: '#fff', padding: '7px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>
                              <span>🎉 Participate ({128 + motionStep * 3})</span>
                            </div>
                          </div>
                        )}

                        {showcaseTab === 'voice' && (
                          <div>
                            <div style={{ fontWeight: 600, color: '#f2f3f5', marginBottom: '6px' }}>
                              🔊 Dynamic Voice Room Spawned
                            </div>
                            <div style={{ fontSize: '13px', color: '#dbdee1' }}>
                              Created temporary voice channel <strong>🎮 Alex&apos;s Squad (3/5)</strong>. Room owner controls unlocked in dashboard.
                            </div>
                          </div>
                        )}

                        {showcaseTab === 'security' && (
                          <div>
                            <div style={{ fontWeight: 600, color: '#f2f3f5', marginBottom: '6px' }}>
                              🛡️ Anti-Raid Shield &amp; Verification Active
                            </div>
                            <div style={{ fontSize: '13px', color: '#dbdee1' }}>
                              Suspicious join spike blocked. New members must complete interactive CAPTCHA before viewing server channels.
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#949ba4' }}>
                        <span>ArchiBot Studio • Material Design 3</span>
                        <span>Latency: 14ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 3: AGENT-FIRST (.agent-first-section)
            1:1 Travelling Sine-Wave + Horizontal Scroll Scrub + Zero Hover
            ================================================================== */}
        <section className="agent-first-section" ref={agentSectionRef}>
          <ul className="icon-list" ref={iconListRef} aria-hidden="true">
            {BOUNCER_ICONS.map((iconName, idx) => (
              <li
                key={iconName + idx}
                ref={(el) => {
                  bouncerRefs.current[idx] = el;
                }}
                className="bouncer"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '34px', fontWeight: 300 }}>
                  {iconName}
                </span>
              </li>
            ))}
          </ul>

          <div className="agent-first-text-container">
            <div className="grid-container">
              <div className="grid-row">
                <div className="grid-col col-xs-4 col-sm-6 col-md-9">
                  <p className="heading-3">
                    <TypedText
                      text={
                        isID
                          ? 'ArchiBot adalah platform manajemen Discord kami yang berevolusi menjadi studio komando berbasis web.'
                          : 'ArchiBot is our Discord automation platform, evolving community management into the architect-first era.'
                      }
                      charDelayMs={18}
                      startDelayMs={100}
                      triggerOnView={true}
                    />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 4: FEATURE EXPLORER (.feature-explorer-section)
            Self-Playing Motion Previews Sourced Directly from Dashboard UI
            ================================================================== */}
        <section className="feature-explorer-section" id="feature-explorer">
          <div className="grid-container">
            <div className="feature-list">
              {/* FEATURE 1: AI Server Architect (ArchitectPage.tsx Motion Preview) */}
              <div className="feature-item">
                <div className="grid-row">
                  <div className="grid-col col-xs-4 col-sm-8 col-md-4">
                    <div className="feature-copy">
                      <a href={dashboardHref} className="feature-title-link">
                        <h3 className="heading-5 feature-title">
                          {isID ? 'AI Server Architect dalam hitungan detik' : 'An AI Server Architect at your core'}
                        </h3>
                      </a>
                      <ScrollRevealText
                        className="body feature-description"
                        text={
                          isID
                            ? 'ArchiBot AI Architect membangun struktur channel, kategori, dan hierarki role Discord lengkap hanya dari satu deskripsi teks, dilengkapi pratinjau blueprint interaktif sebelum diterapkan ke server.'
                            : 'ArchiBot’s AI Server Architect generates complete Discord channel trees, category structures, and role permission hierarchies from a single natural-language prompt—with an interactive blueprint preview before deployment.'
                        }
                      />
                    </div>
                  </div>

                  <div className="grid-col col-xs-4 col-sm-8 col-md-7 col-md-offset-1">
                    <div
                      className="feature-media"
                      style={{
                        background: '#0b0d12',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        color: '#e6eaf0',
                      }}
                    >
                      {/* Authentic ArchitectPage.tsx Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(88,101,242,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>architecture</span>
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>AI Server Architect</div>
                            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>dashboard/src/pages/ArchitectPage.tsx</div>
                          </div>
                        </div>
                        <span style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(52,168,83,0.15)', color: '#4ade80', fontSize: '11px', fontWeight: 500 }}>
                          ● AUTO-SIMULATION
                        </span>
                      </div>

                      {/* Animated Prompt + Blueprint Tree */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
                        <div style={{ background: '#13161f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 14px' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Blueprint Prompt</div>
                          <div style={{ fontSize: '13px', color: '#f8fafc', fontFamily: "'Google Sans Code', monospace" }}>
                            &quot;Build a 50k Gaming &amp; Tournament community with VIP lounges&quot;
                          </div>
                        </div>

                        <div style={{ background: '#13161f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {[
                            { name: '📌 IMPORTANT & VERIFY', channels: ['#welcome-rules', '#announcements', '#verify-gate'], step: 0 },
                            { name: '💬 COMMUNITY LOUNGE', channels: ['#general-chat', '#media-highlights', '#bot-commands'], step: 1 },
                            { name: '🏆 TOURNAMENT HUB', channels: ['#brackets', '🎁・giveaways', '➕ Join to Create'], step: 2 },
                          ].map((cat, idx) => {
                            const active = motionStep >= cat.step;
                            return (
                              <div
                                key={cat.name}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: '10px',
                                  background: active ? 'rgba(50,121,249,0.08)' : 'rgba(255,255,255,0.02)',
                                  border: `1px solid ${active ? 'rgba(50,121,249,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                  opacity: active ? 1 : 0.4,
                                  transform: active ? 'translateX(0)' : 'translateX(-6px)',
                                  transition: 'all 0.4s ease',
                                }}
                              >
                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                                  {cat.name}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {cat.channels.map((ch) => (
                                    <span
                                      key={ch}
                                      style={{
                                        padding: '3px 9px',
                                        borderRadius: '6px',
                                        background: '#1e2230',
                                        color: idx === 2 && ch.includes('Join') ? '#4ade80' : '#e2e8f0',
                                        fontSize: '12px',
                                      }}
                                    >
                                      {ch}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8' }}>
                        <span>Roles Generated: Admin, Moderator, Tournament Host, Verified</span>
                        <span style={{ color: '#60a5fa', fontWeight: 500 }}>
                          {motionStep === 3 ? '✓ Deployed to Guild' : 'Generating Blueprint...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FEATURE 2: Interactive Giveaways & Custom Embed Studio (GiveawaysPage.tsx Motion Preview) */}
              <div className="feature-item">
                <div className="grid-row">
                  <div className="grid-col col-xs-4 col-sm-8 col-md-4">
                    <div className="feature-copy">
                      <a href={dashboardHref} className="feature-title-link">
                        <h3 className="heading-5 feature-title">
                          {isID ? 'Giveaway interaktif & kustomisasi embed penuh' : 'Higher-level Giveaway & Embed Studio'}
                        </h3>
                      </a>
                      <ScrollRevealText
                        className="body feature-description"
                        text={
                          isID
                            ? 'Rancang giveaway profesional dengan pemilih warna embed (Pick Color), unggah thumbnail & banner gambar, teks footer kustom, serta tombol partisipasi live yang menghitung peserta secara real-time.'
                            : 'Build high-conversion Discord giveaways with an intuitive visual Embed Studio: custom hex color picker, drag-and-drop thumbnail and banner uploads, custom footer branding, and live participation counters.'
                        }
                      />
                    </div>
                  </div>

                  <div className="grid-col col-xs-4 col-sm-8 col-md-7 col-md-offset-1">
                    <div
                      className="feature-media"
                      style={{
                        background: '#0b0d12',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        color: '#e6eaf0',
                      }}
                    >
                      {/* Authentic GiveawaysPage.tsx Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(99,102,241,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>celebration</span>
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>Giveaway Embed</div>
                            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Customize the appearance of the giveaway embed.</div>
                          </div>
                        </div>
                        <span style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(99,102,241,0.16)', color: '#a5b4fc', fontSize: '11px', fontWeight: 500 }}>
                          ● LIVE SYNC
                        </span>
                      </div>

                      {/* Exact 2-Button Pick Color + Swatch Bar + Upload Boxes from GiveawaysPage.tsx */}
                      <div style={{ background: '#13161f', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)', margin: '14px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Embed Color</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                height: '36px',
                                padding: '0 14px',
                                borderRadius: '8px',
                                background: '#6366f1',
                                color: '#fff',
                                fontSize: '12.5px',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>format_color_fill</span>
                              <span>Pick Color</span>
                            </span>
                            <div
                              style={{
                                height: '36px',
                                flex: 1,
                                maxWidth: '220px',
                                borderRadius: '8px',
                                background: ['#2b82d8', '#6366f1', '#10b981', '#f59e0b'][motionStep],
                                transition: 'background 0.45s ease',
                                border: '1px solid rgba(255,255,255,0.15)',
                              }}
                            />
                          </div>
                        </div>

                        {/* Live Discord Giveaway Embed Card */}
                        <div
                          style={{
                            background: '#2b2d31',
                            borderRadius: '10px',
                            borderLeft: `4px solid ${['#2b82d8', '#6366f1', '#10b981', '#f59e0b'][motionStep]}`,
                            padding: '14px',
                            transition: 'border-color 0.45s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '14px', color: '#fff' }}>🎁 Discord Nitro Yearly (2 Winners)</strong>
                            <span style={{ fontSize: '11px', color: '#4ade80' }}>Ends in 23h 59m</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setHasParticipated((p) => !p);
                                setDemoParticipants((c) => (hasParticipated ? c - 1 : c + 1));
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 14px',
                                borderRadius: '7px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '12.5px',
                                background: hasParticipated ? '#34a853' : '#5865f2',
                                color: '#fff',
                              }}
                            >
                              <span>🎉</span>
                              <span>Participate ({demoParticipants + motionStep})</span>
                            </button>
                            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Footer: ArchiBot Giveaways</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                        <span>Thumbnail &amp; Image Upload Ready</span>
                        <span style={{ color: '#a5b4fc' }}>Click Participate button to test</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FEATURE 3: Dynamic Join-to-Create Voice Rooms (VoicePage.tsx Motion Preview) */}
              <div className="feature-item">
                <div className="grid-row">
                  <div className="grid-col col-xs-4 col-sm-8 col-md-4">
                    <div className="feature-copy">
                      <a href={dashboardHref} className="feature-title-link">
                        <h3 className="heading-5 feature-title">
                          {isID ? 'Otonomi penuh dengan Dynamic Voice Rooms' : 'Cross-channel Dynamic Voice autonomy'}
                        </h3>
                      </a>
                      <ScrollRevealText
                        className="body feature-description"
                        text={
                          isID
                            ? 'Hadirkan channel suara sementara otomatis saat member masuk ke channel Master Hub. Member mendapatkan kendali penuh atas kapasitas, kunci ruangan, dan izin—lalu channel dihapus otomatis saat kosong.'
                            : 'Synchronize dynamic Join-to-Create voice hubs across your server. Members automatically spawn personal squad rooms with granular lock and user-limit controls, cleaned up the instant everyone leaves.'
                        }
                      />
                    </div>
                  </div>

                  <div className="grid-col col-xs-4 col-sm-8 col-md-7 col-md-offset-1">
                    <div
                      className="feature-media"
                      style={{
                        background: '#0b0d12',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        color: '#e6eaf0',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(52,168,83,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>graphic_eq</span>
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>Dynamic Voice Engine</div>
                            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>dashboard/src/pages/VoicePage.tsx</div>
                          </div>
                        </div>
                        <span style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(52,168,83,0.16)', color: '#4ade80', fontSize: '11px', fontWeight: 500 }}>
                          ● {motionStep === 3 ? 'Auto-Cleaned Empty Room' : '3 Active Squad Rooms'}
                        </span>
                      </div>

                      <div style={{ background: '#13161f', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)', margin: '14px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'rgba(50,121,249,0.1)', border: '1px solid rgba(50,121,249,0.25)' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#93c5fd' }}>➕ Join to Create Master Hub</span>
                          <span style={{ fontSize: '11px', color: '#60a5fa' }}>Trigger Channel</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '10px', background: '#1a1e2b', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: voiceLocked ? '#f87171' : '#4ade80' }}>
                              {voiceLocked ? 'lock' : 'volume_up'}
                            </span>
                            <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#fff' }}>
                              🎮 Alex&apos;s Squad ({Math.min(voiceLimit, 2 + (motionStep % 3))}/{voiceLimit})
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setVoiceLocked(!voiceLocked)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.12)',
                                background: voiceLocked ? '#ea4335' : '#262b3d',
                                color: '#fff',
                                fontSize: '11.5px',
                                cursor: 'pointer',
                              }}
                            >
                              {voiceLocked ? 'Unlock' : 'Lock'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setVoiceLimit((l) => (l >= 10 ? 3 : l + 1))}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.12)',
                                background: '#262b3d',
                                color: '#e2e8f0',
                                fontSize: '11.5px',
                                cursor: 'pointer',
                              }}
                            >
                              Limit: {voiceLimit}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                        <span>Owner: @alex_dev • Bitrate: 96kbps</span>
                        <span style={{ color: '#4ade80' }}>Zero Orphaned Channels</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FEATURE 4: Welcome Studio, Anti-Raid & Backups (WelcomePage.tsx & BackupsPage.tsx) */}
              <div className="feature-item">
                <div className="grid-row">
                  <div className="grid-col col-xs-4 col-sm-8 col-md-4">
                    <div className="feature-copy">
                      <a href={dashboardHref} className="feature-title-link">
                        <h3 className="heading-5 feature-title">
                          {isID ? 'Proteksi Anti-Raid, CAPTCHA & Snapshot 1-Klik' : 'Zero-Trust Anti-Raid, Welcome Canvas & Snapshots'}
                        </h3>
                      </a>
                      <ScrollRevealText
                        className="body feature-description"
                        text={
                          isID
                            ? 'Sambut member baru dengan kartu visual yang dirender secara dinamis, cegah serangan bot dengan verifikasi CAPTCHA interaktif, dan cadangkan seluruh konfigurasi server ke snapshot JSON kapan saja.'
                            : 'Greet verified newcomers with rendered welcome banners, automatically intercept suspicious join spikes with interactive CAPTCHA challenges, and safeguard your guild with 1-click JSON structure backups.'
                        }
                      />

                      <div className="feature-cta-wrap">
                        <a href={dashboardHref} className="call-to-action button button-secondary">
                          <span>{isID ? 'Jelajahi Semua Modul di Dashboard' : 'Explore All Modules in Dashboard'}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="grid-col col-xs-4 col-sm-8 col-md-7 col-md-offset-1">
                    <div
                      className="feature-media"
                      style={{
                        background: '#0b0d12',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        color: '#e6eaf0',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(234,67,53,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>shield_lock</span>
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>Security, Welcome &amp; Snapshots</div>
                            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>WelcomePage.tsx • BackupsPage.tsx</div>
                          </div>
                        </div>
                        <span style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(52,168,83,0.16)', color: '#4ade80', fontSize: '11px', fontWeight: 500 }}>
                          ● PROTECTED
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '14px 0' }}>
                        {[
                          {
                            icon: 'verified_user',
                            color: '#4ade80',
                            title: 'Interactive CAPTCHA Verification Gate',
                            status: motionStep % 2 === 0 ? 'Active • Verified 1,420 Members' : 'Active • Blocked 14 Raid Bots',
                          },
                          {
                            icon: 'waving_hand',
                            color: '#60a5fa',
                            title: 'Dynamic Welcome Banner & Auto-Role Engine',
                            status: 'Assigns @Community Member on verification',
                          },
                          {
                            icon: 'backup',
                            color: '#fbbc04',
                            title: 'Full Guild JSON Snapshot & 1-Click Restore',
                            status: 'Auto-saved 24 channels, 12 roles & overwrites',
                          },
                        ].map((row) => (
                          <div
                            key={row.title}
                            style={{
                              background: '#13161f',
                              borderRadius: '12px',
                              padding: '12px 14px',
                              border: '1px solid rgba(255,255,255,0.07)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ color: row.color, fontSize: '22px' }}>
                              {row.icon}
                            </span>
                            <div>
                              <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#fff' }}>{row.title}</div>
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{row.status}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                        <span>Snapshot Integrity: SHA-256 Verified</span>
                        <span style={{ color: '#4ade80' }}>Ready for Instant Restore</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 5: USE CASES CAROUSEL (.landing-use-case-section)
            ================================================================== */}
        <section className="landing-use-case-section" id="use-cases-section">
          <div className="grid-container">
            <div className="landing-use-case-header">
              <div className="grid-row" style={{ alignItems: 'flex-end' }}>
                <div className="use-case-header-main grid-col col-xs-4 col-sm-6 col-md-5">
                  <h2 className="heading-3">
                    <span>{isID ? 'Dibangun untuk komunitas' : 'Built for communities'}</span>
                    <span>{isID ? 'di era otonom' : 'of every scale'}</span>
                  </h2>
                </div>
                <div className="grid-col col-xs-4 col-sm-6 col-md-5 col-md-offset-2">
                  <p className="body">
                    {isID
                      ? 'ArchiBot dirancang untuk skalabilitas tinggi—baik Anda memimpin tim esports kompetitif, komunitas developer open-source, maupun ekosistem kreator dengan ratusan ribu anggota.'
                      : 'ArchiBot is engineered for zero-friction scale—whether you are leading a competitive esports hub, an open-source developer community, or a 100,000-member creator network.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Use Case Showcase Card */}
            <div className="grid-row">
              <div className="grid-col col-xs-4 col-sm-8 col-md-12">
                <div
                  className="slide-image-wrapper"
                  style={{
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    color: '#ffffff',
                    background: 'radial-gradient(circle at 85% 20%, #1e293b 0%, #121317 70%)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.1)',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      {USE_CASES[activeUseCase].badge}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {USE_CASES.map((uc, idx) => (
                        <button
                          key={uc.id}
                          type="button"
                          onClick={() => setActiveUseCase(idx)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '999px',
                            border: '1px solid rgba(255,255,255,0.16)',
                            background: activeUseCase === idx ? '#ffffff' : 'transparent',
                            color: activeUseCase === idx ? '#121317' : '#ffffff',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          {uc.title.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    key={USE_CASES[activeUseCase].id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '32px',
                      margin: '32px 0',
                      alignItems: 'center',
                      animation: 'agy-dropdown-fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
                    }}
                  >
                    <div>
                      <h3 className="heading-4" style={{ color: '#ffffff', marginBottom: '16px' }}>
                        {USE_CASES[activeUseCase].title}
                      </h3>
                      <p className="body" style={{ color: '#cdd4dc' }}>
                        {USE_CASES[activeUseCase].summary}
                      </p>
                    </div>

                    <div
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '20px',
                        padding: '24px',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#b2bbc5', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Live Provisioned Channels
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {USE_CASES[activeUseCase].channels.map((ch) => (
                          <div
                            key={ch}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '10px',
                              background: 'rgba(18,19,23,0.75)',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#e6eaf0',
                            }}
                          >
                            {ch}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                    {USE_CASES[activeUseCase].stats.map((st) => (
                      <div key={st.label}>
                        <div style={{ fontSize: '22px', fontWeight: 500, color: '#ffffff' }}>{st.value}</div>
                        <div style={{ fontSize: '13px', color: '#b2bbc5' }}>{st.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slider Copy & Prev/Next Controls */}
                <div className="slider-copy-wrapper">
                  <div>
                    <h4 className="heading-7" style={{ marginBottom: '6px' }}>
                      {USE_CASES[activeUseCase].title}
                    </h4>
                    <p className="body" style={{ color: '#45474d', maxWidth: '640px', marginBottom: '12px' }}>
                      {USE_CASES[activeUseCase].summary}
                    </p>
                    <a href={dashboardHref} className="call-to-action arrow-link">
                      <span>{isID ? 'Gunakan template ini di Dashboard' : 'Deploy this template in Dashboard'}</span>
                    </a>
                  </div>

                  <div className="slider-controls">
                    <button
                      type="button"
                      className="slider-control-button"
                      aria-label="Previous slide"
                      disabled={activeUseCase === 0}
                      onClick={() => setActiveUseCase((prev) => Math.max(0, prev - 1))}
                    >
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <button
                      type="button"
                      className="slider-control-button"
                      aria-label="Next slide"
                      disabled={activeUseCase === USE_CASES.length - 1}
                      onClick={() => setActiveUseCase((prev) => Math.min(USE_CASES.length - 1, prev + 1))}
                    >
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 6: LATEST BLOGS (.landing-latest-blogs)
            Placeholder Images + Lorem Ipsum + Horizontal Slider Controls
            ================================================================== */}
        <section className="landing-latest-blogs" id="latest-blogs">
          <div className="grid-container">
            <div className="landing-latest-blogs-header">
              <h2 className="heading-5">Latest Blogs</h2>
              <a href={dashboardHref} className="button button-secondary">
                <span>View blog</span>
              </a>
            </div>

            <div className="blogs-slider-viewport">
              <div
                className="blogs-slider-track"
                style={{
                  transform: `translate3d(calc(-${blogSlideIndex} * ((100% + var(--grid-gutter)) / ${visibleBlogCols})), 0, 0)`,
                }}
              >
                {LATEST_BLOGS.map((blog, idx) => (
                  <a key={idx} href={dashboardHref} className="list-item">
                    <div className="list-image-wrapper">
                      {/* Clean Architectural Placeholder Image */}
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #f0f2f7 0%, #e4e8f0 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          color: '#8a92a6',
                          gap: '10px',
                          position: 'relative',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '42px', fontWeight: 300 }}>
                          image
                        </span>
                        <span className="small" style={{ color: '#6b7280' }}>
                          Placeholder Image
                        </span>
                      </div>
                    </div>
                    <div className="list-item-content">
                      <h3 className="heading-7 item-title">{blog.title}</h3>
                      <div className="list-item-metadata caption">
                        <time>{blog.date}</time>
                        <span>{blog.category}</span>
                      </div>
                      <span className="call-to-action--nav arrow-link" style={{ marginTop: '4px' }}>
                        <span>Read blog</span>
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="blogs-slider-footer">
              <div className="slider-controls">
                <button
                  type="button"
                  className="slider-control-button"
                  aria-label="Previous blogs"
                  disabled={blogSlideIndex <= 0}
                  onClick={() => setBlogSlideIndex((prev) => Math.max(0, prev - 1))}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <button
                  type="button"
                  className="slider-control-button"
                  aria-label="Next blogs"
                  disabled={blogSlideIndex >= maxBlogSlide}
                  onClick={() => setBlogSlideIndex((prev) => Math.min(maxBlogSlide, prev + 1))}
                >
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 7: DARK CTA BANNER (.download-section-container)
            Single Primary CTA ("Interactive Studio Demo" Removed)
            ================================================================== */}
        <section className="download-section-container" id="download-section">
          <div className="grid-container">
            <div className="download-section">
              <div className="download-section-backdrop">
                <AntigravityParticles theme="dark" variant="ring" density={160} />
              </div>

              <div className="download-section-content">
                <h2 className="heading-2 download-section-title">
                  {isID
                    ? 'Luncurkan ArchiBot untuk server Discord Anda'
                    : 'Deploy ArchiBot for your Discord server'}
                </h2>

                <div className="download-section-cta">
                  <a href={dashboardHref} className="call-to-action button button-primary-inverse">
                    <DiscordMark className="w-5 h-5" />
                    <span>
                      {user
                        ? isID
                          ? 'Buka Dashboard'
                          : 'Open Dashboard'
                        : isID
                        ? 'Masuk dengan Discord'
                        : 'Sign in with Discord'}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ====================================================================
          SECTION 8: FOOTER & GIANT CENTERED "ARCHIBOT" WORDMARK
          ==================================================================== */}
      <footer className="footer">
        <div className="grid-container">
          <div className="footer-main-content">
            <div className="footer-liftoff-col">
              <h2 className="footer-liftoff-title">
                Experience liftoff
              </h2>
            </div>

            <div className="footer-links-col">
              <div className="footer-links-grid">
                <div className="footer-column">
                  <span className="footer-column-heading">Product</span>
                  <nav className="footer-column-nav">
                    <a href="#feature-explorer" className="footer-link-item">Product</a>
                    <a href={dashboardHref} className="footer-link-item">Download</a>
                    <a href="#feature-explorer" className="footer-link-item">ArchiBot App</a>
                    <a href="#feature-explorer" className="footer-link-item">ArchiBot Extensions</a>
                    <a href="#feature-explorer" className="footer-link-item">ArchiBot CLI</a>
                    <a href="#feature-explorer" className="footer-link-item">ArchiBot IDE</a>
                    <a href="#feature-explorer" className="footer-link-item">ArchiBot SDK</a>
                  </nav>
                </div>

                <div className="footer-column">
                  <span className="footer-column-heading">Resources</span>
                  <nav className="footer-column-nav">
                    <a href="#feature-explorer" className="footer-link-item">Docs</a>
                    <a href="#latest-blogs" className="footer-link-item">Changelog</a>
                    <a href="#latest-blogs" className="footer-link-item">Releases</a>
                    <a href="#latest-blogs" className="footer-link-item">Blog</a>
                    <a href="#latest-blogs" className="footer-link-item">Newsletter</a>
                    <a href={dashboardHref} className="footer-link-item">Pricing</a>
                    <a href="#use-cases-section" className="footer-link-item">Use Cases</a>
                    <a href="#latest-blogs" className="footer-link-item">Press</a>
                  </nav>
                </div>
              </div>
            </div>
          </div>

          {/* Giant Full-Bleed Centered "ArchiBot" CamelCase Wordmark */}
          <div className="footer-img-container grid-row">
            <div className="grid-col col-xs-4 col-sm-8 col-md-12">
              <div id="antigravity-footer-wrapper" ref={footerWordmarkRef}>
                <svg
                  className="footer-antigravity"
                  viewBox="0 0 1080 230"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="ArchiBot"
                >
                  <text
                    x="50%"
                    y="185"
                    textAnchor="middle"
                    fill="#121317"
                    style={{
                      fontFamily: "'Google Sans Flex', 'Google Sans', sans-serif",
                      fontSize: '250px',
                      fontWeight: 500,
                      letterSpacing: '-0.02em',
                      fontVariationSettings: '"wdth" 100, "wght" 500, "opsz" 144',
                      userSelect: 'none',
                    }}
                  >
                    ArchiBot
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom Legal / Brand Bar (Pure ArchiBot) */}
          <div className="footer-google-links grid-row" style={{ alignItems: 'center' }}>
            <div className="grid-col col-xs-4 col-sm-3 col-md-5">
              <Link to="/" className="footer-google-logo" aria-label="ArchiBot">
                <ArchiBrandMark size={20} />
                <span>ArchiBot</span>
              </Link>
            </div>
            <div className="footer-google-nav grid-col col-xs-4 col-sm-5 col-md-7">
              <a href="#hero" className="caption">
                <span>About ArchiBot</span>
              </a>
              <a href="#feature-explorer" className="caption">
                <span>Modules</span>
              </a>
              <a href={dashboardHref} className="caption">
                <span>Web Studio</span>
              </a>
              <a href="#latest-blogs" className="caption">
                <span>Privacy &amp; Security</span>
              </a>
              <a href="#latest-blogs" className="caption">
                <span>Terms</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
