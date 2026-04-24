import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { containerAPI, saleAPI } from '../utils/api';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { AuthContext, canEditContainers, canDeleteContainers } from '../context/AuthContext';
import InputField from '../components/ui/InputField';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const Containers = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    size: '',
    type: ''
  });

  const fetchContainers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.size) params.size = filters.size;
      if (filters.type) params.type = filters.type;

      const response = await containerAPI.getAll(params);
      setContainers(response.data.containers);
    } catch (error) {
      toast.error('Failed to load containers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  const handleDelete = async () => {
    try {
      await containerAPI.delete(deleteId);
      toast.success('Container deleted successfully');
      setDeleteId(null);
      fetchContainers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete container');
    }
  };

  const getStatusClass = (status) => {
    if (status === 'Available') return 'status-available';
    if (status === 'Reserved') return 'status-reserved';
    return 'status-sold';
  };

  const getPaymentStatusClass = (status) => {
    if (status === 'Full') return 'status-available';
    if (status === 'Partial') return 'status-reserved';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getItemsSummary = (items) => {
    if (!items || items.length === 0) return 'No items';
    if (items.length === 1) return items[0].name;
    return `${items[0].name} +${items.length - 1} more`;
  };

  return (
    <div data-testid="containers-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading uppercase text-slate-900 tracking-tight" data-testid="containers-title">
            Containers
          </h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base" data-testid="containers-subtitle">Manage your container inventory</p>
        </div>
        <button
          onClick={() => navigate('/containers/new')}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          data-testid="add-container-button"
        >
          <Plus size={20} />
          Add Container
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 sm:p-6 mb-6" data-testid="filters-section">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <InputField
            label="Search"
            type="text"
            placeholder="Search by container number..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            inputClassName="pl-10"
            leftSlot={<Search size={18} />}
            data-testid="search-input"
          />

          <InputField
            label="Status"
            as="select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            data-testid="status-filter"
          >
            <option value="">All</option>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Sold">Sold</option>
          </InputField>

          <InputField
            label="Size"
            as="select"
            value={filters.size}
            onChange={(e) => setFilters({ ...filters, size: e.target.value })}
            data-testid="size-filter"
          >
            <option value="">All</option>
            <option value="20FT">20FT</option>
            <option value="40FT">40FT</option>
          </InputField>

          <InputField
            label="Type"
            as="select"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            data-testid="type-filter"
          >
            <option value="">All</option>
            <option value="Dry">Dry</option>
            <option value="Reefer">Reefer</option>
          </InputField>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-8 text-center" data-testid="loading-message">
          <p className="text-slate-500">Loading containers...</p>
        </div>
      ) : containers.length === 0 ? (
        <div className="card p-8 text-center" data-testid="no-containers-message">
          <p className="text-slate-500">No containers found</p>
        </div>
      ) : (
        <div className="card overflow-hidden" data-testid="containers-table">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-[10px] sm:text-xs tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left">Container</th>
                  <th className="px-3 sm:px-6 py-3 text-left">Size</th>
                  <th className="px-3 sm:px-6 py-3 text-left hidden sm:table-cell">Type</th>
                  <th className="px-3 sm:px-6 py-3 text-left">Items</th>
                  <th className="px-3 sm:px-6 py-3 text-left">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left hidden lg:table-cell">Payment</th>
                  <th className="px-3 sm:px-6 py-3 text-left hidden md:table-cell">Price</th>
                  <th className="px-3 sm:px-6 py-3 text-left hidden lg:table-cell">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {containers.map((container, index) => (
                  <React.Fragment key={container._id}>
                    <tr
                      className="hover:bg-slate-50/70 even:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === container._id ? null : container._id)}
                      data-testid={`container-row-${index}`}
                    >
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono text-xs sm:text-sm font-semibold text-slate-900">
                        {container.containerNo}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">
                        {container.size}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-900 hidden sm:table-cell">
                        {container.type}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">
                        <div className="flex items-center gap-1">
                          <span>{getItemsSummary(container.items)}</span>
                          {container.items && container.items.length > 0 && (
                            expandedRow === container._id
                              ? <ChevronUp size={14} className="text-slate-400" />
                              : <ChevronDown size={14} className="text-slate-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className={`status-badge text-[9px] sm:text-xs ${getStatusClass(container.status)}`}>
                          {container.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                        <span className={`status-badge text-[9px] sm:text-xs ${getPaymentStatusClass(container.paymentStatus || 'Pending')}`}>
                          {container.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-slate-900 hidden md:table-cell">
                        AED {container.purchasePrice.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 hidden lg:table-cell">
                        {new Date(container.purchaseDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {canEditContainers(user) && (
                            <button
                              onClick={() => navigate(`/containers/edit/${container._id}`)}
                              className="p-2 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-sm transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                          )}
                          {canDeleteContainers(user) && container.status !== 'Sold' && (
                            <button
                              onClick={() => setDeleteId(container._id)}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-sm transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded items row */}
                    {expandedRow === container._id && container.items && container.items.length > 0 && (
                      <tr className="bg-slate-50/80">
                        <td colSpan="9" className="px-6 py-3">
                          <div className="ml-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-2">Container Items</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {container.items.map((item, itemIndex) => (
                                <div
                                  key={itemIndex}
                                  className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200"
                                >
                                  <span className="font-medium text-sm text-slate-900">{item.name}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-slate-600">
                                      {item.quantity} {item.unit}
                                    </span>
                                    {item.unitPrice > 0 && (
                                      <span className="text-xs text-slate-500">
                                        @ AED {item.unitPrice}/{item.unit}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-testid="delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="delete-dialog-title">Delete Container</AlertDialogTitle>
            <AlertDialogDescription data-testid="delete-dialog-description">
              Are you sure you want to delete this container? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-cancel-button">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" data-testid="delete-confirm-button">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Containers;
