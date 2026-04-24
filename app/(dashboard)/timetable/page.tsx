"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Calendar, Database, CalendarRange, Loader2, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_PERIODS = [
  "8:00 AM - 9:00 AM",
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM"
];

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState("10");
  const [selectedSection, setSelectedSection] = useState("A");
  
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTimetable();
  }, [selectedClass, selectedSection]);

  const fetchTimetable = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('timetable_slots')
      .select('*')
      .eq('class_name', selectedClass)
      .eq('section', selectedSection);

    if (error) {
       toast.error("Failed to load timetable matrix");
       console.error(error);
    } else {
       setSlots(data || []);
    }
    
    setIsLoading(false);
  };

  // Helper matching the specific day & slot to the DB layout
  const getSubjectNode = (day: string, time: string) => {
     return slots.find(s => s.day_of_week === day && s.time_slot === time);
  };

  const getPastelColor = (subject: string) => {
    const map: Record<string, string> = {
       "Mathematics": "bg-blue-50 text-blue-700 border-blue-200",
       "Science": "bg-emerald-50 text-emerald-700 border-emerald-200",
       "English": "bg-purple-50 text-purple-700 border-purple-200",
       "History": "bg-amber-50 text-amber-700 border-amber-200",
       "Physical Ed": "bg-rose-50 text-rose-700 border-rose-200",
       "Computer Science": "bg-cyan-50 text-cyan-700 border-cyan-200",
       "Geography": "bg-indigo-50 text-indigo-700 border-indigo-200"
    };
    return map[subject] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="w-full min-h-screen bg-[#F4F7FE] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* Header & Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
           
           <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
             <div className="relative w-full sm:w-auto">
               <select 
                 value={selectedClass}
                 onChange={(e) => setSelectedClass(e.target.value)}
                 className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 pl-4 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold cursor-pointer w-full tracking-wide"
               >
                 <option value="8">Class 8th</option>
                 <option value="9">Class 9th</option>
                 <option value="10">Class 10th</option>
                 <option value="11">Class 11th</option>
                 <option value="12">Class 12th</option>
               </select>
               <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
             </div>

             <div className="relative w-full sm:w-auto">
               <select 
                 value={selectedSection}
                 onChange={(e) => setSelectedSection(e.target.value)}
                 className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 pl-4 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold cursor-pointer w-full tracking-wide"
               >
                 <option value="A">Section A</option>
                 <option value="B">Section B</option>
                 <option value="C">Section C</option>
               </select>
               <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
             </div>
           </div>

           <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={fetchTimetable}
                disabled={isLoading}
                className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 <Database className="w-5 h-5" />
              </button>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm">
                 <Calendar className="w-5 h-5" />
                 Edit Schedule
              </button>
           </div>
        </div>

        {/* Master Weekly Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto relative">
           {isLoading && (
              <div className="absolute inset-0 z-10 bg-slate-50 flex items-center justify-center p-12">
                 <div className="flex flex-col items-center gap-4 text-blue-500">
                    <Loader2 className="w-12 h-12 animate-spin" />
                    <p className="font-bold text-slate-500 animate-pulse">Building matrix structure...</p>
                 </div>
              </div>
           )}

           <table className="w-full text-left border-collapse min-w-[1000px] table-fixed">
              <thead>
                 <tr className="bg-slate-50/80 border-b border-slate-100 divide-x divide-slate-100">
                    <th className="p-4 w-[160px] text-center text-slate-400 font-semibold text-xs tracking-wider uppercase">
                       <div className="flex items-center justify-center gap-2">
                         <Clock className="w-4 h-4" /> Time / Day
                       </div>
                    </th>
                    {DAYS.map(day => (
                       <th key={day} className="p-4 text-center font-bold text-slate-700 uppercase tracking-wide text-sm bg-white">
                         {day}
                       </th>
                    ))}
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {TIME_PERIODS.map((time, timeIdx) => {
                    const isLunchNext = timeIdx === 3; // After 11:00-12:00
                    return (
                       <React.Fragment key={time}>
                          <tr className="divide-x divide-slate-50 group">
                             <td className="p-4 w-[160px] text-center bg-slate-50/30">
                                <span className="font-bold text-slate-500 text-xs tracking-wider whitespace-nowrap">{time}</span>
                             </td>
                             
                             {DAYS.map(day => {
                                const slotNode = getSubjectNode(day, time);
                                return (
                                  <td key={`${day}-${time}`} className="p-3 bg-white h-[100px] align-top hover:bg-slate-50/50 transition-colors">
                                     {slotNode ? (
                                        <div className={`w-full h-full p-3 rounded-xl border flex flex-col justify-center items-center text-center shadow-sm ${getPastelColor(slotNode.subject)}`}>
                                           <p className="font-extrabold text-sm mb-1 line-clamp-1">{slotNode.subject}</p>
                                           <p className="text-xs font-semibold opacity-75">{slotNode.teacher_name}</p>
                                        </div>
                                     ) : (
                                        <div className="w-full h-full border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-300 group-hover:border-slate-200 transition-colors">
                                           <CalendarRange className="w-5 h-5 opacity-50" />
                                        </div>
                                     )}
                                  </td>
                                );
                             })}
                          </tr>

                          {/* Inject Lunch Break Row */}
                          {isLunchNext && (
                             <tr className="bg-slate-50">
                                <td className="p-2 border-r border-slate-100 w-[160px] text-center">
                                   <span className="font-bold text-slate-400 text-[10px] tracking-wider whitespace-nowrap uppercase">12:00 PM - 1:00 PM</span>
                                </td>
                                <td colSpan={6} className="p-2 text-center border-t border-b border-slate-100">
                                   <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-100 shadow-sm">
                                      🥪 Lunch Break
                                   </span>
                                </td>
                             </tr>
                          )}
                       </React.Fragment>
                    );
                 })}
              </tbody>
           </table>
        </div>

      </div>
    </div>
  );
}
