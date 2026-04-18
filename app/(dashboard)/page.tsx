"use client";

import { useEffect, useState } from "react";
import { Calculator, Atom, BookOpen, FlaskConical, Globe, Languages, GraduationCap, Loader2, Megaphone, Bell } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Helper function to assign icons and colors based on subject
function getSubjectStyles(subject: string) {
  const s = subject.toLowerCase();
  if (s.includes("math")) return { icon: Calculator, gradient: "from-red-500 to-rose-400", bg: "bg-red-50", text: "text-red-600" };
  if (s.includes("phys")) return { icon: Atom, gradient: "from-green-500 to-emerald-400", bg: "bg-green-50", text: "text-green-600" };
  if (s.includes("chem")) return { icon: FlaskConical, gradient: "from-blue-500 to-cyan-400", bg: "bg-blue-50", text: "text-blue-600" };
  if (s.includes("eng") || s.includes("lang") || s.includes("lit")) return { icon: Languages, gradient: "from-purple-500 to-fuchsia-400", bg: "bg-purple-50", text: "text-purple-600" };
  if (s.includes("hist") || s.includes("geo") || s.includes("civics")) return { icon: Globe, gradient: "from-amber-500 to-orange-400", bg: "bg-amber-50", text: "text-amber-600" };
  
  return { icon: BookOpen, gradient: "from-indigo-500 to-blue-400", bg: "bg-indigo-50", text: "text-indigo-600" };
}

export default function Dashboard() {
  const [grades, setGrades] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setLoadingAnnouncements(true);
      try {
        // Fetch the first student for prototype purposes
        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("*")
          .limit(1)
          .single();

        if (studentError || !student) {
          console.error("Error fetching student:", studentError);
        } else {
          // Fetch their grades
          const { data: userGrades, error: gradesError } = await supabase
            .from("grades")
            .select("*")
            .eq("student_id", student.id);

          if (gradesError) {
            console.error("Error fetching grades:", gradesError);
          } else {
            setGrades(userGrades || []);
          }
        }

        // Fetch announcements
        const { data: announcementsData, error: announcementsError } = await supabase
          .from("announcements")
          .select("*")
          .in('target_audience', ['ALL', 'PARENTS'])
          .order('created_at', { ascending: false });

        if (announcementsError) {
          console.error("Error fetching announcements:", announcementsError);
        } else {
          setAnnouncements(announcementsData || []);
        }

      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
        setLoadingAnnouncements(false);
      }
    }

    fetchData();
  }, []);

  return (
    <section className="flex-1 min-w-0 flex flex-col gap-10 animate-in fade-in duration-500">
      <ImportantUpdates announcements={announcements} loading={loadingAnnouncements} />
      <RecentMarks grades={grades} loading={loading} />
    </section>
  );
}

function ImportantUpdates({ announcements, loading }: { announcements: any[], loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-slate-400 bg-surface border border-slate-100 rounded-2xl shadow-sm">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-2" />
        <p className="font-medium text-sm">Checking for updates...</p>
      </div>
    );
  }

  if (announcements.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-serif font-bold text-2xl text-slate-800 drop-shadow-sm">Important Updates</h2>
      </div>
      <div className="flex flex-col gap-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 p-6 md:p-8 rounded-2xl flex gap-4 md:gap-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex flex-col items-center justify-center text-amber-600 shadow-sm border border-amber-200/50">
                <Megaphone className="w-6 h-6" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 w-full justify-center">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-amber-700/80 uppercase tracking-widest">{announcement.target_audience === 'ALL' ? 'Campus-Wide Broadcast' : 'Parent Notice'}</span>
                <span className="text-sm font-bold text-amber-600/70">
                  {new Date(announcement.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <p className="text-slate-800 font-medium leading-relaxed bg-white/50 p-3 rounded-xl border border-amber-100 mt-1 shadow-sm">{announcement.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentMarks({ grades, loading }: { grades: any[], loading: boolean }) {
  return (
    <div className="bg-surface border border-slate-100 rounded-2xl shadow-md p-8 md:p-10 hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif font-bold text-2xl text-primary drop-shadow-sm">Recent Marks</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">Latest term-wise academic performance</p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="font-medium">Fetching grades from cloud...</p>
        </div>
      ) : grades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <div className="p-4 bg-white rounded-full shadow-sm">
            <GraduationCap className="w-8 h-8 text-slate-400" />
          </div>
          <p className="font-medium text-slate-500">No grades posted yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {grades.map((grade, i) => {
            const styles = getSubjectStyles(grade.subject || "Unknown");
            const score = grade.final_score || 0;
            const SubjectIcon = styles.icon;

            return (
              <div 
                key={grade.id || i} 
                className="flex flex-col p-5 md:p-6 border border-slate-100 bg-white rounded-2xl hover:-translate-y-1 hover:shadow-md hover:border-slate-200 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${styles.bg} ${styles.text} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <SubjectIcon className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-slate-800 text-lg">{grade.subject}</span>
                  </div>
                  <span className={`text-4xl font-extrabold drop-shadow-sm ${styles.text}`}>{score}%</span>
                </div>
                
                {/* Progress Bar Track */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  {/* Progress Bar Fill */}
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${styles.gradient} shadow-sm transition-all duration-1000 ease-out`} 
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
