import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { Shield, Lock, Mail, ArrowRight } from "lucide-react";
import { usePlatformAuth } from "../../context/PlatformAuthContext.js";
import { AuthPageLayout } from "../../components/common/AuthPageLayout.js";

export const PlatformLoginPage: React.FC = () => {
  const { platformLogin, isPlatformAuthenticated } = usePlatformAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/platform-admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isPlatformAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isPlatformAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both administrator email and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await platformLogin(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      let finalMessage = "Invalid administrator email or password. Please verify your credentials and try again.";
      try {
        if (typeof err === "string" && err.trim() && err !== "[object Object]") {
          finalMessage = err;
        } else if (err?.response?.data?.message) {
          finalMessage = err.response.data.message;
        } else if (err?.message && typeof err.message === "string" && err.message !== "[object Object]") {
          finalMessage = err.message;
        }
      } catch (e) {
        // Fallback
      }
      if (typeof finalMessage !== "string" || finalMessage.includes("[object Object]")) {
        finalMessage = "Invalid administrator email or password. Please verify your credentials and try again.";
      }
      setErrorMessage(finalMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthPageLayout
      icon={<Shield className="w-6 h-6 text-[#0B3D91]" />}
      title="Acadexa Platform Administration"
      subtitle="Sign in to manage registered institutions and platform-level settings"
      errorMessage={errorMessage}
      backLink={{
        to: "/",
        label: "Back to Acadexa Home",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Platform Admin Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder="admin@acadexa.in"
              className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-[#0B3D91] hover:underline font-medium cursor-pointer border-0 bg-transparent"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder="••••••••••••"
              className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer border-0 active:scale-[0.99]"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <span>Sign In to Acadexa Admin</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Institution Login */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          Are you an institution administrator or student?{" "}
          <Link
            to="/institution-login"
            className="text-[#0B3D91] hover:underline font-semibold inline-flex items-center gap-1 ml-1"
          >
            <span>Institution Login</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
};

export default PlatformLoginPage;

