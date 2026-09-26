import React, { useState } from "react";
import { useSearchParams, Link } from "react-router";
import {
  Search,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Shield,
  Info
} from "lucide-react";
import { applicationService, ApplicationStatusResult } from "../../services/application.service.js";

export const ApplicationStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get("ref") || "";

  const [referenceId, setReferenceId] = useState(initialRef);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<ApplicationStatusResult | null>(null);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!referenceId.trim() || !email.trim()) {
      setErrorMsg("Please enter both your Application Reference ID and Representative Email.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setResult(null);

    try {
      const res = await applicationService.checkStatus(referenceId, email);
      if (res && res.success) {
        setResult(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "No application found matching these details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0B3D91] flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-slate-900 text-sm sm:text-base">Acadexa</span>
            <span className="text-xs text-slate-500 block -mt-0.5">Institution Application Tracker</span>
          </div>
        </Link>

        <Link
          to="/"
          className="text-xs font-medium text-slate-600 hover:text-[#0B3D91] transition-colors"
        >
          ← Platform Home
        </Link>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#0B3D91] text-xs font-semibold mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>Onboarding Status Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Track Institution Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
            Check the verification progress of your college or university registration.
          </p>
        </div>

        {/* Lookup Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mb-6">
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Application Reference ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FF-2026-0001"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Representative Official Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. dean.academic@iitd.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Checking Records...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Retrieve Application Status</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Status Result Card */}
        {result && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-[#0B3D91] tracking-wider">
                  {result.referenceId}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {result.institutionName}
                </h2>
                <p className="text-xs text-slate-500">{result.institutionType}</p>
              </div>

              <div className="self-start sm:self-auto">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    result.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : result.status === "PENDING"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : result.status === "UNDER_REVIEW"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {result.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Stepper */}
            <div className="py-2">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-1">
                    ✓
                  </div>
                  <span className="text-slate-800 font-semibold text-[11px]">Submitted</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(result.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                      result.status === "UNDER_REVIEW" || result.status === "APPROVED"
                        ? "bg-blue-100 text-blue-800 font-bold"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {result.status === "APPROVED" ? "✓" : "2"}
                  </div>
                  <span className="text-slate-800 font-semibold text-[11px]">Under Review</span>
                  <span className="text-[10px] text-slate-500">Accreditation</span>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                      result.status === "APPROVED"
                        ? "bg-blue-100 text-blue-800 font-bold"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {result.status === "APPROVED" ? "✓" : "3"}
                  </div>
                  <span className="text-slate-800 font-semibold text-[11px]">Verification</span>
                  <span className="text-[10px] text-slate-500">Domain Match</span>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                      result.status === "APPROVED"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {result.status === "APPROVED" ? "✓" : "4"}
                  </div>
                  <span className="text-slate-800 font-semibold text-[11px]">Tenant Active</span>
                  <span className="text-[10px] text-slate-500">Live Portal</span>
                </div>
              </div>
            </div>

            {/* Public Message Alert */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-700">
              <div className="font-semibold text-slate-900 mb-0.5 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#0B3D91]" />
                <span>Verification State</span>
              </div>
              <p>{result.publicStatusMessage}</p>
            </div>

            {/* If Approved Details */}
            {result.status === "APPROVED" && result.approvedInstitution && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Your Dedicated Institution Portal Is Ready</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Tenant Identifier:</span>
                    <span className="font-mono font-bold text-[#0B3D91]">{result.approvedInstitution.institutionId}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Portal Slug:</span>
                    <span className="font-mono font-bold text-emerald-700">{result.approvedInstitution.slug}</span>
                  </div>
                </div>
                <div className="pt-1">
                  <a
                    href={`/college/${result.approvedInstitution.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-xs transition-all text-xs"
                  >
                    <span>Open College Feedback Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Acadexa Multi-Institution Platform • Verification Engine
      </footer>
    </div>
  );
};

export default ApplicationStatusPage;
