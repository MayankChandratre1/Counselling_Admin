import React, { useEffect } from 'react';
import {
  User, Building, GraduationCap, X, LogOut, Lock, FormInput, List,
  Home, FileLineChart, CheckCheck, Settings2, Globe2, Crown, Banknote,
  Clock10, RefreshCcwDot, Bell, PieChart
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Master list of all possible nav items with their permission key
const ALL_MENU_ITEMS = [
  { name: 'Home', icon: <Home className="mr-3 text-white" />, path: '/home', permission: 'home' },
  { name: 'Form Progress', icon: <PieChart className="mr-3 text-white" />, path: '/form-progress', permission: 'home' },
  { name: 'Appointments', icon: <Clock10 className="mr-3 text-white" />, path: '/appointments', permission: 'appointments' },
  { name: 'Users', icon: <User className="mr-3 text-blue-400" />, path: '/users', permission: 'users' },
  { name: 'Premium Users', icon: <User className="mr-3 text-blue-400" />, path: '/premium-users', permission: 'users' },
  { name: 'Colleges', icon: <Building className="mr-3 text-green-400" />, path: '/colleges', permission: 'colleges' },
  { name: 'Forms', icon: <FormInput className="mr-3 text-green-400" />, path: '/forms', permission: 'forms' },
  { name: 'Data Collection Form', icon: <FileLineChart className="mr-3 text-green-400" />, path: '/registrationform', permission: 'registrationform' },
  { name: 'Lists', icon: <List className="mr-3 text-green-400" />, path: '/lists', permission: 'lists' },
  { name: 'Static Details', icon: <Globe2 className="mr-3 text-green-400" />, path: '/landing-page', permission: 'landing-page' },
  { name: 'Premium Plans & Screens', icon: <Crown className="mr-3 text-green-400" />, path: '/premium-plans', permission: 'premium-plans' },
  { name: 'Push Notifications', icon: <Bell className="mr-3 text-yellow-400" />, path: '/send-notifications', permission: 'appointments' },
  { name: 'Payments', icon: <Banknote className="mr-3 text-yellow-400" />, path: '/payment-logs', permission: 'payment-logs' },
  { name: 'Refresh Orders', icon: <RefreshCcwDot className="mr-3 text-yellow-400" />, path: '/check-orders', permission: 'admin-settings' },
  { name: 'Change Password', icon: <Lock className="mr-3 text-yellow-400" />, path: '/change-password', permission: 'change-password' },
  { name: 'Admin Settings', icon: <Settings2 className="mr-3 text-yellow-400" />, path: '/admin-settings', permission: 'admin-settings' },
];

const VerticalNavbar = ({ onClose }) => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = React.useState([]);

  useEffect(() => {
    const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo') || 'null');
    const isSuperAdmin = adminInfo?.role === 'super-admin';

    if (isSuperAdmin) {
      // Super-admin sees every item
      setMenuItems(ALL_MENU_ITEMS);
    } else {
      // Regular admin — filter to only the pages they have access to
      const pages = JSON.parse(sessionStorage.getItem('adminPages') || '[]');
      setMenuItems(ALL_MENU_ITEMS.filter((item) => pages.includes(item.permission)));
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminInfo');
    sessionStorage.removeItem('adminPages');

    if (onClose) onClose();
    navigate('/');
  };

  return (
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col relative">
      {/* Close button for mobile */}
      <button
        onClick={onClose}
        className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
      >
        <X size={24} />
      </button>

      {/* Logo/Header */}
      <div className="p-4 border-b border-gray-700 flex items-center">
        <GraduationCap className="mr-2" />
        <h1 className="text-xl font-bold">Education Portal</h1>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-2">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            onClick={onClose}
            className="w-full flex items-center p-3 hover:bg-gray-800 rounded-md transition-colors mb-2"
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="mx-4 mb-4 flex items-center justify-center p-3 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
      >
        <LogOut className="mr-2" size={18} />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default VerticalNavbar;