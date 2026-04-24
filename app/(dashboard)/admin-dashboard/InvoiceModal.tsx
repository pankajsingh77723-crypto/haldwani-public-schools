"use client";

import { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  roll_number?: string;
  roll_no?: string;
}

interface InvoiceModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
  studentList: Student[];
}

export default function InvoiceModal({ onClose, onSuccess, studentList }: InvoiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceFormData, setInvoiceFormData] = useState({
    student_id: "",
    fee_cycle: "Q3 Tuition Fee",
    total_amount: "",
    due_date: "",
  });

  const handleGenerateInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!invoiceFormData.student_id || !invoiceFormData.total_amount || !invoiceFormData.due_date) {
      onSuccess("Wait! Please fill in all required fields.");
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await supabase.from('fees').insert([{
      student_id: invoiceFormData.student_id,
      fee_cycle: invoiceFormData.fee_cycle,
      total_amount: Number(invoiceFormData.total_amount),
      amount_paid: 0,
      due_date: invoiceFormData.due_date,
      status: 'PENDING'
    }]);
    
    setIsSubmitting(false);
    
    if (error) {
      console.error(error);
      onSuccess("Wait! Failed to generate invoice.");
    } else {
      onSuccess("Invoice generated and pushed to Parent Dashboard!");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">
            Generate New Invoice
          </h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleGenerateInvoice} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Student</label>
              <select 
                required
                value={invoiceFormData.student_id}
                onChange={(e) => setInvoiceFormData({...invoiceFormData, student_id: e.target.value})}
                className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 transition-all shadow-sm cursor-pointer font-medium"
                disabled={isSubmitting}
              >
                <option value="" disabled>-- Select a student --</option>
                {studentList.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} (Roll: {student.roll_number || student.roll_no || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Invoice Title / Term</label>
              <input 
                type="text" required value={invoiceFormData.fee_cycle}
                onChange={(e) => setInvoiceFormData({...invoiceFormData, fee_cycle: e.target.value})}
                placeholder="e.g. Q3 Tuition Fee"
                className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 transition-all shadow-sm font-medium"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Amount (₹)</label>
                <input 
                  type="number" required min="0" value={invoiceFormData.total_amount}
                  onChange={(e) => setInvoiceFormData({...invoiceFormData, total_amount: e.target.value})}
                  placeholder="Amount"
                  className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 transition-all shadow-sm font-medium"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Due Date</label>
                <input 
                  type="date" required value={invoiceFormData.due_date}
                  onChange={(e) => setInvoiceFormData({...invoiceFormData, due_date: e.target.value})}
                  className="px-4 h-12 rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 bg-white text-slate-800 transition-all shadow-sm font-medium"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200 h-12 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Invoice
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
