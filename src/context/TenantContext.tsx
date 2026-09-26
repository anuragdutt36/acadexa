import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useParams } from "react-router";
import { API_BASE_URL } from "../services/api.js";

export interface TenantInstitution {
  institutionId: string;
  name: string;
  slug: string;
  type: string;
  website: string;
  officialEmail: string;
  city?: string;
  state?: string;
  logoUrl?: string;
  status: "active" | "suspended" | "pending" | "under_review";
  settings: {
    systemName: string;
    domainRestriction: string;
    googleLoginEnabled: boolean;
    themeMode: "light" | "dark";
    accentColor: string;
    campusImageUrl?: string;
    campusImages?: { url: string; publicId?: string; order?: number }[];
    logoUrl?: string;
    allowPublicStats?: boolean;
  };
  activeSessionsCount?: number;
  activeSession?: {
    id: string;
    name: string;
    academicYear: string;
    startDate?: string;
    endDate?: string;
    customMessage?: string;
  } | null;
  facultyCount?: number;
}

interface TenantContextType {
  institution: TenantInstitution | null;
  loading: boolean;
  error: string | null;
  isTenantPortal: boolean;
  portalSlug: string;
  tenantName: string;
  accentColor: string;
  domainRestriction: string;
  isSuspended: boolean;
  reloadTenant: () => void;
}

const TenantContext = createContext<TenantContextType>({
  institution: null,
  loading: false,
  error: null,
  isTenantPortal: false,
  portalSlug: "",
  tenantName: "Acadexa",
  accentColor: "#0B3D91",
  domainRestriction: "",
  isSuspended: false,
  reloadTenant: () => {},
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const params = useParams<{ slug?: string }>();

  // Determine slug from path /college/:slug, query params, or hostname
  const getDetectedSlug = (): string => {
    // 1. Path parameter /college/:slug
    if (params.slug) return params.slug.toLowerCase().trim();

    // 2. Location pathname check /college/XYZ
    const pathMatch = location.pathname.match(/^\/college\/([a-zA-Z0-9_-]+)/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1].toLowerCase().trim();
    }

    // 3. Subdomain check (e.g. knit.acadexa-fb.vercel.app -> "knit")
    const hostname = window.location.hostname.toLowerCase();
    const platformDomains = ["acadexa-fb.vercel.app", "acadexa.in", "acadexa.com", "localhost"];
    for (const pDomain of platformDomains) {
      if (hostname.endsWith(`.${pDomain}`)) {
        const sub = hostname.replace(`.${pDomain}`, "");
        if (sub && sub !== "www" && sub !== "app" && sub !== "platform") {
          return sub;
        }
      }
    }

    // 4. Check cached currentInstitutionSlug
    const cachedSlug = sessionStorage.getItem("currentInstitutionSlug") || localStorage.getItem("currentInstitutionSlug");
    if (cachedSlug) return cachedSlug;

    return "";
  };

  const currentSlug = getDetectedSlug();
  const [institution, setInstitution] = useState<TenantInstitution | null>(null);
  const [loading, setLoading] = useState(Boolean(currentSlug));
  const [error, setError] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);

  const fetchTenantProfile = async (slugToFetch: string) => {
    if (!slugToFetch) {
      setInstitution(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsSuspended(false);

    try {
      const response = await fetch(`${API_BASE_URL}/institutions/by-slug/${slugToFetch}`);
      const data = await response.json();

      if (response.status === 403 && data.isSuspended) {
        setIsSuspended(true);
        if (data.institution) {
          setInstitution({
            ...data.institution,
            status: "suspended",
          });
          sessionStorage.setItem("currentInstitutionSlug", slugToFetch);
          if (data.institution.institutionId || data.institution.id) {
            sessionStorage.setItem("currentInstitutionId", data.institution.id || data.institution.institutionId);
          }
        } else {
          setInstitution(null);
        }
        return;
      }

      if (response.ok && data.success && data.data) {
        setInstitution(data.data);
        sessionStorage.setItem("currentInstitutionSlug", data.data.slug);
        if (data.data.id || data.data.institutionId) {
          sessionStorage.setItem("currentInstitutionId", data.data.id || data.data.institutionId);
        }
      } else {
        setInstitution(null);
        setError(data.message || `Institution portal '/${slugToFetch}' was not found or is pending platform approval.`);
      }
    } catch (err: any) {
      setInstitution(null);
      setError(err.message || "Failed to load tenant configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantProfile(currentSlug);
  }, [currentSlug]);

  const value: TenantContextType = {
    institution,
    loading,
    error,
    isTenantPortal: Boolean(institution),
    portalSlug: institution?.slug || currentSlug,
    tenantName: institution?.name || "Acadexa",
    accentColor: institution?.settings?.accentColor || "#0B3D91",
    domainRestriction: institution?.settings?.domainRestriction || "",
    isSuspended,
    reloadTenant: () => fetchTenantProfile(currentSlug),
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => useContext(TenantContext);
export default TenantContext;
