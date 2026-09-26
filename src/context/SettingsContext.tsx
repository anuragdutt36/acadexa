import React, { createContext, useContext, useState, useEffect } from "react";
import { settingsService } from "../services/settings.service.js";

interface SettingsContextProps {
  systemName: string;
  instituteName: string;
  logoUrl: string;
  campusImageUrl: string;
  campusImages: { url: string; publicId?: string; order?: number }[];
  googleLoginEnabled: boolean;
  anonymousFeedback: boolean;
  autoActivateBasedOnDate: boolean;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextProps>({
  systemName: "Acadexa",
  instituteName: "Institution",
  logoUrl: "",
  campusImageUrl: "",
  campusImages: [],
  googleLoginEnabled: true,
  anonymousFeedback: true,
  autoActivateBasedOnDate: true,
  loading: true,
  refreshSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clean up any legacy un-scoped global keys that might leak across tenants
  useEffect(() => {
    ["logoUrl", "campusImageUrl", "campusImages", "systemName", "instituteName"].forEach((k) => {
      localStorage.removeItem(k);
    });
  }, []);

  const [systemName, setSystemName] = useState("Acadexa");
  const [instituteName, setInstituteName] = useState("Institution");
  const [logoUrl, setLogoUrl] = useState("");
  const [campusImageUrl, setCampusImageUrl] = useState("");
  const [campusImages, setCampusImages] = useState<{ url: string; publicId?: string; order?: number }[]>([]);
  const [googleLoginEnabled, setGoogleLoginEnabled] = useState(true);
  const [anonymousFeedback, setAnonymousFeedback] = useState(true);
  const [autoActivateBasedOnDate, setAutoActivateBasedOnDate] = useState(true);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const res = await settingsService.getSettings();
      if (res?.success && res.data) {
        setSystemName(res.data.systemName || "Acadexa");
        setInstituteName(res.data.instituteName || "Institution");
        setLogoUrl(res.data.logoUrl || "");
        setCampusImageUrl(res.data.campusImageUrl || "");
        setCampusImages(res.data.campusImages || []);
        setGoogleLoginEnabled(res.data.googleLoginEnabled ?? true);
        setAnonymousFeedback(res.data.anonymousFeedback ?? true);
        setAutoActivateBasedOnDate(res.data.autoActivateBasedOnDate ?? true);

        // Store only in tenant-scoped session cache
        const tenantKey = sessionStorage.getItem("currentInstitutionSlug") || sessionStorage.getItem("currentInstitutionId") || "";
        if (tenantKey) {
          sessionStorage.setItem(`tenant_${tenantKey}_logo`, res.data.logoUrl || "");
          sessionStorage.setItem(`tenant_${tenantKey}_name`, res.data.instituteName || "");
        }
        
        document.title = `${res.data.systemName || "Acadexa"} — Intelligent Academic Feedback & Evaluation Platform`;
      }
    } catch (error) {
      console.error("Failed to load tenant settings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();

    // Listen for custom trigger to reload settings
    const handleCustomStorageEvent = () => {
      refreshSettings();
    };

    window.addEventListener("storage", handleCustomStorageEvent);
    return () => {
      window.removeEventListener("storage", handleCustomStorageEvent);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ systemName, instituteName, logoUrl, campusImageUrl, campusImages, googleLoginEnabled, anonymousFeedback, autoActivateBasedOnDate, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
