import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../utils/api';
import { toast } from 'sonner';
import { Users, Plus, Eye, Power, Clock, Package, ShoppingCart, TrendingUp, X, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import InputField from '../components/ui/InputField';

const AdminEmployees = () => {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeActivities, setEmployeeActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [updateForm, setUpdateForm] = useState({ title: '', message: '' });
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;
      const res = await adminAPI.getEmployeePerformance(params);
      setPerformance(res.data);
    } catch (error) {
      toast.error('Failed to load employee performance');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('All fields are required');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await adminAPI.createEmployee(createForm);
      if (res.data?.emailSent) {
        toast.success(`Employee created. Credentials emailed to ${res.data.email}`);
      } else {
        toast.warning(
          `Employee created, but credentials email failed${res.data?.emailError ? `: ${res.data.emailError}` : ''}. Share the password manually.`
        );
      }
      setShowCreateDialog(false);
      setCreateForm({ name: '', email: '', password: '' });
      fetchPerformance();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create employee');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (employeeId) => {
    try {
      await adminAPI.toggleEmployeeActive(employeeId);
      toast.success('Employee status updated');
      fetchPerformance();
    } catch (error) {
      toast.error('Failed to update employee status');
    }
  };

  const handleDeleteEmployee = async (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${employee.employeeName || employee.employeeEmail}? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await adminAPI.deleteEmployee(employee.employeeId);
      toast.success('Employee deleted');
      fetchPerformance();
    } catch (error) {
      const status = error.response?.status;
      const serverMsg = error.response?.data?.error;
      console.error('Delete employee failed:', status, error.response?.data || error.message);
      if (status === 404) {
        toast.error('Delete endpoint not found — restart the backend to load the new route.');
      } else if (status === 401 || status === 403) {
        toast.error('You do not have permission to delete employees.');
      } else {
        toast.error(serverMsg || `Failed to delete employee (${status || 'network error'})`);
      }
    }
  };

  const handleSendUpdate = async (e) => {
    e.preventDefault();
    if (!updateForm.title.trim() || !updateForm.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setUpdateLoading(true);
    try {
      await adminAPI.broadcastUpdate({
        title: updateForm.title.trim(),
        message: updateForm.message.trim()
      });
      toast.success('Update sent to employees');
      setUpdateForm({ title: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send update');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleViewDetails = async (employee) => {
    setSelectedEmployee(employee);
    setActivityLoading(true);
    try {
      const res = await adminAPI.getEmployeeActivity(employee.employeeId);
      setEmployeeActivities(res.data.activities);
    } catch (error) {
      toast.error('Failed to load activity log');
    } finally {
      setActivityLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const totals = performance.reduce(
    (acc, e) => ({
      employees: acc.employees + 1,
      activeEmployees: acc.activeEmployees + (e.isActive ? 1 : 0),
      added: acc.added + e.containersAdded,
      sold: acc.sold + e.containersSold,
      revenue: acc.revenue + e.totalRevenue,
      profit: acc.profit + e.totalProfit,
    }),
    { employees: 0, activeEmployees: 0, added: 0, sold: 0, revenue: 0, profit: 0 }
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading uppercase text-slate-900 tracking-tight">
            Employee Management
          </h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">Track and manage employee performance</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={20} />
          Add Employee
        </button>
      </div>

      <div className="card p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900">Send System Update</h2>
            <p className="text-xs text-slate-500">Notify all active employees about important changes</p>
          </div>
        </div>
        <form onSubmit={handleSendUpdate} className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <InputField
              label="Title"
              type="text"
              value={updateForm.title}
              onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
              placeholder="System maintenance window"
              required
            />
          </div>
          <div className="lg:col-span-2">
            <InputField
              label="Message"
              type="text"
              value={updateForm.message}
              onChange={(e) => setUpdateForm({ ...updateForm, message: e.target.value })}
              placeholder="Maintenance scheduled for Friday at 9 PM GST."
              required
            />
          </div>
          <div className="lg:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={updateLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateLoading ? 'Sending...' : 'Send Update'}
            </button>
          </div>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Employees</p>
              <p className="text-2xl font-bold text-slate-900">{totals.activeEmployees}<span className="text-sm text-slate-400">/{totals.employees}</span></p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded">
              <Package size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Containers Added</p>
              <p className="text-2xl font-bold text-slate-900">{totals.added}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded">
              <ShoppingCart size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Sales Made</p>
              <p className="text-2xl font-bold text-slate-900">{totals.sold}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Profit</p>
              <p className="text-2xl font-bold text-emerald-600">AED {totals.profit.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <InputField
            label="From"
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          />
          <InputField
            label="To"
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          />
        </div>
      </div>

      {/* Performance Table */}
      {loading ? (
        <div className="card p-8 text-center">
          <p className="text-slate-500">Loading employee data...</p>
        </div>
      ) : performance.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-500">No employees found. Create one to get started.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-[10px] sm:text-xs tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left">Employee</th>
                  <th className="px-3 sm:px-6 py-3 text-left hidden sm:table-cell">Email</th>
                  <th className="px-3 sm:px-6 py-3 text-center">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-center">Added</th>
                  <th className="px-3 sm:px-6 py-3 text-center">Sold</th>
                  <th className="px-3 sm:px-6 py-3 text-right hidden md:table-cell">Revenue</th>
                  <th className="px-3 sm:px-6 py-3 text-right hidden md:table-cell">Profit</th>
                  <th className="px-3 sm:px-6 py-3 text-center hidden lg:table-cell">Avg Time</th>
                  <th className="px-3 sm:px-6 py-3 text-left hidden lg:table-cell">Last Activity</th>
                  <th className="px-3 sm:px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((employee) => (
                  <tr key={employee.employeeId} className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 ${employee.isDeleted ? 'opacity-60' : ''}`}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-sm text-slate-900">
                      {employee.employeeName || 'Unnamed'}
                      {employee.isDeleted && (
                        <span className="ml-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider">(removed)</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs text-slate-600 hidden sm:table-cell">
                      {employee.employeeEmail}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                      <span className={`status-badge text-[9px] sm:text-xs ${employee.isDeleted ? 'bg-slate-100 text-slate-500 border-slate-200' : employee.isActive ? 'status-available' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {employee.isDeleted ? 'Deleted' : employee.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-sm font-semibold text-slate-900">
                      {employee.containersAdded}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-sm font-semibold text-slate-900">
                      {employee.containersSold}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-sm text-slate-900 hidden md:table-cell">
                      AED {(employee.totalRevenue || 0).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-sm font-semibold text-emerald-600 hidden md:table-cell">
                      AED {(employee.totalProfit || 0).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs text-slate-600 hidden lg:table-cell">
                      {formatTime(employee.avgTimeSpent)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs text-slate-600 hidden lg:table-cell">
                      {employee.lastActivity ? new Date(employee.lastActivity).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetails(employee)}
                          className="p-2 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-sm transition-colors"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        {!employee.isDeleted && (
                          <>
                            <button
                              onClick={() => handleToggleActive(employee.employeeId)}
                              className={`p-2 rounded-sm transition-colors ${employee.isActive ? 'text-slate-600 hover:text-red-600 hover:bg-red-50' : 'text-slate-600 hover:text-green-600 hover:bg-green-50'}`}
                              title={employee.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <Power size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee)}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                              title="Delete employee"
                              data-testid={`delete-employee-${employee.employeeId}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Employee Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-heading uppercase tracking-tight">Create Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEmployee} className="space-y-4">
            <InputField
              label="Name"
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="Employee name"
              required
            />
            <InputField
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="employee@company.com"
              required
            />
            <InputField
              label="Password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="Password"
              required
              minLength={6}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="btn-primary"
              >
                {createLoading ? 'Creating...' : 'Create Employee'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Employee Detail Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-heading uppercase tracking-tight">
              {selectedEmployee?.employeeName} - Activity Log
            </DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div>
              {/* Employee Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-50 p-3 rounded">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Added</p>
                  <p className="text-lg font-bold text-slate-900">{selectedEmployee.containersAdded}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Sold</p>
                  <p className="text-lg font-bold text-slate-900">{selectedEmployee.containersSold}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Total Time</p>
                  <p className="text-lg font-bold text-slate-900">{formatTime(selectedEmployee.totalTimeSpent)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Profit</p>
                  <p className="text-lg font-bold text-emerald-600">AED {(selectedEmployee.totalProfit || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Activity Timeline */}
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">Recent Activity</h3>
              {activityLoading ? (
                <p className="text-slate-500 text-sm text-center py-4">Loading activities...</p>
              ) : employeeActivities.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No activities recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {employeeActivities.map((activity, index) => (
                    <div key={activity._id || index} className="flex items-start gap-3 p-3 bg-slate-50 rounded border border-slate-100">
                      <div className={`p-1.5 rounded ${activity.actionType === 'ADD_CONTAINER' ? 'bg-blue-100' : 'bg-green-100'}`}>
                        {activity.actionType === 'ADD_CONTAINER'
                          ? <Package size={14} className="text-blue-600" />
                          : <ShoppingCart size={14} className="text-green-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {activity.actionType === 'ADD_CONTAINER' ? 'Added Container' : 'Sold Container'}
                          {activity.containerId && (
                            <span className="font-mono ml-1 text-primary">
                              {activity.containerId.containerNo || ''}
                            </span>
                          )}
                        </p>
                        {activity.saleId && (
                          <p className="text-xs text-slate-500">
                            Buyer: {activity.saleId.buyerName || 'N/A'} | AED {(activity.saleId.sellingPrice || 0).toLocaleString()}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-slate-400">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                          {activity.timeSpent > 0 && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {formatTime(activity.timeSpent)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmployees;
