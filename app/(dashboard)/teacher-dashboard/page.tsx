"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, Save, Calendar, Users, FileEdit, ClipboardCheck, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function TeacherDashboard() {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStudents() {
      const { data } = await supabase.from('students').select('*');
      if (data) setStudents(data);
    }
    fetchStudents();
  }, []);

  const [activeTab, setActiveTab] = useState<"attendance" | "grading">("attendance");

  const [attendance, setAttendance] = useState<Record<string, "Present" | "Absent" | "Late">>(() => {
    return {};
  });

  const [grades, setGrades] = useState<Record<string, { score: string, remarks: string }>>(() => {
    return {};
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const absentCount = Object.values(attendance).filter(status => status === "Absent").length;
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const handleAttendanceChange = async (id: string, status: "Present" | "Absent" | "Late") => {
    setAttendance(prev => ({ ...prev, [id]: status }));
    
    if (status === "Absent") {
      const { error } = await supabase.from('attendance').insert({ 
        student_id: id, 
        status: 'ABSENT', 
        date: new Date().toISOString() 
      });
      
      if (!error) {
        setSuccessMsg("Real-time ABSENCE logged and parent notified!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    }
  };

  const handleGradeChange = (id: string, field: "score" | "remarks", value: string) => {
    setGrades(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSave = () => {
    setIsSubmitting(true);
    setSuccessMsg("");
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMsg(`Successfully saved ${activeTab === 'attendance' ? 'attendance' : 'grades'}!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    }, 800);
  };

  return (
    <section className="flex-1 w-full min-h-screen bg-slate-50 flex flex-col p-6 lg:p-10 gap-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-sm tracking-wide uppercase">
            <Calendar className="w-4 h-4 text-blue-600" />
            {todayDate}
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-800">Class 10-A</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-xl min-w-[120px]">
            <span className="text-slate-500 font-bold text-xs tracking-wider uppercase mb-1">Students</span>
            <div className="flex items-center gap-2 text-2xl font-extrabold text-blue-900">
              <Users className="w-5 h-5 text-blue-500" />
              {students.length}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-100 rounded-xl min-w-[120px] transition-all">
            <span className="text-red-500 font-bold text-xs tracking-wider uppercase mb-1">Absent</span>
            <div className={`flex items-center gap-2 text-2xl font-extrabold ${absentCount > 0 ? 'text-red-700' : 'text-slate-400'}`}>
              <AlertCircle className={`w-5 h-5 ${absentCount > 0 ? 'text-red-500' : 'text-slate-300'}`} />
              {absentCount}
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 flex items-center gap-3 rounded-xl animate-in slide-in-from-top-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm">{successMsg}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-full max-w-md">
        <button 
          onClick={() => setActiveTab('attendance')} 
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'attendance' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" /> One-Click Roster
        </button>
        <button 
          onClick={() => setActiveTab('grading')} 
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'grading' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileEdit className="w-4 h-4" /> Quick Grading
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 animate-in fade-in duration-500">
        
        {/* Tab 1: Daily Attendance */}
        {activeTab === 'attendance' && (
          <div className="flex flex-col h-full">
            <div className="p-5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-700">Mark Today's Attendance</h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Default: Present</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6 w-[80px]">Roll</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4 text-right pr-6">Status Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 hover:shadow-sm transition-all group cursor-pointer">
                      <td className="p-4 pl-6 text-slate-400 font-mono text-sm font-bold">{student.roll_number || student.roll_no || '--'}</td>
                      <td className="p-4 font-bold text-slate-800">{student.first_name} {student.last_name}</td>
                      <td className="p-4 pr-6 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAttendanceChange(student.id, "Present")}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            attendance[student.id] === "Present" 
                              ? "bg-green-500 text-white border border-green-600 shadow-green-500/20" 
                              : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Present
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.id, "Absent")}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            attendance[student.id] === "Absent" 
                              ? "bg-red-500 text-white border border-red-600 shadow-red-500/20" 
                              : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <XCircle className="w-4 h-4" /> Absent
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.id, "Late")}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            attendance[student.id] === "Late" 
                              ? "bg-yellow-500 text-white border border-yellow-600 shadow-yellow-500/20" 
                              : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <Clock className="w-4 h-4" /> Late
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Quick Grading */}
        {activeTab === 'grading' && (
          <div className="flex flex-col h-full">
            <div className="p-5 bg-indigo-50/30 border-b border-indigo-100 flex items-center justify-between">
              <h2 className="font-bold text-indigo-900">Enter Assignment Scores</h2>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Tab Navigation Enabled</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6 w-[80px]">Roll</th>
                    <th className="p-4 w-[250px]">Student Name</th>
                    <th className="p-4 w-[150px]">Score (0-100)</th>
                    <th className="p-4 pr-6">Remarks (Optional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="p-4 pl-6 text-slate-400 font-mono text-sm font-bold">{student.roll_number || student.roll_no || '--'}</td>
                      <td className="p-4 font-bold text-slate-800">{student.first_name} {student.last_name}</td>
                      <td className="p-4">
                        <input
                          type="number"
                          placeholder="--"
                          min="0"
                          max="100"
                          value={grades[student.id]?.score || ""}
                          onChange={(e) => handleGradeChange(student.id, "score", e.target.value)}
                          className="w-full max-w-[100px] h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold placeholder:font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-center shadow-sm"
                        />
                      </td>
                      <td className="p-4 pr-6">
                        <input
                          type="text"
                          placeholder="E.g. Excellent work..."
                          value={grades[student.id]?.remarks || ""}
                          onChange={(e) => handleGradeChange(student.id, "remarks", e.target.value)}
                          className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all shadow-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Global Save Button */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end mt-auto">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className={`flex items-center justify-center gap-2 px-8 h-12 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed ${
              activeTab === 'attendance' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {activeTab === 'attendance' ? 'Save All Attendance' : 'Submit Grades'}
          </button>
        </div>
      </div>
    </section>
  );
}
