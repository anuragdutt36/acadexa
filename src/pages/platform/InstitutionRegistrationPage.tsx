import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  Shield,
  ArrowLeft,
  Info
} from "lucide-react";
import { applicationService, InstitutionRegistrationPayload } from "../../services/application.service.js";
import { InstitutionNameAutocomplete, CollegeSearchResult } from "../../components/common/InstitutionNameAutocomplete.js";

export const InstitutionRegistrationPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<InstitutionRegistrationPayload>({
    institutionName: "",
    institutionType: "Autonomous Institute",
    officialWebsite: "",
    officialEmail: "",
    state: "Uttar Pradesh",
    city: "",
    fullAddress: "",
    affiliationDetails: "",
    approxStudents: 2500,
    approxFaculty: 150,
    representativeName: "",
    representativeDesignation: "Dean / Director / Principal",
    representativeEmail: "",
    representativePhone: "",
    supportingDocumentUrl: "",
    declarationAccepted: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedRefId, setSubmittedRefId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Domain match signal
  const websiteDomain = formData.officialWebsite
    ? formData.officialWebsite.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].toLowerCase().trim()
    : "";
  const repEmailDomain = formData.representativeEmail
    ? formData.representativeEmail.split("@")[1]?.toLowerCase().trim()
    : "";
  const isDomainMatch = Boolean(
    websiteDomain && repEmailDomain && (repEmailDomain === websiteDomain || repEmailDomain.endsWith(`.${websiteDomain}`))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.institutionName || !formData.officialWebsite || !formData.officialEmail || !formData.representativeEmail || !formData.city || !formData.state) {
      setErrorMsg("Please complete all mandatory institution and representative fields.");
      return;
    }

    if (!formData.declarationAccepted) {
      setErrorMsg("Please acknowledge the authorization declaration to submit.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const payload: InstitutionRegistrationPayload = {
        ...formData,
        fullAddress: formData.fullAddress || `${formData.city}, ${formData.state}`,
      };
      const res = await applicationService.submitApplication(payload);
      if (res && res.success) {
        setSubmittedRefId(res.data.referenceId);
      }
    } catch (err: any) {
      let msg = "Failed to submit institution registration application.";
      if (typeof err === "string" && err.trim()) {
        msg = err;
      } else if (err?.message && typeof err.message === "string" && err.message.trim()) {
        msg = err.message;
      }
      if (msg.includes("pattern") || msg.includes("[object Object]")) {
        msg = "Please verify that all fields contain valid contact information and official URLs.";
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRef = () => {
    if (submittedRefId) {
      try {
        if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(submittedRefId).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }).catch(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          });
        } else {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
      } catch (e) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#0B3D91] selection:text-white">
      {/* Compact Top Navigation */}
      <header className="bg-white/95 border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#0B3D91] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm tracking-tight block leading-tight">
                Acadexa
              </span>
              <span className="text-[10px] text-slate-500 font-medium leading-none">
                Platform Onboarding Gateway
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/status"
              className="text-xs font-semibold text-slate-600 hover:text-[#0B3D91] transition-colors"
            >
              Track Application Status
            </Link>
            <Link
              to="/"
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Viewport-Fitting Container */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-4 sm:py-6">
        <div className="w-full max-w-5xl">
          {submittedRefId ? (
            /* Success Card */
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-4 max-w-xl mx-auto animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Registration Submitted Successfully
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                  Your application has been received and logged. Platform administrators will review your institution credentials and dispatch tenant activation instructions.
                </p>
              </div>

              {/* Reference ID Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-semibold text-slate-700">Application Reference ID</span>
                  <span className="text-[10px] uppercase font-bold text-blue-600">Save this ID</span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="font-mono text-base font-bold text-[#0B3D91] tracking-wider">
                    {submittedRefId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Confirmation sent to: <span className="text-slate-800 font-mono font-medium">{formData.representativeEmail}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/status?ref=${submittedRefId}`)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Track Application Status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <Link
                  to="/"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all text-center"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            /* Structured 2-Column Registration Card */
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs">
              {/* Header inside Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B3D91] shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                      Institution Registration
                    </h1>
                    <p className="text-xs text-slate-500">
                      Onboard your college or university to deploy independent evaluation portals
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                  <Info className="w-3.5 h-3.5 text-[#0B3D91]" />
                  <span>Administrative verification required before activation</span>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-2.5 mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Section 1: Institution Information (2-Column Grid) */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B3D91] mb-2 flex items-center gap-1.5">
                    <span>1. Institution Information</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    {/* Institution Name */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Institution Name <span className="text-red-500">*</span>
                      </label>
                      <InstitutionNameAutocomplete
                        value={formData.institutionName}
                        onChange={(name, isManual) => {
                          setFormData((prev) => ({
                            ...prev,
                            institutionName: name,
                            isUnverifiedManualEntry: isManual,
                          }));
                        }}
                        onSelectSuggestion={(item) => {
                          setFormData((prev) => ({
                            ...prev,
                            institutionName: item.name,
                            isUnverifiedManualEntry: false,
                            city: item.city || prev.city,
                            state: item.state || prev.state,
                            officialWebsite: item.website || prev.officialWebsite,
                            institutionType: item.type || prev.institutionType,
                            collegeCode: item.collegeCode || prev.collegeCode,
                          }));
                        }}
                      />
                    </div>

                    {/* Institution Type */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Institution Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.institutionType}
                        onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                      >
                        <option value="Autonomous Institute">Autonomous Institute</option>
                        <option value="State University">State University</option>
                        <option value="Affiliated College">Affiliated College</option>
                        <option value="Deemed University">Deemed University</option>
                        <option value="Private University">Private University</option>
                        <option value="Institute of National Importance">Institute of National Importance</option>
                        <option value="Polytechnic / Diploma">Polytechnic / Diploma</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Official Website */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Official Website <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="https://knit.ac.in"
                        value={formData.officialWebsite}
                        onChange={(e) => setFormData({ ...formData, officialWebsite: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Institutional Email */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Institutional Official Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="director@knit.ac.in"
                        value={formData.officialEmail}
                        onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sultanpur"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Uttar Pradesh"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact Person & Verification Information (2-Column Grid) */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B3D91] mb-2 flex items-center justify-between">
                    <span>2. Contact &amp; Verification Details</span>
                    {formData.representativeEmail && isDomainMatch && (
                      <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 normal-case">
                        <CheckCircle2 className="w-3 h-3" /> Domain Match Signal Verified
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    {/* Contact Person */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Contact Person / Representative <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Prof. Ramesh Sharma"
                        value={formData.representativeName}
                        onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Contact Email */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Contact Official Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="dean.academic@knit.ac.in"
                        value={formData.representativeEmail}
                        onChange={(e) => setFormData({ ...formData, representativeEmail: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Contact Phone */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Contact Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 9876543210"
                        value={formData.representativePhone}
                        onChange={(e) => setFormData({ ...formData, representativePhone: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Designation / Role */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Designation / Role <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dean Academic Affairs / Director"
                        value={formData.representativeDesignation}
                        onChange={(e) => setFormData({ ...formData, representativeDesignation: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Accreditation / Affiliation (Full Width span) */}
                    <div className="md:col-span-2">
                      <label className="block text-slate-700 font-medium mb-1">
                        Accreditation / Affiliation Information
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. AICTE Approved, Affiliated with AKTU Lucknow, NBA Accredited CSE & EE"
                        value={formData.affiliationDetails}
                        onChange={(e) => setFormData({ ...formData, affiliationDetails: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Declaration Checkbox */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="declarationPage"
                    required
                    checked={formData.declarationAccepted}
                    onChange={(e) => setFormData({ ...formData, declarationAccepted: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-[#0B3D91] border-slate-300 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="declarationPage" className="text-slate-600 text-[11px] leading-tight select-none cursor-pointer">
                    I certify that I am an authorized institutional representative. Submitting initiates administrative verification before tenant activation.
                  </label>
                </div>

                {/* Primary CTA Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Institution Registration</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InstitutionRegistrationPage;
