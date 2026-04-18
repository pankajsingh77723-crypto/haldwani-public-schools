"use client";

import { useState } from "react";
import { Mail, Reply, User, Calendar, Clock } from "lucide-react";

export default function Communications() {
  const messages = [
    {
      id: 1,
      sender: "Mr. Sharma (Math)",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Sharma&backgroundColor=f8fafc",
      subject: "Poor performance in recent calculus test",
      preview: "Dear Parent, I wanted to bring to your attention that Rohan missed several key questions on the...",
      content: "Dear Parent,\n\nI wanted to bring to your attention that Rohan missed several key questions on the recent calculus test. We need to work on his integration techniques. Let's schedule a brief meeting this Saturday to discuss a study plan.\n\nBest regards,\nMr. Sharma",
      date: "Oct 24",
      timestamp: "09:30 AM",
      unread: true,
    },
    {
      id: 2,
      sender: "School Admin",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Admin&backgroundColor=f8fafc",
      subject: "Diwali Holidays Announcement",
      preview: "Please be informed that the school will remain closed from Oct 28th to Nov 2nd for Diwali...",
      content: "Dear Parents and Students,\n\nPlease be informed that the school will remain closed from Oct 28th to Nov 2nd for the Diwali holidays. Classes will resume on Nov 3rd. Wishing you a joyous and safe festival!\n\nRegards,\nHaldwani Public Schools Administration",
      date: "Oct 20",
      timestamp: "14:00 PM",
      unread: false,
    },
    {
      id: 3,
      sender: "Mrs. Verma (Physics)",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Verma&backgroundColor=f8fafc",
      subject: "Excellent Science Project",
      preview: "Rohan's project on electromagnetic induction was outstanding. He demonstrated great...",
      content: "Hello,\n\nRohan's project on electromagnetic induction was outstanding. He demonstrated great creativity and a solid understanding of the principles. Keep encouraging him!\n\nBest,\nMrs. Verma",
      date: "Oct 15",
      timestamp: "11:15 AM",
      unread: false,
    }
  ];

  const [activeMessageId, setActiveMessageId] = useState(messages[0].id);

  const activeMessage = messages.find(m => m.id === activeMessageId) || messages[0];

  return (
    <section className="flex-1 min-w-0 flex flex-col gap-6 md:gap-8 min-h-max">
      {/* Page Header */}
      <div className="flex items-center justify-between bg-surface border border-slate-100 rounded-2xl p-6 md:p-8 shadow-md shrink-0">
        <div>
          <h1 className="font-serif font-bold text-3xl text-primary drop-shadow-sm">Communications</h1>
          <p className="text-slate-500 mt-2 font-medium">Direct messages and school announcements.</p>
        </div>
        <div className="hidden md:flex items-center justify-center p-4 bg-indigo-50 rounded-full text-indigo-500 shadow-inner ring-4 ring-slate-50">
          <Mail className="w-8 h-8" strokeWidth={2.5} />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 md:gap-8 flex-1 min-h-[600px] mb-8">
        {/* Left Pane - Message List */}
        <div className="w-full xl:w-[400px] bg-surface border border-slate-100 rounded-2xl shadow-md p-4 flex flex-col shrink-0">
          <h2 className="font-serif font-bold text-lg text-primary px-3 mb-4 mt-2">Inbox</h2>
          <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
            {messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setActiveMessageId(msg.id)}
                className={`text-left p-4 rounded-xl transition-all duration-300 border focus:outline-none ${
                  activeMessageId === msg.id 
                    ? "bg-slate-50 border-slate-200 shadow-sm ring-1 ring-slate-200" 
                    : msg.unread 
                      ? "bg-blue-50 border-blue-100 hover:-translate-y-0.5 hover:shadow-md" 
                      : "bg-white border-transparent hover:border-slate-100 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`text-base flex-1 truncate ${msg.unread ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                    {msg.sender}
                  </span>
                  <span className={`text-xs ml-2 ${msg.unread ? "font-bold text-blue-600" : "font-medium text-slate-500"}`}>
                    {msg.date}
                  </span>
                </div>
                <h3 className={`text-sm truncate mb-1.5 ${msg.unread ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}>
                  {msg.subject}
                </h3>
                <p className={`text-xs line-clamp-2 leading-relaxed ${msg.unread ? "text-slate-600 font-medium" : "text-slate-500"}`}>
                  {msg.preview}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Pane - Reading Area */}
        <div className="flex-1 bg-surface border border-slate-100 rounded-2xl shadow-md p-6 md:p-8 flex flex-col relative min-h-[500px]">
          <div className="flex flex-col md:flex-row md:items-start gap-5 mb-8 pb-6 border-b border-slate-100">
            <img 
              src={activeMessage.avatar} 
              alt={activeMessage.sender}
              className="w-16 h-16 rounded-full bg-slate-50 shadow-inner ring-4 ring-slate-50 object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-serif font-bold text-xl md:text-2xl text-slate-800 mb-2 leading-tight">{activeMessage.subject}</h2>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4"/> {activeMessage.sender}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> {activeMessage.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {activeMessage.timestamp}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-8">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium md:text-lg">
              {activeMessage.content}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-auto">
            <button className="flex items-center justify-center md:justify-start gap-2 bg-primary hover:bg-blue-900 text-white px-8 py-3.5 rounded-full font-bold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 w-full md:w-auto uppercase tracking-wide text-sm">
              <Reply className="w-5 h-5" />
              Reply to Teacher
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
