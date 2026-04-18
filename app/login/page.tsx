"use client";

import { useRouter } from "next/navigation";
import { GraduationCap, Shield, BookOpen, Users } from "lucide-react";

export default function Login() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-6 font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-100/50 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-3xl p-8 md:p-10 flex flex-col items-center">
        
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="p-4 bg-gradient-to-br from-[#0B2046] to-blue-900 rounded-2xl shadow-lg shadow-blue-900/20">
            <GraduationCap className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="font-serif font-bold text-2xl text-blue-900 drop-shadow-sm text-center">
            Haldwani Public Schools
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-slate-600 font-medium text-center mb-8 text-sm">
          Select your portal to enter (Mock Authentication).
        </p>
        
        {/* Login Buttons */}
        <div className="w-full flex flex-col gap-4">
          <button 
            onClick={() => router.push("/admin-dashboard")}
            className="w-full flex items-center gap-4 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-indigo-950 text-white rounded-2xl p-4 font-bold transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-blue-50" />
            </div>
            <span className="text-lg">Enter as Admin</span>
          </button>
          
          <button 
            onClick={() => router.push("/teacher-dashboard")}
            className="w-full flex items-center gap-4 bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white rounded-2xl p-4 font-bold transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-indigo-50" />
            </div>
            <span className="text-lg">Enter as Teacher</span>
          </button>

          <button 
            onClick={() => router.push("/")}
            className="w-full flex items-center gap-4 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white rounded-2xl p-4 font-bold transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-slate-50" />
            </div>
            <span className="text-lg">Enter as Parent</span>
          </button>
        </div>
        
        {/* Footer info */}
        <p className="mt-8 text-xs text-slate-400 font-medium text-center flex items-center justify-center gap-1">
           Development Mode — Access Control Disabled
        </p>

      </div>
    </div>
  );
}
