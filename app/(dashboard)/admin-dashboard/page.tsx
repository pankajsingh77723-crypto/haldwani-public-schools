"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, CheckCircle, GraduationCap, Loader2, Pencil, Trash2, X, Megaphone, Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"staff" | "students" | "noticeboard">("staff");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEnrollStudent, setShowEnrollStudent] = useState(false);
  
  // Form and Toast State for Staff
  const [formData, setFormData] = useState({ name: "", email: "", role: "Teacher" });
  
  // Form State for Student
  const [studentFormData, setStudentFormData] = useState({ first_name: "", last_name: "", roll_number: "", class_name: "" });

  // Broadcast State
  const [broadcastData, setBroadcastData] = useState({ title: "", target_audience: "ALL", content: "" });
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editingTable, setEditingTable] = useState<'users' | 'students' | null>(null);

  // Data Fetching State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

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

    setStaffList(staffData || []);
    setStudentList(studentData || []);
    
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
      setToastMessage("Announcement broadcasted successfully!");
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
              <button 
                onClick={() => setShowEnrollStudent(!showEnrollStudent)}
                className="flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-5 py-2.5 rounded-xl font-bold transition-all hover:shadow-sm w-full md:w-auto justify-center"
              >
                <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
                Enroll New Student
              </button>
            )}
          </div>
        </div>

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
              <h3 className="font-serif font-bold text-xl text-slate-800 mb-4 px-2">Recent Announcements</h3>
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
                  {recentAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="font-bold text-lg text-slate-800">{announcement.title || 'Untitled Notification'}</h4>
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
        {activeTab !== "noticeboard" && (
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
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm animate-pulse" />
                              <span className="text-sm font-bold text-green-600">Active</span>
                            </div>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex items-center justify-end gap-2">
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
    </div>
  );
}
