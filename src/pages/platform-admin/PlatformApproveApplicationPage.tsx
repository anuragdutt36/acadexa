import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  KeyRound
} from "lucide-react";
import { platformService } from "../../services/platform.service.js";
import { InstitutionApplicationItem } from "../../types/platform.js";
import { useTheme } from "../../context/ThemeContext.js";

export const PlatformApproveApplicationPage: React.FC = () => {
  const { dark } = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<InstitutionApplicationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Approval config fields
  const [slug, setSlug] = useState("");
  const [allowedDomains, setAllowedDomains] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  // Success Result State
  const [approvalResult, setApprovalResult] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const res = await platformService.getApplicationById(id);
        if (res && res.success) {
          setApplication(res.data);
          // Suggest clean default slug
          const suggestedSlug = (res.data.collegeCode || res.data.institutionName)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
          setSlug(suggestedSlug);

          // Extract domain
          const emailDomain = res.data.representativeEmail.split("@")[1] || "";
          setAllowedDomains(emailDomain);
          setAdminNotes(res.data.adminNotes || "Accreditation and representative credentials verified.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load application.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !slug.trim()) {
      setError("Please specify a valid URL slug for this institution tenant.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const domainsList = allowedDomains
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);

      const res = await platformService.approveApplication(id, {
        customSlug: slug.trim().toLowerCase(),
        allowedEmailDomains: domainsList,
        adminNotes,
      });

      if (res && res.success) {
        setApprovalResult(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to approve institution.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyActivationLink = () => {
    if (approvalResult?.activationLink) {
      navigator.clipboard.writeText(approvalResult.activationLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyCreds = () => {
    if (approvalResult?.rootAdmin) {
      const username = approvalResult.rootAdmin.username;
      const password = approvalResult.rootAdmin.tempPassword || "Password unavailable";
      const url = `${window.location.origin}/college/${approvalResult.institution.slug}/login`;
      const text = `College Admin Credentials for ${approvalResult.institution.name}:\nUsername: ${username}\nPassword: ${password}\nLogin URL: ${url}`;
      navigator.clipboard.writeText(text);
      setCopiedCreds(true);
      setTimeout(() => setCopiedCreds(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-10 h-10 border-3 border-[#0B3D91]/30 border-t-[#0B3D91] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Preparing approval workspace...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className={`p-8 rounded-2xl border text-center ${dark ? "bg-[#0B1528] border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700"}`}>
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h2 className={`text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}>Application Not Found</h2>
        <Link
          to="/platform-admin/applications"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-[#0B3D91] text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Applications</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Bar */}
      <div className={`flex items-center gap-3 pb-4 border-b ${dark ? "border-slate-800/80" : "border-slate-200"}`}>
        <Link
          to={`/platform-admin/applications/${id}`}
          className={`p-2 rounded-xl border transition-colors ${
            dark ? "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{application.referenceId}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              Tenant Provisioning
            </span>
          </div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight mt-0.5 ${dark ? "text-white" : "text-slate-900"}`}>
            Approve Institution &amp; Provision Tenant Portal
          </h1>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {approvalResult ? (
        /* Approval Success Screen */
        <div
          className={`rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-center animate-fade-in border ${
            dark ? "bg-[#0B1528] border-emerald-500/30 text-white" : "bg-white border-emerald-200 text-slate-900"
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>
              Institution Approved &amp; Tenant Provisioned!
            </h2>
            <p className={`text-xs mt-1 max-w-md mx-auto ${dark ? "text-slate-400" : "text-slate-600"}`}>
              Isolated multi-tenant container created for <strong>{approvalResult.institution.name}</strong>.
            </p>
          </div>

          {/* Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left text-xs">
            <div className={`p-3.5 rounded-xl border ${dark ? "bg-slate-900/80 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[11px] block ${dark ? "text-slate-400" : "text-slate-500"}`}>Institution Tenant ID</span>
              <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                {approvalResult.institution.institutionId}
              </span>
            </div>

            <div className={`p-3.5 rounded-xl border ${dark ? "bg-slate-900/80 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[11px] block ${dark ? "text-slate-400" : "text-slate-500"}`}>Portal URL / Slug</span>
              <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                {approvalResult.institution.slug}
              </span>
            </div>

            <div className={`sm:col-span-2 p-3.5 rounded-xl border ${dark ? "bg-slate-900/80 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[11px] block ${dark ? "text-slate-400" : "text-slate-500"}`}>Primary Institutional Administrator</span>
              <span className={`font-semibold block mt-0.5 ${dark ? "text-slate-200" : "text-slate-900"}`}>
                {approvalResult.rootAdmin.name} ({approvalResult.rootAdmin.username})
              </span>
            </div>

            {/* Generated Admin Credentials Card */}
            <div className={`sm:col-span-2 p-4 rounded-xl border ${dark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#0B3D91] dark:text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound size={15} /> College Admin Account Credentials
                </span>
                <button
                  type="button"
                  onClick={handleCopyCreds}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  {copiedCreds ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCreds ? "Copied Credentials!" : "Copy Admin Credentials"}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className={`p-3 rounded-lg border ${dark ? "bg-black/50 border-slate-700" : "bg-white border-slate-200"}`}>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Admin Username / Email</span>
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white break-all">
                    {approvalResult.rootAdmin.username}
                  </span>
                </div>
                <div className={`p-3 rounded-lg border ${dark ? "bg-black/50 border-slate-700" : "bg-white border-slate-200"}`}>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Generated Admin Password</span>
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 break-all">
                    {approvalResult.rootAdmin.tempPassword || "Password unavailable"}
                  </span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-emerald-200 dark:border-emerald-500/20 text-left text-xs">
                <span className="text-slate-600 dark:text-slate-400">Direct College Admin Login URL: </span>
                <a
                  href={`/college/${approvalResult.institution.slug}/login`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono font-bold text-[#0B3D91] dark:text-blue-400 hover:underline"
                >
                  http://localhost:5173/college/{approvalResult.institution.slug}/login
                </a>
              </div>
            </div>

            <div className={`sm:col-span-2 p-4 rounded-xl border ${dark ? "bg-slate-900 border-blue-500/30" : "bg-blue-50/50 border-blue-200"}`}>
              <div className={`flex items-center justify-between mb-1.5 text-xs font-semibold ${dark ? "text-slate-300" : "text-slate-800"}`}>
                <span>Administrator Account Activation Link</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">Dispatched to Admin</span>
              </div>
              <div className={`flex items-center justify-between gap-2 p-2 rounded-lg border font-mono text-[11px] break-all ${dark ? "bg-black/50 border-slate-800 text-slate-300" : "bg-white border-slate-300 text-slate-800"}`}>
                <span className="truncate">{approvalResult.activationLink}</span>
                <button
                  type="button"
                  onClick={handleCopyActivationLink}
                  className={`px-2.5 py-1 rounded shrink-0 flex items-center gap-1 transition-colors cursor-pointer ${
                    dark ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t ${dark ? "border-slate-800" : "border-slate-100"}`}>
            <Link
              to="/platform-admin/institutions"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs font-semibold shadow-xs transition-all"
            >
              Go to Institutions Directory
            </Link>
            <a
              href={`/college/${approvalResult.institution.slug}`}
              target="_blank"
              rel="noreferrer"
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-medium border transition-all inline-flex items-center justify-center gap-1.5 ${
                dark
                  ? "bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
              }`}
            >
              <span>Preview Tenant Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (
        /* Approval Form */
        <form onSubmit={handleApprove} className="space-y-6">
          {/* Summary Banner */}
          <div
            className={`p-5 rounded-2xl border space-y-3 transition-all ${
              dark ? "bg-[#0B1528] border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-300" : "text-slate-700"}`}>
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Target Institution Summary</span>
            </div>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs ${dark ? "text-slate-300" : "text-slate-700"}`}>
              <div>
                <span className={`text-[11px] block ${dark ? "text-slate-400" : "text-slate-500"}`}>Institution Name:</span>
                <span className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{application.institutionName}</span>
              </div>
              <div>
                <span className={`text-[11px] block ${dark ? "text-slate-400" : "text-slate-500"}`}>Type &amp; Location:</span>
                <span>{application.institutionType} • {application.city}, {application.state}</span>
              </div>
              <div>
                <span className={`text-[11px] block ${dark ? "text-slate-400" : "text-slate-500"}`}>Representative Authority:</span>
                <span>{application.representativeName} ({application.representativeDesignation})</span>
              </div>
              <div>
                <span className={`text-[11px] block ${dark ? "text-slate-400" : "text-slate-500"}`}>Official Email:</span>
                <span className="font-mono">{application.representativeEmail}</span>
              </div>
            </div>
          </div>

          {/* Tenant Configuration Card */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-all ${
              dark ? "bg-[#0B1528] border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className={`flex items-center gap-2 pb-3 border-b ${dark ? "border-slate-800" : "border-slate-100"}`}>
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className={`text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>Tenant Portal Parameters</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  Institutional URL Slug <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-[#0B3D91] ${
                  dark ? "bg-slate-900 border-slate-700/80" : "bg-white border-slate-300"
                }`}>
                  <span className={`px-3 font-mono text-[11px] border-r ${dark ? "text-slate-400 border-slate-800 bg-slate-950/60" : "text-slate-500 border-slate-200 bg-slate-50"}`}>
                    /college/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="e.g. knit"
                    className={`w-full bg-transparent px-3 py-2 font-mono text-xs focus:outline-none ${dark ? "text-slate-100" : "text-slate-900"}`}
                  />
                  <span className={`px-3 font-mono text-[11px] border-l ${dark ? "text-slate-400 border-slate-800 bg-slate-950/60" : "text-slate-500 border-slate-200 bg-slate-50"}`}>
                    .acadexa-fb.vercel.app
                  </span>
                </div>
                <p className={`text-[11px] mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Students and faculty will access their portal at: <span className="text-blue-600 dark:text-blue-400 font-mono">/college/{slug || "[slug]"}</span>
                </p>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  Allowed Email Domain Restrictions
                </label>
                <input
                  type="text"
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                  placeholder="knit.ac.in, alumni.knit.ac.in"
                  className={`w-full border rounded-xl px-3.5 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0B3D91] ${
                    dark ? "bg-slate-900 border-slate-700/80 text-slate-100" : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
                <p className={`text-[11px] mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Comma-separated domains for student and faculty Google Workspace / SSO login verification.
                </p>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  Verification &amp; Approval Notes
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record verification decision, authority confirmation, or special tenant rules..."
                  className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B3D91] ${
                    dark ? "bg-slate-900 border-slate-700/80 text-slate-100" : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Root Administrator Account Creation Notice */}
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${dark ? "bg-blue-500/10 border-blue-500/20 text-blue-200" : "bg-blue-50 border-blue-200 text-blue-900"}`}>
            <div className={`flex items-center gap-2 font-semibold ${dark ? "text-white" : "text-[#0B3D91]"}`}>
              <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Root Institutional Administrator Provisioning</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>
              An institutional root administrator account will be provisioned for <strong>{application.representativeName}</strong> (<span className="font-mono">{application.representativeEmail}</span>). An activation email with a one-time credential setup link will automatically be logged and dispatched.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to={`/platform-admin/applications/${id}`}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                dark ? "bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Provisioning Tenant...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Institution &amp; Provision Tenant</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PlatformApproveApplicationPage;
