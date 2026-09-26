import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon, Lock, ShieldCheck, Sun, Database,
  SquareCheck, Upload, Play, RotateCcw, AlertTriangle, Loader2
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { ModHeader, ModBtn, cn } from "../../components/admin/AdminShared.js";
import { AcademicSessionDropdown } from "../../components/common/AcademicSessionDropdown.js";
import { RollMappingTab } from "../../components/admin/RollMappingTab.js";
import { settingsService } from "../../services/settings.service.js";
import { authService } from "../../services/auth.service.js";
import { getFormattedLogoUrl } from "../../services/api.js";

export const Settings: React.FC = () => {
  const { dark, setDark } = useTheme();
  const [tab, setTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Simplified settings state matching revised Mongoose schema
  const [settings, setSettings] = useState<any>({
    systemName: "Acadexa",
    instituteName: "Institution",
    academicYear: "2026-27",
    googleLoginEnabled: true,
    domainRestriction: "",
    sessionTimeout: 30,
    anonymousFeedback: true,
    oneSubmissionPerStudent: true,
    autoActivateBasedOnDate: true,
    themeMode: "dark",
    logoUrl: "",
  });

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const cardBg = dark ? "bg-white/5 border-white/10" : "bg-white border-[#0B3D91]/8 shadow-sm";
  const inputCls = dark ? "bg-white/8 border-white/10 text-white placeholder:text-white/30" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E] placeholder:text-[#5A6E8E]/60";

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadSettings = async () => {
    try {
      const res = await settingsService.getSettings();
      if (res?.success && res.data) {
        setSettings(res.data);
        document.title = `${res.data.systemName || "Acadexa"} — Intelligent Academic Feedback & Evaluation Platform`;
      }
    } catch (err: any) {
      console.error("Failed to load settings", err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const res = await settingsService.updateSettings(settings);
      if (res?.success) {
        showNotification("success", "System settings updated and saved successfully!");
        document.title = `${settings.systemName || "Acadexa"} — Intelligent Academic Feedback & Evaluation Platform`;
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification("error", "Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification("error", "New password and confirmation do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      if (res?.success) {
        showNotification("success", "Admin password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to update admin password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const res = await settingsService.uploadLogo(file);
      if (res?.success && res.data) {
        setSettings({ ...settings, logoUrl: res.data.logoUrl });
        window.dispatchEvent(new Event("storage"));
        showNotification("success", "Logo uploaded successfully!");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to upload logo.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleLogoDelete = async () => {
    if (!window.confirm("Are you sure you want to delete the logo?")) return;
    setLoading(true);
    try {
      const res = await settingsService.deleteLogo();
      if (res?.success) {
        setSettings({ ...settings, logoUrl: "" });
        window.dispatchEvent(new Event("storage"));
        showNotification("success", "Logo deleted successfully!");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete logo.");
    } finally {
      setLoading(false);
    }
  };

  const handleCampusImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const res = await settingsService.uploadCampusImage(file, slotIndex);
      if (res?.success && res.data) {
        setSettings(res.data);
        showNotification("success", `Campus image ${slotIndex + 1} uploaded successfully!`);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to upload campus image.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleCampusImageDelete = async (slotIndex: number) => {
    if (!window.confirm(`Are you sure you want to delete campus image ${slotIndex + 1}?`)) return;
    setLoading(true);
    try {
      const res = await settingsService.deleteCampusImage(slotIndex);
      if (res?.success && res.data) {
        setSettings(res.data);
        showNotification("success", `Campus image ${slotIndex + 1} deleted successfully!`);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete campus image.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm("Warning: Seeding will clear existing data and populate a fresh sample dataset (courses, branches, subjects, faculty, mappings, and ratings). Do you want to proceed?")) {
      return;
    }
    setLoading(true);
    try {
      const res = await settingsService.seedDatabase();
      if (res?.success) {
        showNotification("success", "Sample seed data generated successfully! Reloading to apply updates...");
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to seed sample database.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Warning: Clearing will remove all courses, branches, subjects, faculty mappings, feedback sessions, and ratings, keeping ONLY the admin credentials. Do you want to proceed?")) {
      return;
    }
    setLoading(true);
    try {
      const res = await settingsService.clearDatabase();
      if (res?.success) {
        showNotification("success", "All seed data cleared successfully! Reloading to apply updates...");
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to clear database.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: "general", label: "General", icon: SettingsIcon },
    { key: "roll", label: "Roll Number Mapping", icon: Database },
    { key: "auth", label: "Authentication", icon: Lock },
    { key: "feedback", label: "Feedback Options", icon: ShieldCheck },
    { key: "appearance", label: "Appearance", icon: Sun },
  ];

  function Toggle({ on, label, onChange, disabled = false }: { on: boolean; label: string; onChange?: (v: boolean) => void; disabled?: boolean }) {
    return (
      <div className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(11,61,145,0.06)" }}>
        <span className={`text-sm ${textPrimary}`}>{label}</span>
        <div 
          onClick={() => {
            if (!disabled && onChange) onChange(!on);
          }} 
          className={cn(
            "w-10 h-5 rounded-full flex items-center px-0.5 transition-all", 
            on ? "bg-[#0B3D91]" : dark ? "bg-white/20" : "bg-gray-200",
            disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
          )}
        >
          <div className={cn("w-4 h-4 rounded-full bg-white shadow transition-all", on ? "translate-x-5" : "translate-x-0")} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <ModHeader title="System Settings" sub={`Configure ${settings.systemName || "Acadexa"} Academic Feedback System`} dark={dark}>
        <ModBtn icon={SquareCheck} variant="primary" onClick={handleSaveChanges} disabled={saving}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : "Save Changes"}
        </ModBtn>
      </ModHeader>

      {notification && (
        <div className={cn(
          "mb-5 p-4 rounded-2xl border text-sm flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300",
          notification.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300"
        )}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs font-bold underline cursor-pointer border-0 bg-transparent text-inherit ml-2">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-full overflow-x-hidden">
        {/* Tab sidebar */}
        <div className={cn("rounded-2xl border p-1.5 sm:p-3 flex lg:flex-col overflow-x-auto gap-1 sm:gap-0.5 shrink-0 h-fit", cardBg)}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border-0 cursor-pointer whitespace-nowrap shrink-0 lg:w-full",
                tab === key
                  ? "bg-[#0B3D91] text-white"
                  : dark
                    ? "text-white/60 hover:bg-white/8 hover:text-white bg-transparent"
                    : "text-[#5A6E8E] hover:bg-[#EEF2F8] hover:text-[#0D1B3E] bg-transparent"
              )}
            >
              <Icon size={15} className="shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={cn("lg:col-span-3 rounded-2xl border p-4 sm:p-6 min-w-0", cardBg)}>
          {tab === "general" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>College Code</label>
                  <input
                    type="text"
                    className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30", inputCls)}
                    value={settings.systemName}
                    onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                  />
                </div>

                <div>
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Institute Name</label>
                  <input
                    type="text"
                    className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30", inputCls)}
                    value={settings.instituteName}
                    onChange={(e) => setSettings({ ...settings, instituteName: e.target.value })}
                  />
                </div>

                <div>
                  <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Academic Session</label>
                  <AcademicSessionDropdown
                    value={settings.academicYear}
                    onChange={(val) => setSettings({ ...settings, academicYear: val })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Seeding & Reset Section */}
              <div className={cn("p-5 rounded-2xl border flex flex-col gap-3 mt-4", dark ? "border-white/8 bg-white/4" : "border-[#0B3D91]/8 bg-[#F8FAFD]")}>
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className={cn("text-sm font-bold mb-0.5", textPrimary)}>Database Master Seeding</p>
                    <p className={cn("text-xs", textSub)}>Seed master structure data (faculties, branches, subjects, mappings, questions, and roll mappings) or clear it to start clean.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleSeed}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all cursor-pointer border-0 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} Populate Master Structure Data
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all cursor-pointer border-0 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />} Clear Seed Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "auth" && (
            <div className="space-y-6 max-w-md animate-in fade-in duration-200">
              <Toggle
                on={settings.googleLoginEnabled}
                label="Enable Student Google OAuth Sign-In"
                onChange={(val) => setSettings({ ...settings, googleLoginEnabled: val })}
              />

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Restrict Login Domain</label>
                <input
                  type="text"
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={settings.domainRestriction}
                  placeholder="@institute.ac.in"
                  onChange={(e) => setSettings({ ...settings, domainRestriction: e.target.value })}
                />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-2", textSub)}>Session Timeout</label>
                <select
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer", inputCls)}
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>

              {/* Admin Password Change */}
              <div className={cn("p-5 rounded-2xl border flex flex-col gap-4 mt-6", dark ? "border-white/8 bg-white/4" : "border-[#0B3D91]/8 bg-[#F8FAFD]")}>
                <p className={cn("text-sm font-bold flex items-center gap-2", textPrimary)}>
                  <Lock size={15} /> Change Admin Password
                </p>
                <form onSubmit={handlePasswordChangeSubmit} className="space-y-3.5">
                  <div>
                    <label className={cn("block text-xs font-semibold mb-1", textSub)}>Current Password</label>
                    <input
                      type="password"
                      className={cn("w-full px-3 py-2 rounded-xl border text-xs focus:outline-none", inputCls)}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={cn("block text-xs font-semibold mb-1", textSub)}>New Password</label>
                    <input
                      type="password"
                      className={cn("w-full px-3 py-2 rounded-xl border text-xs focus:outline-none", inputCls)}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={cn("block text-xs font-semibold mb-1", textSub)}>Confirm New Password</label>
                    <input
                      type="password"
                      className={cn("w-full px-3 py-2 rounded-xl border text-xs focus:outline-none", inputCls)}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="w-full py-2.5 rounded-xl bg-[#0B3D91] hover:bg-[#0a348a] text-white text-xs font-bold transition-all cursor-pointer border-0 flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {passwordSaving && <Loader2 size={13} className="animate-spin" />} Update Password
                  </button>
                </form>
              </div>
            </div>
          )}

          {tab === "feedback" && (
            <div className="space-y-4 max-w-md animate-in fade-in duration-200">
              <Toggle
                on={settings.anonymousFeedback}
                label="Enforce Fully Anonymous Feedback Responses"
                onChange={(val) => setSettings({ ...settings, anonymousFeedback: val })}
              />


              <Toggle
                on={true}
                disabled={true}
                label="Allow Only One Submission Per Student (Enforced)"
              />

              <Toggle
                on={settings.autoActivateBasedOnDate}
                label="Automatically Activate Feedback Campaigns on Scheduled Dates"
                onChange={(val) => setSettings({ ...settings, autoActivateBasedOnDate: val })}
              />
            </div>
          )}

          {tab === "appearance" && (
            <div className="space-y-4 max-w-md animate-in fade-in duration-200">
              <div>
                <label className={cn("block text-xs font-semibold mb-2", textSub)}>Theme Mode</label>
                <div className={cn("flex rounded-xl p-1", dark ? "bg-white/8" : "bg-[#EEF2F8]")}>
                  {["Light", "Dark"].map(m => (
                    <button
                      key={m}
                      onClick={() => {
                        const nextVal = m.toLowerCase();
                        setSettings({ ...settings, themeMode: nextVal });
                        setDark(nextVal === "dark");
                      }}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-semibold transition-all border-0 cursor-pointer",
                        (settings.themeMode || "dark").toLowerCase() === m.toLowerCase()
                          ? "bg-[#0B3D91] text-white shadow"
                          : dark
                            ? "text-white/50 bg-transparent"
                            : "text-[#5A6E8E] bg-transparent"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-2", textSub)}>Institute Logo Placement</label>
                {settings.logoUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={getFormattedLogoUrl(settings.logoUrl)} className="h-24 w-auto object-contain p-2 bg-white rounded-xl border" alt="Logo Preview" />
                    <div className="flex gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-[#0B3D91] text-white text-xs font-semibold hover:bg-[#0a348a] cursor-pointer">
                        Replace Logo
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      <button type="button" onClick={handleLogoDelete} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer border-0">
                        Delete Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className={cn("flex items-center justify-center h-24 rounded-2xl border-2 border-dashed cursor-pointer hover:opacity-80 transition-all", dark ? "border-white/20 bg-white/5" : "border-[#0B3D91]/20 bg-[#F8FAFD]")}>
                    <div className="text-center">
                      <Upload size={20} className={cn("mx-auto mb-1", textSub)} />
                      <p className={cn("text-xs", textSub)}>Upload Logo (PNG / SVG)</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>
                  College Campus Images (Upload 1–3 Images)
                </label>
                <p className={cn("text-[11px] mb-3 leading-relaxed", textSub)}>
                  Upload between 1 and 3 photos representing your institution's campus, buildings, or environment. These images will render dynamically as a subtle, soft-focused hero background on your college landing page.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[0, 1, 2].map((slotIdx) => {
                    const imgItem = settings.campusImages && settings.campusImages[slotIdx];
                    return (
                      <div key={slotIdx} className={cn("p-3 rounded-2xl border flex flex-col justify-between items-center text-center relative", dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")}>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Slot {slotIdx + 1} {slotIdx === 0 ? "(Primary)" : ""}
                        </div>

                        {imgItem?.url ? (
                          <div className="w-full space-y-2">
                            <div className="h-28 w-full rounded-xl overflow-hidden relative border border-slate-200">
                              <img src={getFormattedLogoUrl(imgItem.url)} alt={`Campus slot ${slotIdx + 1}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex gap-1.5 justify-center">
                              <label className="px-2.5 py-1 rounded-lg bg-[#0B3D91] text-white text-[11px] font-semibold hover:bg-[#0a348a] cursor-pointer">
                                Replace
                                <input type="file" accept="image/*" onChange={(e) => handleCampusImageUpload(e, slotIdx)} className="hidden" />
                              </label>
                              <button
                                type="button"
                                onClick={() => handleCampusImageDelete(slotIdx)}
                                className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-semibold hover:bg-red-700 cursor-pointer border-0"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className={cn("flex flex-col items-center justify-center h-28 w-full rounded-xl border-2 border-dashed cursor-pointer hover:opacity-80 transition-all", dark ? "border-white/20 bg-white/5" : "border-[#0B3D91]/20 bg-white")}>
                            <Upload size={18} className={cn("mb-1", textSub)} />
                            <span className={cn("text-[11px] font-medium", textSub)}>Upload Image {slotIdx + 1}</span>
                            <input type="file" accept="image/*" onChange={(e) => handleCampusImageUpload(e, slotIdx)} className="hidden" />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "roll" && (
            <RollMappingTab />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
