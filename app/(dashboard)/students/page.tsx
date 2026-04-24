"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, Plus, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function StudentDirectory() {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('class_name', { ascending: true })
      .order('roll_no', { ascending: true });
      
    if (error) {
      toast.error("Failed to load student directory");
      console.error(error);
    } else {
      setStudents(data || []);
    }
    setIsLoading(false);
  };

  const handleRowClick = (student: any) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
    setActiveTab("Overview");
  };

  return (
    <>
      <div className="w-full min-h-screen bg-[#F4F7FE] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          
          {/* Header & Controls Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            
            <div className="flex-1 w-full relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search students by name, roll no, or guardian..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-medium"
              />
            </div>

            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
              <div className="relative">
                <select className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer w-full">
                  <option value="">All Classes</option>
                  <option value="8">8th</option>
                  <option value="9">9th</option>
                  <option value="10">10th</option>
                  <option value="11">11th</option>
                  <option value="12">12th</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer w-full">
                  <option value="">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
                <Plus className="w-5 h-5" />
                Add Student
              </button>
            </div>
          </div>

          {/* Data Table Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold uppercase tracking-wider">
                    <th className="p-6">Student</th>
                    <th className="p-6">Roll No</th>
                    <th className="p-6">Class</th>
                    <th className="p-6">Guardian</th>
                    <th className="p-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 relative">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                            <div className="h-4 bg-slate-200 rounded w-32"></div>
                          </div>
                        </td>
                        <td className="p-6"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                        <td className="p-6"><div className="h-6 bg-slate-200 rounded w-24"></div></td>
                        <td className="p-6"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                        <td className="p-6"><div className="h-6 bg-slate-200 rounded-full w-20"></div></td>
                      </tr>
                    ))
                  ) : students.length === 0 ? (
                     <tr>
                       <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                         <div className="flex flex-col items-center gap-2">
                           <Search className="w-8 h-8 text-slate-300" />
                           <p>No students found in the database.</p>
                         </div>
                       </td>
                     </tr>
                  ) : (
                    students.map((student) => (
                      <tr 
                        key={student.id} 
                        onClick={() => handleRowClick(student)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200">
                              {(student.name || "U").split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                            </div>
                            <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{student.name}</span>
                          </div>
                        </td>
                        <td className="p-6 font-medium text-slate-600">{student.roll_no}</td>
                        <td className="p-6">
                          <span className="inline-flex items-center bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded-lg text-sm font-medium">
                            {student.class_name || "N/A"} - {student.section || "N/A"}
                          </span>
                        </td>
                        <td className="p-6 font-medium text-slate-600">{student.guardian_name || "N/A"}</td>
                        <td className="p-6">
                          {student.status === "Active" ? (
                             <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                             </span>
                          ) : (
                             <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                               <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Inactive
                             </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-between text-sm font-medium text-slate-500 bg-slate-50/50">
              <p>Showing <span className="font-bold text-slate-800">{students.length > 0 ? 1 : 0}</span> to <span className="font-bold text-slate-800">{students.length}</span> of <span className="font-bold text-slate-800">{students.length}</span> students</p>
              
              <div className="flex gap-2">
                <button className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50" disabled>
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-1 items-center hidden sm:flex">
                   <button className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold shadow-sm flex items-center justify-center">1</button>
                </div>
                <button className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50" disabled>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Slide-out Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] md:w-[40%] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {selectedStudent && (
          <>
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white z-10 border-b border-slate-100 p-6 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl shrink-0 border border-blue-200 shadow-sm">
                   {(selectedStudent.name || "U").split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-slate-800">{selectedStudent.name}</h2>
                   <p className="text-slate-500 font-medium text-sm mt-0.5">Class {selectedStudent.class_name || "N/A"} - {selectedStudent.section || "N/A"} • Roll {selectedStudent.roll_no}</p>
                   <div className="mt-2">
                     {selectedStudent.status === "Active" ? (
                       <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                         <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Inactive
                       </span>
                     )}
                   </div>
                 </div>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
               >
                 <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 flex gap-8 border-b border-slate-100 text-sm font-bold shrink-0">
               {["Overview", "Academic", "Financial"].map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`py-4 relative transition-colors ${activeTab === tab ? "text-[#2563EB]" : "text-slate-400 hover:text-slate-600"}`}
                 >
                   {tab}
                   {activeTab === tab && (
                     <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2563EB] rounded-t-full" />
                   )}
                 </button>
               ))}
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
               {activeTab === "Overview" && (
                 <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-6 font-serif">General Information</h3>
                      <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Guardian Name</p>
                           <p className="font-semibold text-slate-700">{selectedStudent.guardian_name || "N/A"}</p>
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact Phone</p>
                           <p className="font-semibold text-slate-700">{selectedStudent.contact_phone || "N/A"}</p>
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date of Birth</p>
                           <p className="font-semibold text-slate-700">{selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString() : "N/A"}</p>
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Address</p>
                           <p className="font-semibold text-slate-700 truncate">{selectedStudent.address || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-6 font-serif">Medical Info</h3>
                      <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Blood Group</p>
                           <p className="font-semibold text-slate-700">{selectedStudent.blood_group || "N/A"}</p>
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Allergies</p>
                           <p className="font-semibold text-slate-700">{selectedStudent.allergies || "None"}</p>
                        </div>
                      </div>
                    </div>
                 </div>
               )}
               {activeTab === "Academic" && (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                   <p className="font-bold">Academic details pending</p>
                   <p className="text-sm font-medium">Integration required to fetch records.</p>
                 </div>
               )}
               {activeTab === "Financial" && (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                   {selectedStudent.overdue_amount > 0 ? (
                      <>
                         <p className="font-bold text-red-500">Overdue Balance: ${selectedStudent.overdue_amount}</p>
                         <p className="text-sm font-medium">Pending since {selectedStudent.overdue_months}</p>
                      </>
                   ) : (
                      <>
                         <p className="font-bold text-emerald-500">All Clear</p>
                         <p className="text-sm font-medium">No pending dues found for this student.</p>
                      </>
                   )}
                 </div>
               )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
