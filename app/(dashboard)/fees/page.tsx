"use client";

import { useState, useEffect } from "react";
import { DollarSign, AlertCircle, CalendarClock, Search, CreditCard, Wallet, Banknote, FileCheck2, ArrowUpRight, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function FeeManagement() {
  const [selectedMethod, setSelectedMethod] = useState("UPI");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingTxns, setIsLoadingTxns] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [overdueStudents, setOverdueStudents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [stats, setStats] = useState({ total_collected: 142500, outstanding: 0 });

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setIsLoadingStudents(true);
    setIsLoadingTxns(true);

    // Fetch Overdue Students
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .gt('overdue_amount', 0)
      .order('overdue_amount', { ascending: false });

    if (studentsError) toast.error("Failed to load overdue balances");
    else {
      setOverdueStudents(studentsData || []);
      const totalOutstanding = (studentsData || []).reduce((acc, curr) => acc + Number(curr.overdue_amount), 0);
      setStats(prev => ({ ...prev, outstanding: totalOutstanding }));
    }
    setIsLoadingStudents(false);

    // Fetch Recent Transactions
    const { data: txnsData, error: txnsError } = await supabase
      .from('transactions')
      .select('*, students(name)')
      .order('transaction_date', { ascending: false })
      .limit(10);

    if (txnsError) toast.error("Failed to load transaction history");
    else setTransactions(txnsData || []);
    setIsLoadingTxns(false);
  };

  const handlePaymentRecord = async () => {
    if (!selectedStudent) return;
    setIsProcessing(true);

    try {
      // 1. Insert Transaction
      const { error: txnError } = await supabase
        .from('transactions')
        .insert({
           transaction_ref: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
           student_id: selectedStudent.id,
           amount: selectedStudent.overdue_amount,
           payment_method: selectedMethod,
           status: 'Completed'
        });

      if (txnError) throw txnError;

      // 2. Clear Overdue Amount on Student
      const { error: updateError } = await supabase
        .from('students')
        .update({ overdue_amount: 0, overdue_months: '' })
        .eq('id', selectedStudent.id);

      if (updateError) throw updateError;

      toast.success(`Payment of $${selectedStudent.overdue_amount.toLocaleString()} recorded successfully for ${selectedStudent.name}!`);
      
      // Reset State & Refresh Data
      setSelectedStudent(null);
      fetchFinancialData();
      
    } catch (e: any) {
      toast.error(e.message || "An error occurred while processing the payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F4F7FE] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Collected</p>
                <div className="flex items-center gap-3">
                   <p className="text-3xl font-extrabold text-slate-800">${stats.total_collected.toLocaleString()}</p>
                   <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                     <TrendingUp className="w-3 h-3 mr-1" /> +12%
                   </span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
                <DollarSign className="w-7 h-7 text-emerald-500" />
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Outstanding Dues</p>
                <div className="flex items-center gap-3">
                   <p className="text-3xl font-extrabold text-slate-800">${stats.outstanding.toLocaleString()}</p>
                </div>
              </div>
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center border border-red-100 shadow-sm shrink-0">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Upcoming Deadlines</p>
                <div className="flex items-center gap-3">
                   <p className="text-3xl font-extrabold text-slate-800">14 <span className="text-lg text-slate-500 font-medium">Days</span></p>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1">Term 2 Fees Due</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
                <CalendarClock className="w-7 h-7 text-blue-500" />
              </div>
           </div>
        </div>

        {/* Payment Desk Layout (40% / 60%) */}
        <div className="grid grid-cols-1 lg:grid-[4fr_6fr] gap-6 items-start flex-1 min-h-[500px]">
           
           {/* Left Column (Student Search) */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[550px]">
              <div className="p-6 border-b border-slate-100 shrink-0">
                <h3 className="font-bold text-slate-800 font-serif text-lg mb-4">Pending Clearances</h3>
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search by student or roll no..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-medium"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 relative">
                 {isLoadingStudents ? (
                    <div className="absolute inset-0 flex flex-col gap-3 p-3">
                       {Array.from({ length: 6 }).map((_, idx) => (
                         <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                            <div className="flex-1 space-y-2">
                               <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                               <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                            </div>
                         </div>
                       ))}
                    </div>
                 ) : overdueStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                      <p className="font-medium text-sm">No pending dues found.</p>
                    </div>
                 ) : (
                   overdueStudents.map((student) => (
                      <div 
                        key={student.id} 
                        onClick={() => setSelectedStudent(student)}
                        className={`p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${selectedStudent?.id === student.id ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
                      >
                         <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${selectedStudent?.id === student.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                              {(student.name || "U").split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                            </div>
                            <div>
                              <p className={`font-bold ${selectedStudent?.id === student.id ? 'text-blue-800' : 'text-slate-800'}`}>{student.name}</p>
                              <p className="text-xs font-semibold text-slate-500">Class {student.class_name} • Roll: {student.roll_no}</p>
                            </div>
                         </div>
                         <div className="flex flex-col items-end gap-1.5">
                            <p className="font-extrabold text-slate-800">${Number(student.overdue_amount).toLocaleString()}</p>
                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                               {student.overdue_months || "Overdue"}
                            </span>
                         </div>
                      </div>
                   ))
                 )}
              </div>
           </div>

           {/* Right Column (Invoice Panel) */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[550px] relative overflow-hidden">
              {selectedStudent ? (
                <>
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between shrink-0">
                     <div>
                       <h3 className="font-bold text-slate-800 font-serif text-xl">Fee Collection Panel</h3>
                       <p className="text-slate-500 font-medium text-sm mt-1">Accepting payment for <span className="font-bold text-slate-800">{selectedStudent.name}</span></p>
                     </div>
                     <span className="bg-amber-50 text-amber-600 font-bold px-3 py-1.5 rounded-lg text-sm border border-amber-200 flex items-center gap-1.5">
                       <AlertCircle className="w-4 h-4" /> Due: ${Number(selectedStudent.overdue_amount).toLocaleString()}
                     </span>
                  </div>

                  <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
                     
                     <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                           <h4 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Detailed Breakdown</h4>
                        </div>
                        <div className="p-5 space-y-4">
                           <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                              <span>Tuition Fee (Q2/Q3)</span>
                              <span className="text-slate-800 font-bold">${(Number(selectedStudent.overdue_amount) * 0.7).toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                              <span>Transport Services</span>
                              <span className="text-slate-800 font-bold">${(Number(selectedStudent.overdue_amount) * 0.2).toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                              <span>Laboratory Charges</span>
                              <span className="text-slate-800 font-bold">${(Number(selectedStudent.overdue_amount) * 0.1).toLocaleString()}</span>
                           </div>
                           <div className="w-full h-px bg-slate-200 my-2" />
                           <div className="flex justify-between items-center font-extrabold text-[#2563EB] text-xl">
                              <span>Total Payable</span>
                              <span>${Number(selectedStudent.overdue_amount).toLocaleString()}</span>
                           </div>
                        </div>
                     </div>

                     <div>
                        <h4 className="font-bold text-slate-700 mb-3 uppercase text-xs tracking-wider">Payment Method</h4>
                        <div className="grid grid-cols-3 gap-4">
                           {["Cash", "UPI", "Transfer"].map(method => (
                              <button 
                                key={method}
                                onClick={() => setSelectedMethod(method)}
                                className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all font-bold gap-2 ${selectedMethod === method ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm ring-1 ring-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}
                              >
                                {method === "Cash" && <Banknote className={`w-6 h-6 ${selectedMethod === method ? 'text-blue-600' : 'text-slate-400'}`} />}
                                {method === "UPI" && <Wallet className={`w-6 h-6 ${selectedMethod === method ? 'text-blue-600' : 'text-slate-400'}`} />}
                                {method === "Transfer" && <CreditCard className={`w-6 h-6 ${selectedMethod === method ? 'text-blue-600' : 'text-slate-400'}`} />}
                                <span>{method}</span>
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 shrink-0 bg-white">
                     <button 
                       onClick={handlePaymentRecord}
                       disabled={isProcessing}
                       className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 text-lg"
                     >
                        {isProcessing ? (
                          <><Loader2 className="w-6 h-6 animate-spin" /> Recording...</>
                        ) : (
                          <><FileCheck2 className="w-6 h-6" /> Record Payment of ${Number(selectedStudent.overdue_amount).toLocaleString()}</>
                        )}
                     </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center gap-4 bg-slate-50/50">
                   <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-slate-200 border-dashed shadow-sm">
                      <Banknote className="w-10 h-10 text-slate-300" />
                   </div>
                   <div>
                     <p className="font-bold text-xl text-slate-500 mb-2">Ready to Collect</p>
                     <p className="text-sm font-medium text-slate-400 max-w-[280px]">Select a student from the pending clearances list on the left to initiate a financial transaction.</p>
                   </div>
                </div>
              )}
           </div>

        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col mb-10 mt-2">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <h2 className="font-bold text-slate-800 font-serif text-lg">Recent Transactions</h2>
             <button className="text-[#2563EB] font-bold text-sm flex items-center gap-1 hover:underline">
               View Full Ledger <ArrowUpRight className="w-4 h-4" />
             </button>
           </div>
           <div className="overflow-x-auto relative min-h-[200px]">
             {isLoadingTxns ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                   <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
             ) : null}
             <table className="w-full text-left border-collapse min-w-[800px]">
               <thead>
                 <tr className="bg-white border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                   <th className="p-5 pl-6">Txn ID</th>
                   <th className="p-5">Date</th>
                   <th className="p-5">Amount</th>
                   <th className="p-5">Method</th>
                   <th className="p-5 pr-6">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                 {transactions.length === 0 && !isLoadingTxns ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No transactions recorded yet.</td></tr>
                 ) : (
                   transactions.map((txn, idx) => (
                     <tr key={idx} className="hover:bg-slate-50 cursor-pointer transition-colors">
                       <td className="p-5 pl-6 font-bold text-slate-600">{txn.transaction_ref}</td>
                       <td className="p-5 font-medium text-slate-500">{new Date(txn.transaction_date).toLocaleDateString()}</td>
                       <td className="p-5 font-extrabold text-emerald-600">${Number(txn.amount).toLocaleString()}</td>
                       <td className="p-5">
                         <span className="font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md text-[10px] uppercase tracking-wider">
                           {txn.payment_method}
                         </span>
                       </td>
                       <td className="p-5 pr-6">
                         <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                           <CheckCircle2 className="w-3.5 h-3.5" /> {txn.status}
                         </span>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </div>

      </div>
    </div>
  );
}
