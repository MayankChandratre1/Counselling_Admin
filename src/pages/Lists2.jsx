import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import ListsManagement from '../components/lists/ListsManagement'
import { Menu } from 'lucide-react'
import { useParams } from 'react-router-dom'
import ListsManagement2 from '../components/lists/ListsManagement2'

const Lists2 = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { id } = useParams();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu button */}
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
      <div className="flex-1 overflow-auto w-full">
        <ListsManagement2 listId={id} />
      </div>
    </div>
  )
}

export default Lists2;