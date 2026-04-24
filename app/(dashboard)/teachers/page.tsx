"use client";

import { useState, useEffect } from "react";
import { Search, X, Briefcase, Clock, CalendarDays, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function StaffDirectory() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'TEACHER')
      .order('name', { ascending: true });
      
    if (error) {
      toast.error("Failed to fetch staff directory");
      console.error(error);
    } else {
      setStaffList(data || []);
    }
    setIsLoading(false);
  };

  const handleCardClick = (staff: any) => {
    setSelectedStaff(staff);
    setIsDrawerOpen(true);
    setActiveTab("Overview");
  };

  const departments = ["All", "Science", "Math", "Admin", "Liberal Arts"];

  const filteredStaff = staffList.filter(s => activeFilter === "All" || s.department === activeFilter);

  return (
    <>
      <div className="w-full min-h-screen bg-[#F4F7FE] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">

          {/* Header & Controls Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-5">
            <div className="relative w-full md:w-1/2 lg:w-1/3">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search staff by name or subject..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-medium"
              />
            </div>
            
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
               <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mr-2">Departments:</span>
               {departments.map((dept) => (
                 <button
                   key={dept}
                   onClick={() => setActiveFilter(dept)}
                   className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeFilter === dept ? 'bg-[#2563EB] text-white shadow-sm ring-1 ring-blue-600 ring-offset-1' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                 >
                   {dept}
                 </button>
               ))}
            </div>
          </div>

          {/* Responsive CSS Grid of Profile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center animate-pulse">
                  <div className="w-20 h-20 rounded-full bg-slate-200 mb-4 outline outline-slate-100"></div>
                  <div className="h-5 bg-slate-200 rounded-md w-2/3 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-1/2 mb-5"></div>
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between">
                     <div className="h-6 bg-slate-200 rounded-md w-12"></div>
                     <div className="h-6 bg-slate-200 rounded-md w-16"></div>
                  </div>
                </div>
              ))
            ) : filteredStaff.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-100 flex items-center justify-center flex-col gap-2 shadow-sm">
                   <Search className="w-8 h-8 text-slate-300" />
                   <p>No staff members found.</p>
                </div>
            ) : (
              filteredStaff.map((staff) => (
                 <div 
                   key={staff.id}
                   onClick={() => handleCardClick(staff)}
                   className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-blue-200 group"
                 >
                    <div className="w-20 h-20 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-2xl border-4 border-white outline outline-blue-100 shadow-sm mb-4 group-hover:scale-105 transition-transform duration-300">
                      {(staff.name || "U").split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-[#2563EB] transition-colors">{staff.name}</h3>
                    <p className="font-semibold text-slate-500 text-sm mb-5">{staff.subject || "No Subject Assigned"}</p>
                    
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center text-xs mt-auto">
                       <span className="flex flex-col text-left">
                         <span className="font-bold text-slate-400 uppercase tracking-wider mb-0.5">Workload</span>
                         <span className="font-bold text-slate-700 text-sm">{staff.classes_assigned || 0} Classes</span>
                       </span>
                       <span>
                         {staff.status === "Active" ? (
                            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-md font-bold uppercase tracking-wider text-[10px]">
                               <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                         ) : (
                            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-md font-bold uppercase tracking-wider text-[10px]">
                               <Clock className="w-3 h-3" /> {staff.status || "On Leave"}
                            </span>
                         )}
                       </span>
                    </div>
                 </div>
              ))
            )}
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
        {selectedStaff && (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 border-b border-slate-100 p-6 flex flex-col shrink-0 gap-6 pb-0">
              <div className="flex items-start justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-2xl shrink-0 border border-blue-200 shadow-sm">
                    {(selectedStaff.name || "U").split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selectedStaff.name}</h2>
                    <p className="text-slate-500 font-medium text-sm mt-0.5">{selectedStaff.subject || "Unassigned"} Department</p>
                    <div className="mt-1.5 flex gap-2">
                       <span className="bg-slate-100 font-bold text-slate-500 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-200">
                         {selectedStaff.department || "Faculty"}
                       </span>
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
              <div className="flex gap-8 border-none text-sm font-bold w-full">
                 {["Overview", "Schedule", "Payroll"].map(tab => (
                   <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`py-4 relative transition-colors ${activeTab === tab ? "text-[#2563EB]" : "text-slate-400 hover:text-slate-700"}`}
                   >
                     {tab}
                     {activeTab === tab && (
                       <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2563EB] rounded-t-full" />
                     )}
                   </button>
                 ))}
              </div>
            </div>

            {/* Internal Content Area */}
            <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
               {activeTab === "Overview" && (
                 <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-6 font-serif flex items-center gap-2">
                         <Briefcase className="w-5 h-5 text-blue-500" /> Staff Credentials
                      </h3>
                      <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Employment Type</p>
                           <p className="font-semibold text-slate-700">{selectedStaff.employment_type || "N/A"}</p>
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact Phone</p>
                           <p className="font-semibold text-slate-700">{selectedStaff.contact_phone || "N/A"}</p>
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Qualifications</p>
                           <p className="font-semibold text-slate-700 truncate">{selectedStaff.qualifications || "N/A"}</p>
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Joining Date</p>
                           <p className="font-semibold text-slate-700">{selectedStaff.joining_date ? new Date(selectedStaff.joining_date).toLocaleDateString() : "N/A"}</p>
                        </div>
                      </div>
                    </div>
                 </div>
               )}
               {activeTab === "Schedule" && (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                   <div className="w-16 h-16 bg-white shrink-0 shadow-sm rounded-full flex items-center justify-center border border-slate-100 mb-2">
                     <CalendarDays className="w-8 h-8 text-blue-300" />
                   </div>
                   <p className="font-bold">Schedule configuration pending</p>
                   <p className="text-sm font-medium text-center px-8">Timetable management module has not been linked to this view yet.</p>
                 </div>
               )}
               {activeTab === "Payroll" && (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                   <div className="w-16 h-16 bg-white shrink-0 shadow-sm rounded-full flex items-center justify-center border border-slate-100 mb-2">
                     <Briefcase className="w-8 h-8 text-emerald-300" />
                   </div>
                   <p className="font-bold text-slate-500">Payroll records locked</p>
                   <p className="text-sm font-medium text-center px-8 max-w-sm">Administrative privileges are required to view specific financial dispersals for verified staff nodes.</p>
                 </div>
               )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
