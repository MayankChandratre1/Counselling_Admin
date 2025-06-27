import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { useUsers } from '../contexts/UsersContext';
import axiosInstance from '../utils/axios';
import { Menu } from 'lucide-react';
import Navbar from '../components/Navbar'

const UserListsPage = () => {
  const {userId} = useParams();
  const [user, setUser] = useState(null);
  const [userLists, setUserLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUser = await axiosInstance.get(`/api/admin/user/${userId}`);
        setUser(fetchedUser.data);
        if( fetchedUser.data.lists && fetchedUser.data.lists.length > 0) {
          setUserLists(fetchedUser.data.lists);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
    setLoading(false);
  },[userId]);
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
      <div className="flex-1 overflow-auto w-full ">
         
    </div>
    </div>
  )
}

export default UserListsPage