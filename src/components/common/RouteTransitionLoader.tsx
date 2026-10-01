import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router";
import { GraduationCap } from "lucide-react";

export const RouteTransitionLoader: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevPathRef = useRef(location.pathname + location.search);

  useEffect(() => {
    const currentPath = location.pathname + location.search;
    if (prevPathRef.current !== currentPath) {
      prevPathRef.current = currentPath;

      // Scroll smoothly to top on navigation
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

      // Start page transition loading
      setLoading(true);
      setProgress(25);

      const t1 = setTimeout(() => {
        setProgress(70);
      }, 100);

      const t2 = setTimeout(() => {
        setProgress(100);
      }, 240);

      const t3 = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 360);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [location.pathname, location.search]);

  if (!loading && progress === 0) return null;

  return (
    <>
      {/* Top Gradient Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-all duration-200 ease-out"
        style={{
          opacity: loading ? 1 : 0,
        }}
      >
        <div
          className="h-[3px] bg-gradient-to-r from-[#0B3D91] via-[#2563EB] to-[#38BDF8] shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-200 ease-out"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      {/* Floating Micro-Loader Badge */}
      <div
        className={`fixed bottom-6 right-6 z-[99998] pointer-events-none transition-all duration-250 ease-out transform ${
          loading ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
        }`}
      >
        <div className="bg-slate-900/90 backdrop-blur-md text-white text-xs font-medium px-3.5 py-2 rounded-full shadow-lg border border-slate-700/50 flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="tracking-wide">Loading...</span>
        </div>
      </div>
    </>
  );
};

export default RouteTransitionLoader;
