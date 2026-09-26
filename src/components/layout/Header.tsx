import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Bell, Sun, Moon, ChevronDown, Menu, LogOut,
  LayoutDashboard, Building2, BookOpen, Users, HelpCircle, GitMerge,
  ClipboardList, BarChart3, LineChart, ScrollText, Settings, History,
  Shield, TrendingUp, User
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { useTheme } from "../../context/ThemeContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import { useTenant } from "../../context/TenantContext.js";
import { LogoMark } from "../common/LogoMark.js";
import { notificationService } from "../../services/notification.service.js";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const { dark, setDark } = useTheme();
  const { systemName: globalSystemName } = useSettings();
  const { institution: tenantInst, portalSlug } = useTenant();
  const location = useLocation();
  const navigate = useNavigate();

  const displayName = tenantInst?.settings?.systemName || tenantInst?.name || globalSystemName || (portalSlug ? portalSlug.toUpperCase() : "Acadexa");

  const [unreadCount, setUnreadCount] = useState(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!user || user.role !== "student") return;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silently ignore
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 60_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchUnreadCount]);

  useEffect(() => {
    fetchUnreadCount();
  }, [location.pathname, fetchUnreadCount]);

  if (!user) return null;

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const headerBg = dark ? "bg-[#0D1B3E]/95 border-white/10" : "bg-white/95 border-[#0B3D91]/10";
  const subnavBg = dark ? "bg-[#0A1633]/90 border-white/8" : "bg-[#F8FAFC]/90 border-[#0B3D91]/8";

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    return parts.map((w) => w[0]).join("").substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    setUserDropdownOpen(false);
    logout();
    navigate("/login");
  };

  // Define top horizontal navigation links based on user role
  const getNavLinks = () => {
    switch (user.role) {
      case "admin":
        return [
          { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
          { path: "/admin/structure", label: "Academic Structure", icon: Building2 },
          { path: "/admin/subjects", label: "Subjects", icon: BookOpen },
          { path: "/admin/faculty", label: "Faculty", icon: Users },
          { path: "/admin/questions", label: "Question Bank", icon: HelpCircle },
          { path: "/admin/mapping", label: "Mapping", icon: GitMerge },
          { path: "/admin/sessions", label: "Feedback Sessions", icon: ClipboardList },
          { path: "/admin/reports", label: "Reports", icon: BarChart3 },
          { path: "/admin/analytics", label: "Analytics", icon: LineChart },
          { path: "/admin/audit", label: "Audit Logs", icon: ScrollText },
        ];
      case "student":
        return [
          { path: "/student", label: "Active Feedback", icon: ClipboardList, exact: true },
          { path: "/student/history", label: "Feedback History", icon: History },
          { path: "/student/notifications", label: "Notifications", icon: Bell, badge: unreadCount },
          { path: "/student/help", label: "Help & FAQ", icon: HelpCircle },
          { path: "/student/privacy", label: "Privacy Policy", icon: Shield },
        ];
      case "hod":
      case "dean":
        const basePath = user.role === "dean" ? "/dean" : "/hod";
        return [
          { path: basePath, label: "Dashboard", icon: LayoutDashboard, exact: true },
          { path: `${basePath}/faculty-performance`, label: "Faculty Performance", icon: Users },
          { path: `${basePath}/subject-performance`, label: "Subject Performance", icon: BookOpen },
          { path: `${basePath}/trends`, label: "Feedback Trends", icon: TrendingUp },
          { path: `${basePath}/reports`, label: "Reports", icon: BarChart3 },
          { path: `${basePath}/notifications`, label: "Notifications", icon: Bell },
          { path: `${basePath}/profile`, label: "Profile & Settings", icon: Settings },
          { path: `${basePath}/help`, label: "Help & FAQ", icon: HelpCircle },
        ];
      case "faculty":
        return [
          { path: "/faculty", label: "Dashboard", icon: LayoutDashboard, exact: true },
          { path: "/faculty/my-feedback", label: "My Feedback", icon: ClipboardList },
          { path: "/faculty/reports", label: "Reports", icon: BarChart3 },
          { path: "/faculty/profile", label: "Profile & Settings", icon: Settings },
          { path: "/faculty/notifications", label: "Notifications", icon: Bell },
          { path: "/faculty/help", label: "Help & FAQ", icon: HelpCircle },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const isLinkActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname === path || (path !== "/admin" && path !== "/student" && location.pathname.startsWith(path));
  };

  return (
    <header className="sticky top-0 z-40 w-full flex flex-col shadow-xs backdrop-blur-md">
      {/* Primary Top Bar */}
      <div className={`flex items-center justify-between px-3 sm:px-6 h-14 sm:h-16 border-b transition-colors ${headerBg}`}>
        {/* Left: College Logo & System Name */}
        <div
          onClick={() => navigate(`/${user.role}`)}
          className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer select-none group"
        >
          <LogoMark size={32} dark={dark} className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 transition-transform group-hover:scale-105" />
          <div className="flex flex-col min-w-0">
            <span
              className={`font-bold text-xs sm:text-base leading-tight truncate ${textPrimary}`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {displayName}
            </span>
            <span className={`text-[10px] sm:text-[11px] leading-tight truncate capitalize ${textSub}`}>
              {user.role} Portal {tenantInst ? "• Powered by Acadexa" : "• Acadexa"}
            </span>
          </div>
        </div>

        {/* Right Actions: Notifications, Dark Mode, Avatar, Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Notifications Bell (Student only) */}
          {user.role === "student" && (
            <button
              id="header-notifications-bell"
              onClick={() => navigate("/student/notifications")}
              title="Notifications"
              aria-label="Notifications"
              className={`relative p-2 sm:p-2.5 rounded-xl border transition-all hover:scale-105 cursor-pointer ${
                dark
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-[#0B3D91]/10 bg-white text-[#0D1B3E] hover:bg-[#EEF2F8]"
              }`}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-[3px] rounded-full bg-red-500 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center leading-none shadow-md">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDark(!dark)}
            aria-label="Toggle Theme"
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all hover:scale-105 cursor-pointer ${
              dark
                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border-[#0B3D91]/10 bg-white text-[#0D1B3E] hover:bg-[#EEF2F8]"
            }`}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Avatar & Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className={`flex items-center gap-2 p-1 sm:p-1.5 rounded-xl border transition-all cursor-pointer ${
                dark
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-[#0B3D91]/10 bg-white text-[#0D1B3E] hover:bg-[#EEF2F8]"
              }`}
              aria-label="User profile menu"
            >
              {/* Perfectly centered circular avatar */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#0B3D91] flex items-center justify-center text-white text-xs font-bold shrink-0 select-none shadow-xs">
                {getUserInitials(user.name)}
              </div>
              <div className="hidden lg:block text-left pr-1">
                <div className={`text-xs font-semibold leading-tight truncate max-w-[120px] ${textPrimary}`}>
                  {user.name || "User"}
                </div>
                <div className={`text-[10px] uppercase font-medium leading-tight truncate ${textSub}`}>
                  {user.role}
                </div>
              </div>
              <ChevronDown size={14} className={`hidden sm:block transition-transform duration-200 ${textSub} ${userDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Popup */}
            {userDropdownOpen && (
              <div
                className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                  dark ? "bg-[#0D1B3E] border-white/15 text-white" : "bg-white border-[#0B3D91]/15 text-[#0D1B3E]"
                }`}
              >
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/10">
                  <p className="text-xs font-bold truncate">{user.name || "User"}</p>
                  <p className="text-[11px] text-gray-500 dark:text-blue-200/60 truncate">{user.username}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                    {user.role}
                  </span>
                </div>
                <div className="py-1">
                  {user.role === "admin" && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate("/admin/settings");
                      }}
                      className="w-full px-4 py-2 text-xs font-medium flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                    >
                      <Settings size={14} className="text-[#5A6E8E]" /> Settings
                    </button>
                  )}
                  {(user.role === "faculty" || user.role === "hod" || user.role === "dean") && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate(`/${user.role}/profile`);
                      }}
                      className="w-full px-4 py-2 text-xs font-medium flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                    >
                      <Settings size={14} className="text-[#5A6E8E]" /> Profile & Settings
                    </button>
                  )}
                  {user.role === "student" && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate("/student/help");
                      }}
                      className="w-full px-4 py-2 text-xs font-medium flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                    >
                      <HelpCircle size={14} className="text-[#5A6E8E]" /> Help & FAQ
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-xs font-medium flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hamburger Menu (Mobile Only - MUST be the LAST icon on the far right) */}
          <button
            onClick={onToggleMobileMenu}
            aria-label="Open Navigation Menu"
            title="Open Menu"
            className={`md:hidden p-2 rounded-xl border transition-all hover:scale-105 cursor-pointer ${
              dark
                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border-[#0B3D91]/10 bg-white text-[#0D1B3E] hover:bg-[#EEF2F8]"
            }`}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      <nav
        className={`hidden md:flex items-center justify-center px-4 sm:px-6 h-11 sm:h-12 border-b overflow-x-auto scrollbar-none gap-1 sm:gap-1.5 transition-colors ${subnavBg}`}
        aria-label="Main Navigation"
      >
        {navLinks.map((link) => {
          const active = isLinkActive(link.path, link.exact);
          const Icon = link.icon;
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? dark
                    ? "bg-white/15 text-white shadow-xs ring-1 ring-white/20"
                    : "bg-[#0B3D91] text-white shadow-xs"
                  : dark
                  ? "text-blue-200/70 hover:bg-white/8 hover:text-white"
                  : "text-[#5A6E8E] hover:bg-[#0B3D91]/8 hover:text-[#0B3D91]"
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span>{link.label}</span>
              {Boolean(link.badge) && Number(link.badge) > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold">
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default Header;
