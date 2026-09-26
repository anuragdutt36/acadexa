import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Shield,
  Lock,
  UserCheck,
  BarChart3,
  Layers,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Clock,
  Bell,
  Building2,
  Users,
  GraduationCap,
  Smartphone,
  Server,
  KeyRound,
  EyeOff,
  HelpCircle,
  Mail,
  ChevronDown,
  Award,
  Zap,
  Check,
  ShieldCheck,
  Send,
  X,
  User
} from "lucide-react";
import { InstitutionRegistrationModal } from "../components/platform/InstitutionRegistrationModal.js";

export const PlatformLandingPage: React.FC = () => {
  const navigate = useNavigate();

  // State for modals & interactive components
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<"students" | "faculty" | "hod" | "admin">("students");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const corePillars = [
    {
      icon: EyeOff,
      title: "100% Cryptographic Anonymity",
      description:
        "Student identities are irreversibly decoupled from survey evaluations using cryptographic token dispersion. Responses cannot be traced to any individual."
    },
    {
      icon: Building2,
      title: "Multi-Campus & College Portals",
      description:
        "Easily configure dedicated institutional subdomains, custom branding, departmental hierarchies, and independent evaluation workflows for colleges."
    },
    {
      icon: KeyRound,
      title: "Institutional SSO & Authentication",
      description:
        "Secure Google Workspace and institutional Single Sign-On. Verifies active student enrollment while preventing duplicate submissions."
    },
    {
      icon: Layers,
      title: "Semester & Academic Mapping",
      description:
        "Granular mapping of academic sessions, programs (UG/PG), departments, semester schemes, sections, subjects, and multiple faculty instructors."
    },
    {
      icon: Clock,
      title: "Automated Feedback Windows",
      description:
        "Schedule time-bounded evaluation windows with automated start/stop triggers, live participation meters, and selective student cohort rules."
    },
    {
      icon: BarChart3,
      title: "Accreditation Reports & Analytics",
      description:
        "Compute cumulative performance indexes, parameter breakdowns, sentiment distributions, and one-click NAAC/NBA formatted PDF/Excel exports."
    },
    {
      icon: Bell,
      title: "Intelligent Notifications",
      description:
        "Automated alerts for session announcements, pending evaluation reminders, low-turnout escalations, and report publication."
    },
    {
      icon: Shield,
      title: "Role-Based Access Control",
      description:
        "Strict 5-tier role separation: Super Admin, Institutional Administrator, Academic Dean/HOD, Faculty Member, and Anonymous Student Evaluator."
    },
    {
      icon: Smartphone,
      title: "Responsive Multi-Device UI",
      description:
        "Engineered for smartphones, tablets, and desktops. Clean, high-performance interface optimized for swift mobile completion."
    },
    {
      icon: Server,
      title: "Cloud Infrastructure & Security",
      description:
        "High-availability architecture, TLS 1.3 encrypted data in transit, AES-256 encrypted storage at rest, and audit logs for statutory compliance."
    }
  ];

  const rolePreviews = {
    students: {
      title: "Student Experience",
      subtitle: "Effortless, Fast, and 100% Confidential Feedback",
      description:
        "Students access a clean, uncluttered portal using their official college email. Evaluation forms automatically show assigned professors and enrolled subjects. Takes under 3 minutes with guaranteed anonymity.",
      features: [
        "One-click institutional Google SSO login",
        "Automatic discovery of registered courses & faculty",
        "Intuitive Likert rating scales + constructive remarks",
        "Confidentiality verification badge",
        "Instant progress bar & one-time submission lock"
      ],
      badge: "Zero Identity Exposure",
      stats: [
        { value: "< 3 min", label: "Average Time" },
        { value: "100%", label: "Anonymity" },
        { value: "98.4%", label: "Satisfaction" }
      ]
    },
    faculty: {
      title: "Faculty Insights",
      subtitle: "Actionable Feedback to Drive Teaching Excellence",
      description:
        "Educators receive constructive, aggregated performance metrics without raw identifying data. Multi-metric scoring highlights pedagogical strengths and growth opportunities.",
      features: [
        "Aggregated average score across standard parameters",
        "Subject-by-subject comparative analysis",
        "Categorized qualitative student commentary themes",
        "Semester-over-semester growth trend lines",
        "Private self-appraisal & accreditation portfolios"
      ],
      badge: "Pedagogical Excellence",
      stats: [
        { value: "12+", label: "Evaluation Dimensions" },
        { value: "100%", label: "Privacy Preserved" },
        { value: "Instant", label: "Report Availability" }
      ]
    },
    hod: {
      title: "HOD & Dean Leadership",
      subtitle: "Comprehensive Department-Wide Quality Governance",
      description:
        "Department heads gain birds-eye visibility into teaching effectiveness across all semesters, sections, and subjects. Generate accreditation-ready files in one click.",
      features: [
        "Department-level average feedback scores & heatmaps",
        "Faculty performance distribution and percentile ranking",
        "Real-time session participation & response-rate monitoring",
        "One-click official NAAC / NBA formatted PDF reports",
        "Targeted academic improvement action planning"
      ],
      badge: "Accreditation Ready",
      stats: [
        { value: "1-Click", label: "NAAC/NBA Export" },
        { value: "Real-Time", label: "Turnout Tracking" },
        { value: "100%", label: "Audit Accuracy" }
      ]
    },
    admin: {
      title: "Institutional Administrator",
      subtitle: "Complete Control Over Academic Sessions & Portals",
      description:
        "University and college administrators can configure academic years, import student masterlists, configure dynamic question banks, and orchestrate evaluation cycles seamlessly.",
      features: [
        "Flexible academic structure: Degrees, Branches, Semesters",
        "Bulk CSV student & faculty roster ingestion",
        "Customizable question categories & weightage rubrics",
        "Automated evaluation session scheduling & auto-lock",
        "Tamper-proof audit logs & role permission management"
      ],
      badge: "Enterprise Governance",
      stats: [
        { value: "5-Tier", label: "Granular RBAC" },
        { value: "Automated", label: "Lifecycle Scheduling" },
        { value: "Multi-Dept", label: "Hierarchical Support" }
      ]
    }
  };

  const workflowSteps = [
    {
      step: "01",
      title: "Academic Structure Setup",
      subtitle: "Academic Mapping",
      desc: "Define departments, semesters, subjects, and map faculty instructors. Import student rosters effortlessly via spreadsheet or SIS sync.",
      icon: Layers
    },
    {
      step: "02",
      title: "Launch Evaluation Session",
      subtitle: "Evaluation Window",
      desc: "Configure the active session window, set question weightages, and activate automated notifications for students across targeted cohorts.",
      icon: Clock
    },
    {
      step: "03",
      title: "Anonymous Student Submission",
      subtitle: "Zero Traceability",
      desc: "Students log in via institutional email, rate faculty on key pedagogical metrics, and submit with guaranteed cryptographic decoupling.",
      icon: EyeOff
    },
    {
      step: "04",
      title: "Instant Reports & Analytics",
      subtitle: "Accreditation Dossiers",
      desc: "Immediate aggregation of scores into executive dashboards, faculty scorecards, and NAAC/NBA compliance documentation.",
      icon: BarChart3
    }
  ];

  const faqs = [
    {
      q: "How does Acadexa guarantee student anonymity?",
      a: "Acadexa separates student identity from feedback payloads before database persistence. When a student logs in, their token verifies enrollment eligibility and flags their one-time submission token without storing any link between their user record and their individual rating scores or written comments."
    },
    {
      q: "Can our university host distinct portals for multiple constituent colleges?",
      a: "Yes. The platform is architected for multi-tenant and multi-college deployments. Each constituent college or campus can operate with custom branding, separate faculty hierarchies, individual academic sessions, and localized administrator controls."
    },
    {
      q: "What authentication methods are supported for students and faculty?",
      a: "The system natively supports Google Workspace institutional Single Sign-On (SSO), domain-restricted OAuth 2.0, as well as role-based credential logins for administrators and faculty with secure salted hashing."
    },
    {
      q: "Does the system generate reports compliant with NAAC, NBA, or NIRF?",
      a: "Yes. All aggregated feedback scores are formatted according to standard higher education quality assurance frameworks. Administrators can export department-wide, course-wise, and faculty-wise evaluation reports in PDF and Excel formats in one click."
    },
    {
      q: "Can we customize question sets for different departments or course types?",
      a: "Absolutely. The administrative question bank allows defining distinct question rubrics for theory courses, laboratory sessions, electives, and clinical/project work with customizable rating scales and qualitative prompts."
    },
    {
      q: "How does the platform handle high concurrent traffic during feedback deadlines?",
      a: "The platform uses lightweight, optimized microservices and scalable cloud databases designed to handle thousands of concurrent student evaluations without degradation or slowdown."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#0B3D91] flex items-center justify-center text-white shadow-xs">
              <GraduationCap size={18} />
            </div>
            <div>
              <span className="font-bold tracking-tight text-slate-900 text-sm sm:text-base">
                Acadexa
              </span>
            </div>
          </Link>

          {/* Simple Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-600">
            <a href="#features" className="hover:text-[#0B3D91] transition-colors">
              Platform Features
            </a>
            <a href="#workflow" className="hover:text-[#0B3D91] transition-colors">
              Workflow
            </a>
            <a href="#security" className="hover:text-[#0B3D91] transition-colors">
              Security &amp; NAAC
            </a>
            <a href="#faq" className="hover:text-[#0B3D91] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Links */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate("/application-status")}
              className="text-xs font-semibold text-slate-700 hover:text-[#0B3D91] px-2.5 py-1.5 transition-colors cursor-pointer bg-transparent border-0"
            >
              Track Application
            </button>

            <button
              type="button"
              onClick={() => navigate("/institution-login")}
              className="text-xs font-semibold text-slate-700 hover:text-[#0B3D91] px-2.5 py-1.5 transition-colors cursor-pointer bg-transparent border-0"
            >
              Institution Login
            </button>

            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B3D91] hover:bg-[#082d6c] text-white shadow-xs transition-all cursor-pointer"
            >
              Register Institution
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center w-full">
        {/* HERO SECTION */}
        <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] pt-12 pb-24 flex flex-col items-center justify-center gap-6 sm:gap-8 text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#0B3D91] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Acadexa — Multi-Institution Academic Platform</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 font-normal">NAAC &amp; NBA Aligned</span>
          </div>

          {/* Title */}
          <h1
            className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-[1.18]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Transform Student Feedback into Accreditation-Ready Reports
          </h1>

          {/* Description */}
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
            Automate confidential faculty evaluations, streamline compliance data, and empower your academic council with actionable institutional insights.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md sm:max-w-none">
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#0B3D91] hover:bg-[#082d6c] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 size={16} />
              <span>Register Your Institution</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/institution-login")}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 size={16} className="text-slate-500" />
              <span>Institution Login</span>
            </button>
          </div>

          {/* Metrics Banner */}
          <div className="w-full max-w-5xl mx-auto rounded-xl bg-slate-50 border border-slate-200/80 p-5 sm:p-8 flex items-center justify-between gap-4 overflow-x-auto text-center">
            <div className="flex-1 min-w-[140px]">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>100%</div>
              <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mt-1">
                Cryptographic Anonymity
              </div>
            </div>
            <div className="flex-1 min-w-[140px]">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>&lt; 3 min</div>
              <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mt-1">
                Avg Submission Time
              </div>
            </div>
            <div className="flex-1 min-w-[140px]">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Multi-Tenant</div>
              <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mt-1">
                Isolated College Portals
              </div>
            </div>
            <div className="flex-1 min-w-[140px]">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>NAAC / NBA</div>
              <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mt-1">
                Compliance Ready
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: CORE PLATFORM CAPABILITIES */}
        <section id="features" className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-14 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2
              className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Engineered for Institutional Trust &amp; Performance
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Every feature of Acadexa is designed to solve real-world university governance challenges:
              ensuring high student turnout, guaranteeing absolute privacy, and providing transparent academic insights.
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="w-full">
            {/* Top Row: Two Large Core Capabilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-10 sm:mb-12">
              {/* Card 1: Cryptographic Anonymity */}
              <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 text-left hover:border-blue-400 hover:shadow-lg transition-all group">
                <div className="absolute -top-12 -right-12 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 pointer-events-none">
                  <ShieldCheck size={200} className="text-[#0B3D91]" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B3D91]">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      100% Cryptographic Anonymity
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed max-w-[85%]">
                      Mathematical guarantees that raw identifying data is never stored alongside feedback scores.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Accreditation Reports */}
              <div className="relative overflow-hidden rounded-2xl bg-[#0B3D91] border border-[#0A3278] p-6 sm:p-8 text-left shadow-lg hover:shadow-xl transition-all group">
                <div className="absolute -bottom-10 -right-10 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:-translate-y-2 duration-500 pointer-events-none">
                  <BarChart3 size={200} className="text-white" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Accreditation Reports & Analytics
                    </h3>
                    <p className="text-blue-100 text-sm leading-relaxed max-w-[85%]">
                      One-click generation of NAAC and NBA formatted qualitative and quantitative analytics.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Minimalist Inline List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 sm:gap-y-8 sm:gap-x-12 text-left max-w-5xl mx-auto">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#0B3D91] shrink-0 mt-0.5">
                  <Building2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Multi-Campus Portals</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">Independent workflows for specific colleges.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#0B3D91] shrink-0 mt-0.5">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Institutional SSO</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">Secure login restricting unauthorized access.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#0B3D91] shrink-0 mt-0.5">
                  <Layers size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Academic Mapping</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">Map semesters, branches, and subject faculty.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#0B3D91] shrink-0 mt-0.5">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Automated Windows</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">Time-bounded evaluation schedules and triggers.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#0B3D91] shrink-0 mt-0.5">
                  <Bell size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Intelligent Alerts</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">Automated low-turnout escalations and reports.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#0B3D91] shrink-0 mt-0.5">
                  <Shield size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Role-Based Control</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">Strict 5-tier hierarchical access separation.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: STAKEHOLDER EXPERIENCES */}
        <section id="experiences" className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-14 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2
              className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Purpose-Built Interfaces for Every Stakeholder
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Explore how students, faculty members, department heads, and institutional admins interact with dedicated
              portals tailored to their specific responsibilities.
            </p>
          </div>

          {/* Segmented Tab Bar */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex p-1 bg-slate-100 rounded-lg max-w-full overflow-x-auto gap-1 border border-slate-200">
              {(
                [
                  { id: "students", label: "Students", icon: GraduationCap },
                  { id: "faculty", label: "Faculty", icon: UserCheck },
                  { id: "hod", label: "HOD & Deans", icon: Building2 },
                  { id: "admin", label: "Administrators", icon: Shield }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveRoleTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${activeRoleTab === tab.id
                    ? "bg-white text-[#0B3D91] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab Preview Display Card */}
          <div className="rounded-xl p-6 sm:p-8 bg-slate-50 border border-slate-200 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* Left Column: Details */}
              <div className="lg:col-span-7 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-[#0B3D91] border border-blue-100">
                    {rolePreviews[activeRoleTab].badge}
                  </span>
                  <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                    {rolePreviews[activeRoleTab].title}
                  </span>
                </div>

                <h3
                  className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {rolePreviews[activeRoleTab].subtitle}
                </h3>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {rolePreviews[activeRoleTab].description}
                </p>

                <div className="space-y-2 pt-1">
                  {rolePreviews[activeRoleTab].features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={10} />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/institution-login")}
                    className="px-4 py-2 rounded-lg bg-[#0B3D91] hover:bg-[#082d6c] text-white font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <span>Access Role Portal</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDemoModal(true)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-white bg-transparent font-semibold text-xs transition-all cursor-pointer"
                  >
                    Request Walkthrough
                  </button>
                </div>
              </div>

              {/* Right Column: Clean Preview Box */}
              <div className="lg:col-span-5 space-y-3">
                <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Stakeholder Metrics</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Verified Active</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {rolePreviews[activeRoleTab].stats.map((st) => (
                      <div key={st.label} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <div
                          className="text-base font-extrabold text-slate-900"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {st.value}
                        </div>
                        <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider leading-tight mt-0.5">
                          {st.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-[#0B3D91] leading-relaxed flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#0B3D91] shrink-0" />
                    <span>Zero personal data retention across evaluations. Cryptographic decoupling.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: WORKFLOW */}
        <section id="workflow" className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-14 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2
              className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              From Academic Mapping to Accreditation in 4 Steps
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Automated end-to-end evaluation cycle that replaces manual paper surveys and error-prone spreadsheets with
              a tamper-resistant, real-time feedback pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className="rounded-xl p-5 bg-white border border-slate-200 flex flex-col justify-between hover:border-blue-300 transition-all shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <span
                        className="text-2xl font-black text-slate-300"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {step.step}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-[#0B3D91] flex items-center justify-center">
                        <Icon size={16} />
                      </div>
                    </div>

                    <div className="text-[10px] text-[#0B3D91] font-bold uppercase tracking-wider mb-1">
                      {step.subtitle}
                    </div>

                    <h3
                      className="text-slate-900 font-bold text-sm sm:text-base mb-1.5 leading-snug"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {step.title}
                    </h3>

                    <p className="text-slate-600 text-xs leading-relaxed font-normal">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 uppercase font-semibold">
                    Stage {idx + 1} of 4
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 4: SECURITY & NAAC */}
        <section id="security" className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-14 border-t border-slate-100">
          <div className="rounded-xl p-6 sm:p-8 bg-slate-50 border border-slate-200 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* Left text column */}
              <div className="lg:col-span-6 space-y-3.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-[#0B3D91] text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck size={13} />
                  <span>Enterprise Security &amp; Compliance</span>
                </div>

                <h2
                  className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Statutory Trust &amp; Cryptographic Privacy
                </h2>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Engineered strictly in accordance with modern higher-education accreditation criteria (NAAC Criterion II:
                  Teaching-Learning &amp; Evaluation, NBA Outcome Based Education, and statutory audits).
                </p>

                <div className="space-y-2.5 pt-1">
                  {[
                    {
                      title: "Zero PII Storage in Feedback",
                      desc: "Feedback entries are detached from student email addresses upon database ingestion."
                    },
                    {
                      title: "Role-Based Token Verification",
                      desc: "Prevents duplicate submissions without recording identifying user linkages."
                    },
                    {
                      title: "Tamper-Proof Audit Logging",
                      desc: "Logs administrative actions, session switches, and rubric alterations securely."
                    },
                    {
                      title: "TLS 1.3 & AES-256 Encryption",
                      desc: "Standard higher-education data protection in transit and at rest."
                    }
                  ].map((sec) => (
                    <div key={sec.title} className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        <span>{sec.title}</span>
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5 pl-5.5 leading-relaxed">
                        {sec.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right compliance showcase */}
              <div className="lg:col-span-6 space-y-3.5">
                <div className="rounded-xl p-6 bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="text-center pb-3.5 border-b border-slate-100">
                    <Award size={32} className="text-[#0B3D91] mx-auto mb-1.5" />
                    <h3 className="text-slate-900 font-bold text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Accreditation Aligned
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Fulfills statutory quality assurance parameters seamlessly
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <div className="text-sm font-bold text-slate-900">NAAC</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Criterion II Aligned</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <div className="text-sm font-bold text-slate-900">NBA</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Outcome Metrics</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <div className="text-sm font-bold text-slate-900">NIRF</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Teaching Quality Data</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <div className="text-sm font-bold text-slate-900">ISO 27001</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Security Standards</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-center">
                    <p className="text-xs text-[#0B3D91] font-semibold">
                      Automated 1-Click Institutional Dossier Generation Available
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: FREQUENTLY ASKED QUESTIONS */}
        <section id="faq" className="w-full max-w-[880px] mx-auto px-4 sm:px-6 py-12 sm:py-16 scroll-mt-14 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2
              className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Have questions about deploying Acadexa at your institution? Here are answers to common inquiries.
            </p>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#0B3D91]" : ""
                        }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 6: CALL TO ACTION BANNER */}
        <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-18">
          <div className="rounded-xl p-8 sm:p-10 bg-[#0B3D91] text-white text-center shadow-md">
            <div className="max-w-2xl mx-auto space-y-3.5">
              <h2
                className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Ready to Upgrade Faculty Evaluations Across Your Institution?
              </h2>

              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                Join forward-thinking universities that prioritize academic transparency, high student participation, and
                rigorous pedagogical excellence.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white text-[#0B3D91] hover:bg-blue-50 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Building2 size={15} />
                  <span>Register Your Institution</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/institution-login")}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-white/30 text-white hover:bg-white/10 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Institution Login</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* PLATFORM LIGHT FOOTER */}
      <footer className="w-full border-t border-slate-200 bg-slate-50 px-4 sm:px-6 lg:px-8 py-10 text-slate-600 text-xs">
        <div className="max-w-[1240px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-200">
            {/* Col 1: Brand */}
            <div className="space-y-2.5 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0B3D91] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <GraduationCap size={16} />
                </div>
                <span className="font-bold text-slate-900 text-sm tracking-tight">
                  Acadexa
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Intelligent academic feedback, faculty evaluation, and quality analytics platform.
              </p>
              <div className="text-[11px] text-[#0B3D91] font-medium">
                Multi-Tenant · Anonymous · NAAC Ready
              </div>
            </div>

            {/* Col 2: Platform Links */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Platform
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li><a href="#features" className="hover:text-[#0B3D91] transition-colors">Platform Features</a></li>
                <li><a href="#workflow" className="hover:text-[#0B3D91] transition-colors">Lifecycle Workflow</a></li>
                <li><a href="#security" className="hover:text-[#0B3D91] transition-colors">Security &amp; NAAC</a></li>
                <li><a href="#faq" className="hover:text-[#0B3D91] transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Col 3: Institutions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Institutions
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>
                  <button type="button" onClick={() => setShowRegisterModal(true)} className="hover:text-[#0B3D91] transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit text-xs">
                    Register Institution
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate("/institution-login")} className="hover:text-[#0B3D91] transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit text-xs">
                    Institution Login Gateway
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Acadexa. All rights reserved.</p>
            <div className="flex items-center gap-3 text-[11px]">
              <span>Multi-Tenant Architecture</span>
              <span>·</span>
              <span>Statutory Compliance</span>
              <span>·</span>
              <span>100% Cryptographic Anonymity</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Institution Registration Modal */}
      <InstitutionRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onNavigateStatus={(refId) =>
          navigate(refId ? `/application-status?ref=${refId}` : "/application-status")
        }
      />
    </div>
  );
};

export default PlatformLandingPage;
