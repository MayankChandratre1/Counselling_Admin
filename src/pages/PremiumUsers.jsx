import React, { useState } from 'react'
import { Menu } from 'lucide-react'
import Navbar from '../components/Navbar'
import UsersManagement from '../components/users/UsersManagement';
import PremiumUsersManagement from '../components/users/PremiumUserManagement';


const PremiumUsers = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen bg-gray-100">
    <button
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-gray-800 text-white"
    >
      <Menu size={24} />
    </button>

    {/* Sidebar */}
    <div className={`
      fixed inset-y-0 left-0 transform z-10
      lg:relative lg:translate-x-0 transition duration-200 ease-in-out
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <Navbar onClose={() => setIsSidebarOpen(false)} />
    </div>

    {/* Main content */}
    <div className="flex-1 overflow-auto w-full ">
      <PremiumUsersManagement />
    </div>
  </div>
  )
}

export default PremiumUsers