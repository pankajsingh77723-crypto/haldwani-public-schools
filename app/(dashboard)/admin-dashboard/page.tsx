"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Users, UserPlus, Shield, CheckCircle, GraduationCap, Loader2, Pencil, Trash2, X, Megaphone, Send, Wallet, IndianRupee, FileText, Star, Briefcase, MessageCircle, Activity, UploadCloud } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Papa from 'papaparse';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import InvoiceModal from "./InvoiceModal";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"analytics" | "staff" | "students" | "noticeboard" | "fees" | "recruitment">("analytics");
  const [activeCohort, setActiveCohort] = useState("All");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEnrollStudent, setShowEnrollStudent] = useState(false);
  
  // --- DUMMY DATA FOR ANALYTICS (POWER BI EFFECT) ---
  const dummyStudents = useMemo(() => [
    { id: 1, class: "Class 9" }, { id: 2, class: "Class 9" }, { id: 3, class: "Class 9" },
    { id: 4, class: "Class 10" }, { id: 5, class: "Class 10" }, { id: 6, class: "Class 10" }, { id: 7, class: "Class 10" },
    { id: 8, class: "Class 11" }, { id: 9, class: "Class 11" }
  ], []);

  const dummyGrades = useMemo(() => [
    { class: "Class 9", subject: "Math", average: 75 },
    { class: "Class 9", subject: "Science", average: 82 },
    { class: "Class 9", subject: "English", average: 78 },
    { class: "Class 10", subject: "Math", average: 88 },
    { class: "Class 10", subject: "Science", average: 85 },
    { class: "Class 10", subject: "English", average: 90 },
    { class: "Class 11", subject: "Math", average: 80 },
    { class: "Class 11", subject: "Science", average: 75 },
    { class: "Class 11", subject: "English", average: 85 },
  ], []);

  const dummyAttendance = useMemo(() => [
    { month: "Jan", "Class 9": 95, "Class 10": 98, "Class 11": 92 },
    { month: "Feb", "Class 9": 92, "Class 10": 97, "Class 11": 90 },
    { month: "Mar", "Class 9": 96, "Class 10": 99, "Class 11": 94 },
    { month: "Apr", "Class 9": 94, "Class 10": 96, "Class 11": 91 },
  ], []);

  // --- FILTERED DATA ---
  const filteredGrades = useMemo(() => {
    return activeCohort === "All" ? [
      { subject: "Math", average: 81 },
      { subject: "Science", average: 80.6 },
      { subject: "English", average: 84.3 },
    ] : dummyGrades.filter(g => g.class === activeCohort);
  }, [activeCohort, dummyGrades]);

  const filteredAttendance = useMemo(() => {
    if (activeCohort === "All") {
      return dummyAttendance.map(d => ({
        month: d.month,
        attendance: Math.round((d["Class 9"] + d["Class 10"] + d["Class 11"]) / 3)
      }));
    }
    return dummyAttendance.map(d => ({
      month: d.month,
      attendance: d[activeCohort as keyof typeof d]
    }));
  }, [activeCohort, dummyAttendance]);

  const filteredStats = useMemo(() => {
    let totalEnrolled = dummyStudents.length;
    let avgAttendance = 94; // Global avg
    let overallPerformance = 82; // Global avg

    if (activeCohort !== "All") {
      totalEnrolled = dummyStudents.filter(s => s.class === activeCohort).length;
      avgAttendance = activeCohort === "Class 10" ? 97 : activeCohort === "Class 9" ? 94 : 91;
      overallPerformance = activeCohort === "Class 10" ? 87 : activeCohort === "Class 9" ? 78 : 80;
    }

    return { totalEnrolled, avgAttendance, overallPerformance };
  }, [activeCohort, dummyStudents]);

  const COLORS = ['#2563EB', '#4F46E5', '#7C3AED']; 
  const cohortData = [
    { name: 'Class 9', value: 3 },
    { name: 'Class 10', value: 4 },
    { name: 'Class 11', value: 2 },
  ];
  
  // Form and Toast State for Staff
  const [formData, setFormData] = useState({ name: "", email: "", role: "Teacher" });
  
  // Form State for Student
  const [studentFormData, setStudentFormData] = useState({ first_name: "", last_name: "", roll_number: "", class_name: "" });

  // Broadcast State
  const [broadcastData, setBroadcastData] = useState({ title: "", target_audience: "ALL", content: "" });
  const [broadcastWhatsapp, setBroadcastWhatsapp] = useState(false);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editingTable, setEditingTable] = useState<'users' | 'students' | null>(null);

  // Data Fetching State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [feesList, setFeesList] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fee Modal State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [feeRecord, setFeeRecord] = useState<any>(null);
  const [updateAmountPaid, setUpdateAmountPaid] = useState("");
  const [updateFeeStatus, setUpdateFeeStatus] = useState("Pending");
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);

  // Payroll Modal State
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [payrollRecord, setPayrollRecord] = useState<any>(null);

  const fetchDirectoryData = async () => {
    setIsLoadingData(true);
    
    // Fetch Staff
    const { data: staffData } = await supabase
      .from('users')
      .select('*')
      .in('role', ['TEACHER', 'ADMIN', 'Teacher', 'Administrator']);
      
    // Fetch Students
    const { data: studentData } = await supabase
      .from('students')
      .select('*');

    // Fetch Fees
    const { data: feesData } = await supabase
      .from('fees')
      .select('*, students(first_name, last_name, roll_number, roll_no)');

    setStaffList(staffData || []);
    setStudentList(studentData || []);
    setFeesList(feesData || []);
    
    setIsLoadingData(false);
  };

  const fetchAnnouncements = async () => {
    setIsLoadingAnnouncements(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentAnnouncements(data || []);
    setIsLoadingAnnouncements(false);
  };

  useEffect(() => {
    fetchDirectoryData();
    fetchAnnouncements();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) return;

    setIsSubmitting(true);
    
    const { error } = await supabase.from('users').insert([
      { email: formData.email, role: formData.role.toUpperCase(), name: formData.name }
    ]);
    
    setIsSubmitting(false);

    if (error) {
      console.error(error);
      setToastMessage("Wait! Failed to add user to database.");
    } else {
      setToastMessage("User successfully added to directory!");
      setFormData({ name: "", email: "", role: "Teacher" });
      setShowAddUser(false);
      
      // Cleanup edit state to prevent state collision
      setIsEditModalOpen(false);
      setEditingRecord(null);
      setEditingTable(null);
      
      fetchDirectoryData();
    }
    
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setToastMessage("Parsing CSV and uploading records...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const mappedData = results.data.map((row: any) => ({
            first_name: row.first_name || row.FirstName || row['First Name'] || '',
            last_name: row.last_name || row.LastName || row['Last Name'] || '',
            roll_no: row.roll_no || row.RollNumber || row['Roll Number'] || '',
            class_name: row.class_name || row.Class || row.ClassName || ''
          })).filter((r: any) => r.first_name && r.class_name);
          
          if (mappedData.length === 0) {
            setToastMessage("Wait! CSV was empty or headers didn't match.");
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setTimeout(() => setToastMessage(null), 3000);
            return;
          }

          const { error } = await supabase.from('students').insert(mappedData);
          
          if (error) {
            console.error(error);
            setToastMessage("Wait! Failed to import students from CSV.");
          } else {
            setToastMessage(`Successfully imported ${mappedData.length} students!`);
            fetchDirectoryData();
          }
        } catch (err) {
          console.error(err);
          setToastMessage("Wait! Error during CSV processing.");
        }
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setToastMessage(null), 3000);
      },
      error: (error) => {
        console.error(error);
        setToastMessage("Wait! Failed to read CSV file.");
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setToastMessage(null), 3000);
      }
    });
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFormData.first_name || !studentFormData.last_name || !studentFormData.roll_number || !studentFormData.class_name) return;

    setIsSubmitting(true);
    
    const { error } = await supabase.from('students').insert([
      { 
        first_name: studentFormData.first_name, 
        last_name: studentFormData.last_name, 
        roll_no: studentFormData.roll_number,
        class_name: studentFormData.class_name
      }
    ]);
    
    setIsSubmitting(false);

    if (error) {
      console.error("Student Insert Error:", error);
      setToastMessage("Wait! Failed to enroll student.");
    } else {
      setToastMessage("Student successfully enrolled!");
      setStudentFormData({ first_name: "", last_name: "", roll_number: "", class_name: "" });
      setShowEnrollStudent(false);
      fetchDirectoryData();
    }
    
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastData.content || !broadcastData.title) return;

    setIsSubmitting(true);
    
    // Get current user for author_id
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('announcements').insert([
      { 
        title: broadcastData.title,
        content: broadcastData.content, 
        target_audience: broadcastData.target_audience,
        author_id: user?.id
      }
    ]);
    
    setIsSubmitting(false);

    if (error) {
      console.error("Broadcast Error:", error);
      setToastMessage("Wait! Failed to send broadcast.");
    } else {
      setToastMessage(broadcastWhatsapp ? "Database updated & WhatsApp payload dispatched to parent(s)!" : "Announcement broadcasted successfully!");
      setBroadcastData({ title: "", target_audience: "ALL", content: "" });
      fetchAnnouncements();
    }
    
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = async (id: string, table: 'users' | 'students') => {
    if (!window.confirm('Are you sure you want to delete this record? This cannot be undone.')) return;

    setIsSubmitting(true);
    const { error } = await supabase.from(table).delete().eq('id', id);
    setIsSubmitting(false);

    if (error) {
      console.error(error);
      setToastMessage("Wait! Failed to delete record.");
    } else {
      setToastMessage("Record deleted successfully!");
      fetchDirectoryData();
    }
    
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openEditModal = (record: any, table: 'users' | 'students') => {
    setEditingRecord({ ...record });
    setEditingTable(table);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !editingTable) return;

    setIsSubmitting(true);
    let updatedData = {};
    if (editingTable === 'users') {
      updatedData = { name: editingRecord.name, email: editingRecord.email, role: editingRecord.role.toUpperCase() };
    } else {
      updatedData = { 
        first_name: editingRecord.first_name, 
        last_name: editingRecord.last_name, 
        roll_no: editingRecord.roll_number,
        class_name: editingRecord.class_name
      };
    }

    const { error } = await supabase.from(editingTable).update(updatedData).eq('id', editingRecord.id);
    setIsSubmitting(false);

    if (error) {
      console.error(error);
      setToastMessage("Wait! Failed to update record.");
    } else {
      setToastMessage("Record updated successfully!");
      setIsEditModalOpen(false);
      setEditingRecord(null);
      setEditingTable(null);
      fetchDirectoryData();
    }
    
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openFeeModal = (record: any) => {
    setFeeRecord(record);
    setUpdateAmountPaid(record.amount_paid?.toString() || "0");
    setUpdateFeeStatus(record.status || "Pending");
    setIsFeeModalOpen(true);
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeRecord) return;
    
    setIsSubmitting(true);
    const { error } = await supabase.from('fees').update({
      amount_paid: Number(updateAmountPaid),
      status: updateFeeStatus,
    }).eq('id', feeRecord.id);
    
    setIsSubmitting(false);
    
    if (error) {
      console.error(error);
      setToastMessage("Wait! Failed to update payment.");
    } else {
      setToastMessage("Payment updated successfully!");
      setIsFeeModalOpen(false);
      setFeeRecord(null);
      fetchDirectoryData();
    }
    
    setTimeout(() => setToastMessage(null), 3000);
  };



  const stats = [
    { label: "Total Enrolled", value: studentList.length.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50", shadow: "shadow-md" },
    { label: "Active Staff", value: staffList.length.toString(), icon: Shield, color: "text-indigo-600", bg: "bg-indigo-50", shadow: "shadow-md" },
    { label: "System Status", value: "Operational", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", isStatus: true, shadow: "shadow-md" },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-8 animate-in fade-in duration-500 font-sans relative text-slate-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-green-200 text-green-700 shadow-lg px-6 py-3 rounded-xl font-bold flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300">
          <CheckCircle className="w-5 h-5 text-green-600" />
          {toastMessage}
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="flex flex-col gap-2">
        <h1 className="font-serif font-bold text-3xl text-slate-800">Admin Command Center</h1>
        <p className="text-slate-500 font-medium">Manage school directory, staff, and system performance.</p>
      </div>

      {/* Top-level Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-surface border border-slate-200 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:${stat.shadow} duration-300 flex items-center justify-between shadow-sm`}>
            <div className="flex flex-col gap-2">
              <span className="text-slate-500 font-bold text-sm tracking-wide uppercase">{stat.label}</span>
              {stat.isStatus ? (
                <span className={`font-bold text-lg ${stat.color}`}>{stat.value}</span>
              ) : (
                <span className={`text-4xl font-extrabold text-blue-900`}>{stat.value}</span>
              )}
            </div>
            <div className={`p-4 rounded-xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabbed Directory Section */}
      <div className="flex flex-col bg-surface border border-slate-200 rounded-2xl overflow-hidden flex-1 shadow-sm">
        
        {/* Tabs & Controls Header */}
        <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-stretch md:self-auto overflow-x-auto">
            <button 
              onClick={() => { setActiveTab("analytics"); setShowAddUser(false); setShowEnrollStudent(false); }}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "analytics" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Power BI
            </button>
            <button 
              onClick={() => { setActiveTab("staff"); setShowEnrollStudent(false); }}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "staff" ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Manage Staff
            </button>
            <button 
              onClick={() => { setActiveTab("students"); setShowAddUser(false); }}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "students" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Enroll Student
            </button>
            <button 
              onClick={() => { setActiveTab("noticeboard"); setShowAddUser(false); setShowEnrollStudent(false); }}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "noticeboard" ? "bg-white text-amber-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Noticeboard
            </button>
            <button 
              onClick={() => { setActiveTab("fees"); setShowAddUser(false); setShowEnrollStudent(false); }}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "fees" ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Fees Management
            </button>
            <button 
              onClick={() => { setActiveTab("recruitment"); setShowAddUser(false); setShowEnrollStudent(false); }}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "recruitment" ? "bg-white text-purple-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Hiring
            </button>
          </div>

          {/* Contextual Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {activeTab === "staff" && (
              <button 
                onClick={() => setShowAddUser(!showAddUser)}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 px-5 py-2.5 rounded-xl font-bold transition-all hover:shadow-sm w-full md:w-auto justify-center"
              >
                <UserPlus className="w-5 h-5" strokeWidth={2.5} />
                Add New Staff
              </button>
            )}
            {activeTab === "students" && (
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 bg-transparent text-slate-600 border border-slate-300 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-bold transition-all w-full md:w-auto justify-center disabled:opacity-50 hover:shadow-sm"
                  title="Upload CSV"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <UploadCloud className="w-5 h-5" strokeWidth={2.5} />}
                  Upload CSV
                </button>
                <button 
                  onClick={() => setShowEnrollStudent(!showEnrollStudent)}
                  className="flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-5 py-2.5 rounded-xl font-bold transition-all hover:shadow-sm w-full md:w-auto justify-center"
                >
                  <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
                  Enroll New Student
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Tab (Power BI Style) */}
        {activeTab === "analytics" && (
          <div className="flex flex-col p-6 md:p-8 gap-8 bg-slate-50/50 animate-in fade-in duration-500">
            {/* Header & Clear Filter */}
            <div className="flex items-center justify-between">
               <div>
                 <h2 className="font-serif font-bold text-2xl text-slate-800 flex items-center gap-3">
                   <Activity className="w-6 h-6 text-blue-600" />
                   Interactive Analytics
                 </h2>
                 <p className="text-slate-500 text-sm mt-1 font-medium">Click on chart segments to filter all visuals (Power BI style).</p>
               </div>
               {activeCohort !== "All" && (
                 <button 
                   onClick={() => setActiveCohort("All")}
                   className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 hover:text-slate-800 shadow-sm transition-all text-sm flex items-center gap-2"
                 >
                   <X className="w-4 h-4" />
                   Clear Filter ({activeCohort})
                 </button>
               )}
            </div>

            {/* Dynamic KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                 <span className="text-slate-500 font-bold text-xs tracking-wider uppercase mb-2">Total Enrolled</span>
                 <span className="text-4xl font-extrabold text-blue-900">{filteredStats.totalEnrolled}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                 <span className="text-slate-500 font-bold text-xs tracking-wider uppercase mb-2">Avg Attendance</span>
                 <span className="text-4xl font-extrabold text-indigo-600">{filteredStats.avgAttendance}%</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                 <span className="text-slate-500 font-bold text-xs tracking-wider uppercase mb-2">Overall Performance</span>
                 <span className="text-4xl font-extrabold text-emerald-600">{filteredStats.overallPerformance}%</span>
              </div>
            </div>

            {/* CSS Grid for Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Controller: Pie Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col col-span-1 min-h-[350px]">
                <h3 className="font-bold text-slate-700 mb-4 text-center">Total Students by Class</h3>
                <div className="flex-1 w-full min-h-[250px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={cohortData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={100}
                         paddingAngle={5}
                         dataKey="value"
                         onClick={(data) => { if (data && data.name) setActiveCohort(data.name); }}
                         className="cursor-pointer outline-none hover:opacity-80 transition-opacity"
                       >
                         {cohortData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                     </PieChart>
                   </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-slate-400 font-medium">Click a slice to filter dashboard</p>
              </div>

              {/* Responder: Bar Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col col-span-1 lg:col-span-2 min-h-[350px]">
                <h3 className="font-bold text-slate-700 mb-4">Average Scores by Subject {activeCohort !== "All" && `(${activeCohort})`}</h3>
                <div className="flex-1 w-full min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredGrades} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} domain={[0, 100]} />
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} cursor={{fill: '#f8fafc'}} />
                      <Bar dataKey="average" fill="#4F46E5" radius={[4, 4, 0, 0]} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Responder: Line Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col col-span-1 lg:col-span-3 min-h-[350px]">
                <h3 className="font-bold text-slate-700 mb-4">Monthly Attendance Trends {activeCohort !== "All" && `(${activeCohort})`}</h3>
                <div className="flex-1 w-full min-h-[250px] -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredAttendance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} domain={[80, 100]} />
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="attendance" stroke="#2563EB" strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0, fill: '#1d4ed8' }} animationDuration={800} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Staff Add User Form */}
        {activeTab === "staff" && showAddUser && (
          <form onSubmit={handleAddUser} className="p-6 bg-indigo-50/30 border-b border-slate-200 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
            <h3 className="font-bold text-indigo-700 text-lg">Onboard New Staff Member</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5 md:col-span-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Dr. R. K. Singh" 
                  className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 disabled:opacity-50 transition-all shadow-sm" 
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="e.g. admin@school.edu" 
                  className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 disabled:opacity-50 transition-all shadow-sm" 
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 disabled:opacity-50 transition-all shadow-sm cursor-pointer" 
                  disabled={isSubmitting}
                >
                  <option value="Teacher">Teacher</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 text-right justify-end">
                <button 
                  type="submit"
                  disabled={isSubmitting || isLoadingData}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-12 rounded-lg font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Profile"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Enroll Student Form */}
        {activeTab === "students" && showEnrollStudent && (
          <form onSubmit={handleEnrollStudent} className="p-6 bg-blue-50/30 border-b border-slate-200 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
            <h3 className="font-bold text-blue-700 text-lg">Enroll New Student</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">First Name</label>
                <input 
                  type="text" 
                  required
                  value={studentFormData.first_name}
                  onChange={(e) => setStudentFormData({...studentFormData, first_name: e.target.value})}
                  placeholder="e.g. Rohan" 
                  className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 disabled:opacity-50 transition-all shadow-sm" 
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Last Name</label>
                <input 
                  type="text" 
                  required
                  value={studentFormData.last_name}
                  onChange={(e) => setStudentFormData({...studentFormData, last_name: e.target.value})}
                  placeholder="e.g. Joshi" 
                  className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 disabled:opacity-50 transition-all shadow-sm" 
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Class Name</label>
                <input 
                  type="text" 
                  required
                  value={studentFormData.class_name}
                  onChange={(e) => setStudentFormData({...studentFormData, class_name: e.target.value})}
                  placeholder="e.g. 10-A" 
                  className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 disabled:opacity-50 transition-all shadow-sm" 
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Roll Number</label>
                <input 
                  type="text" 
                  required
                  value={studentFormData.roll_number}
                  onChange={(e) => setStudentFormData({...studentFormData, roll_number: e.target.value})}
                  placeholder="e.g. 42" 
                  className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 disabled:opacity-50 transition-all shadow-sm" 
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-1.5 text-right justify-end">
                <button 
                  type="submit"
                  disabled={isSubmitting || isLoadingData}
                  className="bg-blue-600 text-white hover:bg-blue-700 px-6 h-12 rounded-lg font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enroll Student"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Noticeboard Form */}
        {activeTab === "noticeboard" && (
          <div className="p-6 md:p-10 flex flex-col items-center justify-center animate-in fade-in duration-300 min-h-[400px]">
            <div className="max-w-2xl w-full">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-200/50 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="p-4 bg-amber-100/80 text-amber-600 rounded-2xl shadow-sm">
                    <Megaphone className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-2xl text-amber-900 drop-shadow-sm">Global Noticeboard</h2>
                    <p className="text-amber-700/80 font-medium">Broadcast campus-wide announcements.</p>
                  </div>
                </div>

                <form onSubmit={handleBroadcast} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-amber-800 uppercase tracking-wide ml-1">Announcement Title</label>
                    <input 
                      type="text"
                      required
                      value={broadcastData.title}
                      onChange={(e) => setBroadcastData({...broadcastData, title: e.target.value})}
                      placeholder="e.g. Science Fair Registration Open!" 
                      className="w-full px-5 h-12 rounded-lg border-2 border-amber-200/60 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white/80 backdrop-blur-sm text-slate-800 transition-all shadow-sm font-medium"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-amber-800 uppercase tracking-wide ml-1">Target Audience</label>
                    <div className="relative">
                      <select 
                        value={broadcastData.target_audience}
                        onChange={(e) => setBroadcastData({...broadcastData, target_audience: e.target.value})}
                        className="w-full px-5 h-12 rounded-lg border-2 border-amber-200/60 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white/80 backdrop-blur-sm text-slate-800 font-bold transition-all cursor-pointer shadow-sm appearance-none"
                        disabled={isSubmitting}
                      >
                        <option value="ALL">Everyone (Parents & Teachers)</option>
                        <option value="PARENTS">Parents Only</option>
                        <option value="TEACHERS">Teachers Only</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-amber-800 uppercase tracking-wide ml-1">Message Content</label>
                    <textarea 
                      required
                      value={broadcastData.content}
                      onChange={(e) => setBroadcastData({...broadcastData, content: e.target.value})}
                      placeholder="Type your important update here..." 
                      className="w-full px-5 py-4 rounded-lg border-2 border-amber-200/60 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white/80 backdrop-blur-sm text-slate-800 transition-all min-h-[160px] resize-y shadow-sm font-medium"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={broadcastWhatsapp} onChange={(e) => setBroadcastWhatsapp(e.target.checked)} disabled={isSubmitting} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#25D366]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                    </label>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-[#25D366] fill-[#25D366]/10" />
                      <span className="text-sm font-bold text-slate-700">Broadcast via WhatsApp</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit"
                      disabled={isSubmitting || !broadcastData.content}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white h-12 rounded-lg font-bold text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                          <Send className="w-5 h-5" />
                          Publish Broadcast
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Recent Announcements List */}
            <div className="max-w-2xl w-full mt-8 animate-in fade-in duration-500 delay-150">
              <h3 className="font-serif font-bold text-xl text-slate-800 mb-4 px-2">Message History</h3>
              {isLoadingAnnouncements ? (
                <div className="flex items-center justify-center p-8 bg-white/50 rounded-2xl border border-slate-200 shadow-sm">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : recentAnnouncements.length === 0 ? (
                <div className="flex items-center justify-center p-8 bg-white/50 rounded-2xl border border-slate-200 shadow-sm text-slate-500 font-medium tracking-wide">
                  No recent announcements.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {recentAnnouncements.map((announcement, index) => (
                    <div key={announcement.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex flex-col gap-1">
                          <h4 className="font-bold text-lg text-slate-800">{announcement.title || 'Untitled Notification'}</h4>
                          {index % 2 === 0 && (
                             <span className="flex items-center gap-1.5 text-[10px] bg-[#25D366]/10 text-[#128C7E] px-2.5 py-1 rounded-full font-bold border border-[#25D366]/20 shadow-sm w-max uppercase tracking-wider"><MessageCircle className="w-3.5 h-3.5 fill-[#25D366]/20" /> Delivered via WhatsApp</span>
                          )}
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${announcement.target_audience === 'ALL' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {announcement.target_audience}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium text-sm whitespace-pre-wrap">{announcement.content}</p>
                      <div className="mt-4 text-xs font-bold text-slate-400 tracking-wide">
                        {new Date(announcement.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}


        {/* Data Grid */}
        {(activeTab === "staff" || activeTab === "students") && (
          <div className="overflow-x-auto min-h-[300px]">
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="font-bold tracking-wide">Loading directory...</span>
            </div>
          ) : (
            <>
              {activeTab === "staff" && staffList.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                  <Shield className="w-10 h-10 text-slate-300" strokeWidth={1} />
                  <span className="font-medium">No staff members found.</span>
                </div>
              )}
              {activeTab === "students" && studentList.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                  <Users className="w-10 h-10 text-slate-300" strokeWidth={1} />
                  <span className="font-medium">No students enrolled yet.</span>
                </div>
              )}
              
              {((activeTab === "staff" && staffList.length > 0) || (activeTab === "students" && studentList.length > 0)) && (
                <table className="w-full text-left border-collapse whitespace-nowrap animate-in fade-in duration-300">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-widest font-bold">
                      <th className="p-5 font-bold">Name</th>
                      {activeTab === "staff" ? (
                        <>
                          <th className="p-5 font-bold">Role</th>
                          <th className="p-5 font-bold">Email</th>
                          <th className="p-5 font-bold">Performance</th>
                        </>
                      ) : (
                        <>
                          <th className="p-5 font-bold">Class</th>
                          <th className="p-5 font-bold">Roll No.</th>
                        </>
                      )}
                      <th className="p-5 font-bold">Status</th>
                      <th className="p-5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {activeTab === "staff" ? (
                      staffList.map((user) => (
                        <tr key={user.id} className="hover:bg-blue-50 even:bg-slate-50 transition-colors">
                          <td className="p-5 font-bold text-slate-800">{user.name || "Unnamed"}</td>
                          <td className="p-5">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide border ${
                              user.role?.toLowerCase() === 'teacher' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {user.role || "Staff"}
                            </span>
                          </td>
                          <td className="p-5 text-slate-500 font-medium">{user.email || "N/A"}</td>
                          <td className="p-5">
                            <div className="flex items-center gap-1 text-amber-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`w-4 h-4 ${star <= (user.rating || 4 + ((user.name?.length || 0) % 2)) ? 'fill-current' : 'text-slate-200'}`} />
                              ))}
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm animate-pulse" />
                              <span className="text-sm font-bold text-green-600">Active</span>
                            </div>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => { setPayrollRecord(user); setIsPayrollModalOpen(true); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Manage Payroll">
                                <Wallet className="w-4 h-4" />
                              </button>
                              <button onClick={() => openEditModal(user, 'users')} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(user.id, 'users')} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      studentList.map((student) => (
                        <tr 
                          key={student.id} 
                          className="hover:bg-blue-50 even:bg-slate-50 transition-colors group"
                        >
                          <td className="p-5 font-bold text-slate-800 transition-colors flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0 shadow-sm">
                              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${student.first_name}&backgroundColor=f8fafc`} alt={student.first_name} />
                            </div>
                            {student.first_name} {student.last_name}
                          </td>
                          <td className="p-5 text-slate-500 font-medium">
                            <span className="font-bold text-slate-700 tracking-widest uppercase">{student.class_name || 'N/A'}</span>
                          </td>
                          <td className="p-5 text-slate-500 font-mono text-sm font-medium">{student.roll_number || "N/A"}</td>
                          <td className="p-5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm animate-pulse" />
                              <span className="text-sm font-bold text-green-600">Active</span>
                            </div>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditModal(student, 'students')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(student.id, 'students')} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
        )}
        
        {/* Fees Management Tab */}
        {activeTab === "fees" && (
          <div className="flex flex-col p-6 gap-6 bg-slate-50/50">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                <span className="text-slate-500 font-bold text-xs tracking-wider uppercase mb-2">Total Expected</span>
                <span className="text-3xl font-extrabold text-slate-800">
                  ₹{feesList.reduce((acc, fee) => acc + (Number(fee.total_amount) || 0), 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                <span className="text-slate-500 font-bold text-xs tracking-wider uppercase mb-2">Total Collected</span>
                <span className="text-3xl font-extrabold text-emerald-600">
                  ₹{feesList.reduce((acc, fee) => acc + (Number(fee.amount_paid) || 0), 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                <span className="text-slate-500 font-bold text-xs tracking-wider uppercase mb-2">Pending Dues</span>
                <span className="text-3xl font-extrabold text-amber-600">
                  ₹{(feesList.reduce((acc, fee) => acc + (Number(fee.total_amount) || 0), 0) - feesList.reduce((acc, fee) => acc + (Number(fee.amount_paid) || 0), 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Fees Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800 font-serif">Fee Records</h3>
                <button 
                  onClick={() => setIsAddInvoiceModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md hover:-translate-y-0.5"
                >
                  + Generate New Invoice
                </button>
              </div>
              <div className="overflow-x-auto min-h-[300px]">
                {isLoadingData ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <span className="font-bold tracking-wide">Loading fees data...</span>
                  </div>
                ) : feesList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                    <IndianRupee className="w-10 h-10 text-slate-300" strokeWidth={1} />
                    <span className="font-medium">No fee records found.</span>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse whitespace-nowrap animate-in fade-in duration-300">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-widest font-bold">
                        <th className="p-5 font-bold">Student Name</th>
                        <th className="p-5 font-bold">Roll No</th>
                        <th className="p-5 font-bold">Fee Cycle</th>
                        <th className="p-5 font-bold text-right">Total Amount</th>
                        <th className="p-5 font-bold text-right">Amount Paid</th>
                        <th className="p-5 font-bold">Status</th>
                        <th className="p-5 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {feesList.map((fee) => (
                        <tr key={fee.id} className="hover:bg-emerald-50/50 transition-colors group">
                          <td className="p-5 font-bold text-slate-800">
                            {fee.students?.first_name} {fee.students?.last_name}
                          </td>
                          <td className="p-5 text-slate-500 font-mono text-sm font-medium">
                            {fee.students?.roll_number || fee.students?.roll_no || 'N/A'}
                          </td>
                          <td className="p-5 text-slate-600 font-medium">{fee.fee_cycle}</td>
                          <td className="p-5 font-bold text-slate-700 text-right">₹{Number(fee.total_amount).toLocaleString('en-IN')}</td>
                          <td className="p-5 font-bold text-emerald-600 text-right">₹{Number(fee.amount_paid).toLocaleString('en-IN')}</td>
                          <td className="p-5">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide border ${
                              fee.status?.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              fee.status?.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {fee.status || 'Pending'}
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            <button 
                              onClick={() => openFeeModal(fee)} 
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 rounded-lg font-bold text-xs transition-colors shadow-sm ml-auto"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              Update
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Recruitment Tab */}
        {activeTab === "recruitment" && (
          <div className="flex flex-col p-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl shadow-sm">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-2xl text-slate-800 drop-shadow-sm">Incoming Applications</h2>
                <p className="text-slate-500 font-medium text-sm">Review candidates for open positions.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Priya Sharma", role: "Math Teacher", exp: "5 Years", status: "Under Review" },
                { name: "Rahul Verma", role: "Librarian", exp: "2 Years", status: "New" },
                { name: "Anita Desai", role: "Science Teacher", exp: "8 Years", status: "Interviewed" }
              ].map((app, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xl shadow-sm ring-2 ring-purple-100">
                      {app.name.charAt(0)}
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${app.status === 'New' ? 'bg-blue-100 text-blue-700' : app.status === 'Interviewed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {app.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">{app.name}</h3>
                  <p className="text-purple-600 font-bold text-sm mb-3">{app.role}</p>
                  
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Experience: {app.exp}
                  </div>
                  
                  <div className="flex gap-3 w-full">
                    <button className="flex-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl py-2.5 font-bold text-sm transition-colors shadow-sm">Review CV</button>
                    <button className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 rounded-xl py-2.5 font-bold text-sm transition-colors shadow-sm">Schedule</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingRecord && editingTable && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                Edit {editingTable === 'users' ? 'Staff Profile' : 'Student Record'}
              </h3>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingRecord(null); setEditingTable(null); }} 
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                {editingTable === 'users' ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                      <input 
                        type="text" required value={editingRecord.name || ''}
                        onChange={(e) => setEditingRecord({...editingRecord, name: e.target.value})}
                        className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 transition-all shadow-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                      <input 
                        type="email" required value={editingRecord.email || ''}
                        onChange={(e) => setEditingRecord({...editingRecord, email: e.target.value})}
                        className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 transition-all shadow-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Role</label>
                      <select 
                        value={editingRecord.role || 'Teacher'}
                        onChange={(e) => setEditingRecord({...editingRecord, role: e.target.value})}
                        className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 transition-all shadow-sm cursor-pointer"
                      >
                        <option value="Teacher">Teacher</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">First Name</label>
                        <input 
                          type="text" required value={editingRecord.first_name || ''}
                          onChange={(e) => setEditingRecord({...editingRecord, first_name: e.target.value})}
                          className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 transition-all shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Last Name</label>
                        <input 
                          type="text" required value={editingRecord.last_name || ''}
                          onChange={(e) => setEditingRecord({...editingRecord, last_name: e.target.value})}
                          className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Class Name</label>
                        <input 
                          type="text" required value={editingRecord.class_name || ''}
                          onChange={(e) => setEditingRecord({...editingRecord, class_name: e.target.value})}
                          className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 transition-all shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Roll Number</label>
                        <input 
                          type="text" required value={editingRecord.roll_number || ''}
                          onChange={(e) => setEditingRecord({...editingRecord, roll_number: e.target.value})}
                          className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => { setIsEditModalOpen(false); setEditingRecord(null); setEditingTable(null); }}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 h-12 rounded-lg font-bold text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                      editingTable === 'users' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
                    } disabled:opacity-70`}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Fee Payment Modal */}
      {isFeeModalOpen && feeRecord && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h3 className="font-bold text-lg text-emerald-800 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                Update Payment
              </h3>
              <button 
                onClick={() => { setIsFeeModalOpen(false); setFeeRecord(null); }} 
                className="text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100/50 p-1.5 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm text-slate-500 shadow-inner">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">{feeRecord.students?.first_name} {feeRecord.students?.last_name}</span>
                  <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md text-xs">{feeRecord.fee_cycle}</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                  <span className="font-bold tracking-wide uppercase text-xs">Total Bill</span>
                  <span className="font-bold text-slate-800 text-lg">₹{(feeRecord.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <form onSubmit={handleUpdatePayment} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Amount Paid So Far</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                    <input 
                      type="number" required value={updateAmountPaid}
                      onChange={(e) => setUpdateAmountPaid(e.target.value)}
                      className="px-4 pl-9 h-12 w-full rounded-lg border border-slate-200 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800 transition-all shadow-sm font-bold text-lg"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Payment Status</label>
                  <select 
                    value={updateFeeStatus}
                    onChange={(e) => setUpdateFeeStatus(e.target.value)}
                    className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800 transition-all shadow-sm cursor-pointer font-bold"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => { setIsFeeModalOpen(false); setFeeRecord(null); }}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 h-12 rounded-lg font-bold text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Modal */}
      {isPayrollModalOpen && payrollRecord && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <h3 className="font-bold text-lg text-indigo-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                Staff Payroll
              </h3>
              <button 
                onClick={() => { setIsPayrollModalOpen(false); setPayrollRecord(null); }} 
                className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100/50 p-1.5 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 bg-slate-50 border border-slate-100 p-4 rounded-xl shadow-inner">
                <div className="font-bold text-slate-800 text-center mb-4 text-lg border-b border-slate-200 pb-2">{payrollRecord.name}</div>
                
                <div className="flex justify-between items-center py-2.5">
                  <span className="font-bold text-slate-500 text-xs uppercase tracking-wide">Base Salary</span>
                  <span className="font-bold text-slate-800 text-sm">₹45,000</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="font-bold text-slate-500 text-xs uppercase tracking-wide flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500"/> Attendance Bonus</span>
                  <span className="font-bold text-emerald-600 text-sm">+ ₹3,500</span>
                </div>
                <div className="flex justify-between items-center py-4 mt-2 bg-indigo-50 px-4 -mx-4 rounded-b-xl border-t border-indigo-100">
                  <span className="font-bold text-indigo-800 text-sm uppercase tracking-wide">Total Payout</span>
                  <span className="font-extrabold text-indigo-700 text-2xl drop-shadow-sm">₹48,500</span>
                </div>
              </div>
              
              <div className="flex items-center justify-end">
                  <button 
                    onClick={() => { setIsPayrollModalOpen(false); setPayrollRecord(null); }}
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700 px-6 h-12 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    Close
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Invoice Blank Modal */}
      {isAddInvoiceModalOpen && (
        <InvoiceModal 
          onClose={() => setIsAddInvoiceModalOpen(false)}
          onSuccess={(msg) => {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(null), 3000);
            fetchDirectoryData();
          }}
          studentList={studentList}
        />
      )}
    </div>
  );
}
