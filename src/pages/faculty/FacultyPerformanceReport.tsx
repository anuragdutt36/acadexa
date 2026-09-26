import React from "react";
import {
  Star,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  X,
  FileText,
  MessageSquare
} from "lucide-react";

interface CategoryScore {
  name: string;
  score: number;
}

interface QuestionScore {
  id: number;
  question: string;
  category: string;
  score: number;
}

interface TrendPoint {
  period: string;
  score: number;
}

export interface ReportData {
  facultyName: string;
  department: string;
  designation: string;
  subjectName: string;
  semester: string;
  sessionName: string;
  academicYear: string;
  responseCount: number;
  overallScore: number;
  categoryScores: CategoryScore[];
  questionScores: QuestionScore[];
  trends: TrendPoint[];
  comments: string[];
  isLowResponseGroup?: boolean;
}

interface Props {
  data: ReportData;
  onClose?: () => void;
}

export const FacultyPerformanceReport: React.FC<Props> = ({ data, onClose }) => {
  const lowSample = data.responseCount < 3;

  return (
    <div className="bg-white dark:bg-[#0D1B3E] rounded-2xl border border-slate-200/90 dark:border-white/10 p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white max-w-4xl mx-auto shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#0B3D91] dark:text-blue-400 text-xs font-semibold mb-2 border border-blue-100 dark:border-blue-500/20">
            <FileText size={12} />
            <span>Acadexa Report • {data.academicYear}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {data.subjectName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-blue-200/70 mt-1">
            {data.facultyName} ({data.designation}) &nbsp;•&nbsp; {data.department} &nbsp;•&nbsp; {data.semester}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Small Sample Warning */}
      {lowSample && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Small Response Sample Notice:</span> This evaluation session contains fewer than 3 responses ({data.responseCount} submission). Detailed individual commentary is restricted to protect collective anonymity and prevent indirect de-anonymization.
          </div>
        </div>
      )}

      {/* Primary Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-blue-200/60 uppercase">
            Overall Average Score
          </span>
          <div className="text-3xl font-extrabold text-[#0B3D91] dark:text-blue-400 mt-1 flex items-center justify-center gap-1">
            <Star className="fill-amber-400 text-amber-400 w-6 h-6" />
            <span>{data.overallScore > 0 ? data.overallScore.toFixed(2) : "N/A"}</span>
            <span className="text-xs text-slate-400">/ 5.00</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-blue-200/60 uppercase">
            Total Submissions
          </span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-center justify-center gap-1">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>{data.responseCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-blue-200/60 uppercase">
            Anonymity Status
          </span>
          <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-2.5 flex items-center justify-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Cryptographically Decoupled</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {data.categoryScores && data.categoryScores.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-[#0B3D91]" />
            <span>Category-Wise Scores</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.categoryScores.map((cat) => (
              <div key={cat.name} className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-200">{cat.name}</span>
                  <span className="text-[#0B3D91] dark:text-blue-400 font-bold">{cat.score.toFixed(1)} / 5.0</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#0B3D91] h-full rounded-full transition-all duration-500"
                    style={{ width: `${(cat.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question-Wise Scores */}
      {data.questionScores && data.questionScores.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Question Parameter Breakdown
          </h3>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Evaluation Parameter</th>
                  <th className="p-3 text-right">Avg Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {data.questionScores.map((q, i) => (
                  <tr key={q.id || i} className="hover:bg-slate-50/70 dark:hover:bg-white/5">
                    <td className="p-3 font-semibold text-slate-500">{i + 1}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{q.question}</td>
                    <td className="p-3 text-right font-bold text-[#0B3D91] dark:text-blue-400">
                      {q.score.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Anonymized Qualitative Remarks */}
      {data.comments && data.comments.length > 0 && !lowSample && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-[#0B3D91]" />
            <span>Anonymized Qualitative Comments</span>
          </h3>
          <div className="space-y-2">
            {data.comments.map((comment, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
              >
                "{comment}"
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400">
        <span>Confidential Acadexa Dossier</span>
        <span>No PII / Identifiable Student Data Retained</span>
      </div>
    </div>
  );
};

export default FacultyPerformanceReport;
