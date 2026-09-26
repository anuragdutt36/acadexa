import React from "react";
import { useNavigate } from "react-router";
import { Globe, Shield, Lock, Award, HelpCircle, Mail, FileText, CheckCircle2, ShieldCheck } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { useSettings } from "../../context/SettingsContext.js";
import { useTenant } from "../../context/TenantContext.js";
import { LogoMark } from "../common/LogoMark.js";

interface FooterProps {
  compact?: boolean;
  landing?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ compact = false, landing = false }) => {
  const { dark } = useTheme();
  const { systemName, instituteName } = useSettings();
  const { institution: tenantInst, portalSlug } = useTenant();
  const navigate = useNavigate();

  const isDark = landing || dark;
  const sysName = tenantInst?.settings?.systemName || systemName || (portalSlug && portalSlug !== "knit" ? portalSlug.toUpperCase() : "KNIT");
  const instName = tenantInst?.name || (portalSlug && portalSlug !== "knit" ? "Rajkiya Engineering College" : (instituteName || "Kamla Nehru Institute of Technology, Sultanpur"));

  const textColor = isDark ? "text-white" : "text-[#0D1B3E]";
  const subTextColor = isDark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const borderColor = isDark ? "border-white/10" : "border-[#0B3D91]/10";
  const bgClass = landing 
    ? "bg-transparent" 
    : isDark 
      ? "bg-[#040B1A]/90" 
      : "bg-white/80 backdrop-blur-md";

  if (compact) {
    return (
      <footer 
        className={`border-t px-4 sm:px-8 py-3.5 mt-auto w-full transition-colors ${borderColor} ${bgClass}`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <LogoMark size={22} dark={isDark} className="shrink-0" />
            <div className="truncate">
              <span className={`font-semibold ${textColor}`}>{sysName}</span>
              <span className={`hidden md:inline mx-1.5 ${subTextColor}`}>·</span>
              <span className={`hidden md:inline text-[11px] ${subTextColor}`}>Powered by Acadexa</span>
            </div>
          </div>
          <div className={`flex items-center gap-3 text-[11px] ${subTextColor}`}>
            <span className="flex items-center gap-1"><Shield size={11} className="text-emerald-500" /> NAAC Ready</span>
            <span>·</span>
            <span>© {new Date().getFullYear()} {sysName} · Acadexa</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer 
      className={`border-t px-4 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12 mt-auto w-full transition-colors ${borderColor} ${bgClass}`}
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 pb-6 sm:pb-8 border-b border-inherit">
          {/* Left section: Branding & Identity */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <LogoMark size={28} dark={isDark} className="shrink-0 w-7 h-7 sm:w-8 sm:h-8" />
              <div>
                <h3 className={`font-bold text-xs sm:text-sm md:text-base leading-tight ${textColor}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {sysName}
                </h3>
                <p className={`text-[11px] sm:text-xs ${subTextColor} mt-0.5 leading-snug`}>{instName} • Powered by Acadexa</p>
              </div>
            </div>
            <p className={`text-[11px] sm:text-xs leading-relaxed ${subTextColor} max-w-sm`}>
              Official institutional feedback platform powered by Acadexa, engineered for anonymous faculty evaluation, continuous academic quality enhancement, and institutional excellence.
            </p>
            <div className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-medium ${subTextColor}`}>
              <Globe size={12} className="text-[#3B82F6] shrink-0" />
              <span>{sysName.toLowerCase()}.ac.in · Uttar Pradesh, India</span>
            </div>
          </div>

          {/* Center section: Quick Links */}
          <div className="space-y-2.5 sm:space-y-3 md:pl-4 lg:pl-6">
            <h4 className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${textColor}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Portal Links &amp; Policies
            </h4>
            <ul className={`space-y-2 text-[11px] sm:text-xs ${subTextColor}`}>
              <li>
                <button
                  onClick={() => navigate("/student/privacy")}
                  className="hover:text-[#3B82F6] hover:underline inline-flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit text-[11px] sm:text-xs"
                >
                  <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                  <span>Privacy Policy &amp; Anonymity</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/student/help")}
                  className="hover:text-[#3B82F6] hover:underline inline-flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit text-[11px] sm:text-xs"
                >
                  <HelpCircle size={13} className="text-[#3B82F6] shrink-0" />
                  <span>Help &amp; FAQ</span>
                </button>
              </li>
              <li>
                <a
                  href={`mailto:${tenantInst?.officialEmail || (portalSlug && portalSlug !== "knit" ? `support@${portalSlug}.ac.in` : "feedback-support@knit.ac.in")}`}
                  className="hover:text-[#3B82F6] hover:underline inline-flex items-center gap-1.5 transition-colors text-inherit text-[11px] sm:text-xs"
                >
                  <Mail size={13} className="text-violet-400 shrink-0" />
                  <span>Contact Academic Section</span>
                </a>
              </li>
              <li>
                <button
                  onClick={() => navigate("/student/privacy")}
                  className="hover:text-[#3B82F6] hover:underline inline-flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit text-[11px] sm:text-xs"
                >
                  <FileText size={13} className="text-amber-400 shrink-0" />
                  <span>Terms of Academic Feedback</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Right section: System Quality Badges */}
          <div className="space-y-2.5 sm:space-y-3">
            <h4 className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${textColor}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Quality &amp; Security Standards
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2 sm:p-2.5 rounded-xl border flex items-center gap-1.5 sm:gap-2 ${isDark ? "bg-white/5 border-white/8" : "bg-[#F8FAFD] border-[#0B3D91]/8"}`}>
                <Shield size={13} className="text-violet-400 shrink-0" />
                <span className={`text-[10px] sm:text-[11px] font-medium leading-tight ${textColor}`}>Anonymous</span>
              </div>
              <div className={`p-2 sm:p-2.5 rounded-xl border flex items-center gap-1.5 sm:gap-2 ${isDark ? "bg-white/5 border-white/8" : "bg-[#F8FAFD] border-[#0B3D91]/8"}`}>
                <Lock size={13} className="text-emerald-400 shrink-0" />
                <span className={`text-[10px] sm:text-[11px] font-medium leading-tight ${textColor}`}>Encrypted</span>
              </div>
              <div className={`p-2 sm:p-2.5 rounded-xl border flex items-center gap-1.5 sm:gap-2 ${isDark ? "bg-white/5 border-white/8" : "bg-[#F8FAFD] border-[#0B3D91]/8"}`}>
                <CheckCircle2 size={13} className="text-blue-400 shrink-0" />
                <span className={`text-[10px] sm:text-[11px] font-medium leading-tight ${textColor}`}>Role-Based</span>
              </div>
              <div className={`p-2 sm:p-2.5 rounded-xl border flex items-center gap-1.5 sm:gap-2 ${isDark ? "bg-white/5 border-white/8" : "bg-[#F8FAFD] border-[#0B3D91]/8"}`}>
                <Award size={13} className="text-amber-400 shrink-0" />
                <span className={`text-[10px] sm:text-[11px] font-medium leading-tight ${textColor}`}>NAAC Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className={`pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-center sm:text-left ${subTextColor}`}>
          <p>© {new Date().getFullYear()} {sysName}. Powered by Acadexa. All rights reserved.</p>
          <div className="flex items-center gap-3 text-[10px] sm:text-[11px]">
            <span>Acadexa Platform</span>
            <span>·</span>
            <span>Accredited Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
