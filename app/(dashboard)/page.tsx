"use client";

import { useEffect, useState } from "react";
import { Calculator, Atom, BookOpen, FlaskConical, Globe, Languages, GraduationCap, Loader2, Megaphone, Bell, Target } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

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
      <HolisticCard grades={grades} loading={loading} />
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

function HolisticCard({ grades, loading }: { grades: any[], loading: boolean }) {
  const avgAcademics = grades.length > 0 
    ? grades.reduce((acc, g) => acc + (g.final_score || 0), 0) / grades.length 
    : 85;

  const performaceData = [
    { subject: 'Academics', score: Math.round(avgAcademics), fullMark: 100 },
    { subject: 'Communication', score: 88, fullMark: 100 },
    { subject: 'Sports', score: 75, fullMark: 100 },
    { subject: 'Creativity', score: 92, fullMark: 100 },
    { subject: 'Discipline', score: 95, fullMark: 100 },
  ];

  return (
    <div className="bg-surface border border-slate-100 rounded-2xl shadow-md p-8 md:p-10 hover:shadow-lg transition-all duration-300 flex flex-col relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="flex items-center justify-between mb-8 z-10 relative">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-800 drop-shadow-sm flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-600" />
            360° Holistic Performance
          </h2>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">Comprehensive view of student capabilities</p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400 z-10 relative">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="font-medium">Synthesizing holistic profile...</p>
        </div>
      ) : (
        <div className="w-full h-[400px] z-10 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={performaceData}>
              <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13, fontWeight: 'bold' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar 
                name="Student Profile" 
                dataKey="score" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fill="#60a5fa" 
                fillOpacity={0.6} 
                style={{ filter: 'drop-shadow(0px 0px 10px rgba(59, 130, 246, 0.5))' }} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
