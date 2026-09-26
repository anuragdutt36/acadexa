const getApiBaseUrl = (): string => {
  let customUrl = import.meta.env.VITE_API_URL;
  if (customUrl && typeof customUrl === "string" && customUrl.trim() !== "") {
    let clean = customUrl.trim().replace(/\/+$/, "");
    if (!clean.endsWith("/api")) {
      clean = `${clean}/api`;
    }
    return clean;
  }
  // When running in the browser on Vercel or production domain, use relative /api proxy
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "/api";
  }
  return "http://localhost:5001/api";
};

export const API_BASE_URL = getApiBaseUrl();

export const getBackendOrigin = (): string => {
  return API_BASE_URL.replace(/\/api\/?$/, "");
};

export const getFormattedLogoUrl = (url?: string): string => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;

  const backendOrigin = getBackendOrigin();

  // If path is relative like "/uploads/..."
  if (url.startsWith("/")) {
    return `${backendOrigin}${url}`;
  }

  // If URL has hardcoded localhost:5001/5000 in DB but VITE_API_URL points elsewhere (e.g. deployed on Vercel/Render)
  if (url.includes("localhost:") && !backendOrigin.includes("localhost:")) {
    const uploadIndex = url.indexOf("/uploads");
    if (uploadIndex !== -1) {
      return `${backendOrigin}${url.substring(uploadIndex)}`;
    }
  }

  return url;
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = localStorage.getItem("accessToken");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const tenantId = sessionStorage.getItem("currentInstitutionId") || localStorage.getItem("currentInstitutionId");
  const tenantSlug = sessionStorage.getItem("currentInstitutionSlug") || localStorage.getItem("currentInstitutionSlug");
  if (tenantId && !headers.has("X-Institution-Id")) {
    headers.set("X-Institution-Id", tenantId);
  }
  if (tenantSlug && !headers.has("X-Institution-Slug")) {
    headers.set("X-Institution-Slug", tenantSlug);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

export const apiDownload = async (endpoint: string, filename: string) => {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("accessToken");
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const tenantId = sessionStorage.getItem("currentInstitutionId") || localStorage.getItem("currentInstitutionId");
  const tenantSlug = sessionStorage.getItem("currentInstitutionSlug") || localStorage.getItem("currentInstitutionSlug");
  if (tenantId) headers["X-Institution-Id"] = tenantId;
  if (tenantSlug) headers["X-Institution-Slug"] = tenantSlug;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { 
    headers,
    credentials: "include",
  });
  if (!response.ok) throw new Error("Download failed");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export default apiFetch;
