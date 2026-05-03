import React, { useState, useEffect, useCallback, useContext } from 'react';
import { saleAPI, reportAPI } from '../utils/api';
import { toast } from 'sonner';
import { 
  Search, Edit, FileText, Loader2, Printer, Mail, Share2, 
  Phone, MapPin, X, Calendar, Download 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AuthContext } from '../context/AuthContext';
import InputField from '../components/ui/InputField';

const Sales = () => {
  const { user } = useContext(AuthContext);

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSale, setEditingSale] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState('');
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState(null);

  const [editData, setEditData] = useState({
    paymentStatus: '',
    amountReceived: '',
    remarks: ''
  });

  const [filters, setFilters] = useState({
    search: '',
    paymentStatus: '',
    from: '',
    to: ''
  });

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);

      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const response = await saleAPI.getAll(params);
      setSales(response.data.sales);

    } catch (error) {
      toast.error('Failed to load sales');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleEdit = (sale) => {
    setEditingSale(sale);

    setEditData({
      paymentStatus: sale.paymentStatus,
      amountReceived: sale.amountReceived,
      remarks: sale.remarks || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      await saleAPI.update(editingSale._id, {
        paymentStatus: editData.paymentStatus,
        amountReceived: parseFloat(editData.amountReceived),
        remarks: editData.remarks
      });

      toast.success('Payment details updated successfully');
      setEditingSale(null);
      fetchSales();

    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update sale');
    }
  };

  const getPaymentStatusClass = (status) => {
    if (status === 'Full') return 'status-available';
    if (status === 'Partial') return 'status-reserved';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const handleDownloadInvoice = async (saleId) => {
    try {
      setInvoiceLoading(saleId);
      const response = await reportAPI.getInvoice(saleId);
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success('Invoice opened — use Print to save as PDF');
    } catch (error) {
      console.error('Invoice error:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setInvoiceLoading('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const numberToWords = (num) => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    const inWords = (n) => {
      if ((n = n.toString()).length > 9) return 'overflow';
      let n_arr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n_arr) return '';
      let str = '';
      str += (n_arr[1] != 0) ? (a[Number(n_arr[1])] || b[n_arr[1][0]] + ' ' + a[n_arr[1][1]]) + 'crore ' : '';
      str += (n_arr[2] != 0) ? (a[Number(n_arr[2])] || b[n_arr[2][0]] + ' ' + a[n_arr[2][1]]) + 'lakh ' : '';
      str += (n_arr[3] != 0) ? (a[Number(n_arr[3])] || b[n_arr[3][0]] + ' ' + a[n_arr[3][1]]) + 'thousand ' : '';
      str += (n_arr[4] != 0) ? (a[Number(n_arr[4])] || b[n_arr[4][0]] + ' ' + a[n_arr[4][1]]) + 'hundred ' : '';
      str += (n_arr[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) : '';
      return str.trim();
    }

    const whole = Math.floor(num);
    const fraction = Math.round((num - whole) * 100);
    let str = inWords(whole) + ' dirhams';
    if (fraction > 0) {
      str += ' and ' + inWords(fraction) + ' fils';
    }
    return str.charAt(0).toUpperCase() + str.slice(1) + ' only';
  };

  const InvoiceView = ({ sale }) => {
    if (!sale) return null;
    const totalAmount = sale.sellingPrice || 0;
    const subtotal = totalAmount / 1.05;
    const vat = totalAmount - subtotal;
    const balanceDue = totalAmount - (sale.amountReceived || 0);

    return (
      <div className="bg-white p-4 sm:p-10 max-w-[900px] mx-auto font-sans text-slate-900 overflow-y-auto max-h-[85vh] shadow-inner">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6 pb-6 border-b-[3px] border-[#00244D]">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[#00244D] tracking-tight uppercase">LMH Trading - FZCO</h1>
            <div className="text-[11px] text-slate-500 font-bold leading-tight">
              IFZA Business Park, Dubai Digital Park<br/>
              Premises No: 55507-001, Building A1<br/>
              Dubai Silicon Oasis, Dubai, UAE
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[12px] font-black text-[#00244D]">TNR :</span>
              <span className="text-[12px] font-bold text-slate-800 tracking-wider">100012345600003</span>
            </div>
          </div>
          <div className="w-28 h-28 bg-[#001D3D] flex items-center justify-center rounded-sm shrink-0 shadow-lg border border-white/10">
             <span className="text-3xl font-black text-[#E5B15F] tracking-tighter">LMH</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
           <div className="inline-block border-b-[2px] border-[#00244D] px-24 py-1">
             <h2 className="text-2xl font-black text-[#00244D] uppercase tracking-[0.2em]">Tax Invoice</h2>
           </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
          {/* Bill To */}
          <div className="border border-[#00244D] rounded-sm overflow-hidden flex flex-col">
             <div className="bg-[#00244D] px-4 py-2 text-[11px] font-black text-white uppercase tracking-widest">Bill To</div>
             <div className="bg-white p-5 flex-1 text-[12px] space-y-2">
                <p className="font-black text-[#00244D] text-[15px] leading-tight">{sale.buyerName || 'ABC General Trading LLC'}</p>
                <p className="text-slate-600 font-semibold">Office No. 501, Dynasty Business Tower,</p>
                <p className="text-slate-600 font-semibold">P.O. Box 654321, Dubai,</p>
                <p className="text-slate-600 font-semibold">United Arab Emirates</p>
                <div className="mt-4 flex items-center gap-2">
                   <span className="font-bold text-slate-900">Buyer TNR No. :</span>
                   <span className="text-slate-700 font-bold tracking-wider">100223344500003</span>
                </div>
             </div>
          </div>

          {/* Invoice Details */}
          <div className="border border-[#00244D] rounded-sm overflow-hidden flex flex-col">
             <div className="bg-[#00244D] px-4 py-2 text-[11px] font-black text-white uppercase tracking-widest">Invoice Details</div>
             <div className="bg-white p-5 flex-1 text-[12px] border-t border-[#00244D]">
                <div className="space-y-4">
                   <div className="flex items-center">
                      <span className="w-32 text-slate-500 font-bold">Invoice No.</span>
                      <span className="font-black text-slate-900">:</span>
                      <span className="flex-1 ml-4 font-black text-slate-900 uppercase">LMTI-2024-{sale._id.slice(-6).toUpperCase()}</span>
                   </div>
                   <div className="flex items-center">
                      <span className="w-32 text-slate-500 font-bold">Invoice Date</span>
                      <span className="font-black text-slate-900">:</span>
                      <span className="flex-1 ml-4 font-bold text-slate-900">{new Date(sale.sellingDate).toLocaleDateString('en-GB', {day:'2-digit', month:'long', year:'numeric'})}</span>
                   </div>
                   <div className="flex items-center">
                      <span className="w-32 text-slate-500 font-bold">Due Date</span>
                      <span className="font-black text-slate-900">:</span>
                      <span className="flex-1 ml-4 font-bold text-slate-900">{new Date(new Date(sale.sellingDate).getTime() + 30*24*60*60*1000).toLocaleDateString('en-GB', {day:'2-digit', month:'long', year:'numeric'})}</span>
                   </div>
                   <div className="flex items-center">
                      <span className="w-32 text-slate-500 font-bold">Place of Supply</span>
                      <span className="font-black text-slate-900">:</span>
                      <span className="flex-1 ml-4 font-bold text-slate-900">Dubai</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-[#00244D] rounded-sm overflow-hidden mb-6">
           <table className="w-full text-[11px]">
              <thead>
                 <tr className="bg-[#00244D] text-white">
                    <th className="px-3 py-3 text-center border-r border-white/20 font-black">S.No.</th>
                    <th className="px-4 py-3 text-left border-r border-white/20 font-black">Description of Goods / Services</th>
                    <th className="px-2 py-3 text-center border-r border-white/20 font-black">Unit</th>
                    <th className="px-2 py-3 text-center border-r border-white/20 font-black">Quantity</th>
                    <th className="px-3 py-3 text-right border-r border-white/20 font-black whitespace-nowrap">Unit Rate<br/>(AED)</th>
                    <th className="px-3 py-3 text-right border-r border-white/20 font-black whitespace-nowrap">Taxable Amount<br/>(AED)</th>
                    <th className="px-3 py-3 text-right border-r border-white/20 font-black whitespace-nowrap">VAT 5%<br/>(AED)</th>
                    <th className="px-3 py-3 text-right font-black whitespace-nowrap">Total Amount<br/>(AED)</th>
                 </tr>
              </thead>
              <tbody className="text-slate-800 font-bold">
                 <tr className="border-b border-slate-300 h-16">
                    <td className="px-3 py-4 text-center border-r border-slate-300">1</td>
                    <td className="px-4 py-4 border-r border-slate-300">
                       <span className="block text-[13px] font-black mb-1">{sale.containerId?.type || 'Shipping Container'}</span>
                       <span className="text-[10px] text-slate-500 font-bold">Ref: {sale.containerId?.containerNo || 'N/A'}</span>
                    </td>
                    <td className="px-2 py-4 text-center border-r border-slate-300 uppercase">Nos</td>
                    <td className="px-2 py-4 text-center border-r border-slate-300">{sale.quantity || 1}</td>
                    <td className="px-3 py-4 text-right border-r border-slate-300 font-black">{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="px-3 py-4 text-right border-r border-slate-300 font-black">{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="px-3 py-4 text-right border-r border-slate-300 font-black">{vat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="px-3 py-4 text-right font-black">{totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                 </tr>
                 {/* Decorative empty rows */}
                 {[...Array(2)].map((_,i) => (
                    <tr key={i} className="border-b border-slate-100 h-12">
                       <td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td>
                       <td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td>
                       <td className="border-r border-slate-300"></td><td></td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        {/* Lower Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           <div className="space-y-6">
              {/* Description Box */}
              <div className="border border-[#00244D] rounded-sm overflow-hidden text-left">
                 <div className="bg-[#00244D] px-3 py-1.5 text-[10px] font-black text-white uppercase tracking-widest">Description</div>
                 <div className="p-4 bg-white text-[12px] space-y-2 font-bold text-slate-800">
                    <p>Container: <span className="text-[#00244D] font-black ml-2">{sale.containerId?.containerNo || 'CSQU9876543'}</span></p>
                    <p>Size: {sale.containerId?.size || '40FT'} | Type: {sale.containerId?.type || 'Reefer'}</p>
                 </div>
              </div>

              {/* Amount In Words */}
              <div className="border border-[#00244D] rounded-sm overflow-hidden text-left">
                 <div className="bg-[#00244D] px-3 py-1.5 text-[10px] font-black text-white uppercase tracking-widest">Amount in Words</div>
                 <div className="p-4 bg-white text-[12px] font-black text-slate-800 italic leading-relaxed">
                    {numberToWords(totalAmount)}
                 </div>
              </div>

              {/* Payment Summary */}
              <div className="border border-[#00244D] rounded-sm overflow-hidden text-left">
                 <div className="bg-[#00244D] px-3 py-1.5 text-[10px] font-black text-white uppercase tracking-widest">Payment Summary</div>
                 <div className="p-4 bg-white space-y-3 font-bold text-[12px]">
                    <div className="flex justify-between">
                       <span className="text-slate-500">Total Invoice Amount</span>
                       <span className="font-black text-slate-900">AED {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-slate-500">Amount Received</span>
                       <span className="font-black text-slate-900">AED {(sale.amountReceived || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200">
                       <span className="text-[13px] font-black text-[#00244D] uppercase">Balance Due</span>
                       <span className="text-[15px] font-black text-[#00244D]">AED {balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              {/* Financial Totals */}
              <div className="border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                 <div className="flex justify-between px-4 py-4 border-b border-slate-100 text-[12px]">
                    <span className="text-slate-500 font-bold">Sub Total (Taxable Amount)</span>
                    <span className="font-black text-slate-900">AED {subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                 </div>
                 <div className="flex justify-between px-4 py-4 border-b border-slate-100 text-[12px]">
                    <span className="text-slate-500 font-bold">VAT 5%</span>
                    <span className="font-black text-slate-900">AED {vat.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                 </div>
                 <div className="flex justify-between items-center px-4 py-6 bg-slate-50">
                    <span className="text-[14px] font-black text-[#00244D] uppercase tracking-tighter">Total Amount Payable</span>
                    <span className="text-[18px] font-black text-[#00244D] tabular-nums">AED {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                 </div>
              </div>

              {/* Bank Details */}
              <div className="border border-[#00244D] rounded-sm overflow-hidden text-left">
                 <div className="bg-[#00244D] px-3 py-1.5 text-[10px] font-black text-white uppercase tracking-widest">Bank Details</div>
                 <div className="p-4 bg-white space-y-2 text-[11px] font-bold">
                    <div className="flex">
                       <span className="w-28 text-slate-500">Account Holder</span>
                       <span className="text-slate-900">: LMH Trading - FZCO</span>
                    </div>
                    <div className="flex">
                       <span className="w-28 text-slate-500">Bank Name</span>
                       <span className="text-slate-900">: Emirates NBD</span>
                    </div>
                    <div className="flex">
                       <span className="w-28 text-slate-500">Account Number</span>
                       <span className="text-slate-900">: 1012345678901</span>
                    </div>
                    <div className="flex">
                       <span className="w-28 text-slate-500">IBAN</span>
                       <span className="text-slate-900">: AE020260001012345678901</span>
                    </div>
                    <div className="flex">
                       <span className="w-28 text-slate-500">SWIFT Code</span>
                       <span className="text-slate-900">: EBILAEAD</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

           {/* Signature & Stamp Row */}
           <div className="flex justify-between items-end mt-12 mb-10 px-4 relative">
              {/* Left: Notes Section */}
              <div className="border border-[#00244D] rounded-sm overflow-hidden text-left w-[45%]">
                 <div className="bg-[#00244D] px-3 py-1.5 text-[10px] font-black text-white uppercase tracking-widest">Notes</div>
                 <div className="p-4 bg-white text-[10px] font-bold text-slate-600 leading-relaxed space-y-1">
                    <p className="flex gap-2"><span>•</span> Exchange rate as per UAE Central Bank rate on invoice date.</p>
                    <p className="flex gap-2"><span>•</span> In case of any discrepancy, AED amount will prevail.</p>
                    <p className="flex gap-2"><span>•</span> Payment to be made within the due date.</p>
                    <p className="flex gap-2"><span>•</span> Thank you for doing business with us!</p>
                 </div>
              </div>

              {/* Right: Signature & Stamp Image Container */}
              <div className="relative flex flex-col items-center w-[50%]">
                 <div className="w-full flex flex-col items-center mb-2">
                    <p className="text-[13px] font-black text-[#003B71] uppercase tracking-tight">For: LMH Trading - FZCO</p>
                 </div>
                 
                 <div className="relative w-full h-44 flex items-center justify-center">
                    <img 
                      src="/signature-stamp-final.png" 
                      alt="Official Signature and Stamp" 
                      className="h-full object-contain"
                    />
                 </div>
                 
                 <div className="w-full flex flex-col items-center mt-1">
                    <p className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">Authorized Signatory</p>
                 </div>
              </div>
           </div>

        {/* Footer */}
        <div className="pt-6 border-t-[2px] border-blue-900/10 flex flex-wrap justify-center gap-x-12 gap-y-3 no-print">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-800">
              <Phone size={14} className="text-[#00244D]" /> +971 50 123 4567
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-800">
              <Mail size={14} className="text-[#00244D]" /> info@lmhtrading.ae
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-800">
              <MapPin size={14} className="text-[#00244D]" /> www.lmhtrading.ae
           </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
            .no-print { display: none !important; }
            @page { margin: 0; size: auto; }
          }
        `}} />
      </div>
    );
  };

  return (
    <div data-testid="sales-page">

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold font-heading uppercase text-slate-900 tracking-tight">
          Sales
        </h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">
          Track all container sales and payments
        </p>
      </div>

      {/* Filters */}

      <div className="card p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <InputField
            label="Search Buyer"
            type="text"
            placeholder="Search by buyer name..."
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
            inputClassName="pl-10"
            leftSlot={<Search size={18} />}
          />

          <InputField
            label="Payment Status"
            as="select"
            value={filters.paymentStatus}
            onChange={(e) =>
              setFilters({ ...filters, paymentStatus: e.target.value })
            }
          >
            <option value="">All</option>
            <option value="Full">Full</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
          </InputField>

          <InputField
            label="From Date"
            type="date"
            value={filters.from}
            onChange={(e) =>
              setFilters({ ...filters, from: e.target.value })
            }
          />

          <InputField
            label="To Date"
            type="date"
            value={filters.to}
            onChange={(e) =>
              setFilters({ ...filters, to: e.target.value })
            }
          />

        </div>
      </div>

      {/* Table */}

      {loading ? (
        <div className="card p-8 text-center">
          <p className="text-slate-500">Loading sales...</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-500">No sales found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Container</th>
                  <th className="px-4 py-3 text-left">Buyer</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-left">Price</th>

                  {user?.role === 'admin' && (
                    <th className="px-4 py-3 text-left">Profit</th>
                  )}

                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>

                {sales.map((sale, index) => (

                  <tr
                    key={sale._id}
                    className="hover:bg-slate-50 even:bg-slate-50/50 transition-colors border-b border-slate-100"
                    data-testid={`sale-row-${index}`}
                  >

                    <td className="px-4 py-3 font-mono text-sm font-semibold">
                      {sale.containerId?.containerNo || 'N/A'}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {sale.buyerName}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {sale.quantity || 1} {sale.unit || 'Unit'}
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold">
                      AED {sale.sellingPrice.toLocaleString()}
                    </td>

                    {user?.role === 'admin' && (
                      <td
                        className={`px-4 py-3 text-sm font-semibold ${
                          sale.profit >= 0
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        AED {sale.profit.toLocaleString()}
                      </td>
                    )}

                    <td className="px-4 py-3">
                      <span className={`status-badge ${getPaymentStatusClass(sale.paymentStatus)}`}>
                        {sale.paymentStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">

                      <div className="flex items-center justify-end gap-2">

                        <button
                          onClick={() => setSelectedSaleForInvoice(sale)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View High-Fidelity Invoice"
                        >
                          <FileText size={16}/>
                        </button>

                        <button
                          onClick={() => handleDownloadInvoice(sale._id)}
                          disabled={invoiceLoading === sale._id}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded"
                          title="Download Basic Invoice"
                        >
                          {invoiceLoading === sale._id
                            ? <Loader2 size={16} className="animate-spin"/>
                            : <Download size={14}/>
                          }
                        </button>

                        <button
                          onClick={() => handleEdit(sale)}
                          className="p-2 text-slate-600 hover:text-primary hover:bg-slate-100 rounded"
                        >
                          <Edit size={16}/>
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* Edit Dialog */}

      <Dialog open={!!editingSale} onOpenChange={() => setEditingSale(null)}>

        <DialogContent>

          <DialogHeader>
            <DialogTitle>
              Update Payment Details
            </DialogTitle>
          </DialogHeader>

          {editingSale && (

            <form onSubmit={handleUpdate} className="space-y-4">

              <InputField
                label="Payment Status"
                as="select"
                value={editData.paymentStatus}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    paymentStatus: e.target.value
                  })
                }
              >
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Full">Full</option>
              </InputField>

              <InputField
                label="Amount Received (AED)"
                type="number"
                value={editData.amountReceived}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    amountReceived: e.target.value
                  })
                }
                min="0"
                step="0.01"
              />

              <InputField
                label="Remarks"
                as="textarea"
                value={editData.remarks}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    remarks: e.target.value
                  })
                }
                rows="3"
                inputClassName="resize-none"
              />

              <div className="flex gap-4">

                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>

              </div>

            </form>

          )}

        </DialogContent>

      </Dialog>

      {/* High-Fidelity Invoice Modal */}
      <Dialog open={!!selectedSaleForInvoice} onOpenChange={() => setSelectedSaleForInvoice(null)}>
        <DialogContent className="max-w-[850px] p-0 rounded-2xl overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-50 px-6 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-slate-200 no-print">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00244D] flex items-center justify-center">
                   <FileText size={16} className="text-white" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Tax Invoice</h3>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600">
                   <Printer size={16} />
                </button>
                <button onClick={() => setSelectedSaleForInvoice(null)} className="ml-4 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors">
                   Close
                </button>
             </div>
          </div>
          
          <div className="print-area">
             <InvoiceView sale={selectedSaleForInvoice} />
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Sales;