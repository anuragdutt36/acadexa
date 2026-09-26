import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import {
  Building2,
  Search,
  ArrowRight,
  ChevronRight,
  X,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { API_BASE_URL, getFormattedLogoUrl } from "../../services/api.js";
import { AuthPageLayout } from "../../components/common/AuthPageLayout.js";

interface InstitutionItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  city?: string;
  state?: string;
  logoUrl?: string;
}

// Generate acronym from institution name (e.g. "Kamla Nehru Institute of Technology" -> "knit")
function getAcronyms(name: string): string[] {
  const words = name.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const acronym = words.map(w => w[0]).join("").toLowerCase();
  const majorAcronym = words
    .filter(w => !["of", "and", "in", "for", "the", "at"].includes(w.toLowerCase()))
    .map(w => w[0])
    .join("")
    .toLowerCase();
  return Array.from(new Set([acronym, majorAcronym])).filter(a => a.length >= 2);
}

export const InstitutionLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [allInstitutions, setAllInstitutions] = useState<InstitutionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

  // Check URL query parameters for preselected college
  const paramSlug = searchParams.get("slug") || searchParams.get("college") || searchParams.get("inst");

  const fetchInstitutions = async () => {
    setIsLoading(true);
    setFetchFailed(false);
    try {
      let res = await fetch(`${API_BASE_URL}/institutions/active-tenants`);
      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/institutions/public-list`);
      }
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const mapped: InstitutionItem[] = data.data.map((item: any) => ({
            id: item.institutionId || item._id,
            name: item.name,
            slug: item.slug,
            type: item.type || "Autonomous Institute",
            city: item.city,
            state: item.state,
            logoUrl: item.logoUrl,
          }));
          setAllInstitutions(mapped);

          // If paramSlug matches an institution, auto-navigate to it
          if (paramSlug) {
            const matched = mapped.find(
              (i) => i.slug.toLowerCase() === paramSlug.toLowerCase()
            );
            if (matched) {
              navigate(`/college/${matched.slug}`);
            }
          }
        }
      } else {
        setFetchFailed(true);
      }
    } catch (e) {
      console.error("Failed to load institutions", e);
      setFetchFailed(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch active institutions on component mount
  useEffect(() => {
    fetchInstitutions();
  }, [paramSlug, navigate]);

  const handleCustomSlugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = customSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanSlug) {
      setErrorMsg("Please enter a valid institution code or identifier.");
      return;
    }
    navigate(`/college/${cleanSlug}`);
  };

  // Smart filtering logic with substring, token, and acronym matching
  const filtered = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    if (!rawQuery) return allInstitutions;

    const tokens = rawQuery.split(/\s+/).filter(Boolean);

    return allInstitutions
      .map((inst) => {
        const nameLower = inst.name.toLowerCase();
        const slugLower = inst.slug.toLowerCase();
        const cityLower = (inst.city || "").toLowerCase();
        const stateLower = (inst.state || "").toLowerCase();
        const idLower = (inst.id || "").toLowerCase();
        const acronyms = getAcronyms(inst.name);

        const fullSearchString = `${nameLower} ${slugLower} ${cityLower} ${stateLower} ${idLower} ${acronyms.join(" ")}`;

        // Check if all tokens match anywhere in the combined metadata
        const matchesAllTokens = tokens.every(
          (t) =>
            fullSearchString.includes(t) ||
            acronyms.some((ac) => ac.startsWith(t))
        );

        if (!matchesAllTokens) return null;

        // Calculate relevance score
        let score = 0;
        if (slugLower === rawQuery) score += 100;
        if (slugLower.startsWith(rawQuery)) score += 50;
        if (nameLower.startsWith(rawQuery)) score += 40;
        if (acronyms.includes(rawQuery)) score += 45;
        if (nameLower.includes(rawQuery)) score += 20;
        if (cityLower.startsWith(rawQuery)) score += 15;

        return { inst, score };
      })
      .filter((item): item is { inst: InstitutionItem; score: number } => item !== null)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.inst);
  }, [allInstitutions, searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filtered.length === 1) {
      e.preventDefault();
      navigate(`/college/${filtered[0].slug}`);
    }
  };

  return (
    <AuthPageLayout
      icon={<Building2 className="w-6 h-6 text-[#0B3D91]" />}
      title="Sign in to Institution"
      subtitle="Select your college to access student feedback or academic portals"
      errorMessage={errorMsg}
      backLink={{
        to: "/",
        label: "Back to Platform Home",
      }}
    >
      <div className="space-y-4">
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Find Your College / Institution
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setErrorMsg("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search by college name, acronym (KNIT, IIT), city..."
                autoFocus
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Institution List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                Connecting to institutions directory...
              </div>
            ) : fetchFailed ? (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-amber-800 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Unable to load institutions directory</span>
                </div>
                <p className="text-xs text-amber-700">
                  The backend service may be waking up. Please retry in a moment.
                </p>
                <button
                  type="button"
                  onClick={fetchInstitutions}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
                  <span>{searchQuery.trim() ? `Search Results (${filtered.length})` : `Available Institutions (${filtered.length})`}</span>
                  {filtered.length === 1 && searchQuery.trim() && (
                    <span className="text-[11px] text-blue-600">Press Enter to select</span>
                  )}
                </div>
                {filtered.map((inst) => (
                  <button
                    key={inst.id || inst.slug}
                    type="button"
                    onClick={() => {
                      navigate(`/college/${inst.slug}`);
                    }}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/90 hover:border-[#0B3D91]/40 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      {inst.logoUrl ? (
                        <img
                          src={getFormattedLogoUrl(inst.logoUrl)}
                          alt={inst.name}
                          className="w-9 h-9 object-contain rounded-lg bg-white p-0.5 border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-[#0B3D91] flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#0B3D91] group-hover:text-white transition-colors">
                          <Building2 size={16} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-900 group-hover:text-[#0B3D91] transition-colors truncate">
                          {inst.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            /{inst.slug}
                          </span>
                          {inst.city && <span>• {inst.city}{inst.state ? `, ${inst.state}` : ""}</span>}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B3D91] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 px-3 text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p>No matching institutions found for &ldquo;<span className="font-semibold text-slate-700">{searchQuery}</span>&rdquo;.</p>
                <p className="text-xs text-slate-400">Try searching by college code, city, or check the spelling.</p>
              </div>
            )}
          </div>

          {/* Direct Institution Code Option */}
          <div className="pt-2 border-t border-slate-100 text-center">
            {!showDirectInput ? (
              <button
                type="button"
                onClick={() => setShowDirectInput(true)}
                className="text-sm text-slate-500 hover:text-[#0B3D91] transition-colors cursor-pointer inline-flex items-center gap-1 bg-transparent border-0 font-medium"
              >
                <span>Have an institution code or custom subdomain?</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <form onSubmit={handleCustomSlugSubmit} className="space-y-2 text-left pt-1">
                <label className="block text-sm font-medium text-slate-700">
                  Enter Institution Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => {
                      setCustomSlug(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="e.g. knit or iiid"
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all cursor-pointer border-0"
                  >
                    Go
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Platform Admin Secondary Link */}
          <div className="pt-1 text-center">
            <p className="text-sm text-slate-500">
              Are you a platform super-administrator?{" "}
              <Link
                to="/platform-admin/login"
                className="text-[#0B3D91] hover:underline font-semibold ml-1 inline-flex items-center gap-0.5"
              >
                <span>Platform Admin Login</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
};

export default InstitutionLoginPage;
