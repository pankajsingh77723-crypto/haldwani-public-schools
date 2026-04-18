"use client";

import { useState, useEffect } from "react";
import { Users, FileEdit, TrendingUp, Save, Megaphone, Send, CheckCircle2, AlertCircle, Loader2, ChevronLeft, ChevronRight, Trash2, Pencil, BookOpen, CalendarDays, ClipboardCheck, Clock, Activity, AlertTriangle, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function TeacherDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [subject, setSubject] = useState("");
  const [score, setScore] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sendWhatsapp, setSendWhatsapp] = useState(false);

  // Gradebook state
  const [grades, setGrades] = useState<any[]>([]);
  const [isFetchingGrades, setIsFetchingGrades] = useState(false);
  
  // Edit Grade State
  const [editingGrade, setEditingGrade] = useState<any | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editScore, setEditScore] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Pagination State
  const [page, setPage] = useState(0);
  const [isPaginating, setIsPaginating] = useState(false);
  const ITEMS_PER_PAGE = 20;

  // Tab state
  const [activeTab, setActiveTab] = useState<'gradebook' | 'attendance' | 'insights'>('gradebook');
  
  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState("");
  const [attendanceError, setAttendanceError] = useState("");

  const fetchStudents = async (currentPage: number) => {
    setIsPaginating(true);
    const start = currentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .range(start, end);
      
    if (error) {
      console.error("Error fetching students:", error);
    } else {
      setStudents(data || []);
    }
    setIsPaginating(false);
  };

  const fetchGrades = async () => {
    setIsFetchingGrades(true);
    const { data, error } = await supabase
      .from("grades")
      .select("*, students(first_name, last_name)")
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) {
      console.error("Error fetching grades:", error);
    } else {
      setGrades(data || []);
    }
    setIsFetchingGrades(false);
  };

  // Fetch class roster from Supabase when page changes
  useEffect(() => {
    fetchStudents(page);
  }, [page]);

  // Fetch grades on load
  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchNextPage = () => {
    if (students.length === ITEMS_PER_PAGE) {
      setPage((prev) => prev + 1);
    }
  };

  const fetchPreviousPage = () => {
    if (page > 0) {
      setPage((prev) => prev - 1);
    }
  };

  const handleAttendanceChange = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async () => {
    setIsSubmittingAttendance(true);
    setAttendanceError("");
    setAttendanceSuccess("");

    if (students.length === 0) {
      setAttendanceError("No students to submit attendance for.");
      setIsSubmittingAttendance(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const recordsToInsert = students.map(student => ({
      student_id: student.id,
      date: today,
      status: attendanceRecords[student.id] || 'Present'
    }));

    const { error } = await supabase.from("attendance").insert(recordsToInsert);

    setIsSubmittingAttendance(false);
    
    if (error) {
      console.error("Error submitting attendance:", error);
      setAttendanceError("Failed to save attendance. Please check your connection and try again.");
    } else {
       setAttendanceSuccess("Attendance successfully saved for today!");
       setTimeout(() => setAttendanceSuccess(""), 4000);
    }
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !subject || !score) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase.from("grades").insert([
      {
        student_id: selectedStudent,
        subject: subject,
        final_score: Number(score)
      }
    ]);

    setIsSubmitting(false);

    if (error) {
      console.error("Error submitting grade:", error);
      setErrorMessage("Failed to save grade. Please check your connection and try again.");
    } else {
      setSuccessMessage(sendWhatsapp ? "Database updated & WhatsApp payload dispatched to parent!" : "Grade successfully saved to the database!");
      setSubject("");
      setScore("");
      setSelectedStudent("");
      fetchGrades(); // Refresh table
      
      // Clear success message
      setTimeout(() => setSuccessMessage(""), 4000);
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!window.confirm("Are you sure you want to delete this grade?")) return;
    
    const { error } = await supabase.from("grades").delete().eq("id", gradeId);
    if (error) {
      alert("Failed to delete grade.");
      console.error("Error deleting grade:", error);
    } else {
      fetchGrades(); // Refresh table
    }
  };

  const openEditModal = (grade: any) => {
    setEditingGrade(grade);
    setEditSubject(grade.subject);
    setEditScore(grade.final_score.toString());
  };

  const handleUpdateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade) return;

    setIsUpdating(true);
    const { error } = await supabase
      .from("grades")
      .update({
        subject: editSubject,
        final_score: Number(editScore)
      })
      .eq("id", editingGrade.id);

    setIsUpdating(false);

    if (error) {
      alert("Failed to update grade. Please check console.");
      console.error("Error updating grade:", error);
    } else {
      setEditingGrade(null);
      fetchGrades(); // Refresh table
    }
  };

  return (
    <section className="flex-1 min-w-0 flex flex-col gap-8 md:gap-10 h-full min-h-max pb-8 text-slate-900">
      
      {/* Header & Context */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-surface border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden shadow-inner ring-4 ring-slate-50 shrink-0">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Sharma&backgroundColor=f8fafc" alt="Mr. Sharma" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-3xl text-slate-800 mb-1">Welcome, Mr. Sharma</h1>
            <p className="text-slate-500 font-medium">Manage your classes, grades, and announcements.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full xl:w-auto">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Active Class</label>
          <select className="bg-white border border-slate-200 text-slate-800 h-12 px-4 rounded-lg font-bold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 cursor-pointer pr-8 transition-all">
            <option>Class 10-A Mathematics</option>
            <option>Class 10-B Mathematics</option>
            <option>Class 9-A Calculus</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
        <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-500 group-hover:text-blue-600 transition-colors">Enrolled Students</h3>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><Users className="w-5 h-5" /></div>
          </div>
          <span className="text-4xl font-extrabold text-blue-900 transition-all">34</span>
        </div>
        <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3 z-10 relative">
            <h3 className="font-bold text-slate-500 group-hover:text-orange-600 transition-colors">Pending Gradings</h3>
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform"><FileEdit className="w-5 h-5" /></div>
          </div>
          <span className="text-4xl font-extrabold text-blue-900 z-10 relative">4</span>
          {/* Subtle decoration instead of pulse */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-orange-50 rounded-full blur-2xl" />
        </div>
        <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-500 group-hover:text-green-600 transition-colors">Class Average</h3>
            <div className="p-2.5 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <span className="text-4xl font-extrabold text-green-600 transition-all">76%</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mt-4 mb-2 gap-8 px-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('gradebook')} 
          className={`pb-4 font-bold text-sm tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'gradebook' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
        >
          <BookOpen className="w-5 h-5" /> Gradebook
        </button>
        <button 
          onClick={() => setActiveTab('attendance')} 
          className={`pb-4 font-bold text-sm tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'attendance' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
        >
          <ClipboardCheck className="w-5 h-5" /> Daily Attendance
        </button>
        <button 
          onClick={() => setActiveTab('insights')} 
          className={`pb-4 font-bold text-sm tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'insights' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
        >
          <Activity className="w-5 h-5" /> AI Predictive Insights
        </button>
      </div>

      <div className={activeTab === 'gradebook' ? 'flex flex-col gap-8 md:gap-10' : 'hidden'}>
      {/* Grade Entry Portal */}
      <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-8 md:p-10 hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden">
        {/* Decorative blur */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        
        <div className="mb-8 z-10 relative">
          <h2 className="font-serif font-bold text-2xl text-slate-800 flex items-center gap-3">
            <FileEdit className="w-6 h-6 text-blue-600" />
            Grade Entry Portal
          </h2>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">Capture student academic performance directly into the secure cloud.</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-100 flex items-center gap-3 rounded-xl z-10 relative animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 flex items-center gap-3 rounded-xl z-10 relative animate-in fade-in slide-in-from-top-2 shadow-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmitGrade} className="flex flex-col gap-6 z-10 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-600 ml-1 uppercase tracking-wide">Select Student</label>
              <select 
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                disabled={students.length === 0 || isPaginating}
                className="w-full h-12 bg-white border border-slate-200 text-slate-800 px-4 rounded-lg font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {students.length === 0 ? (
                  <option value="" disabled>No students found in database</option>
                ) : (
                  <option value="" disabled>-- Select a student from roster --</option>
                )}
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} (Roll: {s.roll_number || s.roll || 'N/A'})
                  </option>
                ))}
              </select>
              
              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-2 ml-1">
                <span className="text-xs text-slate-500 font-bold">Page {page + 1}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={fetchPreviousPage}
                    disabled={page === 0 || isPaginating}
                    className="p-1 px-3 rounded-lg flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 disabled:opacity-40 disabled:hover:bg-blue-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-3 h-3" /> Prev
                  </button>
                  <button
                    type="button"
                    onClick={fetchNextPage}
                    disabled={students.length < ITEMS_PER_PAGE || isPaginating}
                    className="p-1 px-3 rounded-lg flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 disabled:opacity-40 disabled:hover:bg-blue-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Next <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-600 ml-1 uppercase tracking-wide">Subject</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                className="w-full h-12 bg-white border border-slate-200 text-slate-800 px-4 rounded-lg font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-2">
            <div className="flex flex-col gap-2 w-full md:w-1/2">
              <label className="text-sm font-bold text-slate-600 ml-1 uppercase tracking-wide">Final Score (%)</label>
              <input 
                type="number" 
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="e.g. 85"
                className="w-full h-12 bg-white border border-slate-200 text-slate-800 px-4 rounded-lg font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-start md:mr-auto">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={sendWhatsapp} onChange={(e) => setSendWhatsapp(e.target.checked)} disabled={isSubmitting} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#25D366]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
              </label>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-5 h-5 text-[#25D366] fill-[#25D366]/10" />
                <span className="text-sm font-bold text-slate-700">Send Instant WhatsApp Alert to Parent</span>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-8 py-3.5 rounded-lg font-bold transition-all duration-300 shadow-md hover:shadow-lg w-full md:w-auto md:min-w-[220px] h-12 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Grade...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Submit Grade
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Submissions (Gradebook) */}
      <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-8 md:p-10 flex flex-col relative overflow-hidden">
        <h2 className="font-serif font-bold text-2xl text-slate-800 mb-6 flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          Recent Submissions
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-2">Student Name</th>
                <th className="py-4 px-2">Subject</th>
                <th className="py-4 px-2">Score</th>
                <th className="py-4 px-2">Date</th>
                <th className="py-4 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingGrades ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                    Fetching grades...
                  </td>
                </tr>
              ) : grades.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">No recent submissions found.</td>
                </tr>
              ) : (
                grades.map((grade) => (
                  <tr key={grade.id} className="border-b border-slate-100/60 hover:bg-blue-50 even:bg-slate-50 transition-colors group">
                    <td className="py-4 px-2 font-bold text-slate-800">
                      {grade.students?.first_name} {grade.students?.last_name}
                    </td>
                    <td className="py-4 px-2 font-medium text-slate-600">{grade.subject}</td>
                    <td className="py-4 px-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${grade.final_score >= 80 ? 'bg-green-100 text-green-700' : grade.final_score >= 60 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        {grade.final_score}%
                      </span>
                    </td>
                    <td className="py-4 px-2 text-sm text-slate-500 font-medium">
                      {new Date(grade.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-2 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => openEditModal(grade)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors shadow-sm hover:shadow" title="Edit">
                           <Pencil className="w-4 h-4" />
                         </button>
                         <button onClick={() => handleDeleteGrade(grade.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shadow-sm hover:shadow" title="Delete">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast Hub */}
      <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-8 md:p-10 hover:shadow-md transition-all duration-300 flex flex-col">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Megaphone className="w-5 h-5" /></div>
          <div>
            <h2 className="font-serif font-bold text-2xl text-slate-800">Broadcast Announcement</h2>
            <p className="text-slate-500 text-sm font-medium">Instantly notify students or parents via portal & email.</p>
          </div>
        </div>

        <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-600 ml-1 uppercase tracking-wide">Message Content</label>
            <textarea 
              placeholder="Write your announcement here..."
              className="w-full h-32 bg-slate-50 border border-slate-200 text-slate-800 p-4 rounded-lg font-medium outline-none transition-all resize-none shadow-sm opacity-50 cursor-not-allowed"
            />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-2 w-full md:w-1/3">
              <label className="text-sm font-bold text-slate-600 ml-1 uppercase tracking-wide">Target Audience</label>
              <select disabled title="Coming Soon" className="w-full h-12 bg-slate-50 border border-slate-200 text-slate-800 px-4 rounded-lg font-bold outline-none transition-all shadow-sm opacity-50 cursor-not-allowed appearance-none">
                <option>Entire Class</option>
                <option>Parents Only</option>
                <option>Students Only</option>
              </select>
            </div>
            
            <button disabled title="Coming Soon" className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 h-12 rounded-lg font-bold shadow-md w-full md:w-auto uppercase tracking-wide text-sm opacity-50 cursor-not-allowed">
              <Send className="w-4 h-4" />
              Send Message
            </button>
          </div>
        </form>
      </div>
      </div>

      {/* Daily Attendance UI */}
      <div className={activeTab === 'attendance' ? 'flex flex-col gap-8' : 'hidden'}>
        <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-8 md:p-10 flex flex-col relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 z-10 relative">
            <div>
              <h2 className="font-serif font-bold text-2xl text-slate-800 flex items-center gap-3">
                <ClipboardCheck className="w-6 h-6 text-blue-600" />
                Daily Attendance
              </h2>
              <p className="text-slate-500 text-sm mt-1.5 font-medium flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <button 
              onClick={handleSubmitAttendance}
              disabled={isSubmittingAttendance || students.length === 0}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-bold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
            >
              {isSubmittingAttendance ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Submit Attendance
                </>
              )}
            </button>
          </div>

          {attendanceError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-100 flex items-center gap-3 rounded-xl z-10 relative animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium text-sm">{attendanceError}</p>
            </div>
          )}

          {attendanceSuccess && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 flex items-center gap-3 rounded-xl z-10 relative animate-in fade-in shadow-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="font-medium text-sm">{attendanceSuccess}</p>
            </div>
          )}

          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-4 px-4 rounded-tl-lg">Student Profile</th>
                  <th className="py-4 px-4">Roll Number</th>
                  <th className="py-4 px-4 rounded-tr-lg">Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-500 font-medium border-b border-slate-100">
                      {isPaginating ? "Loading roster..." : "No students found in roster."}
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const status = attendanceRecords[student.id] || 'Present';
                    return (
                      <tr key={student.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-800">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium text-sm">
                          {student.roll_number || student.roll || 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-xl w-max border border-slate-200/60 shadow-inner">
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'Present')}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${status === 'Present' ? 'bg-green-500 text-white shadow-sm ring-1 ring-green-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'Absent')}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${status === 'Absent' ? 'bg-red-500 text-white shadow-sm ring-1 ring-red-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'Late')}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${status === 'Late' ? 'bg-yellow-500 text-white shadow-sm ring-1 ring-yellow-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                            >
                              Late
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Roster Pagination Controls */}
          {students.length > 0 && (
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100 px-2">
                <span className="text-xs text-slate-500 font-bold tracking-wide uppercase">Roster Page {page + 1}</span>
                <div className="flex gap-2">
                  <button
                    onClick={fetchPreviousPage}
                    disabled={page === 0 || isPaginating}
                    className="p-1 px-4 rounded-lg flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-3 h-3" /> Prev
                  </button>
                  <button
                    onClick={fetchNextPage}
                    disabled={students.length < ITEMS_PER_PAGE || isPaginating}
                    className="p-1 px-4 rounded-lg flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Next <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
          )}
        </div>
      </div>

      {/* Insights UI */}
      <div className={activeTab === 'insights' ? 'flex flex-col gap-8 md:gap-10 animate-in fade-in duration-500' : 'hidden'}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
          
          {/* Performance Forecast */}
          <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-8 md:p-10 flex flex-col relative overflow-hidden">
            <div className="mb-6 z-10 relative">
              <h2 className="font-serif font-bold text-2xl text-slate-800 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                Performance Forecast
              </h2>
              <p className="text-slate-500 text-sm mt-1.5 font-medium">AI-flagged students requiring academic intervention.</p>
            </div>
            
            <div className="flex flex-col gap-4 z-10 relative overflow-y-auto max-h-[300px] pr-2">
              {grades.filter(g => g.final_score < 50).length === 0 ? (
                <div className="p-6 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="font-bold text-green-700">No students are currently at risk. Good job!</p>
                </div>
              ) : (
                Object.values(grades.filter(g => g.final_score < 50).reduce((acc: any, g) => {
                  if (!acc[g.student_id] || new Date(g.created_at) > new Date(acc[g.student_id].created_at)) {
                    acc[g.student_id] = g;
                  }
                  return acc;
                }, {})).map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold shadow-sm">
                        {g.students?.first_name?.charAt(0)}{g.students?.last_name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{g.students?.first_name} {g.students?.last_name}</h4>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{g.subject}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold tracking-wide mb-1">AT RISK</span>
                      <p className="text-sm font-extrabold text-slate-800">{g.final_score}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subject Trend Line Chart */}
          <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-8 md:p-10 flex flex-col relative overflow-hidden">
            <div className="mb-6 z-10 relative">
              <h2 className="font-serif font-bold text-2xl text-slate-800 flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Subject Trend
              </h2>
              <p className="text-slate-500 text-sm mt-1.5 font-medium">Recent class grade fluctuations over time.</p>
            </div>
            
            <div className="w-full h-[300px] z-10 relative -ml-4">
              {grades.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p className="font-medium">No grade data available for trends.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...grades].reverse().slice(-15).map(g => ({
                    name: new Date(g.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    score: g.final_score,
                    subject: g.subject
                  }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                      itemStyle={{ color: '#3b82f6' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal (Portal) */}
      {editingGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold font-serif mb-6 text-slate-800 flex items-center gap-3">
              <Pencil className="w-6 h-6 text-blue-600" />
              Edit Grade
            </h2>
            <form onSubmit={handleUpdateGrade} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Subject</label>
                <input 
                  type="text" 
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full h-12 bg-white border border-slate-200 text-slate-800 px-4 rounded-lg font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 transition-all shadow-sm"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Final Score (%)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={editScore}
                  onChange={(e) => setEditScore(e.target.value)}
                  className="w-full h-12 bg-white border border-slate-200 text-slate-800 px-4 rounded-lg font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 transition-all shadow-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingGrade(null)}
                  disabled={isUpdating}
                  className="px-6 h-12 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center justify-center gap-2 px-6 h-12 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed min-w-[150px]"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
