import React, { useContext, useState } from 'react';
import { toast } from 'sonner';
import { Lock, Save } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { userAPI } from '../utils/api';
import InputField from '../components/ui/InputField';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (form.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await userAPI.changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      });
      toast.success('Password updated successfully');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold font-heading uppercase text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">Manage your account and password</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 sm:p-6">
          <h2 className="text-base font-bold font-heading text-slate-900">Profile</h2>
          <p className="text-xs text-slate-500 mt-1">Your current account details</p>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Name</p>
              <p className="text-slate-900 font-medium">{user?.name || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Email</p>
              <p className="text-slate-900 font-medium">{user?.email || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Role</p>
              <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-wider border font-mono bg-slate-100 text-slate-600 border-slate-200">
                {user?.role || 'user'}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-slate-900">Change Password</h2>
              <p className="text-xs text-slate-500">Keep your account secure with a strong password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <InputField
                label="Current Password"
                type="password"
                name="oldPassword"
                value={form.oldPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                required
              />
            </div>
            <InputField
              label="New Password"
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              required
            />
            <InputField
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              required
            />

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
