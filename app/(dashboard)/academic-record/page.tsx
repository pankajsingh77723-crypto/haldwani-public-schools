"use client";

import { useState } from "react";

export default function AcademicRecord() {
  const [activeTerm, setActiveTerm] = useState("Term 1");

  return (
    <section className="flex-1 min-w-0 flex flex-col gap-8">
      {/* Top Header Section for the page */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-surface border border-slate-100 rounded-2xl p-6 md:p-8 shadow-md">
        <div>
          <h1 className="font-serif font-bold text-3xl text-primary drop-shadow-sm">Academic Record</h1>
          <p className="text-slate-500 mt-2 font-medium">Comprehensive view of term-wise grades, attendance, and remarks.</p>
        </div>
        <AttendanceWidget />
      </div>

      {/* Main Content */}
      <div className="bg-surface border border-slate-100 rounded-2xl shadow-md p-6 md:p-8 hover:shadow-lg transition-all duration-300 flex flex-col">
        {/* Term Selector */}
        <div className="flex items-center gap-2 mb-8 bg-slate-50 p-1.5 rounded-full w-fit border border-slate-100 overflow-x-auto max-w-full shrink-0">
          {["Term 1", "Term 2", "Final"].map((term) => (
            <button
              key={term}
              onClick={() => setActiveTerm(term)}
              className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                activeTerm === term
                  ? "bg-white text-primary shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-primary hover:bg-slate-100/50 block"
              }`}
            >
              {term}
            </button>
          ))}
        </div>

        {/* Grades Table */}
        <GradesTable term={activeTerm} />
      </div>
    </section>
  );
}

function AttendanceWidget() {
  const percentage = 88;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-6 bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-inner w-full xl:w-auto overflow-hidden shrink-0">
      <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="#E2E8F0"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="#0B2046"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out drop-shadow-sm"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute font-serif font-bold text-xl text-primary">{percentage}%</span>
      </div>
      <div>
        <h3 className="font-bold text-slate-800 text-lg">Attendance</h3>
        <p className="text-slate-500 text-sm font-medium mt-1 max-w-[200px]">Excellent track record throughout the year.</p>
      </div>
    </div>
  );
}

function GradesTable({ term }: { term: string }) {
  // Dummy data dependent on term
  let grades = [
    { subject: "Mathematics", midterm: "45%", assignments: "65%", final: "50%", remark: "Needs urgent attention in calculus." },
    { subject: "Physics", midterm: "82%", assignments: "90%", final: "85%", remark: "Consistent performance, keep it up." },
    { subject: "Chemistry", midterm: "78%", assignments: "85%", final: "80%", remark: "Good grasp of concepts." },
    { subject: "English", midterm: "88%", assignments: "92%", final: "89%", remark: "Excellent participation in class discussions." },
    { subject: "Computer Science", midterm: "95%", assignments: "98%", final: "96%", remark: "Outstanding programming and logic skills." },
  ];

  if (term === "Term 2") {
    grades = grades.map(g => ({ ...g, midterm: "N/A", assignments: "70%", final: "Exams pending" }));
  } else if (term === "Final") {
    grades = [];
  }

  if (grades.length === 0) {
    return (
      <div className="text-center py-12 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
        <p className="font-bold text-lg text-slate-600 font-serif">Exams pending</p>
        <p className="text-slate-500 text-sm mt-2">Data will be populated once exams are completed and evaluated.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full pb-4 scrollbar-hide">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="pb-4 font-serif font-bold text-primary whitespace-nowrap px-4 w-[20%]">Subject</th>
            <th className="pb-4 font-serif font-bold text-primary whitespace-nowrap px-4 w-[15%]">Mid-Term</th>
            <th className="pb-4 font-serif font-bold text-primary whitespace-nowrap px-4 hidden md:table-cell w-[15%]">Assignments</th>
            <th className="pb-4 font-serif font-bold text-primary whitespace-nowrap px-4 w-[15%]">Final</th>
            <th className="pb-4 font-serif font-bold text-primary px-4 w-[35%]">Teacher Remark</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group last:border-0">
              <td className="py-5 px-4 font-bold text-slate-800 whitespace-nowrap">{grade.subject}</td>
              <td className="py-5 px-4 font-medium text-slate-600">{grade.midterm}</td>
              <td className="py-5 px-4 font-medium text-slate-600 hidden md:table-cell">{grade.assignments}</td>
              <td className="py-5 px-4">
                {grade.final !== "Exams pending" ? (
                  <span className={`font-bold px-3 py-1.5 rounded-lg text-sm shadow-sm ${parseInt(grade.final) < 60 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                    {grade.final}
                  </span>
                ) : (
                  <span className="font-medium text-slate-400 italic text-sm">{grade.final}</span>
                )}
              </td>
              <td className="py-5 px-4 text-sm text-slate-500 italic md:whitespace-normal leading-relaxed group-hover:text-slate-800 transition-colors">{grade.remark}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
