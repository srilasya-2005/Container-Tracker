import React, { useState, useEffect, useCallback, useContext } from 'react';
import { saleAPI, reportAPI } from '../utils/api';
import { toast } from 'sonner';
import { Search, Edit, FileText, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AuthContext } from '../context/AuthContext';
import InputField from '../components/ui/InputField';

const Sales = () => {
  const { user } = useContext(AuthContext);

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSale, setEditingSale] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState('');

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
                          onClick={() => handleDownloadInvoice(sale._id)}
                          disabled={invoiceLoading === sale._id}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          {invoiceLoading === sale._id
                            ? <Loader2 size={16} className="animate-spin"/>
                            : <FileText size={16}/>
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

    </div>
  );
};

export default Sales;