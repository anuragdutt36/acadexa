import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Building2,
  FileCheck,
  Clock,
  XCircle,
  AlertOctagon,
  ScrollText,
  Bell,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  ExternalLink,
  Sun,
  Moon
} from "lucide-react";
import { usePlatformAuth } from "../../context/PlatformAuthContext.js";
import { useTheme } from "../../context/ThemeContext.js";
import { platformService } from "../../services/platform.service.js";

export const PlatformAdminLayout: React.FC = () => {
  const { platformAdmin, platformLogout } = usePlatformAuth();
  const { dark, setDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    platformLogout();
    navigate("/platform-admin/login");
  };

  const [counts, setCounts] = useState<{
    pendingApplications: number;
    underReviewApplications: number;
    activeInstitutions: number;
    suspendedInstitutions: number;
    rejectedApplications: number;
    totalApplications: number;
  }>({
    pendingApplications: 0,
    underReviewApplications: 0,
    activeInstitutions: 0,
    suspendedInstitutions: 0,
    rejectedApplications: 0,
    totalApplications: 0,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      try {
        const res = await platformService.getDashboardStats();
        if (res && res.success && res.data && res.data.stats && isMounted) {
          const s = res.data.stats;
          setCounts({
            pendingApplications: s.pendingApplications || 0,
            underReviewApplications: s.underReviewApplications || 0,
            activeInstitutions: s.activeInstitutions || 0,
            suspendedInstitutions: s.suspendedInstitutions || 0,
            rejectedApplications: s.rejectedApplications || 0,
            totalApplications:
              (s.pendingApplications || 0) +
              (s.underReviewApplications || 0) +
              (s.activeInstitutions || 0) +
              (s.rejectedApplications || 0),
          });
        }
      } catch {
        // silent fetch error
      }
    };

    if (platformAdmin) {
      fetchCounts();
    }

    return () => {
      isMounted = false;
    };
  }, [location.pathname, location.search, platformAdmin]);

  const navItems = [
    {
      label: "Platform Overview",
      items: [
        { name: "Dashboard", path: "/platform-admin", icon: LayoutDashboard },
      ],
    },
    {
      label: "Institution Onboarding",
      items: [
        { name: "All Applications", path: "/platform-admin/applications", icon: FileCheck, count: counts.totalApplications },
        { name: "Pending Verification", path: "/platform-admin/applications?status=PENDING", icon: Clock, count: counts.pendingApplications },
        { name: "Under Review", path: "/platform-admin/applications?status=UNDER_REVIEW", icon: FileCheck, count: counts.underReviewApplications },
        { name: "Approved / Active", path: "/platform-admin/institutions", icon: Building2, count: counts.activeInstitutions },
        { name: "Suspended", path: "/platform-admin/institutions?status=suspended", icon: AlertOctagon, count: counts.suspendedInstitutions },
        { name: "Rejected", path: "/platform-admin/applications?status=REJECTED", icon: XCircle, count: counts.rejectedApplications },
      ],
    },
    {
      label: "Governance & Security",
      items: [
        { name: "Platform Audit Logs", path: "/platform-admin/audit-logs", icon: ScrollText },
        { name: "Notification Logs", path: "/platform-admin/notification-logs", icon: Bell },
        { name: "Platform Settings", path: "/platform-admin/settings", icon: Settings },
      ],
    },
  ];

  // Single Source of Truth for Route Active State
  const isNavItemActive = (itemPath: string): boolean => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    // 1. If item has query params (e.g. "?status=PENDING", "?status=suspended", "?status=REJECTED")
    if (itemPath.includes("?")) {
      const [pathPart, queryPart] = itemPath.split("?");
      if (currentPath !== pathPart) return false;
      return currentSearch.includes(queryPart);
    }

    // 2. Exact match for Dashboard root
    if (itemPath === "/platform-admin") {
      return currentPath === "/platform-admin" || currentPath === "/platform-admin/";
    }

    // 3. Applications with no query status (or when viewing a specific application ID / approve page)
    if (itemPath === "/platform-admin/applications") {
      if (currentPath.startsWith("/platform-admin/applications/")) {
        return true;
      }
      if (currentPath === "/platform-admin/applications") {
        return !currentSearch || currentSearch === "" || currentSearch === "?status=ALL" || !currentSearch.includes("status=");
      }
      return false;
    }

    // 4. Institutions with no query status
    if (itemPath === "/platform-admin/institutions") {
      if (currentPath === "/platform-admin/institutions") {
        return !currentSearch || currentSearch === "" || currentSearch === "?status=ALL" || currentSearch.includes("status=active") || !currentSearch.includes("status=suspended");
      }
      return false;
    }

    // 5. Direct path prefix matches for audit-logs, notification-logs, settings
    return currentPath.startsWith(itemPath);
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
        dark
          ? "bg-[#070D1E] text-slate-100 selection:bg-blue-600 selection:text-white"
          : "bg-[#F8FAFC] text-slate-900 selection:bg-[#0B3D91] selection:text-white"
      }`}
    >
      {/* Top Bar */}
      <header
        className={`sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between transition-colors ${
          dark
            ? "bg-[#0B1528]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/20"
            : "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg border transition-colors cursor-pointer ${
              dark
                ? "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-white"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B3D91] shadow-xs flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold tracking-tight text-sm sm:text-base ${dark ? "text-white" : "text-slate-900"}`}>
                  Acadexa
                </span>
                <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase">
                  Platform Admin
                </span>
              </div>
              <p className={`text-xs font-normal hidden sm:block ${dark ? "text-slate-400" : "text-slate-500"}`}>
                Multi-Institution Governance Hub
              </p>
            </div>
          </div>
        </div>

        {/* User & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={() => setDark(!dark)}
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
              dark
                ? "bg-slate-800/90 border-slate-700 text-amber-300 hover:bg-slate-750 shadow-xs"
                : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 shadow-xs"
            }`}
          >
            {dark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span className="hidden sm:inline">{dark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              dark
                ? "bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900"
            }`}
          >
            <span>Live Platform</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <div className={`h-6 w-px hidden sm:block ${dark ? "bg-slate-800" : "bg-slate-200"}`} />

          <div
            className={`flex items-center gap-2.5 border px-2.5 py-1 rounded-lg ${
              dark
                ? "bg-slate-850 border-slate-800 text-slate-200"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <div className="w-6 h-6 rounded-md bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
              {platformAdmin?.name?.charAt(0) || "A"}
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className={`font-semibold leading-none ${dark ? "text-slate-200" : "text-slate-800"}`}>
                {platformAdmin?.name || "Super Admin"}
              </p>
              <p className={`text-[10px] capitalize mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {platformAdmin?.role || "superadmin"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out of Platform Admin"
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              dark
                ? "bg-slate-850 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border-slate-800 hover:border-red-500/20"
                : "bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border-slate-200 hover:border-red-200"
            }`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col w-64 border-r p-4 shrink-0 overflow-y-auto transition-colors ${
            dark
              ? "border-slate-800/80 bg-[#0A1224]"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="space-y-6">
            {navItems.map((group, gIdx) => (
              <div key={gIdx}>
                <h3
                  className={`text-[11px] font-bold uppercase tracking-wider px-3 mb-2 ${
                    dark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {group.label}
                </h3>
                <nav className="space-y-1">
                  {group.items.map((item, iIdx) => {
                    const Icon = item.icon;
                    const isActive = isNavItemActive(item.path);

                    return (
                      <Link
                        key={iIdx}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? "bg-[#0B3D91] text-white font-semibold shadow-xs"
                            : dark
                            ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : dark ? "text-slate-400" : "text-slate-500"}`} />
                        <span className="flex-1">{item.name}</span>
                        {typeof item.count === "number" && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                              isActive
                                ? "bg-white/20 text-white"
                                : dark
                                ? "bg-slate-800 text-slate-300 border border-slate-700/60"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Quick Help / Version */}
          <div
            className={`mt-auto pt-5 border-t text-[11px] px-3 ${
              dark ? "border-slate-800/60 text-slate-400" : "border-slate-200 text-slate-500"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span>Platform Tier</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">Enterprise Core</span>
            </div>
            <div className="flex items-center justify-between">
              <span>System Version</span>
              <span className="font-mono">v2.5.0-mt</span>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-out Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            <div
              className={`relative w-72 max-w-[80vw] border-r p-5 flex flex-col z-50 overflow-y-auto ${
                dark ? "bg-[#0A1224] border-slate-800" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className={`flex items-center justify-between pb-4 mb-4 border-b ${dark ? "border-slate-800" : "border-slate-200"}`}>
                <span className={`font-bold text-sm ${dark ? "text-white" : "text-slate-900"}`}>Platform Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                {navItems.map((group, gIdx) => (
                  <div key={gIdx}>
                    <h3 className={`text-[11px] font-bold uppercase tracking-wider px-2 mb-2 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                      {group.label}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item, iIdx) => {
                        const Icon = item.icon;
                        const isActive = isNavItemActive(item.path);

                        return (
                          <Link
                            key={iIdx}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              isActive
                                ? "bg-[#0B3D91] text-white font-semibold shadow-xs"
                                : dark
                                ? "text-slate-300 hover:bg-slate-800/60"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? "text-white" : dark ? "text-slate-400" : "text-slate-500"}`} />
                            <span className="flex-1">{item.name}</span>
                            {typeof item.count === "number" && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                  isActive
                                    ? "bg-white/20 text-white"
                                    : dark
                                    ? "bg-slate-800 text-slate-300 border border-slate-700/60"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {item.count}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main View Area */}
        <main
          className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors ${
            dark ? "bg-[#070D1E]" : "bg-[#F8FAFC]"
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlatformAdminLayout;
