import React, { useEffect } from 'react';
import { User, Building, GraduationCap, X, LogOut, Lock, FormInput, List, Home, FormInputIcon, FileLineChart,CheckCheck, Settings2, Tent, Globe2, Crown, Banknote, Clock10, RefreshCcwDot } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const VerticalNavbar = ({ onClose }) => {
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = React.useState([
    { name: 'Home', icon: <Home className="mr-3 text-white" />, path: '/home' },
  ]);

  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo'));

    const role = adminInfo?.role || null;
    const isSuperAdmin = role === 'super-admin';
    
    switch (role) {
      case 'super-admin':
        setMenuItems([
          { name: 'Home', icon: <Home className="mr-3 text-white" />, path: '/home' },
          { name: 'Users', icon: <User className="mr-3 text-blue-400" />, path: '/users' },
          { name: 'Colleges', icon: <Building className="mr-3 text-green-400" />, path: '/colleges' },
          { name: 'Forms', icon: <FormInput className="mr-3 text-green-400" />, path: '/forms' },
          { name: 'Data Collection Form', icon: <FileLineChart className="mr-3 text-green-400" />, path: '/registrationform' },
          { name: 'Lists', icon: <List className="mr-3 text-green-400" />, path: '/lists' },
          { name: 'Cutoff', icon: <CheckCheck className="mr-3 text-green-400" />, path: '/cutoff' },
          { name: 'Change Password', icon: <Lock className="mr-3 text-yellow-400" />, path: '/change-password' },
          { name: 'Admin Settings', icon: <Settings2 className="mr-3 text-yellow-400" />, path: '/admin-settings' },
        ]);
        break;
        default:
        setMenuItems([
          { name: 'Home', icon: <Home className="mr-3 text-white" />, path: '/home' },
          { name: 'Users', icon: <User className="mr-3 text-blue-400" />, path: '/users' },
          { name: 'Colleges', icon: <Building className="mr-3 text-green-400" />, path: '/colleges' },
          { name: 'Forms', icon: <FormInput className="mr-3 text-green-400" />, path: '/forms' },
          { name: 'Data Collection Form', icon: <FileLineChart className="mr-3 text-green-400" />, path: '/registrationform' }
        ]);
    }
  },[])

  useEffect(() => {
    const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo'));
    const permissions = adminInfo?.permissions;
    
    if (!permissions) {
      setMenuItems([
        { name: 'Home', icon: <Home className="mr-3 text-white" />, path: '/home' }
      ]);
      return;
    }
  
    const allowedPages = permissions.pages;
    const allMenuItems = [
      { name: 'Home', icon: <Home className="mr-3 text-white" />, path: '/home', permission: 'home' },
      { name: 'Users', icon: <User className="mr-3 text-blue-400" />, path: '/users', permission: 'users' },
      { name: 'Colleges', icon: <Building className="mr-3 text-green-400" />, path: '/colleges', permission: 'colleges' },
      { name: 'Forms', icon: <FormInput className="mr-3 text-green-400" />, path: '/forms', permission: 'forms' },
      { name: 'Data Collection Form', icon: <FileLineChart className="mr-3 text-green-400" />, path: '/registrationform', permission: 'registrationform' },
      { name: 'Lists', icon: <List className="mr-3 text-green-400" />, path: '/lists', permission: 'lists' },
      { name: 'Static Details', icon: <Globe2 className="mr-3 text-green-400" />, path: '/landing-page', permission: 'landing-page' },
      { name: 'Premium Plans & Screens', icon: <Crown className="mr-3 text-green-400" />, path: '/premium-plans', permission: 'premium-plans' },
      { name: 'Appointments', icon: <Clock10 className="mr-3 text-yellow-400" />, path: '/appointments', permission: 'appointments' },
      { name: 'Payments', icon: <Banknote className="mr-3 text-yellow-400" />, path: '/payment-logs', permission: 'payment-logs' },
      { name: 'Refresh Orders', icon: <RefreshCcwDot className="mr-3 text-yellow-400" />, path: '/check-orders', permission: 'admin-settings' },
      { name: 'Change Password', icon: <Lock className="mr-3 text-yellow-400" />, path: '/change-password', permission: 'change-password' },
      { name: 'Admin Settings', icon: <Settings2 className="mr-3 text-yellow-400" />, path: '/admin-settings', permission: 'admin-settings' },
    ];
  
    setMenuItems(allMenuItems.filter(item => allowedPages.includes(item.permission)));
  }, []);

  const handleLogout = () => {
    // Clear all authentication data from sessionStorage
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminInfo');
    
    // Remove the token from axios headers if you're using axios
    if (window.axios && window.axios.defaults.headers.common['token']) {
      delete window.axios.defaults.headers.common['token'];
    }
    
    // Close the navbar if on mobile
    if (onClose) {
      onClose();
    }
    
    // Redirect to login page
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
       
        {
          menuItems.map((item, index) => (
            <Link 
              key={index}
              to={item.path}
              onClick={onClose}
              className="w-full flex items-center p-3 hover:bg-gray-800 rounded-md transition-colors mb-2"
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))
        }
        
        
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