import React, { useEffect } from 'react';
import { GraduationCap, X, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getNavRoutes } from '../config/routes';

const VerticalNavbar = ({ onClose }) => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = React.useState([]);

  useEffect(() => {
    const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo') || 'null');
    const isSuperAdmin = adminInfo?.role === 'super-admin';

    console.log('🔍 Navbar - Admin Info:', adminInfo);
    console.log('🔍 Navbar - Is Super Admin:', isSuperAdmin);

    const allNavRoutes = getNavRoutes();

    if (isSuperAdmin) {
      console.log('✅ Super-admin - showing all nav items');
      setMenuItems(allNavRoutes);
    } else {
      const pages = adminInfo?.permissions?.pages || [];
      console.log('🔍 Navbar - Pages from permissions:', pages);
      const filteredItems = allNavRoutes.filter((route) => pages.includes(route.permission));
      console.log('🔍 Navbar - Filtered menu items:', filteredItems);
      setMenuItems(filteredItems);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminInfo');

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
            <span>{item.label}</span>
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