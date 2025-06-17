import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Plus, 
  MessageSquare, 
  Eye, 
  MoreVertical,
  ChevronDown,
  List,
  Trash2,
  Edit,
  ExternalLink,
  Users,
  SortAsc,
  SortDesc,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import axiosInstance from '../../utils/axios';
import { useUsers } from '../../contexts/UsersContext';
import ListReleaseModal from './ListReleaseModal';

const NotesModal = ({ isOpen, onClose, userNotes, userName }) => {
  if (!isOpen) return null;

  const [selectedAdmin, setSelectedAdmin] = useState('all');

  // Transform notes object to array and get unique admins
  const notesArray = userNotes.notes ? 
    Object.entries(userNotes.notes)
      .map(([key, value]) => ({
        adminEmail: key.replace('note-', ''),
        ...value
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];

  // Get unique admin emails for filter dropdown
  const uniqueAdmins = ['all', ...new Set(notesArray.map(note => note.adminEmail))];

  // Filter notes based on search query and selected admin
  const filteredNotes = notesArray.filter(note => {
    const matchesAdmin = selectedAdmin === 'all' || note.adminEmail === selectedAdmin;
    
    return matchesAdmin;
  });

  // Group notes by date
  const groupedNotes = filteredNotes.reduce((groups, note) => {
    const date = new Date(note.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(note);
    return groups;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Notes for {userName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex gap-4 mb-4">
          
          <select
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {uniqueAdmins.map(admin => (
              <option key={admin} value={admin}>
                {admin === 'all' ? 'All Admins' : admin}
              </option>
            ))}
          </select>
        </div>

        {/* Notes List */}
        <div className="overflow-y-auto max-h-[calc(90vh-12rem)]">
          {Object.entries(groupedNotes).map(([date, dayNotes]) => (
            <div key={date} className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2 sticky top-0 bg-white py-2 border-b">
                {date}
              </h4>
              <div className="space-y-3">
                {dayNotes.map((note, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {note.adminEmail}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{note.note}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {notesArray.length === 0 
                ? "No notes available for this user" 
                : "No notes match your search criteria"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ActionsDropdown = ({ user, onAddToList, onViewLists, onEdit, onDelete, onViewDetails, isLastItem }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (action) => {
    setIsOpen(false);
    switch (action) {
      case 'details':
        navigate(`/users/${user.id}`);
        break;
      case 'addToList':
        onAddToList(user);
        break;
      case 'viewLists':
        onViewLists(user.id, user.name);
        break;
      case 'edit':
        onEdit(user);
        break;
      case 'delete':
        onDelete(user);
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-99" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className={`absolute right-0 ${isLastItem ? "bottom-full":"top-full"} mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-99`}>
            <div className="py-1">
              <button
                onClick={() => handleAction('details')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <ExternalLink size={14} className="mr-2" />
                View Details
              </button>
              {user.isPremium && <button
                onClick={() => handleAction('addToList')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Plus size={14} className="mr-2" />
                Add to List
              </button>}
              <button
                onClick={() => handleAction('viewLists')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <List size={14} className="mr-2" />
                View Lists
              </button>
              <div className="border-t border-gray-100 my-1" />
              
              <button
                onClick={() => handleAction('delete')}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <Trash2 size={14} className="mr-2" />
                Delete User
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const UsersTable = ({ 
  users, 
  loading, 
  error, 
  isSearchMode, 
  currentPage, 
  pageSize, 
  hasMore,
  onPageChange, 
  onPageSizeChange, 
  onAddToList, 
  onViewLists, 
  onEdit, 
  onDelete,
  onViewDetails
}) => {
  const navigate = useNavigate();
  const { notes, updateUserNotes, totalUsersNumber, isFilterActive, filters } = useUsers();
  const [sortOrder, setSortOrder] = useState('desc');
  const [sortedUsers, setSortedUsers] = useState([]);
  
  const [noteModal, setNoteModal] = useState({
    isOpen: false,
    userId: null,
    userName: '',
    note: ''
  });
  const [viewNotesModal, setViewNotesModal] = useState({
    isOpen: false,
    userId: null,
    userName: ''
  });
  const [showListReleaseModal, setShowListReleaseModal] = useState(false);
  const [selectedUserForRelease, setSelectedUserForRelease] = useState(null);

  // Sort users by createdAt
  useEffect(() => {
    if (users && users.length > 0) {
      const sorted = [...users].sort((a, b) => {
        const dateA = a.createdAt?._seconds || 0;
        const dateB = b.createdAt?._seconds || 0;
        
        if (sortOrder === 'desc') {
          return dateB - dateA; // Newest first
        } else {
          return dateA - dateB; // Oldest first
        }
      });
      setSortedUsers(sorted);
    } else {
      setSortedUsers([]);
    }
  }, [users, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const formatDate = (timestamp) => {
    if (!timestamp?._seconds) return 'N/A';
    return new Date(timestamp._seconds * 1000).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'

    });
  };

  const handleUserNameClick = (userId) => {
    navigate(`/users/${userId}`);
  };

  const handleAddNote = (userId, userName) => {
    setNoteModal({
      isOpen: true,
      userId,
      userName,
      note: ''
    });
  };

  const handleSaveNote = async (isDelete = false) => {
    try {
      const response = await axiosInstance.post(`/api/admin/add-note/${noteModal.userId}`, {
        note: isDelete ? '' : noteModal.note
      });

      // Update notes in context with the response data
      if (response.data.message === 'success') {
        updateUserNotes(
          noteModal.userId, 
          response.data.adminEmail, 
          isDelete ? '' : noteModal.note,
          new Date().toISOString()
        );
      }
      
      // Close modal and reset state
      setNoteModal({
        isOpen: false,
        userId: null,
        userName: '',
        note: ''
      });
      
      // Show success message
      alert(isDelete ? 'Note deleted successfully' : 'Note added successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    }
  };

  const handleViewNotes = (userId, userName) => {
    setViewNotesModal({
      isOpen: true,
      userId,
      userName
    });
  };

  const exportToCSV = () => {
    const csvData = users.map(user => {
      // Get user's notes
      const userNotes = notes[user.id]?.notes || {};
      const formattedNotes = Object.entries(userNotes)
        .map(([key, value]) => ({
          admin: key.replace('note-', ''),
          note: value.note,
          date: new Date(value.createdAt).toLocaleString()
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        Name: user.name,
        Phone: user.phone,
        Email: user.email || '-',
        CreatedAt: user.createdAt?._seconds ? new Date(user.createdAt._seconds * 1000).toLocaleDateString() : '-',
        Batch: user.batch || 'Unassigned',
        IsPremium: user.isPremium ? 'Yes' : 'No',
        HasLoggedIn: user.hasLoggedIn ? 'Yes' : 'No',
        AssignedLists: user.lists?.map(list => list.title).join('; ') || '-',
        NotesCount: formattedNotes.length,
        LastNote: formattedNotes[0]?.note || '-',
        LastNoteBy: formattedNotes[0]?.admin || '-',
        LastNoteDate: formattedNotes[0]?.date || '-',
        AllNotes: formattedNotes.map(n => `${n.note} (by ${n.admin} on ${n.date})`).join('\n')
      };
    });

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `users_with_notes_export.xlsx`);
  };

  const handleOpenListReleaseModal = (user) => {
    setSelectedUserForRelease(user);
    setShowListReleaseModal(true);
  };

  const handleListReleased = (listId) => {
    // Update the user's createdList array by removing the released list
    setSortedUsers(prevUsers => 
      prevUsers.map(user => {
        if (user.id === selectedUserForRelease.id) {
          return {
            ...user,
            createdList: user.createdList?.filter(list => list.id !== listId) || []
          };
        }
        return user;
      })
    );

    // If you have a parent state update function, call it here
    // This would depend on your state management structure
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with Total Users Count */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            {totalUsersNumber && (
              <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <Eye size={16} />
                <span className="text-sm font-medium">
                  {totalUsersNumber.toLocaleString()} total users
                </span>
              </div>
            )}
            {isFilterActive && (
              <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                <Filter size={16} />
                <span className="text-sm font-medium">Filtered Results</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Showing {sortedUsers.length} users
              {isFilterActive && (
                <span className="text-orange-600 ml-1">(filtered)</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={toggleSortOrder}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                >
                  Created Date
                  {sortOrder === 'desc' ? (
                    <SortDesc size={14} />
                  ) : (
                    <SortAsc size={14} />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lists
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  {/* Created Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(user.createdAt)}
                  </td>
                  
                  {/* User Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <button
                        onClick={() => handleUserNameClick(user.id)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {user.name}
                      </button>
                      {user.email && (
                        <div className="text-sm text-gray-500">{user.email}</div>
                      )}
                    </div>
                  </td>
                  
                  {/* Contact */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.phone || 'N/A'}
                  </td>
                  
                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isPremium 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.isPremium ? 'Premium' : 'Standard'}
                      </span>
                      {user.premiumPlan?.planTitle && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.premiumPlan.planTitle}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Batch */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {user.batch || 'Unassigned'}
                    </span>
                  </td>
                  
                  {/* Lists */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {/* Add List Plus Button */}
                    {user.isPremium && <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToList(user);
                      }}
                      className="flex-shrink-0 w-5 h-5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors group"
                      title="Add to list"
                    >
                      <Plus size={12} />
                    </button>}
                        
                      {/* Lists Display */}
                      <div className="flex flex-wrap gap-1">
                        {user.lists && user.lists.length > 0 ? (
                          <>
                            {user.lists.map((list, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {list.title}
                              </span>
                            ))}
                          </>
                        ) : null}
                        
                        {user.createdList && user.createdList.length > 0 ? (
                          <>
                            {user.createdList.map((list, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => handleOpenListReleaseModal(user)}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors"
                                title="Click to manage created lists"
                              >
                                {list.title}
                              </button>
                            ))}
                            {user.createdList.length > 2 && (
                              <button
                                onClick={() => handleOpenListReleaseModal(user)}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                title="Click to see all created lists"
                              >
                                +{user.createdList.length - 2} more
                              </button>
                            )}
                          </>
                        ) : null}
                        
                        {(!user.lists || user.lists.length === 0) && (!user.createdList || user.createdList.length === 0) && (
                          <span className="text-xs text-gray-500">No lists</span>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* Notes */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {notes && notes[user.id] && Object.keys(notes[user.id].notes || {}).length > 0 ? (
                      <button
                        onClick={() => setViewNotesModal({
                          isOpen: true,
                          userId: user.id,
                          userName: user.name
                        })}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        <MessageSquare size={12} className="mr-1" />
                        {Object.keys(notes[user.id].notes).length}
                      </button>
                    ) : (
                      <button
                        onClick={() => setNoteModal({
                          isOpen: true,
                          userId: user.id,
                          userName: user.name,
                          note: ''
                        })}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Plus size={12} className="mr-1" />
                        Add Note
                      </button>
                    )}
                  </td>
                  
                  {/* Actions Dropdown */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <ActionsDropdown
                      user={user}
                      onAddToList={onAddToList}
                      onViewLists={onViewLists}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onViewDetails={onViewDetails}
                      isLastItem={sortedUsers.indexOf(user) >= sortedUsers.length/2}
                    />
                  </td>
                </tr>
              ))
            )}
             {
              sortedUsers.length != 0 && sortedUsers.length < 5 &&
             <tr key={"Random"} className="hover:bg-gray-50 transition-colors h-48"></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isSearchMode && sortedUsers.length > 0 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasMore}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                !hasMore ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span>
                {isFilterActive && (
                  <span className="text-orange-600 ml-2">(filtered view)</span>
                )}
                {totalUsersNumber && !isFilterActive && (
                  <span className="text-gray-500 ml-2">
                    (Total: {totalUsersNumber.toLocaleString()} users)
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Show:</label>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  {currentPage}
                </span>
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={!hasMore}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    !hasMore ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {noteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Add Note for {noteModal.userName}
              </h3>
              <button
                onClick={() => setNoteModal(prev => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <textarea
                value={noteModal.note}
                onChange={(e) => setNoteModal(prev => ({ ...prev, note: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                placeholder="Enter your note here..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setNoteModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveNote(true)}
                className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Delete Note
              </button>
              <button
                onClick={() => handleSaveNote(false)}
                disabled={!noteModal.note.trim()}
                className={`px-4 py-2 rounded-md text-white ${
                  !noteModal.note.trim() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add NotesModal */}
      <NotesModal 
        isOpen={viewNotesModal.isOpen}
        onClose={() => setViewNotesModal(prev => ({ ...prev, isOpen: false }))}
        userNotes={notes && notes[viewNotesModal.userId] || { notes: {} }}
        userName={viewNotesModal.userName}
      />

      {/* Add ListReleaseModal */}
      <ListReleaseModal 
        showModal={showListReleaseModal}
        onClose={() => {
          setShowListReleaseModal(false);
          setSelectedUserForRelease(null);
        }}
        selectedUser={selectedUserForRelease}
        onListReleased={handleListReleased}
      />

      {/* Pagination */}
      {/* {users.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Page {currentPage}
            </span>
            <select 
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
            >
              Previous
            </button>
            <button 
              disabled={!hasMore}
              onClick={() => onPageChange(currentPage + 1)}
              className={`px-3 py-1 rounded-md ${!hasMore ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
            >
              Next
            </button>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default UsersTable;
