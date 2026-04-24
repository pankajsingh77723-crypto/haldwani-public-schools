"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Megaphone, Star, AlertTriangle, MessageSquare, CheckCircle, GraduationCap, Wallet, Download } from "lucide-react";

type FeedItem = {
  id: string;
  type: 'ANNOUNCEMENT' | 'GRADE_UPDATE' | 'ATTENDANCE_ALERT' | 'BEHAVIOR_NOTE';
  title: string;
  message: string;
  timestamp: string;
  isAcknowledged?: boolean;
  rawDate?: string;
};

export default function ParentDashboard() {
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [currentFee, setCurrentFee] = useState<any>(null);
  const [isFetchingFee, setIsFetchingFee] = useState(true);
  const [timelineEvents, setTimelineEvents] = useState<FeedItem[]>([]);
  const [isFetchingTimeline, setIsFetchingTimeline] = useState(true);
  
  useEffect(() => {
    async function fetchStudentAndData() {
      const { data, error } = await supabase.from("students").select("*").limit(1).single();
      if (!error && data) {
        setStudentProfile(data);
        
        // Fetch Fee Data
        const { data: feeData } = await supabase.from("fees").select("*").eq("student_id", data.id).order("created_at", { ascending: false }).limit(1).single();
        if (feeData) {
          setCurrentFee(feeData);
        }
        setIsFetchingFee(false);

        // Fetch Timeline Data
        const { data: gradesData } = await supabase.from("grades").select("*").eq("student_id", data.id);
        const { data: announcementsData } = await supabase.from("announcements").select("*").in("target_audience", ["ALL", "PARENTS", "All", "Parents"]);
        const { data: attendanceData } = await supabase.from("attendance").select("*").eq("student_id", data.id);
        
        const events: FeedItem[] = [];
        
        if (gradesData) {
          gradesData.forEach((g: any) => {
            events.push({
              id: `grade-${g.id}`,
              type: 'GRADE_UPDATE',
              title: `New Grade: ${g.subject_name}`,
              message: `Scored ${g.score_obtained} / ${g.total_score} in ${g.exam_type}`,
              timestamp: new Date(g.created_at || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
              isAcknowledged: false,
              rawDate: g.created_at || new Date().toISOString()
            });
          });
        }
        
        if (announcementsData) {
          announcementsData.forEach((a: any) => {
            events.push({
              id: `ann-${a.id}`,
              type: 'ANNOUNCEMENT',
              title: a.title || 'Update from School',
              message: a.content,
              timestamp: new Date(a.created_at || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
              isAcknowledged: false,
              rawDate: a.created_at || new Date().toISOString()
            });
          });
        }

        if (attendanceData) {
          attendanceData.forEach((a: any) => {
            events.push({
              id: `att-${a.id}`,
              type: 'ATTENDANCE_ALERT',
              title: `Attendance Update`,
              message: `Marked ${a.status}`,
              timestamp: new Date(a.date || a.created_at || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
              isAcknowledged: false,
              rawDate: a.date || a.created_at || new Date().toISOString()
            });
          });
        }
        
        // Sort descending
        events.sort((a: any, b: any) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
        setTimelineEvents(events);
      } else {
        setIsFetchingFee(false);
      }
      setIsFetchingTimeline(false);
    }
    fetchStudentAndData();
  }, []);

  // Real-Time Subscriptions
  useEffect(() => {
    if (!studentProfile) return;

    const channel = supabase.channel('public:attendance')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance', filter: `student_id=eq.${studentProfile.id}` }, (payload) => {
        const newRecord = payload.new as any;
        const newEvent: FeedItem = {
          id: `att-${newRecord.id}`,
          type: 'ATTENDANCE_ALERT',
          title: `Attendance Update`,
          message: `Marked ${newRecord.status}`,
          timestamp: new Date(newRecord.date || newRecord.created_at || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
          isAcknowledged: false,
          rawDate: newRecord.date || newRecord.created_at || new Date().toISOString()
        };
        
        // Push newly formatted event to the absolute top of the timeline array
        setTimelineEvents((prev) => [newEvent, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentProfile]);

  const name = studentProfile ? `${studentProfile.first_name || ''} ${studentProfile.last_name || ''}`.trim() : "Loading...";
  const className = studentProfile?.class_name ? `Class ${studentProfile.class_name}` : "Class N/A";
  const rollNo = studentProfile?.roll_number || studentProfile?.roll_no || studentProfile?.roll || 'N/A';

  const attendancePercent = 96;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (attendancePercent / 100) * circumference;

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handlePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }, 1500);
  };

  const handleAcknowledge = (id: string) => {
    setTimelineEvents(prev => prev.map(item => item.id === id ? { ...item, isAcknowledged: true } : item));
  };

  const getFeedCardStyles = (type: FeedItem['type']) => {
    switch (type) {
      case 'ANNOUNCEMENT': return { border: 'border-l-blue-500', icon: Megaphone, iconColor: 'text-blue-500', bg: 'bg-blue-50' };
      case 'GRADE_UPDATE': return { border: 'border-l-green-500', icon: Star, iconColor: 'text-green-500', bg: 'bg-green-50' };
      case 'ATTENDANCE_ALERT': return { border: 'border-l-red-500', icon: AlertTriangle, iconColor: 'text-red-500', bg: 'bg-red-50' };
      case 'BEHAVIOR_NOTE': return { border: 'border-l-indigo-500', icon: MessageSquare, iconColor: 'text-indigo-500', bg: 'bg-indigo-50' };
      default: return { border: 'border-l-slate-500', icon: MessageSquare, iconColor: 'text-slate-500', bg: 'bg-slate-50' };
    }
  };

  return (
    <section className="flex-1 w-full min-h-screen bg-slate-50 p-4 lg:p-8 flex justify-center animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-white border border-green-200 text-green-700 shadow-xl shadow-green-900/5 px-6 py-4 rounded-2xl font-bold flex items-center gap-3 animate-in slide-in-from-top-10 fade-in zoom-in-95 duration-300">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-800 text-sm">Payment Gateway</span>
            <span className="text-[11px] font-bold text-green-600 uppercase tracking-widest">Opening Secure Link...</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl flex flex-col gap-8">
        
        {/* Top Header: Student Snapshot */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600 left-0"></div>
          
          <div className="relative mt-8 md:mt-2 w-28 h-28 rounded-full border-4 border-white shadow-md bg-white overflow-hidden shrink-0">
            {studentProfile ? (
              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${name.replace(/\s+/g, "")}&backgroundColor=f8fafc`} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100 animate-pulse" />
            )}
          </div>
          
          <div className="relative z-10 flex flex-col items-center md:items-start flex-1 mt-4 md:mt-10">
            {studentProfile ? (
              <>
                <h1 className="font-serif font-extrabold text-3xl text-slate-800">{name}</h1>
                <p className="text-blue-600 font-bold text-sm tracking-wide uppercase mt-1">{className} • Roll {rollNo}</p>
              </>
            ) : (
              <>
                <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse mb-2" />
                <div className="h-5 w-32 bg-blue-50 rounded-lg animate-pulse" />
              </>
            )}
          </div>

          <div className="relative z-10 flex gap-6 mt-4 md:mt-10 w-full md:w-auto justify-center md:justify-end">
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r={radius} stroke="currentColor" strokeWidth="5" fill="transparent" className="text-slate-100" />
                  <circle cx="28" cy="28" r={radius} stroke="currentColor" strokeWidth="5" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className="text-emerald-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-extrabold text-slate-800 text-sm">
                  {attendancePercent}%
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-2">Attendance</span>
            </div>
            
            <div className="w-px h-16 bg-slate-200"></div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 mb-2">
                <span className="font-extrabold text-indigo-700 text-lg">3.8</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Current GPA</span>
            </div>
          </div>
        </div>

        {/* Financial Status Widget */}
        {isFetchingFee ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden animate-pulse">
              <div className="flex flex-col relative z-10 w-full mb-4 sm:mb-0">
                <div className="h-4 bg-slate-100 rounded w-24 mb-2"></div>
                <div className="h-6 bg-slate-100 rounded w-48"></div>
              </div>
              <div className="h-12 bg-slate-100 rounded-xl w-48 shrink-0"></div>
          </div>
        ) : currentFee && (currentFee.status?.toUpperCase() === 'OVERDUE' || currentFee.status?.toUpperCase() === 'PENDING') ? (
          <div className={`bg-white border border-${currentFee.status.toUpperCase() === 'OVERDUE' ? 'red' : 'amber'}-200 shadow-${currentFee.status.toUpperCase() === 'OVERDUE' ? 'red' : 'amber'}-900/5 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-48 h-48 bg-${currentFee.status.toUpperCase() === 'OVERDUE' ? 'red' : 'amber'}-50 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-150 duration-700 opacity-70`}></div>
            
            <div className="flex flex-col relative z-10">
              <span className={`text-${currentFee.status.toUpperCase() === 'OVERDUE' ? 'red' : 'amber'}-500 font-extrabold text-[10px] tracking-widest uppercase mb-1.5 flex items-center gap-1.5 bg-${currentFee.status.toUpperCase() === 'OVERDUE' ? 'red' : 'amber'}-50 w-max px-2.5 py-1 rounded-md border border-${currentFee.status.toUpperCase() === 'OVERDUE' ? 'red' : 'amber'}-100`}>
                <AlertTriangle className={`w-3.5 h-3.5 fill-${currentFee.status.toUpperCase() === 'OVERDUE' ? 'red' : 'amber'}-500/20`} /> Status: {currentFee.status}
              </span>
              <h3 className="font-serif font-bold text-2xl text-slate-800">{currentFee.fee_cycle}: <span className={`font-extrabold text-${currentFee.status.toUpperCase() === 'OVERDUE' ? 'red' : 'amber'}-600 bg-clip-text`}>₹{Number(currentFee.total_amount).toLocaleString('en-IN')}</span></h3>
            </div>
            
            <button 
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className={`relative z-10 shrink-0 bg-${currentFee.status.toUpperCase() === 'OVERDUE' ? 'red' : 'amber'}-600 hover:bg-${currentFee.status.toUpperCase() === 'OVERDUE' ? 'red' : 'amber'}-700 disabled:opacity-80 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(${currentFee.status.toUpperCase() === 'OVERDUE' ? '220,38,38' : '245,158,11'},0.2)] hover:shadow-[0_0_30px_rgba(${currentFee.status.toUpperCase() === 'OVERDUE' ? '220,38,38' : '245,158,11'},0.4)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2.5`}
            >
              {isProcessingPayment ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Pay Now via Razorpay
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-sm shadow-emerald-900/5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-150 duration-700 opacity-70"></div>
            
            <div className="flex flex-col relative z-10">
              <span className="text-emerald-600 font-extrabold text-[10px] tracking-widest uppercase mb-1.5 flex items-center gap-1.5 bg-emerald-50 w-max px-2.5 py-1 rounded-md border border-emerald-100">
                <CheckCircle className="w-3.5 h-3.5 fill-emerald-500/20" /> All Dues Cleared
              </span>
              <h3 className="font-serif font-bold text-xl text-slate-800">Financial Status: <span className="font-extrabold text-emerald-600 bg-clip-text">No active dues.</span></h3>
            </div>
            
            <button 
              className="relative z-10 shrink-0 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2.5"
            >
              <Download className="w-5 h-5" />
              Download Receipt
            </button>
          </div>
        )}

        {/* Daily Feed Timeline */}
        <div className="flex flex-col relative w-full mb-10">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-serif font-bold text-2xl text-slate-800">Real-Time Daily Feed</h2>
            <div className="h-px bg-slate-200 flex-1 ml-4"></div>
          </div>

          {isFetchingTimeline ? (
            <div className="flex flex-col gap-6 px-2 mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 md:items-center md:even:flex-row-reverse animate-pulse group">
                  <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0 border-4 border-slate-50 md:mx-auto"></div>
                  <div className="flex-1 md:w-[calc(50%-2.5rem)] md:flex-none bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mt-1 mb-1">
                    <div className="h-3 bg-slate-100 rounded w-20 mb-3"></div>
                    <div className="h-5 bg-slate-100 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-50 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : timelineEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-3xl shadow-sm text-center mt-5 mb-5 mx-2 group">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Megaphone className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-2">No Recent Activity</h3>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">You're all caught up! There are no new announcements or grade updates to show at this time.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5 px-2 relative before:absolute before:inset-0 before:ml-[34px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
              {timelineEvents.map((item, idx) => {
                const styles = getFeedCardStyles(item.type);
                const Icon = styles.icon;
                
                return (
                  <div key={item.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ease-out ${item.isAcknowledged ? 'opacity-50' : 'opacity-100'}`}>
                    
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-50 bg-white shadow-sm z-10 shrink-0 md:mx-auto ${styles.iconColor} ring-1 ring-slate-200 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                      <div className={`border-l-4 ${styles.border} p-5 flex flex-col`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${styles.bg} ${styles.iconColor}`}>
                            {item.type.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">{item.timestamp}</span>
                        </div>
                        
                        <h3 className="font-bold text-slate-800 text-lg mb-1 leading-snug">{item.title}</h3>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed">{item.message}</p>
                        
                        {item.type === 'ATTENDANCE_ALERT' && !item.isAcknowledged && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <button 
                              onClick={() => handleAcknowledge(item.id)}
                              className="flex items-center justify-center gap-2 w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-lg transition-colors border border-red-100"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Acknowledge Alert
                            </button>
                          </div>
                        )}
                        {item.isAcknowledged && (
                          <div className="mt-4 pt-3 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                            <CheckCircle className="w-3.5 h-3.5" /> Acknowledged
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
