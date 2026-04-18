"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, MessageSquare, UserCircle, AlertCircle, ChevronRight, LogOut, Shield } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export function Sidebar() {
  const pathname = usePathname();
  const isAdmin = pathname.includes("admin");
  const isTeacher = pathname.includes("teacher");

  const isParent = !isAdmin && !isTeacher;

  let navLinks;
  if (isAdmin) {
    navLinks = [
      { name: "Overview", href: "/admin-dashboard", icon: LayoutDashboard },
      { name: "Directory", href: "/admin-dashboard?tab=staff", icon: Shield },
      { name: "Classes", href: "/admin-dashboard?tab=students", icon: BookOpen },
      { name: "Notice Board", href: "/admin-dashboard?tab=noticeboard", icon: MessageSquare },
      { name: "Global Settings", href: "/settings", icon: AlertCircle },
    ];
  } else if (isTeacher) {
    navLinks = [
      { name: "Dashboard", href: "/teacher-dashboard", icon: LayoutDashboard },
    ];
  } else {
    navLinks = [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Academic Record", href: "/academic-record", icon: BookOpen },
      { name: "Communications", href: "/communications", icon: MessageSquare },
      { name: "Student Profile", href: "/profile", icon: UserCircle },
    ];
  }

  return (
    <aside className="w-full md:w-[320px] flex flex-col gap-8 shrink-0">
      <nav className="flex flex-col gap-3">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold ${
                isActive 
                  ? "bg-blue-600 text-white shadow-md hover:bg-blue-700" 
                  : "bg-surface text-slate-500 hover:bg-slate-50 hover:text-blue-600 border border-slate-100 hover:border-slate-200 hover:shadow-sm"
              }`}
            >
              <link.icon className={`w-5 h-5 ${isActive ? "text-blue-100" : ""}`} strokeWidth={2.5} />
              {link.name}
            </Link>
          );
        })}

        <div className="mt-2 border-t border-slate-100 pt-5">
          <button
            onClick={() => {
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-3 justify-start px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold bg-surface text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-100 hover:shadow-sm"
          >
            <LogOut className="w-5 h-5" strokeWidth={2.5} />
            Sign Out
          </button>
        </div>
      </nav>
      {isParent && <ProfileCard />}
      <AlertsCard />
    </aside>
  );
}

function ProfileCard() {
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudent() {
      const { data, error } = await supabase.from("students").select("*").limit(1).single();
      if (!error && data) {
        setStudentProfile(data);
      }
      setLoading(false);
    }
    fetchStudent();
  }, []);

  if (loading) {
    return (
      <div className="bg-surface border border-slate-100 rounded-2xl p-8 flex flex-col items-center shadow-md animate-pulse">
        <div className="w-28 h-28 rounded-full bg-slate-100 mb-5 ring-4 ring-slate-50" />
        <div className="h-6 w-32 bg-slate-100 rounded-lg mb-4" />
        <div className="flex flex-col items-center space-y-3 w-full mt-2">
          <div className="h-7 w-24 bg-blue-50 rounded-full" />
          <div className="h-4 w-20 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  const name = studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}` : "Student Profile";
  const className = studentProfile?.class_name ? `CLASS ${studentProfile.class_name}` : "CLASS N/A";
  const rollNo = studentProfile ? `Roll No: ${studentProfile.roll_number || studentProfile.roll || 'N/A'}` : "Roll No: N/A";

  return (
    <div className="bg-surface border border-slate-100 rounded-2xl p-8 flex flex-col items-center shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
      <div className="w-28 h-28 rounded-full bg-slate-50 mb-5 shadow-inner overflow-hidden flex items-center justify-center ring-4 ring-slate-50">
        <img 
          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${name.replace(/\s+/g, "")}&backgroundColor=f8fafc`} 
          alt={name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>
      <h2 className="font-serif font-bold text-2xl text-slate-800 mb-1.5">{name}</h2>
      <div className="flex flex-col items-center text-slate-500 text-sm space-y-2 w-full mt-2">
        <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full font-bold tracking-wide text-xs">{className.toUpperCase()}</span>
        <span className="font-medium text-slate-500">{rollNo}</span>
      </div>
    </div>
  );
}

function AlertsCard() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 border-l-4 border-l-indigo-500 rounded-2xl p-6 shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="flex items-center gap-2 mb-3 text-indigo-600">
        <AlertCircle className="w-5 h-5" strokeWidth={2.5} />
        <span className="font-bold font-serif text-sm tracking-wide uppercase">Urgent Announcement</span>
      </div>
      <p className="text-slate-700 text-sm leading-relaxed font-medium">
        Parent-Teacher meeting scheduled for this Saturday.
      </p>
      <button className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wide">
        View details <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
