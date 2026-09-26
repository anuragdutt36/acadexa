import React, { useState } from "react";
import { Search, HelpCircle, Info, Key, ShieldCheck, Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { useSettings } from "../../context/SettingsContext.js";

const getFaqSections = (systemName: string, instituteName: string) => [
  {
    id: "general",
    title: "General",
    icon: Info,
    items: [
      { q: `What is the ${systemName}?`, a: `The ${systemName} is a secure, web-based platform that allows students to submit structured evaluations of faculty members at the end of each academic semester. It helps the institution monitor and improve teaching quality across all departments.` },
      { q: "Why should I submit feedback?", a: `Your feedback directly influences faculty development, curriculum improvements, and academic policies at ${systemName}. It is one of the few mechanisms through which students can officially contribute to the quality of their education — completely anonymously.` },
      { q: "Is feedback mandatory?", a: "Feedback submission is strongly encouraged by the institute. In some departments, submission status may be linked to clearance for examination hall tickets or result release. Please check your department notice board or contact your academic section for the current policy." },
    ],
  },
  {
    id: "login",
    title: "Login & Access",
    icon: Key,
    items: [
      { q: "I cannot log in to the portal.", a: "Ensure you are using your correct institution Google account. Clear your browser cache and try again. If the issue persists, contact the support team." },
      { q: "My assigned subjects are missing from the dashboard.", a: "Subject assignments are synchronized from the academic records system at the start of each semester. If a subject is missing, it may not have been mapped to your section yet. Contact your department's academic coordinator or raise a support ticket from this Help page." },
    ],
  },
  {
    id: "anonymous",
    title: "Anonymous Feedback",
    icon: ShieldCheck,
    items: [
      { q: "Is my feedback truly anonymous?", a: "Yes. The system is architected so that your login credentials are used only to verify that you are eligible to submit feedback and to prevent duplicate submissions. Once eligibility is confirmed, an anonymous token is generated. Your email, name, roll number, or any personally identifying information is never stored alongside your feedback responses." },
      { q: "Can the faculty member see my identity?", a: "No. Faculty members can only view aggregated rating scores and analytics for the subjects they teach. They have no access to individual responses, submission logs, or any information that could link a response to a specific student." },
      { q: "Can the administrator identify which feedback I submitted?", a: "No. The database architecture separates submission status (for duplicate prevention) from the actual feedback content. Even system administrators and database administrators cannot link a feedback record to a student's identity without architectural access that has been deliberately prevented." },
      { q: "Can I edit my feedback after submission?", a: "No. To preserve the integrity and anonymity of the process, submissions are final. Once you click 'Submit Feedback' and confirm on the dialog, your response is recorded and cannot be retrieved, modified, or deleted by you or any other user." },
    ],
  },
  {
    id: "technical",
    title: "Technical Issues",
    icon: Wrench,
    items: [
      { q: "The page is not loading or showing an error.", a: "Try refreshing the page (Ctrl+R or Cmd+R). If the issue continues, clear your browser cache and cookies and try again in a different browser. If the portal displays a maintenance notice, please wait for the scheduled maintenance window to end." },
      { q: "The Submit button is disabled and I cannot proceed.", a: "The Submit button is enabled only after all required rating questions have been answered. Scroll through the feedback form and ensure every question has a selected rating option. The progress indicator at the top of the form shows how many questions remain." },
      { q: "I accidentally closed the browser mid-submission.", a: "Feedback is only saved when you complete the full form and click 'Submit Feedback' followed by the confirmation dialog. If you closed the browser before confirmation, your session was not saved. Return to the portal, log in again, and re-submit the feedback form for that subject." },
    ],
  },
];

export const HelpFAQ: React.FC = () => {
  const { dark } = useTheme();
  const { systemName, instituteName } = useSettings();
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  
  const faqSections = getFaqSections(systemName, instituteName);

  const toggle = (id: string) => setOpenItems(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });

  const filtered = faqSections.map(sec => ({
    ...sec,
    items: sec.items.filter(item =>
      !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(sec => sec.items.length > 0);

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const border = dark ? "border-white/8" : "border-[#0B3D91]/8";
  const cardBg = dark ? "bg-white/5" : "bg-white";
  const sectionHeaderBg = dark ? "bg-white/4" : "bg-[#F8FAFD]";

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className={`text-xl sm:text-2xl font-bold ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Help & FAQ</h1>
        <p className={`text-xs sm:text-sm ${textSub} mt-0.5`}>Find answers to common questions about Acadexa</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6E8E]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search help articles…"
          className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 transition-all shadow-sm ${
            dark
              ? "bg-white/8 border-white/10 text-white placeholder:text-white/30"
              : "bg-white border-[#0B3D91]/10 text-[#0D1B3E] placeholder:text-[#5A6E8E]/60"
          }`}
        />
      </div>

      {/* FAQ Sections */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#EEF2F8] dark:bg-white/5 flex items-center justify-center mb-3">
            <HelpCircle size={28} className="text-[#5A6E8E]" strokeWidth={1.5} />
          </div>
          <p className={`font-semibold ${textPrimary} mb-1`}>No results for "{search}"</p>
          <p className={`text-sm ${textSub}`}>Try different keywords or browse all sections below.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(sec => (
            <div key={sec.id} className={`rounded-2xl border ${border} ${cardBg} shadow-sm overflow-hidden`}>
              {/* Section header */}
              <div className={`flex items-center gap-3 px-5 py-4 border-b ${dark ? "border-white/5" : "border-[#0B3D91]/6"} ${sectionHeaderBg}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? "bg-white/5" : "bg-[#EEF2F8]"}`}>
                  <sec.icon size={15} className={dark ? "text-blue-300" : "text-[#0B3D91]"} />
                </div>
                <span className={`font-bold ${textPrimary} text-sm`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{sec.title}</span>
                <span className={`ml-auto text-xs ${textSub}`}>{sec.items.length} article{sec.items.length !== 1 ? "s" : ""}</span>
              </div>
              {/* Items */}
              <div className={dark ? "divide-y divide-white/5" : "divide-y divide-[#0B3D91]/5"}>
                {sec.items.map((item, idx) => {
                  const itemId = `${sec.id}-${idx}`;
                  const open = openItems.has(itemId);
                  return (
                    <div key={idx}>
                      <button
                        onClick={() => toggle(itemId)}
                        className={`w-full flex items-start justify-between gap-4 px-5 py-4 text-left transition-colors cursor-pointer ${
                          dark ? "hover:bg-white/5" : "hover:bg-[#F8FAFD]"
                        }`}
                      >
                        <span className={`font-semibold text-xs leading-relaxed ${textPrimary}`}>{item.q}</span>
                        {open ? <ChevronUp size={14} className="text-[#5A6E8E] shrink-0 mt-1" /> : <ChevronDown size={14} className="text-[#5A6E8E] shrink-0 mt-1" />}
                      </button>
                      {open && (
                        <div className={`px-5 pb-5 pt-1 text-xs leading-relaxed text-[#5A6E8E] border-t ${
                          dark ? "border-white/5 bg-white/1" : "border-t-[#0B3D91]/4 bg-[#F8FAFD]/50"
                        }`}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HelpFAQ;
