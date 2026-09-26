import React from "react";
import { Link } from "react-router";
import { GraduationCap, AlertCircle } from "lucide-react";

export interface AuthPageLayoutProps {
  /** Top Header Brand Title (Default: "Acadexa") */
  brandTitle?: string;
  /** Top Header Subtitle (Default: "Intelligent Academic Feedback & Evaluation Platform") */
  brandSubtitle?: string;
  /** Custom action on top-right of header */
  headerRightAction?: React.ReactNode;

  /** Card Header Icon Component */
  icon: React.ReactNode;
  /** Card Primary Heading Title */
  title: string;
  /** Card Subheading Description */
  subtitle: string;

  /** Optional error message banner at top of card content */
  errorMessage?: string;

  /** Main form or card content */
  children: React.ReactNode;

  /** Max width class override (default: max-w-[480px]) */
  maxWidthClass?: string;

  /** Secondary Back Link rendered cleanly below the authentication card */
  backLink?: {
    to?: string;
    label: string;
    onClick?: () => void;
  };

  /** Additional content placed below the card */
  belowCardContent?: React.ReactNode;

  /** Footer text (Default: "Acadexa • Academic Quality Governance") */
  footerText?: string;
}

export const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({
  brandTitle = "Acadexa",
  brandSubtitle = "Intelligent Academic Feedback & Evaluation Platform",
  headerRightAction,
  icon,
  title,
  subtitle,
  errorMessage,
  children,
  maxWidthClass = "max-w-[450px]",
  backLink,
  belowCardContent,
  footerText,
}) => {
  return (
    <div className="min-h-screen bg-[#F4F6F8] text-slate-900 font-sans flex flex-col justify-center items-center px-4 py-8 sm:py-12">
      {/* Main Authentication Section */}
      <main className={`w-full ${maxWidthClass} my-auto relative z-10`}>
        {/* Auth Card */}
        <div className="bg-white border border-slate-200/60 rounded-[32px] p-10 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {/* Card Hero Icon & Titles */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm text-[#0B3D91] mb-5 mx-auto">
              {icon}
            </div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 leading-snug">
              {title}
            </h1>
            <p className="text-sm text-slate-500 mt-3 max-w-sm mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Optional Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Form & Card Body */}
          {children}
        </div>

        {/* Secondary Back Navigation Link below card */}
        {backLink && (
          <div className="mt-8 text-center">
            {backLink.onClick ? (
              <button
                type="button"
                onClick={backLink.onClick}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer bg-transparent border-0 inline-flex items-center gap-1.5"
              >
                <span>{backLink.label.startsWith("←") ? backLink.label : `← ${backLink.label}`}</span>
              </button>
            ) : (
              <Link
                to={backLink.to || "/"}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors no-underline inline-flex items-center gap-1.5"
              >
                <span>{backLink.label.startsWith("←") ? backLink.label : `← ${backLink.label}`}</span>
              </Link>
            )}
          </div>
        )}

        {belowCardContent}
      </main>

      {/* Consistent Page Footer */}
      {footerText && (
        <footer className="w-full max-w-md text-center text-sm text-slate-400 z-10 pt-6 pb-2">
          {footerText}
        </footer>
      )}
    </div>
  );
};

