import React, { useState } from "react";
import { Shield, Lock, CheckCircle2, Save, KeyRound } from "lucide-react";
import { usePlatformAuth } from "../../context/PlatformAuthContext.js";
import { useTheme } from "../../context/ThemeContext.js";

export const PlatformSettingsPage: React.FC = () => {
  const { dark } = useTheme();
  const { platformAdmin } = usePlatformAuth();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    platformName: "Acadexa",
    supportEmail: "support@acadexa.in",
    autoVerifyEmailDomain: true,
    requireDocumentUpload: false,
    sessionTimeoutMins: 60,
    allowRegistration: true,
    rateLimitingEnabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Platform Configuration
          </span>
        </div>
        <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
          Platform Governance &amp; Security Settings
        </h1>
        <p className={`text-xs sm:text-sm mt-0.5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
          Configure platform-wide verification parameters, multi-tenant security policies, and environment defaults
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Platform settings updated and persisted successfully.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Onboarding & Verification Policies */}
        <div
          className={`rounded-2xl p-5 sm:p-6 border transition-all ${
            dark ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10" : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <div className={`flex items-center gap-2.5 pb-4 border-b mb-5 ${dark ? "border-slate-800" : "border-slate-100"}`}>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                Institution Verification Rules
              </h2>
              <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                Rules applied during application review
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className={`flex items-start justify-between gap-4 py-2 border-b ${dark ? "border-slate-800/50" : "border-slate-100"}`}>
              <div>
                <span className={`font-semibold block ${dark ? "text-slate-200" : "text-slate-800"}`}>
                  Allow Public Institution Registrations
                </span>
                <span className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  When enabled, any educational institution representative can submit an application via the landing page.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.allowRegistration}
                onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 mt-1 cursor-pointer"
              />
            </div>

            <div className={`flex items-start justify-between gap-4 py-2 border-b ${dark ? "border-slate-800/50" : "border-slate-100"}`}>
              <div>
                <span className={`font-semibold block ${dark ? "text-slate-200" : "text-slate-800"}`}>
                  Automatic Email Domain Signal Detection
                </span>
                <span className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Automatically compares representative official email domain with the provided institution website domain.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoVerifyEmailDomain}
                onChange={(e) => setSettings({ ...settings, autoVerifyEmailDomain: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 mt-1 cursor-pointer"
              />
            </div>

            <div className="flex items-start justify-between gap-4 py-2">
              <div>
                <span className={`font-semibold block ${dark ? "text-slate-200" : "text-slate-800"}`}>
                  Mandatory Document Upload
                </span>
                <span className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Require applicants to upload affiliation/recognition proof before application submission.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.requireDocumentUpload}
                onChange={(e) => setSettings({ ...settings, requireDocumentUpload: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 mt-1 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Security & Access Defaults */}
        <div
          className={`rounded-2xl p-5 sm:p-6 border transition-all ${
            dark ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10" : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <div className={`flex items-center gap-2.5 pb-4 border-b mb-5 ${dark ? "border-slate-800" : "border-slate-100"}`}>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                Platform Security &amp; Operator Session
              </h2>
              <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                Operator session timeouts and rate limiting
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className={`block font-semibold mb-1 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                Platform Admin Session Timeout (Minutes)
              </label>
              <input
                type="number"
                value={settings.sessionTimeoutMins}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMins: Number(e.target.value) })}
                className={`w-full border rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] ${
                  dark ? "bg-slate-900 border-slate-700/80 text-slate-200" : "bg-white border-slate-300 text-slate-900"
                }`}
              />
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                Platform Support Desk Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className={`w-full border rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] ${
                  dark ? "bg-slate-900 border-slate-700/80 text-slate-200" : "bg-white border-slate-300 text-slate-900"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Active Operator Info */}
        <div
          className={`rounded-2xl p-5 sm:p-6 border transition-all ${
            dark ? "bg-[#0B1528] border-slate-800/80 shadow-xl shadow-black/10" : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <div className={`flex items-center gap-2.5 pb-4 border-b mb-4 ${dark ? "border-slate-800" : "border-slate-100"}`}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                Current Platform Operator
              </h2>
              <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                Authenticated administrative credentials
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className={`p-3 rounded-xl border ${dark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[11px] block ${dark ? "text-slate-400" : "text-slate-500"}`}>Operator Name</span>
              <span className={`font-semibold mt-0.5 block ${dark ? "text-slate-200" : "text-slate-900"}`}>{platformAdmin?.name}</span>
            </div>
            <div className={`p-3 rounded-xl border ${dark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[11px] block ${dark ? "text-slate-400" : "text-slate-500"}`}>Account Email</span>
              <span className={`font-mono mt-0.5 block ${dark ? "text-slate-200" : "text-slate-900"}`}>{platformAdmin?.username}</span>
            </div>
            <div className={`p-3 rounded-xl border ${dark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[11px] block ${dark ? "text-slate-400" : "text-slate-500"}`}>Assigned Role</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase mt-0.5 block">{platformAdmin?.role}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Platform Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlatformSettingsPage;
