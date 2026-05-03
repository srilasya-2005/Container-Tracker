import React, { useContext, useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Package, DollarSign, BarChart3, LogOut, Plus, ShoppingCart, Menu, X, Users, Settings, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { notificationAPI } from '../utils/api';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const seenNotifications = useRef(new Set());

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'employee') return undefined;

    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        const res = await notificationAPI.getUserNotifications({ unread: true, limit: 5 });
        const notifications = res.data.notifications || [];

        for (const notification of notifications) {
          if (seenNotifications.current.has(notification._id)) {
            continue;
          }

          toast(notification.title || 'Notification', {
            description: notification.message || ''
          });

          seenNotifications.current.add(notification._id);
          await notificationAPI.markRead(notification._id);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load notifications', error);
        }
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'finance', 'ops'] },
    { path: '/containers', icon: Package, label: 'Containers', roles: ['admin', 'finance', 'ops', 'employee'] },
    { path: '/sell', icon: ShoppingCart, label: 'Sell Container', roles: ['admin', 'finance', 'ops', 'employee'] },
    { path: '/sales', icon: DollarSign, label: 'Sales', roles: ['admin', 'finance', 'ops'] },
    { path: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'finance'] },
    { path: '/admin/employees', icon: Users, label: 'Employees', roles: ['admin'] },
    { path: '/payments', icon: CreditCard, label: 'Payments', roles: ['admin', 'finance'] },
    { path: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'finance', 'ops', 'employee'] }
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(user?.role));

  const SidebarContent = () => (
    <>
      {/* Logo & Brand */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <img src="/lmh.png" alt="LMH Trading" className="w-11 h-11 object-contain rounded" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold font-heading uppercase tracking-tight text-slate-900 leading-tight truncate">
              LMH Trading
            </h1>
            <p className="text-[10px] text-slate-500 truncate">FZCO - Container Trade</p>
          </div>
        </div>
        {user && (
          <div className="mt-2">
            <p className="text-[10px] text-slate-600 truncate">{user.name || user.email}</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 uppercase tracking-wider font-medium">
              {user.role}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-sm transition-all text-sm ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <item.icon size={18} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <NavLink
            to="/containers/new"
            className="flex items-center gap-3 px-4 py-2.5 rounded-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm font-bold uppercase tracking-wide transition-all text-sm"
          >
            <Plus size={18} />
            <span>Add Container</span>
          </NavLink>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 w-full transition-all text-sm"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Top Bar */}
      <header className="lg:hidden bg-secondary text-slate-900 flex items-center justify-between px-4 py-3 sticky top-0 z-40 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <img src="/lmh.png" alt="LMH Trading" className="w-9 h-9 object-contain rounded" />
          <div>
            <h1 className="text-sm font-bold font-heading uppercase tracking-tight leading-tight">LMH Trading</h1>
            <p className="text-[9px] text-slate-500">FZCO</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-sm transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 top-[57px]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: slide-over */}
      <aside
        className={`
          bg-secondary text-secondary-foreground flex flex-col
          fixed lg:sticky top-[57px] lg:top-0 left-0 z-50 h-[calc(100vh-57px)] lg:h-screen
          w-64 transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto bg-[radial-gradient(circle_at_top,_#ffffff,_#f8fafc_45%,_#eef2f7_100%)]">
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
