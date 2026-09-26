import React from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard, Building2, BookOpen, Users, HelpCircle, GitMerge,
  ClipboardList, BarChart3, LineChart, ScrollText, Settings, LogOut,
  Bell, Shield, History, TrendingUp, X, User
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import { useTenant } from "../../context/TenantContext.js";
import { LogoMark } from "../common/LogoMark.js";

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { systemName: globalSystemName } = useSettings();
  const { institution: tenantInst, portalSlug } = useTenant();

  const sysDisplayName = tenantInst?.settings?.systemName || tenantInst?.name || globalSystemName || (portalSlug ? portalSlug.toUpperCase() : "Acadexa");

  if (!user) return null;

  const handleLogout = () => {
    logout();
    if (onCloseMobile) onCloseMobile();
    navigate("/login");
  };

  const handleItemClick = (path: string) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  // Define mobile navigation items based on role
  const getNavItems = () => {
    switch (user.role) {
      case "admin":
        return [
          {
            group: "Main Menu",
            items: [
              { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
              { path: "/admin/structure", label: "Academic Structure", icon: Building2 },
              { path: "/admin/subjects", label: "Subjects", icon: BookOpen },
              { path: "/admin/faculty", label: "Faculty", icon: Users },
              { path: "/admin/questions", label: "Question Bank", icon: HelpCircle },
              { path: "/admin/mapping", label: "Mapping", icon: GitMerge },
              { path: "/admin/sessions", label: "Feedback Sessions", icon: ClipboardList },
            ],
          },
          {
            group: "Insights & Configuration",
            items: [
              { path: "/admin/reports", label: "Reports", icon: BarChart3 },
              { path: "/admin/analytics", label: "Analytics", icon: LineChart },
              { path: "/admin/audit", label: "Audit Logs", icon: ScrollText },
              { path: "/admin/settings", label: "Settings", icon: Settings },
            ],
          },
        ];
      case "student":
        return [
          {
            group: "Feedback & Tasks",
            items: [
              { path: "/student", label: "Active Feedback", icon: ClipboardList, exact: true },
              { path: "/student/history", label: "Feedback History", icon: History },
              { path: "/student/notifications", label: "Notifications", icon: Bell },
            ],
          },
          {
            group: "Support & Information",
            items: [
              { path: "/student/help", label: "Help & FAQ", icon: HelpCircle },
              { path: "/student/privacy", label: "Privacy Policy", icon: Shield },
            ],
          },
        ];
      case "hod":
      case "dean":
        const basePath = user.role === "dean" ? "/dean" : "/hod";
        return [
          {
            group: user.role === "dean" ? "Dean Portal" : "HOD Portal",
            items: [
              { path: basePath, label: "Dashboard", icon: LayoutDashboard, exact: true },
              { path: `${basePath}/faculty-performance`, label: "Faculty Performance", icon: Users },
              { path: `${basePath}/subject-performance`, label: "Subject Performance", icon: BookOpen },
              { path: `${basePath}/trends`, label: "Feedback Trends", icon: TrendingUp },
              { path: `${basePath}/reports`, label: "Reports", icon: BarChart3 },
              { path: `${basePath}/notifications`, label: "Notifications", icon: Bell },
              { path: `${basePath}/profile`, label: "Profile & Settings", icon: Settings },
              { path: `${basePath}/help`, label: "Help & FAQ", icon: HelpCircle },
            ],
          },
        ];
      case "faculty":
        return [
          {
            group: "Faculty Portal",
            items: [
              { path: "/faculty", label: "Dashboard", icon: LayoutDashboard, exact: true },
              { path: "/faculty/my-feedback", label: "My Feedback", icon: ClipboardList },
              { path: "/faculty/reports", label: "Reports", icon: BarChart3 },
              { path: "/faculty/profile", label: "Profile & Settings", icon: Settings },
              { path: "/faculty/notifications", label: "Notifications", icon: Bell },
              { path: "/faculty/help", label: "Help & FAQ", icon: HelpCircle },
            ],
          },
        ];
      default:
        return [];
    }
  };

  const navGroups = getNavItems();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return (
      location.pathname === path ||
      (path !== "/admin" &&
        path !== "/student" &&
        path !== "/hod" &&
        path !== "/faculty" &&
        location.pathname.startsWith(path))
    );
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    return parts.map((w) => w[0]).join("").substring(0, 2).toUpperCase();
  };

  if (!mobileOpen) return null;

  return (
    /* Mobile Slide-Over Drawer from the RIGHT (< 768px) */
    <div className="md:hidden fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onCloseMobile}
      />

      {/* Drawer Panel - slides in from right */}
      <aside
        className="relative w-72 max-w-[85vw] h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-200"
        style={{ background: "linear-gradient(180deg, #041030 0%, #0B3D91 100%)" }}
      >
        {/* Drawer Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <LogoMark size={28} dark className="w-7 h-7 shrink-0" />
            <div className="overflow-hidden">
              <div
                className="text-white font-bold text-xs truncate leading-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {sysDisplayName}
              </div>
              <div className="text-blue-200/70 text-[10px] truncate capitalize">
                {user.role} Portal • Acadexa
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto overflow-x-hidden">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-blue-300/50">
                {group.group}
              </div>
              {group.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    isActive(item.path, (item as any).exact)
                      ? "bg-white/15 text-white shadow-xs ring-1 ring-white/20"
                      : "text-blue-200/70 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <item.icon size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {isActive(item.path, (item as any).exact) && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Drawer Footer: User Profile & Logout */}
        <div className="px-3 py-3 border-t border-white/10 space-y-2 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/8 border border-white/10">
            {/* Perfectly centered circular avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#0B3D91] flex items-center justify-center text-white text-xs font-bold shrink-0 select-none shadow-xs">
              {getUserInitials(user.name)}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <div className="text-white text-xs font-semibold truncate">{user.name || "User"}</div>
              <div className="text-blue-200/50 text-[10px] truncate capitalize">{user.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/15 hover:text-red-100 transition-all cursor-pointer border border-red-400/20"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
