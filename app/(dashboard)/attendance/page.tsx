"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronDown, CheckCircle2, XCircle, Clock, Save, Loader2, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

type AttendanceStatus = "Present" | "Absent" | "Late" | "Half-Day";

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState("10");
  const [selectedSection, setSelectedSection] = useState("A");
  
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRoster();
  }, [selectedDate, selectedClass, selectedSection]);

  const fetchRoster = async () => {
    setIsLoading(true);
    
    // 1. Fetch Students matching Class/Section
    const { data: studentsData, error: studentErr } = await supabase
      .from('students')
      .select('*')
      .eq('class_name', selectedClass)
      .eq('section', selectedSection)
      .order('roll_no', { ascending: true });

    if (studentErr) {
      toast.error("Failed to load students roster");
      setIsLoading(false);
      return;
    }
    
    const studentsArr = studentsData || [];
    setStudents(studentsArr);

    // 2. Fetch Attendance for today for these students
    const { data: attData, error: attErr } = await supabase
      .from('attendance')
      .select('user_id, status')
      .eq('date', selectedDate);

    if (attErr) {
       toast.error("Could not sync previous attendance records.");
    } else {
       // Map DB records. Default is "Present" for students with no DB record
       const existingMap: Record<string, AttendanceStatus> = {};
       const dbRecords = attData || [];
       
       studentsArr.forEach(s => {
          const match = dbRecords.find(r => r.user_id === s.id);
          if (match) {
            // DB might be uppercase like "HALF-DAY", we normalize to UI
            let UIStatus: AttendanceStatus = "Present";
            if (match.status.toUpperCase() === "ABSENT") UIStatus = "Absent";
            if (match.status.toUpperCase() === "LATE") UIStatus = "Late";
            if (match.status.toUpperCase() === "HALF-DAY") UIStatus = "Half-Day";
            existingMap[s.id] = UIStatus;
          } else {
            existingMap[s.id] = "Present";
          }
       });
       setAttendanceRecords(existingMap);
    }

    setIsLoading(false);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    const newMap: Record<string, AttendanceStatus> = {};
    students.forEach(s => newMap[s.id] = status);
    setAttendanceRecords(newMap);
    toast.success(`All marked as ${status}`);
  };

  const handleSave = async () => {
    if (students.length === 0) {
      toast.error("No students are currently active in this roster to save.");
      return;
    }
    setIsSaving(true);
    
    // Build bulk upsert array
    const upsertPayload = students.map(s => ({
       user_id: s.id,
       date: selectedDate,
       status: attendanceRecords[s.id].toUpperCase(), // 'PRESENT', 'ABSENT', 'LATE', 'HALF-DAY'
       role: 'STUDENT'
    }));

    // In Supabase, if we are upserting and don't provide the primary key id, we need a unique constraint on (user_id, date)
    // Assuming the architecture relies on matching or we just DELETE then INSERT to securely overwrite.
    
    const { error: delErr } = await supabase
       .from('attendance')
       .delete()
       .eq('date', selectedDate)
       .in('user_id', students.map(s => s.id));

    if (delErr) {
       toast.error(`Database Error: ${delErr.message}`);
       setIsSaving(false);
       return;
    }

    const { error: insErr } = await supabase
       .from('attendance')
       .insert(upsertPayload);

    if (insErr) {
       toast.error(`Insertion Failed: ${insErr.message}`);
    } else {
       toast.success(`Successfully saved attendance for ${students.length} students on ${selectedDate}`);
    }
    
    setIsSaving(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#F4F7FE] p-6 lg:p-8 flex flex-col pt-4">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">

        {/* Control Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between z-10 shrink-0">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
             
             {/* Class Selector */}
             <div className="relative">
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold cursor-pointer w-full tracking-wide"
                >
                  <option value="8">Class 8th</option>
                  <option value="9">Class 9th</option>
                  <option value="10">Class 10th</option>
                  <option value="11">Class 11th</option>
                  <option value="12">Class 12th</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
             </div>

             {/* Section Selector */}
             <div className="relative">
                <select 
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold cursor-pointer w-full tracking-wide"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
             </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl p-1 pr-3">
             <div className="bg-white p-2 text-slate-500 rounded-lg shadow-sm border border-slate-100">
               <Calendar className="w-5 h-5" />
             </div>
             <input 
               type="date" 
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="bg-transparent border-none text-slate-700 font-bold focus:outline-none focus:ring-0 cursor-pointer uppercase tracking-wider text-sm"
             />
          </div>
        </div>

        {/* Main Roster Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden mb-24 relative">
           
           {/* Top Utilities */}
           <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <p className="font-bold text-slate-600 text-sm tracking-wide">
                Showing roster for <span className="text-[#2563EB]">Class {selectedClass}-{selectedSection}</span>
              </p>
              <button 
                onClick={() => markAll("Present")}
                className="flex items-center gap-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-2 px-4 rounded-lg font-bold text-sm transition-colors"
                disabled={isLoading}
              >
                <UserCheck className="w-4 h-4" />
                Mark All Present
              </button>
           </div>

           {/* Scrollable Students List */}
           <div className="flex-1 overflow-y-auto w-full relative">
              {isLoading ? (
                <div className="w-full flex flex-col">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 border-b border-slate-50 bg-white animate-pulse">
                      <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0 outline outline-slate-100 outline-offset-2"></div>
                        <div className="flex flex-col gap-2">
                           <div className="h-4 bg-slate-200 rounded w-40"></div>
                           <div className="h-3 bg-slate-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="bg-slate-100 h-12 rounded-xl w-72"></div>
                    </div>
                  ))}
                </div>
              ) : students.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4 h-full">
                    <UserCheck className="w-12 h-12 text-slate-300" />
                    <p className="font-bold text-lg text-slate-500">Empty Roster</p>
                    <p className="font-medium text-sm">No students found matching this class constraint.</p>
                 </div>
              ) : (
                <div className="w-full flex flex-col">
                  {students.map((student) => {
                    const status = attendanceRecords[student.id] || "Present";
                    return (
                      <div key={student.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        
                        {/* Student Profile Info */}
                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2 transition-colors ${
                              status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              status === 'Absent' ? 'bg-red-50 text-red-600 border-red-100' :
                              status === 'Late' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                              'bg-orange-50 text-orange-600 border-orange-100'
                           }`}>
                             {(student.name || "U").split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                           </div>
                           <div>
                             <p className="font-bold text-slate-800 text-lg">{student.name}</p>
                             <p className="text-sm font-semibold text-slate-400 tracking-wider">ROLL NO: <span className="text-slate-600">{student.roll_no}</span></p>
                           </div>
                        </div>

                        {/* Segmented 4-State Toggle */}
                        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                           {/* Present */}
                           <button 
                             onClick={() => handleStatusChange(student.id, "Present")}
                             className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-200 ${status === "Present" ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-500/20' : 'text-slate-500 hover:text-slate-700'}`}
                           >
                              {status === "Present" && <CheckCircle2 className="w-3.5 h-3.5" />}
                              Present
                           </button>
                           
                           {/* Absent */}
                           <button 
                             onClick={() => handleStatusChange(student.id, "Absent")}
                             className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-200 ${status === "Absent" ? 'bg-white text-red-600 shadow-sm ring-1 ring-red-500/20' : 'text-slate-500 hover:text-slate-700'}`}
                           >
                              {status === "Absent" && <XCircle className="w-3.5 h-3.5" />}
                              Absent
                           </button>

                           {/* Late */}
                           <button 
                             onClick={() => handleStatusChange(student.id, "Late")}
                             className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-200 ${status === "Late" ? 'bg-white text-yellow-600 shadow-sm ring-1 ring-yellow-500/20' : 'text-slate-500 hover:text-slate-700'}`}
                           >
                              {status === "Late" && <Clock className="w-3.5 h-3.5" />}
                              Late
                           </button>

                           {/* Half-Day */}
                           <button 
                             onClick={() => handleStatusChange(student.id, "Half-Day")}
                             className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-200 ${status === "Half-Day" ? 'bg-white text-orange-600 shadow-sm ring-1 ring-orange-500/20' : 'text-slate-500 hover:text-slate-700'}`}
                           >
                              {status === "Half-Day" && <Clock className="w-3.5 h-3.5" />}
                              Half-Day
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
           </div>

        </div>

      </div>

      {/* Sticky Save Footer */}
      <div className="fixed bottom-0 left-0 w-full md:left-64 md:w-[calc(100%-16rem)] bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 lg:px-8 flex justify-end z-20 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
         <div className="flex items-center gap-6 max-w-7xl mx-auto w-full justify-between lg:justify-end">
            <div className="hidden lg:flex items-center text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
               Modifying records for <span className="text-[#2563EB] mx-1"> {selectedDate}</span>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-all text-lg w-full lg:w-auto justify-center"
            >
               {isSaving ? (
                 <><Loader2 className="w-6 h-6 animate-spin" /> Persisting...</>
               ) : (
                 <><Save className="w-6 h-6" /> Save Attendance Roster</>
               )}
            </button>
         </div>
      </div>
    </div>
  );
}
