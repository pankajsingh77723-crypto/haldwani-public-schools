"use client";

import { PieChart, BarChart3, Download, Search, ListFilter, Calendar, FileText } from "lucide-react";

export default function ReportsAnalytics() {
  const tableData = [
    { metric: "Total Enrollment", target: "1,500", achieved: "1,240", variance: "-17.3%", status: "Needs Review" },
    { metric: "Average Attendance", target: "95%", achieved: "92.4%", variance: "-2.6%", status: "On Track" },
    { metric: "Fee Collection", target: "$150,000", achieved: "$142,500", variance: "-5%", status: "On Track" },
    { metric: "Staff Retention", target: "98%", achieved: "96%", variance: "-2%", status: "On Track" },
    { metric: "New Admissions", target: "200", achieved: "215", variance: "+7.5%", status: "Exceeded" },
  ];

  return (
    <div className="w-full min-h-screen bg-[#F4F7FE] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* Top Control Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-6 xl:items-end justify-between">
            <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
              
              {/* Report Type */}
              <div className="flex flex-col gap-1.5 flex-1 md:flex-none">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Report Type</label>
                <div className="relative">
                  <select className="w-full md:w-[220px] appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-10 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] font-semibold cursor-pointer">
                    <option value="financial">Financial Overview</option>
                    <option value="attendance">Attendance Summary</option>
                    <option value="academic">Academic Performance</option>
                    <option value="staff">Staff Workload</option>
                  </select>
                  <ListFilter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Date Range */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1 md:flex-none">
                <div className="flex flex-col gap-1.5 flex-1 w-full md:w-[150px]">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Start Date</label>
                  <div className="relative">
                    <input 
                      type="date"
                      defaultValue="2026-01-01"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-slate-700 font-semibold text-sm cursor-text"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 w-full md:w-[150px]">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">End Date</label>
                  <div className="relative">
                    <input 
                      type="date"
                      defaultValue="2026-04-21"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all text-slate-700 font-semibold text-sm cursor-text"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto mt-2 xl:mt-0 pt-0.5">
               <button className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
                 <Download className="w-4 h-4" /> Export to CSV
               </button>
               <button className="flex-1 sm:flex-none bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 whitespace-nowrap">
                 <FileText className="w-4 h-4" /> Generate Report
               </button>
            </div>
        </div>

        {/* 60 / 40 Chart Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-[6fr_4fr] gap-6">
           {/* Bar Chart Placeholder Container (60%) */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[420px]">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="font-bold text-slate-800 font-serif text-xl">Financial Performance</h2>
                 <button className="text-slate-400 hover:text-slate-600 transition-colors"><Search className="w-5 h-5"/></button>
              </div>
              <div className="flex-1 w-full bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-400 transition-colors hover:bg-slate-50">
                 <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm mb-2">
                    <BarChart3 className="w-8 h-8 text-blue-300" />
                 </div>
                 <p className="font-bold text-slate-500 uppercase tracking-wider text-sm">Bar Chart Pending</p>
                 <p className="text-xs font-semibold max-w-[250px] text-center text-slate-400">Main metrics visualization parsing payload arrays. Ready for graph engine integration.</p>
              </div>
           </div>

           {/* Donut Chart Placeholder Container (40%) */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[420px]">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="font-bold text-slate-800 font-serif text-xl">Revenue Distribution</h2>
                 <button className="text-slate-400 hover:text-slate-600 transition-colors"><Search className="w-5 h-5"/></button>
              </div>
              <div className="flex-1 w-full bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-400 transition-colors hover:bg-slate-50">
                 <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm mb-2">
                    <PieChart className="w-8 h-8 text-emerald-300" />
                 </div>
                 <p className="font-bold text-slate-500 uppercase tracking-wider text-sm">Donut Chart Pending</p>
                 <p className="text-xs font-semibold max-w-[250px] text-center text-slate-400">Radial breakdown elements awaiting dimensional dataset slice hooks.</p>
              </div>
           </div>
        </div>

        {/* Aggregated Raw Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col mb-10">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <h2 className="font-bold text-slate-800 font-serif text-lg">Aggregated Data Source</h2>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[800px]">
               <thead>
                 <tr className="bg-white border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                   <th className="p-5 pl-8 w-1/3">Target Metric</th>
                   <th className="p-5">Expected Target</th>
                   <th className="p-5">Achieved Value</th>
                   <th className="p-5">Variance</th>
                   <th className="p-5 pr-8">Audited Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                 {tableData.map((row, idx) => (
                   <tr key={idx} className="hover:bg-slate-50 transition-colors cursor-pointer">
                     <td className="p-5 pl-8 font-bold text-slate-700">{row.metric}</td>
                     <td className="p-5 font-semibold text-slate-500">{row.target}</td>
                     <td className="p-5 font-extrabold text-slate-800">{row.achieved}</td>
                     <td className="p-5">
                       <span className={`font-bold ${row.variance.includes('+') ? 'text-emerald-600' : 'text-rose-500'}`}>
                         {row.variance}
                       </span>
                     </td>
                     <td className="p-5 pr-8">
                       {row.status === "Exceeded" || row.status === "On Track" ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            {row.status}
                          </span>
                       ) : (
                          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            {row.status}
                          </span>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

      </div>
    </div>
  );
}
