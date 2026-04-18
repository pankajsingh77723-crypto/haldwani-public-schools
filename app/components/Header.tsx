"use client";

import { Bell, GraduationCap, Search, Loader2, User, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function Header() {
  const pathname = usePathname();
  const isAdmin = pathname.includes("admin");

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      
      // Search students
      const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name, class_name, roll_no')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,roll_no.ilike.%${searchQuery}%`)
        .limit(3);
        
      // Search staff (users)
      const { data: users } = await supabase
        .from('users')
        .select('id, name, role')
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(3);

      const combined = [
        ...(students || []).map(s => ({ ...s, type: 'student' })),
        ...(users || []).map(u => ({ ...u, type: 'staff' }))
      ];
      
      setResults(combined);
      setIsSearching(false);
    };
    
    const timer = setTimeout(() => {
      fetchResults();
    }, 400); // debounce
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <header className="h-20 bg-gradient-to-r from-blue-900 to-indigo-800 w-full flex items-center justify-center shrink-0 shadow-md">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <GraduationCap className="w-8 h-8 hidden md:block" strokeWidth={2.5} />
          <span className="font-serif font-bold text-2xl tracking-wide drop-shadow-sm whitespace-nowrap">
            Haldwani Public Schools
          </span>
        </div>

        {/* Global Admin Search Bar */}
        {isAdmin && (
          <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-200" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Search for student, teacher, or roll number..." 
              className="w-full bg-white/10 hover:bg-white/20 focus:bg-white focus:text-slate-900 text-white placeholder-blue-200 px-11 py-2.5 rounded-full border border-white/20 focus:border-blue-400 outline-none transition-all shadow-inner"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 animate-spin" />
            )}

            {/* Search Dropdown */}
            {showDropdown && searchQuery.trim() !== "" && (
              <div className="absolute top-[120%] left-0 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 flex flex-col py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {results.length === 0 && !isSearching ? (
                  <div className="p-4 text-center text-slate-500 font-medium">
                    No matching records found.
                  </div>
                ) : (
                  <>
                    {results.map((result, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b last:border-b-0 border-slate-100 group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm">
                              {result.type === 'student' ? `${result.first_name} ${result.last_name}` : result.name}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              {result.type === 'student' ? `Class ${result.class_name || 'N/A'} - Roll: ${result.roll_no || 'N/A'}` : result.role}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          result.type === 'staff' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {result.type}
                        </span>
                      </div>
                    ))}
                    <div className="px-4 py-2 mt-1 bg-slate-50/50 flex items-center justify-center text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors uppercase tracking-wide">
                      View all results <ChevronRight className="w-3 h-3 ml-1" />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <button className="relative p-2.5 text-white hover:bg-white/10 rounded-xl transition-all duration-300 group" aria-label="Notifications">
          <Bell className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" strokeWidth={2} />
          {/* Notification Dot */}
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-transparent shadow-sm"></span>
        </button>
      </div>
    </header>
  );
}
