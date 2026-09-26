import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import {
  KeyRound,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles
} from "lucide-react";
import { API_BASE_URL } from "../../services/api.js";
import { AuthPageLayout } from "../../components/common/AuthPageLayout.js";

export const ActivateInstitutionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";
  const referenceId = searchParams.get("ref") || "";

  const [verifying, setVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState("");
  const [appDetails, setAppDetails] = useState<any | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [activatedData, setActivatedData] = useState<any | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!token || !referenceId) {
        setVerifyError("Activation token and Reference ID are missing from the URL.");
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/auth/verify-activation?token=${encodeURIComponent(token)}&referenceId=${encodeURIComponent(referenceId)}`
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Invalid or expired activation link.");
        }
        setAppDetails(data.data);
      } catch (err: any) {
        setVerifyError(err.message || "Could not verify activation token.");
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token, referenceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match. Please verify.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/activate-institution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          referenceId,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to activate administrator account.");
      }

      setActivatedData(data.data);
    } catch (err: any) {
      setSubmitError(err.message || "Activation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageLayout
      icon={<KeyRound className="w-6 h-6" />}
      title="Activate Institution Portal"
      subtitle={appDetails ? `Set admin password for ${appDetails.institutionName}` : "Set initial administrator credentials"}
      errorMessage={submitError}
      backLink={{
        to: "/",
        label: "Back to Platform Home",
      }}
      footerText="Acadexa Multi-Institution Platform • Administrator Account Activation"
    >
      {verifying ? (
        <div className="text-center py-8 text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-[#0B3D91] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500">Verifying activation credentials...</p>
        </div>
      ) : verifyError ? (
        <div className="text-center space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Activation Link Error</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{verifyError}</p>
          <div className="pt-2">
            <Link
              to="/institution-login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors no-underline"
            >
              <span>Go to Institution Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : activatedData ? (
        /* Activation Success View */
        <div className="text-center space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">Portal Activated Successfully!</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your administrator account is now active. Log in to configure your institution.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
            <div>
              <span className="text-[11px] text-slate-500 block">Administrator Email:</span>
              <span className="font-mono font-semibold text-slate-800">{activatedData.username}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Institution Portal Code:</span>
              <span className="font-mono font-semibold text-[#0B3D91]">{activatedData.portalSlug}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to={activatedData.portalLoginUrl || "/institution-login"}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all no-underline"
            >
              <span>Log In to Institution Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Set Password Form */
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Verified Ref: {appDetails?.referenceId}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Official Administrator Email
              </label>
              <input
                type="text"
                disabled
                value={appDetails?.representativeEmail || ""}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-slate-500 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Set New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="At least 8 characters..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-3.5 pr-10 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer border-0 bg-transparent"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Re-enter your password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer border-0"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Activating Account...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Activate Account &amp; Log In</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </AuthPageLayout>
  );
};

export default ActivateInstitutionPage;
