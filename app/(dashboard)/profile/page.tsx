"use client";

import { useState, useEffect } from "react";
import { User, Phone, CheckCircle2, Download, AlertCircle, FileText, Mail, Shield, Briefcase, Building } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function Profile() {
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
        const { data } = await supabase.from('users').select('role').eq('email', user.email).single();
        if (data && data.role) {
          setRole(data.role.toUpperCase());
        }
      }
      setLoading(false);
    };
    fetchRole();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (role === 'ADMIN' || role === 'ADMINISTRATOR') {
    return (
      <section className="flex-1 min-w-0 flex flex-col gap-6 md:gap-8 h-full min-h-max animate-in fade-in duration-300">
        <div className="flex items-center justify-between bg-surface border border-slate-100 rounded-2xl p-6 md:p-8 shadow-md shrink-0">
          <div>
            <h1 className="font-serif font-bold text-3xl text-primary drop-shadow-sm">Admin Settings</h1>
            <p className="text-slate-500 mt-2 font-medium">Manage global preferences and your administrator account.</p>
          </div>
          <div className="hidden md:flex items-center justify-center p-4 bg-indigo-50 rounded-full text-indigo-600 shadow-inner ring-4 ring-slate-50">
            <Shield className="w-8 h-8" strokeWidth={2.5} />
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full lg:w-[60%]">
          <div className="bg-surface border border-slate-100 rounded-2xl shadow-md p-6 md:p-8 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-100 pb-4">
               <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Administrator</span>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Mail className="w-4 h-4"/> Admin Email</label>
                <input type="text" readOnly value={email} className="h-12 w-full bg-slate-50 border border-slate-200 text-slate-500 px-4 rounded-xl font-medium focus:outline-none cursor-not-allowed shadow-inner" />
              </div>
            </div>
            <button className="mt-8 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white w-full md:w-auto px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-md">
              Update Administrator Preferences
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (role === 'TEACHER') {
    return (
      <section className="flex-1 min-w-0 flex flex-col gap-6 md:gap-8 h-full min-h-max animate-in fade-in duration-300">
        <div className="flex items-center justify-between bg-surface border border-slate-100 rounded-2xl p-6 md:p-8 shadow-md shrink-0">
          <div>
            <h1 className="font-serif font-bold text-3xl text-primary drop-shadow-sm">Teacher Profile</h1>
            <p className="text-slate-500 mt-2 font-medium">Manage your staff details and communication preferences.</p>
          </div>
          <div className="hidden md:flex items-center justify-center p-4 bg-blue-50 rounded-full text-blue-600 shadow-inner ring-4 ring-slate-50">
            <Briefcase className="w-8 h-8" strokeWidth={2.5} />
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full lg:w-[60%]">
          <div className="bg-surface border border-slate-100 rounded-2xl shadow-md p-6 md:p-8 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-100 pb-4">
               <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Staff / Educator</span>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Mail className="w-4 h-4"/> Work Email</label>
                <input type="text" readOnly value={email} className="h-12 w-full bg-slate-50 border border-slate-200 text-slate-500 px-4 rounded-xl font-medium focus:outline-none cursor-not-allowed shadow-inner" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Building className="w-4 h-4"/> Department</label>
                <input type="text" readOnly value="General Academics" className="h-12 w-full bg-slate-50 border border-slate-200 text-slate-500 px-4 rounded-xl font-medium focus:outline-none cursor-not-allowed shadow-inner" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 min-w-0 flex flex-col gap-6 md:gap-8 h-full min-h-max animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex items-center justify-between bg-surface border border-slate-100 rounded-2xl p-6 md:p-8 shadow-md shrink-0">
        <div>
          <h1 className="font-serif font-bold text-3xl text-primary drop-shadow-sm">Student Profile</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage contact details, fees, and portal settings.</p>
        </div>
        <div className="hidden md:flex items-center justify-center p-4 bg-emerald-50 rounded-full text-emerald-600 shadow-inner ring-4 ring-slate-50">
          <User className="w-8 h-8" strokeWidth={2.5} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 flex-1 mb-8">
        {/* Left Column (70%) - Forms & Contacts */}
        <div className="w-full lg:w-[70%] flex flex-col gap-8 shrink-0">
          
          {/* Personal Details */}
          <div className="bg-surface border border-slate-100 rounded-2xl shadow-md p-6 md:p-8 hover:shadow-lg transition-all duration-300">
            <h2 className="font-serif font-bold text-2xl text-primary mb-6 border-b-2 border-slate-100 pb-4">Personal Details</h2>
            <form className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Date of Birth</label>
                  <input type="text" readOnly value="14 August 2010" className="h-12 w-full bg-slate-50 border border-slate-200 text-slate-500 px-4 rounded-xl font-medium focus:outline-none cursor-not-allowed shadow-inner" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Blood Group</label>
                  <input type="text" readOnly value="O Positive (O+)" className="h-12 w-full bg-slate-50 border border-slate-200 text-slate-500 px-4 rounded-xl font-medium focus:outline-none cursor-not-allowed shadow-inner" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Residential Address</label>
                <textarea readOnly value="142, Spring Valley Greens, Nainital Road, Haldwani, Uttarakhand 263139" className="h-24 w-full bg-slate-50 border border-slate-200 text-slate-500 p-4 rounded-xl font-medium focus:outline-none cursor-not-allowed shadow-inner resize-none"></textarea>
              </div>
            </form>
          </div>

          {/* Emergency Contacts */}
          <div className="bg-surface border border-slate-100 rounded-2xl shadow-md p-6 md:p-8 hover:shadow-lg transition-all duration-300">
            <h2 className="font-serif font-bold text-2xl text-primary mb-6 border-b-2 border-slate-100 pb-4">Emergency Contacts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="p-5 border border-slate-100 rounded-2xl bg-white hover:border-blue-200 hover:bg-blue-50/50 transition-colors group">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Father</p>
                <p className="text-lg font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">Rajesh Joshi</p>
                <div className="flex items-center gap-2 text-slate-600 font-medium bg-slate-50 w-fit px-3 py-1.5 rounded-lg shadow-sm border border-slate-100">
                  <Phone className="w-4 h-4 text-blue-500" />
                  +91 98765 43210
                </div>
              </div>

              <div className="p-5 border border-slate-100 rounded-2xl bg-white hover:border-blue-200 hover:bg-blue-50/50 transition-colors group">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mother</p>
                <p className="text-lg font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">Meena Joshi</p>
                <div className="flex items-center gap-2 text-slate-600 font-medium bg-slate-50 w-fit px-3 py-1.5 rounded-lg shadow-sm border border-slate-100">
                  <Phone className="w-4 h-4 text-blue-500" />
                  +91 98765 43211
                </div>
              </div>

            </div>
          </div>

          {/* Primary CTA */}
          <button className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-900 text-white w-full md:w-fit px-8 py-4 rounded-full font-bold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 uppercase tracking-wide text-sm mt-2">
            <AlertCircle className="w-5 h-5" />
            Request Details Update
          </button>
        </div>

        {/* Right Column (30%) - Summaries & Widgets */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Fees Status Widget */}
          <button className="bg-surface border border-slate-100 rounded-2xl shadow-md p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-primary">
             {/* Decorative Background */ }
            <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText className="w-32 h-32 text-green-500" />
            </div>

            <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Financials</p>
            <h3 className="font-serif font-bold text-xl text-primary mb-4 drop-shadow-sm">Fees Status</h3>
            
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 p-4 rounded-xl shadow-inner relative z-10 w-fit md:w-full">
              <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" strokeWidth={2.5} />
              <span className="font-bold text-green-700 text-lg flex-1">Q2 Fees: Paid</span>
              <div className="bg-white p-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 hidden lg:block">
                <Download className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </button>
        </div>

      </div>
    </section>
  );
}
