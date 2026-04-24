import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { userAPI } from '../utils/api';
import { toast } from 'sonner';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import InputField from '../components/ui/InputField';

const ResetPassword = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultRoute = user?.role === 'employee' ? '/containers' : '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await userAPI.resetPassword({ newPassword });
      const updated = { ...user, mustResetPassword: false };
      updateUser(updated);
      toast.success('Password reset successfully');
      navigate(defaultRoute, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-sm border border-slate-200 shadow-xl p-8">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
              <ShieldCheck size={28} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-heading uppercase text-slate-900 tracking-tight">
              Set a New Password
            </h1>
            <p className="text-slate-600 text-sm mt-2">
              For security, please change your temporary password before continuing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              inputClassName="pr-10"
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <InputField
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              minLength={6}
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save New Password'}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel and log out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
