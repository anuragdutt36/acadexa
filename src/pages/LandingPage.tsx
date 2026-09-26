import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import {
  ShieldCheck,
  UserCheck,
  Lock,
  BarChart3,
  Layers,
  ChevronDown,
  Mail,
  ArrowUpRight,
  GraduationCap,
  Calendar,
  Info,
  Building2,
  ArrowRight
} from "lucide-react";
import { useSettings } from "../context/SettingsContext.js";
import { useTenant } from "../context/TenantContext.js";
import { getFormattedLogoUrl } from "../services/api.js";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { systemName, instituteName, logoUrl: globalLogoUrl } = useSettings();
  const { institution: tenantInst, loading: tenantLoading, error: tenantError, isSuspended, portalSlug } = useTenant();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Extract campus images strictly from tenant institution
  const tenantCampusImages = tenantInst?.settings?.campusImages || [];
  const tenantSingle = tenantInst?.settings?.campusImageUrl;

  const imagesToRender = useMemo(() => {
    if (tenantCampusImages.length > 0) {
      return tenantCampusImages.map(img => getFormattedLogoUrl(img.url)).filter(Boolean);
    }
    if (tenantSingle) {
      return [getFormattedLogoUrl(tenantSingle)].filter(Boolean);
    }
    return [];
  }, [tenantCampusImages, tenantSingle]);

  // Preload Cloudinary images into browser cache to prevent white flashes or unloaded frames
  useEffect(() => {
    imagesToRender.forEach(src => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [imagesToRender]);

  // Detect OS prefers-reduced-motion setting for accessibility
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  // Automatic 5-second slideshow index with 1.8s crossfade transition
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    if (imagesToRender.length <= 1) {
      setActiveSlideIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % imagesToRender.length);
    }, 5000); // 5 seconds per slide

    return () => clearInterval(timer);
  }, [imagesToRender.length]);

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Loading institution portal details...</p>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center p-6 text-center text-white font-sans">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Portal Access Suspended</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Access to this institution portal has been temporarily suspended by platform administration.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold no-underline transition-all"
        >
          Return to Platform Home
        </Link>
      </div>
    );
  }

  if (!tenantInst) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center p-6 text-center text-white font-sans">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20 mb-3 uppercase tracking-wider">
          Portal Not Available
        </span>
        <h1 className="text-2xl font-bold mb-2">Institution Portal Not Found or Not Approved</h1>
        <p className="text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
          {tenantError || `The institution portal '/${portalSlug}' does not exist, has been removed by platform administrators, or is pending verification.`}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register-institution"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold no-underline transition-all shadow-lg shadow-blue-600/20"
          >
            Register Institution Application
          </Link>
          <Link
            to="/application-status"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold no-underline transition-all"
          >
            Check Application Status
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold no-underline transition-all"
          >
            Platform Landing Page
          </Link>
        </div>
      </div>
    );
  }

  const instName = tenantInst?.name || instituteName || "Institution";
  const supportEmail = tenantInst?.officialEmail || (portalSlug ? `support@${portalSlug}.ac.in` : "support@acadexa.in");
  const logoUrl = getFormattedLogoUrl(tenantInst?.logoUrl || tenantInst?.settings?.logoUrl || "");

  const getLoginPath = () => {
    const currentPath = location.pathname.toLowerCase();
    if (currentPath.startsWith("/college/") && !currentPath.endsWith("/login")) {
      return `${location.pathname}/login`;
    } else if (currentPath === "/knit") {
      return "/knit/login";
    } else if (currentPath === "/college-portal") {
      return "/college-portal/login";
    }
    return "/login";
  };

  const workflowSteps = [
    {
      step: "01",
      title: "Sign In",
      subtitle: "Google SSO Verification",
      desc: "Authenticate securely using your official institutional Google account. Eligibility and course rosters are mapped automatically.",
      icon: UserCheck
    },
    {
      step: "02",
      title: "Evaluate",
      subtitle: "Structured Ratings",
      desc: "Provide objective ratings on course coverage, teaching methodology, and academic support across registered subjects.",
      icon: Layers
    },
    {
      step: "03",
      title: "Submit Confidentially",
      subtitle: "Privacy Preserved",
      desc: "Submissions verify completion eligibility while guaranteeing individual identity privacy before database storage.",
      icon: Lock
    },
    {
      step: "04",
      title: "Academic Review",
      subtitle: "Continuous Improvement",
      desc: "Aggregated reports are reviewed by Department HODs and Deans to strengthen institutional academic quality.",
      icon: BarChart3
    }
  ];

  const studentFaqs = [
    {
      q: "Is student feedback confidential?",
      a: "Yes. Your authentication verifies eligibility and ensures one submission per student. Individual responses are anonymized before storage so instructors and administrators only review aggregate department trends."
    },
    {
      q: "Who can submit feedback?",
      a: "All active students currently enrolled in the institution with official institutional accounts can submit evaluations for their assigned courses."
    },
    {
      q: "When can I submit feedback?",
      a: "Feedback can be submitted during active evaluation windows configured by the Academic Council. Active sessions and deadlines are displayed on this portal when open."
    },
    {
      q: "How is feedback used by the institution?",
      a: "Aggregated feedback reports assist HODs, Deans, and the Academic Council in identifying teaching excellence, enhancing course delivery, and maintaining accreditation standards."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col justify-between">
      {isSuspended && (
        <div className="bg-[#D93025] text-white px-4 py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 border-b border-red-700">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>Notice: Portal evaluation services for this institution are currently suspended by platform administration.</span>
        </div>
      )}

      {/* Official Institution Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Institution Logo & Branding */}
          <Link to={location.pathname} className="flex items-center gap-3 shrink-0 no-underline">
            {logoUrl ? (
              <img src={logoUrl} alt={instName} className="h-9 w-auto object-contain max-w-[140px]" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#0B3D91] flex items-center justify-center text-white shadow-xs">
                <GraduationCap size={20} />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-slate-900 text-sm sm:text-base leading-tight">
                {instName}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Powered by Acadexa
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#home" className="hover:text-[#0B3D91] transition-colors">Home</a>
            <a href="#notice" className="hover:text-[#0B3D91] transition-colors">Feedback Window</a>
            <a href="#workflow" className="hover:text-[#0B3D91] transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-[#0B3D91] transition-colors">FAQ &amp; Support</a>
          </nav>

          {/* Right Action: Single Access Entry Point */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate(getLoginPath())}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B3D91] hover:bg-[#082d6c] text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Access Portal</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center w-full">
        {/* HERO SECTION WITH DYNAMIC CAMPUS ATMOSPHERE SLIDESHOW */}
        <section id="home" className="w-full relative overflow-hidden bg-slate-900 text-white min-h-[calc(100vh-65px)] py-16 sm:py-24 flex items-center justify-center scroll-mt-16">
          {/* Stable Layered Atmosphere Slideshow Background (1–3 images, ~15-22% opacity effect, ~6-12px blur, 1.8s opacity crossfade) */}
          {imagesToRender.length > 0 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
              {imagesToRender.map((imgSrc, idx) => {
                const isActive = idx === activeSlideIndex;
                return (
                  <div
                    key={imgSrc + idx}
                    className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <img
                      src={imgSrc}
                      alt={`Campus background atmosphere ${idx + 1}`}
                      className="w-full h-full object-cover blur-[8px] saturate-[0.8] scale-105"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* WCAG AAA Compliant Gradient Scrim & Overlay (this gives the image the 60-70% dark overlay and leaves 15-22% visibility) */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900/85 pointer-events-none z-0" />

          {/* Hero Foreground Content */}
          <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-6">
            {/* Institution Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-semibold text-white/90">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{instName}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/80">Powered by Acadexa</span>
            </div>

            {/* Main Title */}
            <h1
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Acadexa &amp; Evaluation Portal
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              A secure digital platform for students to submit structured academic feedback, helping strengthen teaching methodology, course delivery, and educational quality.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2 w-full max-w-sm sm:max-w-none">
              <button
                type="button"
                onClick={() => navigate(getLoginPath())}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0B3D91] hover:bg-[#0a348a] text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-blue-400/30"
              >
                <span>Access Portal &amp; Submit Feedback</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Quick Session Indicator */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                100% Confidential Evaluation
              </span>
              <span className="flex items-center gap-1.5">
                <UserCheck size={14} className="text-blue-400" />
                Institutional SSO Authenticated
              </span>
            </div>
          </div>
        </section>

        {/* ABOUT / PURPOSE SECTION */}
        <section className="w-full bg-slate-50 border-b border-slate-200 py-12">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <h2 className="text-xs font-bold text-[#0B3D91] uppercase tracking-wider mb-2">
              Institutional Quality Assurance
            </h2>
            <h3
              className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Purpose of Academic Feedback
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Student feedback provides valuable insight into teaching effectiveness, course delivery, and academic support. This portal enables structured and confidential evaluation while helping the institution continuously improve academic quality and maintain accreditation standards.
            </p>
          </div>
        </section>

        {/* DYNAMIC ACTIVE SESSION STATUS / FEEDBACK WINDOW SECTION */}
        <section id="notice" className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-16 sm:scroll-mt-20 border-b border-slate-100">
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0B3D91] border border-blue-100 flex items-center justify-center shrink-0 mt-1">
                <Calendar size={24} />
              </div>
              <div>
                {tenantInst?.activeSession ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      ACTIVE SESSION
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      Faculty Evaluation
                      <br />
                      <span className="text-[#0B3D91]">{tenantInst.activeSession.name}</span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xl">
                      Evaluation window is currently open.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      NO ACTIVE SESSION
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      There is currently no live faculty evaluation session.
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xl">
                      The institution has not opened an evaluation window at this time.
                    </p>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(getLoginPath())}
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] text-white font-semibold text-xs sm:text-sm transition-all shrink-0 cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <span>{tenantInst?.activeSession ? "Access Portal" : "Access Portal"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="workflow" className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-16 sm:scroll-mt-20 border-b border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2
              className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Evaluation Process &amp; Workflow
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              A streamlined 4-step evaluation process ensuring complete confidentiality and structured governance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className="rounded-2xl p-6 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-extrabold text-slate-300" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {step.step}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B3D91]">
                        <Icon size={18} />
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-[#0B3D91] uppercase tracking-wider mb-1">
                      {step.subtitle}
                    </div>
                    <h3 className="text-slate-900 font-bold text-base mb-2 leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {step.title}
                    </h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Step {idx + 1} of 4
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section id="faq" className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-16 sm:scroll-mt-20 text-left">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2
              className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Clear information regarding evaluation schedules, confidentiality, and procedures.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3 mb-10">
            {studentFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span
                      className="font-bold text-slate-900 text-sm sm:text-base leading-snug"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#0B3D91]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Support Banner */}
          <div className="max-w-3xl mx-auto rounded-2xl p-5 bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B3D91] flex items-center justify-center shrink-0 border border-blue-100">
                <Mail size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Academic Support Helpdesk</h4>
                <p className="text-xs text-slate-500 mt-0.5">Contact technical &amp; academic coordinators</p>
              </div>
            </div>
            <a
              href={`mailto:${supportEmail}`}
              className="px-5 py-2.5 rounded-lg bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 shrink-0 no-underline"
            >
              <span>{supportEmail}</span>
              <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
      </main>

      {/* Official Academic Institution Footer */}
      <footer className="w-full bg-slate-50 border-t border-slate-200 pt-8 pb-6 text-slate-600 text-xs mt-auto">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={instName} className="h-7 w-auto object-contain" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#0B3D91] flex items-center justify-center text-white shadow-xs">
                  <GraduationCap size={16} />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-sm">
                  {instName}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Powered by Acadexa
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-slate-600 text-xs font-semibold">
              <a href="#home" className="hover:text-[#0B3D91] transition-colors no-underline text-inherit">Home</a>
              <a href="#workflow" className="hover:text-[#0B3D91] transition-colors no-underline text-inherit">How It Works</a>
              <a href="#faq" className="hover:text-[#0B3D91] transition-colors no-underline text-inherit">FAQ</a>
              <button
                type="button"
                onClick={() => navigate(getLoginPath())}
                className="hover:text-[#0B3D91] transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit font-semibold text-xs"
              >
                Access Portal
              </button>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-[11px]">
            <p>© {new Date().getFullYear()} {instName}. Powered by Acadexa. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <span>Acadexa Platform</span>
              <span>•</span>
              <span>Confidential Academic Evaluation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
