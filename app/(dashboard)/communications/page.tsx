"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User as UserIcon, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function Communications() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Current User & Contacts
  useEffect(() => {
    async function initUserAndContacts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('users').select('*').eq('email', user.email).single();
      
      let finalUser = profile || { id: user.id, name: user.email, role: 'ADMIN' };
      setCurrentUser(finalUser);
      
      let targetRoles = ['TEACHER', 'Teacher', 'PARENT', 'Parent', 'ADMIN', 'Administrator'];
      if (finalUser.role === 'PARENT' || finalUser.role === 'Parent') targetRoles = ['TEACHER', 'Teacher', 'ADMIN', 'Administrator'];
      else if (finalUser.role === 'TEACHER' || finalUser.role === 'Teacher') targetRoles = ['PARENT', 'Parent', 'ADMIN', 'Administrator'];
      
      const { data: contacts } = await supabase
        .from('users')
        .select('*')
        .neq('id', finalUser.id)
        .in('role', targetRoles);
        
      if (contacts) setConversations(contacts);
    }
    initUserAndContacts();
  }, []);

  // 2. Fetch Chat History when activeChat changes
  useEffect(() => {
    if (!currentUser || !activeChat) return;

    async function fetchMessages() {
      setIsLoadingMessages(true);
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });
        
      if (data) setMessages(data);
      setIsLoadingMessages(false);
    }
    fetchMessages();
  }, [activeChat, currentUser]);

  // 3. Real-Time Channel
  useEffect(() => {
    if (!currentUser || !activeChat) return;

    const channel = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as any;
        // Verify this message belongs to the current open chat
        const isRelated = 
          (newMsg.sender_id === currentUser.id && newMsg.receiver_id === activeChat.id) ||
          (newMsg.sender_id === activeChat.id && newMsg.receiver_id === currentUser.id);
          
        if (isRelated) {
          setMessages(prev => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, activeChat]);

  // 4. Auto-Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !activeChat) return;
    
    setIsSending(true);
    const content = newMessage;
    setNewMessage(""); // Clear instantly for snappy UX
    
    await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: activeChat.id,
      content: content,
    });
    
    setIsSending(false);
  };

  return (
    <section className="flex-1 w-full min-h-screen bg-slate-50 flex flex-col p-6 lg:p-10 gap-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-800">Messages</h1>
          <p className="text-slate-500 mt-1 font-medium">Real-time two-way communication.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 bg-transparent overflow-hidden h-[700px]">
        {/* Left Pane - Contacts */}
        <div className="w-full md:w-80 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm shrink-0 h-full">
          <div className="p-5 border-b border-slate-100 bg-slate-50/80">
            <h2 className="font-bold text-slate-700 tracking-wide uppercase text-sm">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
            {conversations.map(contact => (
              <button
                key={contact.id}
                onClick={() => setActiveChat(contact)}
                className={`w-full flex items-center gap-4 p-4 transition-all text-left group ${
                  activeChat?.id === contact.id ? 'bg-blue-50/80 border-l-4 border-l-blue-600 pl-3' : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-white group-hover:scale-105 transition-transform">
                  <UserIcon className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold truncate text-[15px] ${activeChat?.id === contact.id ? 'text-blue-900' : 'text-slate-800'}`}>
                    {contact.name || (contact.first_name ? contact.first_name + ' ' + contact.last_name : contact.email)}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate tracking-wider font-extrabold uppercase mt-1">{contact.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Pane - Chat */}
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-full">
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500 bg-slate-50/50">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 ring-8 ring-slate-50 shadow-sm transition-transform hover:scale-110 duration-300">
                <MessageSquare className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Your Conversations</h3>
              <p className="text-slate-500 max-w-sm leading-relaxed text-sm font-medium">Select a conversation from the sidebar to start messaging in real-time.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-4 shrink-0 z-10">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    {activeChat.name || (activeChat.first_name ? activeChat.first_name + ' ' + activeChat.last_name : activeChat.email)}
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1.5 uppercase tracking-widest mt-0.5"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Online Engine</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/30">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender_id === currentUser?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm relative ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-sm' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm drop-shadow-sm'
                        }`}>
                          <p className="text-[15px] font-medium leading-relaxed">{msg.content}</p>
                          <span className={`text-[10px] mt-2 block font-extrabold tracking-widest uppercase ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              {/* Chat Input */}
              <div className="p-4 md:p-5 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 h-14 px-6 bg-slate-50 border border-slate-200 rounded-full outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-[15px] font-medium text-slate-800 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shrink-0"
                  >
                    <Send className="w-5 h-5 ml-1" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
