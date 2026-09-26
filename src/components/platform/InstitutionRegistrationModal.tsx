import React, { useState } from "react";
import {
  X,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  Info
} from "lucide-react";
import { applicationService, InstitutionRegistrationPayload } from "../../services/application.service.js";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateStatus?: (refId?: string) => void;
}

export const InstitutionRegistrationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateStatus,
}) => {
  const [formData, setFormData] = useState<InstitutionRegistrationPayload>({
    institutionName: "",
    collegeCode: "",
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

  if (!isOpen) return null;

  // Domain match check
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

  const handleResetAndClose = () => {
    setSubmittedRefId(null);
    setErrorMsg("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200/90 rounded-2xl shadow-xl text-slate-900 my-auto overflow-hidden animate-fade-in">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B3D91] shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Institution Registration
              </h2>
              <p className="text-[11px] text-slate-500">
                Deploy an independent academic feedback &amp; evaluation portal on Acadexa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6">
          {submittedRefId ? (
            /* Success View */
            <div className="text-center py-4 px-2 space-y-3.5 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Registration Submitted Successfully
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Your application has been received and logged. Platform administrators will review your institution credentials and dispatch tenant activation instructions.
                </p>
              </div>

              {/* Reference ID Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left">
                <div className="flex items-center justify-between mb-1 text-slate-500 text-xs">
                  <span className="font-semibold text-slate-700">Application Reference ID</span>
                  <span className="text-[10px] uppercase font-bold text-blue-600">Save this ID</span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
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
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Confirmation sent to: <span className="text-slate-800 font-mono font-medium">{formData.representativeEmail}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                {onNavigateStatus && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateStatus(submittedRefId);
                      handleResetAndClose();
                    }}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Track Application Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Wide 2-Column Application Form */
            <form onSubmit={handleSubmit} className="space-y-3">
              {errorMsg && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Section 1: Institution Information (2-Column Grid) */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B3D91] mb-1.5">
                  1. Institution Information
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                  {/* Institution Name */}
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1 text-xs">
                      Institution Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Indian Institute of Technology Delhi"
                      value={formData.institutionName}
                      onChange={(e) => {
                        const name = e.target.value;
                        const autoSlug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
                        setFormData((prev) => ({
                          ...prev,
                          institutionName: name,
                          isUnverifiedManualEntry: true,
                          collegeCode: prev.collegeCode ? prev.collegeCode : autoSlug,
                        }));
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* College Code / Portal Slug */}
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1 text-xs">
                      College Code / Portal Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. iitd"
                      value={formData.collegeCode || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          collegeCode: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "")
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Portal URL: <span className="text-[#0B3D91] font-semibold">http://localhost:5173/college/{formData.collegeCode || "iitd"}</span>
                    </p>
                  </div>

                  {/* Institution Type */}
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1 text-xs">
                      Institution Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.institutionType}
                      onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                    >
                      <option value="Institute of National Importance">Institute of National Importance</option>
                      <option value="Autonomous Institute">Autonomous Institute</option>
                      <option value="State University">State University</option>
                      <option value="Affiliated College">Affiliated College</option>
                      <option value="Deemed University">Deemed University</option>
                      <option value="Private University">Private University</option>
                      <option value="Polytechnic / Diploma">Polytechnic / Diploma</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Official Website */}
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1 text-xs">
                      Official Website <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="https://iitd.ac.in"
                      value={formData.officialWebsite}
                      onChange={(e) => setFormData({ ...formData, officialWebsite: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Institutional Email */}
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1 text-xs">
                      Institutional Official Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="director@iitd.ac.in"
                      value={formData.officialEmail}
                      onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1 text-xs">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. New Delhi"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1 text-xs">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Delhi"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact & Verification Information (2-Column Grid) */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0B3D91] mb-2 flex items-center justify-between">
                  <span>2. Contact &amp; Verification Details</span>
                  {formData.representativeEmail && isDomainMatch && (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 normal-case">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Domain Match Signal Verified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                  {/* Contact Person */}
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1 text-xs">
                      Contact Person / Representative <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prof. Rangan Banerjee"
                      value={formData.representativeName}
                      onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1 text-xs">
                      Contact Official Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="dean.academics@iitd.ac.in"
                      value={formData.representativeEmail}
                      onChange={(e) => setFormData({ ...formData, representativeEmail: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1 text-xs">
                      Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 11 2659 7135"
                      value={formData.representativePhone}
                      onChange={(e) => setFormData({ ...formData, representativePhone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Designation / Role */}
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1 text-xs">
                      Designation / Role <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Director / Dean Academic Affairs"
                      value={formData.representativeDesignation}
                      onChange={(e) => setFormData({ ...formData, representativeDesignation: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Accreditation / Affiliation (Full Width) */}
                  <div className="md:col-span-2">
                    <label className="block text-slate-800 font-semibold mb-1 text-xs">
                      Accreditation / Affiliation Information
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Institute of National Importance, Autonomous, NAAC A++"
                      value={formData.affiliationDetails}
                      onChange={(e) => setFormData({ ...formData, affiliationDetails: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div className="flex items-start gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="declarationModal"
                  required
                  checked={formData.declarationAccepted}
                  onChange={(e) => setFormData({ ...formData, declarationAccepted: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-[#0B3D91] border-slate-300 mt-0.5 cursor-pointer"
                />
                <label htmlFor="declarationModal" className="text-slate-600 text-[11px] leading-tight select-none cursor-pointer">
                  I certify that I am an authorized institutional representative. Submitting initiates administrative verification before tenant activation.
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default InstitutionRegistrationModal;
