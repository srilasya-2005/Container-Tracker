import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { saleAPI, reportAPI } from '../utils/api';
import { toast } from 'sonner';
import { 
  Search, FileText, Loader2, Download, CreditCard, 
  ArrowUpRight, Clock, AlertCircle, CheckCircle2,
  Calendar, Printer, Mail, Share2, MoreVertical,
  ChevronRight, Building2, User, Phone, MapPin,
  Package, DollarSign, Wallet
} from 'lucide-react';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { AuthContext } from '../context/AuthContext';
import InputField from '../components/ui/InputField';
import { formatAED, Card, KPICard, StatusBadge } from '../components/DashboardWidgets';
import { motion, AnimatePresence } from 'framer-motion';

const Payments = () => {
  const { user } = useContext(AuthContext);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'All'
  });

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status !== 'All') params.paymentStatus = filters.status;
      
      const response = await saleAPI.getAll(params);
      setSales(response.data.sales || []);
    } catch (error) {
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const totalInvoiced = sales.reduce((acc, s) => acc + (s.sellingPrice || 0), 0);
  const totalCollected = sales.reduce((acc, s) => acc + (s.amountReceived || 0), 0);
  const totalOutstanding = totalInvoiced - totalCollected;

  const handlePrint = () => {
    window.print();
  };

  const InvoiceView = ({ sale }) => {
    if (!sale) return null;
    
    // Calculate subtotal, VAT, etc.
    const subtotal = sale.sellingPrice / 1.05;
    const vat = sale.sellingPrice - subtotal;
    const balanceDue = sale.sellingPrice - (sale.amountReceived || 0);

    return (
      <div className="bg-white p-0 sm:p-8 max-w-[800px] mx-auto font-sans text-slate-900 overflow-y-auto max-h-[90vh]">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8 pb-8 border-b-2 border-slate-900">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#00244D] tracking-tight">LMH Trading - FZCO</h1>
            <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
              IFZA Business Park, Dubai Digital Park<br/>
              Premises No: 55507-001, Building A1<br/>
              Dubai Silicon Oasis, Dubai, UAE
            </div>
            <div className="mt-3 inline-block">
              <span className="text-[11px] font-bold text-[#00244D]">TNR : 100012345600003</span>
            </div>
          </div>
          <div className="w-24 h-24 bg-[#00244D] flex items-center justify-center rounded-sm">
             <span className="text-2xl font-bold text-[#E5B15F]">LMH</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
           <div className="inline-block border-b-2 border-[#00244D] px-20 py-1">
             <h2 className="text-xl font-bold text-[#00244D] uppercase tracking-widest">Tax Invoice</h2>
           </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Bill To */}
          <div className="bg-[#00244D] rounded-sm overflow-hidden border border-[#00244D]">
             <div className="px-4 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider">Bill To</div>
             <div className="bg-white p-4 min-h-[140px] text-[11px] space-y-1.5 border-t border-[#00244D]">
                <p className="font-bold text-slate-900 text-[13px] mb-1">{sale.buyerName}</p>
                <p className="text-slate-500">Office No. {Math.floor(Math.random()*900)+100}, Dynasty Business Tower,</p>
                <p className="text-slate-500">P.O. Box {Math.floor(Math.random()*90000)+10000}, Dubai,</p>
                <p className="text-slate-500">United Arab Emirates</p>
                <div className="mt-3 flex gap-2">
                   <span className="font-bold">Buyer TNR No. :</span>
                   <span className="text-slate-500">100223344500003</span>
                </div>
             </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-[#00244D] rounded-sm overflow-hidden border border-[#00244D]">
             <div className="px-4 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider">Invoice Details</div>
             <div className="bg-white p-4 min-h-[140px] text-[11px] border-t border-[#00244D]">
                <div className="space-y-3">
                   <div className="flex justify-between">
                      <span className="text-slate-500">Invoice No.</span>
                      <span className="font-bold text-slate-900 uppercase">LMTI-2024-{sale._id.slice(-6)}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-500">Invoice Date</span>
                      <span className="font-bold text-slate-900">{new Date(sale.sellingDate).toLocaleDateString()}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-500">Due Date</span>
                      <span className="font-bold text-slate-900">{new Date(new Date(sale.sellingDate).getTime() + 30*24*60*60*1000).toLocaleDateString()}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-500">Place of Supply</span>
                      <span className="font-bold text-slate-900">Dubai</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-[#00244D] rounded-sm overflow-hidden mb-8">
           <table className="w-full text-[10px]">
              <thead>
                 <tr className="bg-[#00244D] text-white">
                    <th className="px-3 py-2 text-left border-r border-white/20">S.No.</th>
                    <th className="px-3 py-2 text-left border-r border-white/20">Description of Goods / Services</th>
                    <th className="px-3 py-2 text-center border-r border-white/20">Unit</th>
                    <th className="px-3 py-2 text-center border-r border-white/20">Qty</th>
                    <th className="px-3 py-2 text-right border-r border-white/20">Rate (AED)</th>
                    <th className="px-3 py-2 text-right">Amount (AED)</th>
                 </tr>
              </thead>
              <tbody className="text-slate-800 font-medium">
                 <tr className="border-b border-slate-200">
                    <td className="px-3 py-3 text-center border-r border-slate-200">1</td>
                    <td className="px-3 py-3 border-r border-slate-200">
                       <p className="font-bold mb-0.5">Container: {sale.containerId?.containerNo || 'N/A'}</p>
                       <p className="text-[9px] text-slate-500">Size: {sale.containerId?.size || '40FT'} | Type: {sale.containerId?.type || 'Reefer'}</p>
                    </td>
                    <td className="px-3 py-3 text-center border-r border-slate-200">Nos</td>
                    <td className="px-3 py-3 text-center border-r border-slate-200">{sale.quantity || 1}</td>
                    <td className="px-3 py-3 text-right border-r border-slate-200">{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="px-3 py-3 text-right">{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                 </tr>
                 {/* Fill empty space */}
                 <tr className="h-20">
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td></td>
                 </tr>
              </tbody>
           </table>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-2 gap-8 mb-8">
           {/* Left: Summary and Bank */}
           <div className="space-y-6">
              <div className="bg-[#00244D] rounded-sm overflow-hidden border border-[#00244D]">
                 <div className="px-3 py-1 text-[9px] font-bold text-white uppercase">Payment Summary</div>
                 <div className="bg-white p-3 space-y-2 border-t border-[#00244D]">
                    <div className="flex justify-between text-[11px]">
                       <span className="text-slate-500">Total Invoice Amount</span>
                       <span className="font-bold">AED {sale.sellingPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                       <span className="text-slate-500">Amount Received</span>
                       <span className="font-bold">AED {(sale.amountReceived || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-[12px] pt-1 border-t border-slate-100">
                       <span className="font-black text-[#00244D]">BALANCE DUE</span>
                       <span className="font-black text-[#00244D]">AED {balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                 </div>
              </div>

              <div className="bg-[#00244D] rounded-sm overflow-hidden border border-[#00244D]">
                 <div className="px-3 py-1 text-[9px] font-bold text-white uppercase">Bank Details</div>
                 <div className="bg-white p-3 space-y-1.5 border-t border-[#00244D] text-[10px]">
                    <div className="flex gap-2">
                       <span className="w-24 text-slate-500">Account Holder</span>
                       <span className="font-bold">: LMH Trading - FZCO</span>
                    </div>
                    <div className="flex gap-2">
                       <span className="w-24 text-slate-500">Bank Name</span>
                       <span className="font-bold">: Emirates NBD</span>
                    </div>
                    <div className="flex gap-2">
                       <span className="w-24 text-slate-500">Account Number</span>
                       <span className="font-bold">: 1012345678901</span>
                    </div>
                    <div className="flex gap-2">
                       <span className="w-24 text-slate-500">IBAN</span>
                       <span className="font-bold">: AE020260001012345678901</span>
                    </div>
                    <div className="flex gap-2">
                       <span className="w-24 text-slate-500">SWIFT Code</span>
                       <span className="font-bold">: EBILAEAD</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right: Calculations */}
           <div className="space-y-4">
              <div className="border border-slate-200 rounded-sm p-4 space-y-3">
                 <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Sub Total (Taxable Amount)</span>
                    <span className="font-bold text-slate-900">AED {subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                 </div>
                 <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">VAT 5%</span>
                    <span className="font-bold text-slate-900">AED {vat.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                 </div>
                 <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <span className="text-[13px] font-black text-[#00244D] uppercase">Total Amount Payable</span>
                    <span className="text-[16px] font-black text-[#00244D]">AED {sale.sellingPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                 </div>
              </div>
              
              {/* Stamp and Sig */}
              <div className="text-center pt-6 relative">
                 <p className="text-[10px] font-bold text-[#00244D] mb-12">For: LMH Trading - FZCO</p>
                 <div className="font-handwriting text-2xl text-blue-700 opacity-80 -rotate-6">Mohammed Hassan</div>
                 <div className="h-px bg-slate-300 w-48 mx-auto mt-2"></div>
                 <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Authorized Signatory</p>
                 
                 {/* Seal */}
                 <div className="absolute top-8 right-0 w-24 h-24 border-4 border-blue-900/20 rounded-full flex items-center justify-center rotate-12 pointer-events-none">
                    <div className="text-[8px] font-black text-blue-900/30 text-center uppercase tracking-tighter">
                       LMH TRADING<br/>DUBAI - UAE<br/>1000123456
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-6 flex justify-center gap-12 text-[9px] font-bold text-slate-400">
           <div className="flex items-center gap-2"><Phone size={10} className="text-[#00244D]"/> +971 50 123 4567</div>
           <div className="flex items-center gap-2"><Mail size={10} className="text-[#00244D]"/> info@lmhtrading.ae</div>
           <div className="flex items-center gap-2"><MapPin size={10} className="text-[#00244D]"/> www.lmhtrading.ae</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payments</h1>
          <p className="text-sm text-slate-500 mt-1">Manage receivables, invoices and credit history</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchSales} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
             <RefreshCw size={18} className="text-slate-400" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
             <Download size={16} />
             <span>Export All</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KPICard 
          title="Total Invoiced" 
          value={formatAED(totalInvoiced)} 
          subtitle={`${sales.length} invoices generated`}
          icon={FileText}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          accent="bg-blue-500"
        />
        <KPICard 
          title="Total Collected" 
          value={formatAED(totalCollected)} 
          subtitle={`${((totalCollected / (totalInvoiced || 1)) * 100).toFixed(1)}% recovery rate`}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          accent="bg-emerald-500"
        />
        <KPICard 
          title="Outstanding Balance" 
          value={formatAED(totalOutstanding)} 
          subtitle="Awaiting payment"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          accent="bg-amber-500"
        />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Header / Filters */}
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by buyer, invoice # or container..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
               {['All', 'Full', 'Partial', 'Pending'].map(s => (
                 <button 
                  key={s}
                  onClick={() => setFilters({...filters, status: s})}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    filters.status === s 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                 >
                   {s} Payments
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Transaction</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Buyer Details</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">History</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">Processing records...</p>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <CreditCard size={28} className="text-slate-300" />
                    </div>
                    <p className="text-slate-900 font-bold">No payments found</p>
                    <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search query</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                             <Package size={20} />
                          </div>
                          <div>
                             <p className="font-mono text-[13px] font-bold text-slate-900 tracking-tight">{sale.containerId?.containerNo || 'N/A'}</p>
                             <p className="text-[11px] text-slate-400 font-medium">LMTI-2024-{sale._id.slice(-6).toUpperCase()}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="space-y-0.5">
                          <p className="text-sm font-bold text-slate-800">{sale.buyerName}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                             <Calendar size={12} />
                             <span>{new Date(sale.sellingDate).toLocaleDateString()}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="space-y-0.5">
                          <p className="text-sm font-black text-slate-900">AED {sale.sellingPrice?.toLocaleString()}</p>
                          <p className="text-[11px] text-emerald-600 font-bold">AED {sale.amountReceived?.toLocaleString()} received</p>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                          <div 
                            className={`h-full rounded-full ${sale.paymentStatus === 'Full' ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                            style={{ width: `${Math.min((sale.amountReceived / (sale.sellingPrice || 1)) * 100, 100)}%` }} 
                          />
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {sale.paymentStatus === 'Full' ? 'Cleared' : `AED ${(sale.sellingPrice - sale.amountReceived).toLocaleString()} due`}
                       </p>
                    </td>
                    <td className="px-6 py-5">
                       <StatusBadge status={sale.paymentStatus} />
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedSale(sale)}
                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="View Detailed Invoice"
                          >
                             <FileText size={18} />
                          </button>
                          <div className="h-4 w-px bg-slate-100 mx-1" />
                          <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                             <MoreVertical size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-[850px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-50 px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-200 no-print">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00244D] flex items-center justify-center">
                   <FileText size={16} className="text-white" />
                </div>
                <div>
                   <h3 className="text-sm font-bold text-slate-900">Tax Invoice Detail</h3>
                   <p className="text-[10px] text-slate-500">Official commercial document</p>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600">
                   <Printer size={16} />
                </button>
                <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600">
                   <Mail size={16} />
                </button>
                <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600">
                   <Share2 size={16} />
                </button>
                <button onClick={() => setSelectedSale(null)} className="ml-4 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors">
                   Close
                </button>
             </div>
          </div>
          
          <div id="invoice-content" className="p-0 bg-white">
             <InvoiceView sale={selectedSale} />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Styles for handwriting font and printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        .font-handwriting { font-family: 'Dancing Script', cursive; }
        @media print {
          body * { visibility: hidden; }
          #invoice-content, #invoice-content * { visibility: visible; }
          #invoice-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}} />
    </div>
  );
};

export default Payments;

const RefreshCw = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
