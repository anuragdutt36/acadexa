import React, { useState, useEffect } from "react";
import {
  Plus, Download, Upload, Star, Users, UserCheck, Building2, Trash2, Edit, X, Loader2, BookOpen, AlertTriangle,
  KeyRound, Copy, Check, Eye, EyeOff, CheckCircle2, Lock
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext.js";
import { useTenant } from "../../context/TenantContext.js";
import {
  ModHeader, ModBtn, ModSearchBar, ModTable, ModTd, cn
} from "../../components/admin/AdminShared.js";
import { Badge } from "../../components/common/Badge.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { facultyService } from "../../services/faculty.service.js";
import { academicService } from "../../services/academic.service.js";
import { mappingService } from "../../services/mapping.service.js";
import { analyticsService } from "../../services/analytics.service.js";

interface FacultyMember {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  role?: "faculty" | "hod" | "dean";
  academicScope?: string;
  branchId: {
    _id: string;
    code: string;
    name: string;
  } | null;
  status: "active" | "inactive";
}

export const Faculty: React.FC = () => {
  const { dark } = useTheme();
  const { portalSlug } = useTenant();

  // Search & Filter States
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Data States
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);

  // Page Loading States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<FacultyMember | null>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    department: "Computer Science",
    designation: "Assistant Professor",
    role: "faculty" as "faculty" | "hod" | "dean",
    academicScope: "Computer Science Department",
    branchId: "",
    status: "active" as "active" | "inactive",
    password: "Faculty@123",
  });

  // Password Reset Modal States
  const [resetModalFaculty, setResetModalFaculty] = useState<FacultyMember | null>(null);
  const [customResetPassword, setCustomResetPassword] = useState("Faculty@123");
  const [showResetPass, setShowResetPass] = useState(false);
  const [resetSuccessData, setResetSuccessData] = useState<{ email: string; name: string; password: string; role: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Deletion State
  const [deleteConfirm, setDeleteConfirm] = useState<FacultyMember | null>(null);

  // Import State
  const [importOpen, setImportOpen] = useState(false);
  const [importingFile, setImportingFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importStats, setImportStats] = useState({ total: 0, valid: 0, duplicates: 0 });

  // Sidebar details panel (for click on Assigned Subjects)
  const [activeFacultySubjects, setActiveFacultySubjects] = useState<{ name: string; list: string[] } | null>(null);

  const textPrimary = dark ? "text-white" : "text-[#0D1B3E]";
  const textSub = dark ? "text-blue-200/70" : "text-[#5A6E8E]";
  const cardBg = dark ? "bg-white/5 border-white/10" : "bg-white border-[#0B3D91]/8 shadow-sm";
  const inputCls = dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]";

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const facRes = await facultyService.getFacultyList();
      if (facRes?.success) setFaculty(facRes.data);

      const branchRes = await academicService.getBranches();
      if (branchRes?.success) setBranches(branchRes.data);

      const mapRes = await mappingService.getMappings();
      if (mapRes?.success) setMappings(mapRes.data);

      const rankRes = await analyticsService.getFacultyRanking();
      if (rankRes?.success) setRankings(rankRes.data);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load faculty information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-generate employeeId for new profiles
  const openAddModal = () => {
    setEditItem(null);
    setShowFormPassword(false);
    const nextNum = faculty.length + 1;
    const generatedId = `FAC-${String(nextNum).padStart(3, "0")}`;
    setForm({
      employeeId: generatedId,
      name: "",
      email: "",
      phone: "",
      department: "Computer Science",
      designation: "Assistant Professor",
      role: "faculty",
      academicScope: "Computer Science Department",
      branchId: branches[0]?._id || "",
      status: "active",
      password: "Faculty@123",
    });
    setModalOpen(true);
  };

  const openEditModal = (item: FacultyMember) => {
    setEditItem(item);
    setShowFormPassword(false);
    setForm({
      employeeId: item.employeeId,
      name: item.name,
      email: item.email,
      phone: item.phone || "",
      department: item.department || "Computer Science",
      designation: item.designation,
      role: item.role || "faculty",
      academicScope: item.academicScope || "Department Scope",
      branchId: item.branchId?._id || "",
      status: item.status,
      password: "",
    });
    setModalOpen(true);
  };

  const openResetPasswordModal = (item: FacultyMember) => {
    setResetModalFaculty(item);
    setCustomResetPassword("Faculty@123");
    setShowResetPass(false);
  };

  const handleQuickResetPassword = async (targetFaculty: FacultyMember, passToSet?: string) => {
    setSubmitting(true);
    try {
      const finalPass = passToSet && passToSet.trim().length > 0 ? passToSet.trim() : "Faculty@123";
      const res = await facultyService.resetPassword(targetFaculty._id, finalPass);
      if (res?.success) {
        setResetModalFaculty(null);
        setResetSuccessData({
          email: targetFaculty.email,
          name: targetFaculty.name,
          password: finalPass,
          role: targetFaculty.role || "faculty",
        });
        loadData();
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.designation) {
      showNotification("error", "Full Name, College Email, and Designation are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.toLowerCase().trim())) {
      showNotification("error", "Email must be a valid official college email address.");
      return;
    }

    setSubmitting(true);
    try {
      if (editItem) {
        // Update Faculty
        await facultyService.updateFaculty(editItem._id, {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          designation: form.designation,
          role: form.role,
          academicScope: form.academicScope,
          status: form.status,
          password: form.password && form.password.trim().length > 0 ? form.password.trim() : undefined,
        });
        setModalOpen(false);
        loadData();
        if (form.password && form.password.trim().length > 0) {
          setResetSuccessData({
            email: form.email,
            name: form.name,
            password: form.password.trim(),
            role: form.role,
          });
        } else {
          showNotification("success", `${form.role.toUpperCase()} record updated successfully!`);
        }
      } else {
        // Create Faculty
        if (faculty.some(f => f.employeeId === form.employeeId.toUpperCase())) {
          throw new Error("Employee ID already exists");
        }
        await facultyService.createFaculty({
          employeeId: form.employeeId,
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          designation: form.designation,
          role: form.role,
          academicScope: form.academicScope,
          status: form.status,
          password: form.password || "Faculty@123",
        });
        setModalOpen(false);
        loadData();
        setResetSuccessData({
          email: form.email,
          name: form.name,
          password: form.password || "Faculty@123",
          role: form.role,
        });
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to submit details.");
    } finally {
      setSubmitting(false);
    }
  };

  // Direct toggle status directly from the table
  const handleToggleStatus = async (item: FacultyMember) => {
    try {
      const nextStatus = item.status === "active" ? "inactive" : "active";
      const res = await facultyService.updateFaculty(item._id, { status: nextStatus });
      if (res?.success) {
        showNotification("success", `${item.name} is now marked ${nextStatus}.`);
        loadData();
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to toggle status.");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const hasMappings = mappings.some(m => {
        const fid = m.facultyId && typeof m.facultyId === "object" ? m.facultyId._id : m.facultyId;
        return fid === deleteConfirm._id;
      });
      if (hasMappings) {
        showNotification("error", `Cannot delete ${deleteConfirm.name} because they are actively assigned to subjects. Please mark them as Inactive instead.`);
        setDeleteConfirm(null);
        return;
      }

      await facultyService.deleteFaculty(deleteConfirm._id);
      showNotification("success", "Record deleted successfully.");
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete record.");
      setDeleteConfirm(null);
    }
  };

  const getFilteredFaculty = () => {
    let list = [...faculty];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(f => {
        const matchingMappings = mappings.filter(m => m.facultyId?._id === f._id && (m.subjectId?.name || "").toLowerCase().includes(q));
        return f.name.toLowerCase().includes(q) ||
               f.email.toLowerCase().includes(q) ||
               (f.phone || "").toLowerCase().includes(q) ||
               matchingMappings.length > 0;
      });
    }

    if (selectedStatus) {
      list = list.filter(f => f.status === selectedStatus);
    }

    if (selectedRole) {
      list = list.filter(f => (f.role || "faculty") === selectedRole);
    }

    return list;
  };

  const filteredFaculty = getFilteredFaculty();

  const getFacultyRating = (id: string) => {
    const rankInfo = rankings.find(r => r.id === id);
    return rankInfo && rankInfo.rating > 0 ? rankInfo.rating : 4.0;
  };

  const handleExport = () => {
    if (filteredFaculty.length === 0) {
      showNotification("error", "No data to export.");
      return;
    }
    const headers = ["Name", "Role", "Designation", "College Email", "Phone", "Assigned Subjects", "Avg Rating", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredFaculty.map(f => {
        const subjCount = mappings.filter(m => m.facultyId?._id === f._id).length;
        const rating = getFacultyRating(f._id);
        return [
          `"${f.name}"`,
          `"${(f.role || "faculty").toUpperCase()}"`,
          `"${f.designation}"`,
          `"${f.email}"`,
          `"${f.phone || "—"}"`,
          `"${subjCount} Subjects"`,
          `"${rating}"`,
          `"${f.status}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "institutional_users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("success", `Exported ${filteredFaculty.length} records successfully.`);
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingFile(file);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      if (lines.length <= 1) throw new Error("File is empty");

      const parsedRows: any[] = [];
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      
      const idIdx = headers.indexOf("faculty id");
      const nameIdx = headers.indexOf("name");
      const deptIdx = headers.indexOf("department");
      const emailIdx = headers.indexOf("college email");
      const phoneIdx = headers.indexOf("phone");
      const desIdx = headers.indexOf("designation");
      const statusIdx = headers.indexOf("status");

      if (idIdx === -1 || nameIdx === -1 || emailIdx === -1 || desIdx === -1) {
        throw new Error("Missing headers. Must contain: Faculty ID, Name, College Email, Designation");
      }

      let duplicates = 0;
      let valid = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(",").map(c => c.trim());
        if (cols.length < headers.length) continue;

        const id = cols[idIdx];
        const email = cols[emailIdx];
        const isDupe = faculty.some(f => f.employeeId === id.toUpperCase() || f.email.toLowerCase() === email.toLowerCase());

        if (isDupe) duplicates++;
        else valid++;

        parsedRows.push({
          employeeId: id,
          name: cols[nameIdx],
          branchName: deptIdx !== -1 ? cols[deptIdx] : "Computer Science",
          email: email,
          phone: phoneIdx !== -1 ? cols[phoneIdx] : "",
          designation: cols[desIdx],
          status: statusIdx !== -1 ? cols[statusIdx] : "active",
          isDupe
        });
      }

      setImportPreview(parsedRows);
      setImportStats({ total: parsedRows.length, valid, duplicates });
    } catch (err: any) {
      showNotification("error", err.message || "Failed to parse import preview.");
      setImportingFile(null);
    }
  };

  const confirmImport = async () => {
    if (!importingFile) return;
    setSubmitting(true);
    try {
      const res = await facultyService.importFaculty(importingFile);
      if (res?.success) {
        showNotification("success", `Successfully imported ${res.data?.count || 0} profiles!`);
        setImportOpen(false);
        setImportingFile(null);
        setImportPreview([]);
        loadData();
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to import file.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalCount = faculty.length;
  const activeCount = faculty.filter(f => f.status === "active").length;
  const uniqueBranches = Array.from(new Set(faculty.map(f => f.branchId?._id).filter(Boolean))).length;
  
  const getOverallRatingAvg = () => {
    const ratedFaculty = faculty.map(f => getFacultyRating(f._id)).filter(r => r > 0);
    if (ratedFaculty.length === 0) return "4.1";
    const sum = ratedFaculty.reduce((a, b) => a + b, 0);
    return (sum / ratedFaculty.length).toFixed(1);
  };

  return (
    <div>
      <ModHeader title="Institutional User Management" sub="Manage authorized Faculty, HOD, and Dean profiles for Google OAuth passwordless access" dark={dark}>
        <ModBtn icon={Plus} variant="primary" onClick={openAddModal}>Add Record</ModBtn>
        <ModBtn icon={Download} variant="outline" onClick={handleExport}>Export</ModBtn>
        <ModBtn icon={Upload} variant="outline" onClick={() => setImportOpen(true)}>Import CSV</ModBtn>
      </ModHeader>

      {notification && (
        <div className={cn(
          "mb-5 p-4 rounded-2xl border text-sm flex items-center justify-between shadow-sm",
          notification.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300"
        )}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs font-bold underline cursor-pointer border-0 bg-transparent text-inherit ml-2">Dismiss</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Members", value: totalCount, icon: Users, color: "bg-[#0B3D91]" },
          { label: "Active Authorized", value: activeCount, icon: UserCheck, color: "bg-emerald-500" },
          { label: "Departments", value: uniqueBranches || branches.length, icon: Building2, color: "bg-[#3B82F6]" },
          { label: "Avg Rating", value: `${getOverallRatingAvg()} ★`, icon: Star, color: "bg-amber-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={cn("rounded-2xl p-5 border", cardBg)}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color)}><Icon size={18} className="text-white" /></div>
            <div className={cn("text-2xl font-bold mb-0.5", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
            <div className={cn("text-xs", textSub)}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-4">
        <ModSearchBar dark={dark} placeholder="Search by name, email or phone…" value={search} onChange={setSearch} />
        
        <select
          className={cn("px-4 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer w-full sm:w-auto", dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]")}
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">All Roles</option>
          <option value="faculty" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Faculty</option>
          <option value="hod" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">HOD</option>
          <option value="dean" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Dean</option>
        </select>

        <select
          className={cn("px-4 py-2.5 rounded-xl border text-sm focus:outline-none cursor-pointer w-full sm:w-auto", dark ? "bg-white/8 border-white/10 text-white" : "bg-[#F0F4FA] border-[#0B3D91]/10 text-[#0D1B3E]")}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">All Status</option>
          <option value="active" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Active</option>
          <option value="inactive" className="bg-white text-[#0D1B3E] dark:bg-[#132052] dark:text-white text-xs">Inactive</option>
        </select>

        {(selectedStatus || selectedRole || search) && (
          <button onClick={() => { setSelectedStatus(""); setSelectedRole(""); setSearch(""); setCurrentPage(1); }} className="text-xs font-bold text-red-500 hover:underline cursor-pointer border-0 bg-transparent">Clear Filters</button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-[#0B3D91]" />
          <p className={cn("text-sm mt-3 font-medium", textSub)}>Loading user database...</p>
        </div>
      ) : (
        <ModTable
          dark={dark}
          headers={["Name", "Authorized Role", "Designation", "Official Email", "Assigned Scope", "Status", "Actions"]}
          totalCount={filteredFaculty.length}
          page={currentPage}
          onPageChange={setCurrentPage}
        >
          {filteredFaculty.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-xs font-semibold text-gray-400">No institutional user records found.</td>
            </tr>
          ) : (
            filteredFaculty.slice((currentPage - 1) * 10, currentPage * 10).map((r) => {
              const roleVal = r.role || "faculty";
              return (
                <tr key={r._id} className={cn("transition-colors", dark ? "hover:bg-white/5" : "hover:bg-[#F8FAFD]")}>
                  <ModTd>
                    <span className={cn("font-bold text-sm", textPrimary)}>{r.name}</span>
                  </ModTd>
                  <ModTd>
                    <Badge variant={roleVal === "dean" ? "info" : roleVal === "hod" ? "warning" : "default"}>
                      {roleVal.toUpperCase()}
                    </Badge>
                  </ModTd>
                  <ModTd><span className={textSub}>{r.designation}</span></ModTd>
                  <ModTd><span className={textSub}>{r.email}</span></ModTd>
                  <ModTd><span className={textSub}>{r.academicScope || r.department || "General"}</span></ModTd>
                  <ModTd>
                    <button
                      onClick={() => handleToggleStatus(r)}
                      title="Click to toggle status"
                      className="cursor-pointer border-0 bg-transparent text-left"
                    >
                      <Badge variant={r.status === "active" ? "success" : "error"}>
                        {r.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </ModTd>
                  <ModTd>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openResetPasswordModal(r)}
                        title="Reset / Edit Password"
                        className="p-2 rounded-xl text-amber-500 hover:bg-amber-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => openEditModal(r)}
                        title="Edit Details"
                        className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(r)}
                        title="Delete Record"
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </ModTd>
                </tr>
              );
            })
          )}
        </ModTable>
      )}

      {/* --- Add / Edit User Modal --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cn("font-bold text-lg", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {editItem ? "Edit" : "Create"} Institutional Record
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-[#5A6E8E] hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"><X size={18} /></button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Sharma"
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Official Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. faculty@college.ac.in"
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Authorized System Role</label>
                <select
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none font-bold", inputCls)}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                >
                  <option value="faculty">Faculty</option>
                  <option value="hod">HOD (Head of Department)</option>
                  <option value="dean">DEAN (Academic Dean)</option>
                </select>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Associate Professor / Dean Academics"
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Assigned Scope / Department</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science Department or All Departments"
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.academicScope}
                  onChange={(e) => setForm({ ...form, academicScope: e.target.value })}
                />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textSub)}>Account Status</label>
                <select
                  required
                  className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none", inputCls)}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                >
                  <option value="active">Active (Authorized)</option>
                  <option value="inactive">Inactive (Deauthorized)</option>
                </select>
              </div>

              {/* Password Management in Add / Edit Modal */}
              <div className={cn("p-3.5 rounded-2xl border space-y-2", dark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Lock size={13} className="text-[#0B3D91] dark:text-blue-400" />
                    <label className={cn("text-xs font-bold", textPrimary)}>
                      {editItem ? "Change Login Password" : "Login Password"}
                    </label>
                  </div>
                  {editItem ? (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, password: "Faculty@123" })}
                      className="text-[10px] text-blue-500 font-bold hover:underline cursor-pointer border-0 bg-transparent"
                    >
                      Use Default (Faculty@123)
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      Default Assigned
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showFormPassword ? "text" : "password"}
                    placeholder={editItem ? "Leave empty to keep existing password" : "e.g. Faculty@123"}
                    className={cn("w-full px-3 py-2 pr-9 rounded-xl border text-xs focus:outline-none font-mono", inputCls)}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border-0 bg-transparent cursor-pointer p-0"
                  >
                    {showFormPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400">
                  {editItem
                    ? "Enter a new password to reset it, or leave blank to keep current credentials."
                    : "The faculty/HOD/dean will use this password to sign into the institution portal."}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B3D91] text-white text-xs font-bold hover:bg-[#0a348a] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60 border-0"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  {editItem ? "Save Changes" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Deletion Confirmation Dialog --- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-sm shadow-2xl relative text-center",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <h4 className={cn("text-base font-bold mb-2", textPrimary)}>Confirm Deletion</h4>
            <p className={cn("text-xs mb-6", textSub)}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer border-0"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Clickable Assigned Subjects Drawer Panel --- */}
      {activeFacultySubjects && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-300">
          <div className={cn(
            "w-80 h-full p-6 shadow-2xl relative flex flex-col justify-between animate-in slide-in-from-right duration-300",
            dark ? "bg-[#132052] border-l border-white/10 text-white" : "bg-white border-l border-gray-100 text-[#0D1B3E]"
          )}>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Assigned Subjects</h4>
                <button onClick={() => setActiveFacultySubjects(null)} className="p-1 rounded-lg text-[#5A6E8E] hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"><X size={18} /></button>
              </div>
              <p className={cn("text-xs font-medium mb-4", textSub)}>Subject mapping for <strong>{activeFacultySubjects.name}</strong>:</p>
              <div className="space-y-2">
                {activeFacultySubjects.list.map((sub, i) => (
                  <div key={i} className={cn("p-3 rounded-xl border text-xs font-semibold flex items-center gap-2", dark ? "bg-white/5 border-white/10" : "bg-[#EEF2F8] border-[#0B3D91]/10")}>
                    <BookOpen size={14} className="text-[#0B3D91] dark:text-blue-400" />
                    <span>{sub}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setActiveFacultySubjects(null)}
              className="w-full py-2.5 rounded-xl bg-[#0B3D91] text-white text-xs font-bold hover:bg-[#0a348a] cursor-pointer border-0"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}

      {/* --- Import Faculty Dialog --- */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cn("font-bold text-lg", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Import Faculty Profiles
              </h3>
              <button
                onClick={() => {
                  setImportOpen(false);
                  setImportingFile(null);
                  setImportPreview([]);
                }}
                className="p-1 rounded-lg text-[#5A6E8E] hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {!importingFile ? (
                <div className={cn("border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center", dark ? "border-white/10 bg-white/5" : "border-[#0B3D91]/10 bg-[#EEF2F8]")}>
                  <Upload size={32} className="text-gray-400 mb-3" />
                  <p className={cn("text-xs font-bold mb-1.5", textPrimary)}>Choose CSV or Excel sheet to upload</p>
                  <p className="text-[10px] text-gray-400 mb-4">Required columns: Faculty ID, Name, Department, College Email, Designation</p>
                  <label className="inline-flex">
                    <input
                      type="file"
                      accept=".csv, .xlsx"
                      className="hidden"
                      onChange={handleImportFileChange}
                    />
                    <div className="px-4 py-2.5 rounded-xl bg-[#0B3D91] hover:bg-[#0a348a] text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-[#0B3D91]/20">
                      Select File
                    </div>
                  </label>
                </div>
              ) : (
                <>
                  <div className={cn("p-4 rounded-xl flex items-center justify-between", dark ? "bg-white/5" : "bg-[#EEF2F8]")}>
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-[#3B82F6]" />
                      <div className="text-left">
                        <p className={cn("text-xs font-bold", textPrimary)}>{importingFile.name}</p>
                        <p className="text-[10px] text-gray-400">{(importingFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setImportingFile(null);
                        setImportPreview([]);
                      }}
                      className="text-xs font-bold text-red-500 hover:underline cursor-pointer border-0 bg-transparent"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { label: "Total Rows", val: importStats.total, color: textPrimary },
                      { label: "New / Valid", val: importStats.valid, color: "text-emerald-500" },
                      { label: "Duplicates", val: importStats.duplicates, color: "text-amber-500" }
                    ].map(({ label, val, color }) => (
                      <div key={label} className={cn("p-3 rounded-xl border text-center", dark ? "bg-white/5 border-white/10" : "bg-[#F8FAFD] border-[#0B3D91]/10")}>
                        <div className={cn("text-base font-bold", color)}>{val}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Preview list */}
                  <div className={cn("max-h-48 overflow-y-auto border rounded-xl divide-y", dark ? "border-white/10 divide-white/5" : "border-gray-150 divide-gray-100")}>
                    {importPreview.map((row, idx) => (
                      <div key={idx} className="p-3 text-left flex items-start justify-between text-[11px]">
                        <div>
                          <p className={cn("font-bold", textPrimary)}>{row.name} ({row.employeeId})</p>
                          <p className="text-gray-400">{row.email} · {row.branchName} · {row.designation}</p>
                        </div>
                        {row.isDupe ? (
                          <Badge variant="warning">Duplicate (Will Update)</Badge>
                        ) : (
                          <Badge variant="success">New</Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setImportOpen(false);
                        setImportingFile(null);
                        setImportPreview([]);
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmImport}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-[#0B3D91] text-white text-xs font-bold hover:bg-[#0a348a] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60 border-0"
                    >
                      {submitting && <Loader2 size={13} className="animate-spin" />}
                      Import Now
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* --- Quick Reset / Change Password Dialog --- */}
      {resetModalFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200",
            dark ? "bg-[#132052] border-white/10" : "bg-white border-[#0B3D91]/10"
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className={cn("font-bold text-base", textPrimary)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Reset Account Password
                  </h3>
                  <p className={cn("text-xs", textSub)}>{resetModalFaculty.name} ({resetModalFaculty.email})</p>
                </div>
              </div>
              <button
                onClick={() => setResetModalFaculty(null)}
                className="p-1 rounded-lg text-[#5A6E8E] hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer border-0 bg-transparent"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={cn("text-xs font-semibold", textSub)}>New Password</label>
                  <button
                    type="button"
                    onClick={() => setCustomResetPassword("Faculty@123")}
                    className="text-[10px] text-blue-500 font-bold hover:underline cursor-pointer border-0 bg-transparent"
                  >
                    Reset to Default (Faculty@123)
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showResetPass ? "text" : "password"}
                    required
                    placeholder="Enter new password"
                    className={cn("w-full px-3 py-2.5 pr-10 rounded-xl border text-sm focus:outline-none font-mono", inputCls)}
                    value={customResetPassword}
                    onChange={(e) => setCustomResetPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPass(!showResetPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border-0 bg-transparent cursor-pointer p-0"
                  >
                    {showResetPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Once reset, the faculty member can immediately use this new password to sign in.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalFaculty(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || !customResetPassword.trim()}
                  onClick={() => handleQuickResetPassword(resetModalFaculty, customResetPassword)}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 border-0 shadow-md shadow-amber-600/20"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Credential Success Notice Modal --- */}
      {resetSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "rounded-3xl border p-6 w-full max-w-md shadow-2xl relative text-center animate-in zoom-in-95 duration-200",
            dark ? "bg-[#132052] border-white/10 text-white" : "bg-white border-[#0B3D91]/10 text-[#0D1B3E]"
          )}>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={26} />
            </div>
            <h3 className="font-bold text-lg mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Login Credentials Ready
            </h3>
            <p className={cn("text-xs mb-4", textSub)}>
              Account ready for <strong>{resetSuccessData.name}</strong> ({resetSuccessData.role.toUpperCase()}). You can share these details with the member:
            </p>

            <div className={cn("p-4 rounded-2xl border text-left space-y-2 mb-5 font-mono text-xs", dark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-sans">Login Portal:</span>
                <span className="font-bold text-[11px] truncate max-w-[200px]">{window.location.origin}/college/{portalSlug || "knit"}/login</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-sans">Email (User):</span>
                <span className="font-bold text-blue-500">{resetSuccessData.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-sans">Password:</span>
                <span className="font-bold text-emerald-500">{resetSuccessData.password}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const text = `Acadexa Portal Login\nURL: ${window.location.origin}/college/${portalSlug || "knit"}/login\nEmail: ${resetSuccessData.email}\nPassword: ${resetSuccessData.password}`;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0B3D91] hover:bg-[#0a348a] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border-0 shadow-md shadow-[#0B3D91]/20"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? "Copied Credentials!" : "Copy Credentials"}
              </button>
              <button
                type="button"
                onClick={() => setResetSuccessData(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faculty;
