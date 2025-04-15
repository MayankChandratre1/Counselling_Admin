import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Notebook, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import axiosInstance from '../../utils/axios';
import { useUsers } from '../../contexts/UsersContext';

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
  onViewDetails // Add this prop
}) => {
  const navigate = useNavigate();
  const { notes, updateUserNotes } = useUsers();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
        <p className="mt-2 text-gray-500 text-lg">
          No users found. {!isSearchMode && "Use the search function to find users."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Add Export button above the table */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 border border-green-200"
        >
          <Download size={16} />
          Export Users & Notes
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 sm:-mx-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Premium
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Assigned Lists
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.email || 'No email'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.phone}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isPremium ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Premium
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Standard
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.lists && user.lists.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {user.lists.slice(0, 2).map((list, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs leading-tight rounded-full bg-indigo-100 text-indigo-800">
                                {list.title}
                            </span>
                        ))}
                        {user.lists.length > 2 && (
                            <span className="px-2 py-1 text-xs leading-tight rounded-full bg-gray-100 text-gray-600">
                                +{user.lists.length - 2} more
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-gray-500">No lists assigned</span>
                )}
                </td>


                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                    onClick={() => handleViewNotes(user.id, user.name)}
                    className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-200 relative"
                  >
                    <Notebook className='w-5 h-5' />
                    {notes[user.id]?.notes && Object.keys(notes[user.id]?.notes).length > 0 && (
                      <span className="absolute top-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                        {Object.keys(notes[user.id].notes).length}
                      </span>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                
                  <button 
                    onClick={() => navigate(`/users/${user.id}`)}
                    className="text-blue-600 hover:text-blue-900 mr-4 transition-colors duration-200"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleAddNote(user.id, user.name)}
                    className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-200"
                  >
                    Add Note
                  </button>
                 
                  <button 
                    onClick={() => onAddToList(user.id, user.name)}
                    className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-200"
                  >
                    Add to List
                  </button>
                  <button 
                    onClick={() => onViewLists(user.id, user.name)}
                    className="text-blue-600 hover:text-blue-900 mr-4 transition-colors duration-200"
                  >
                    View Lists
                  </button>
                  <button 
                    onClick={() => onEdit(user)}
                    className="text-blue-600 hover:text-blue-900 mr-4 transition-colors duration-200"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => onDelete(user.id)}
                    className="text-red-600 hover:text-red-900 transition-colors duration-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
        userNotes={notes[viewNotesModal.userId] || { notes: {} }}
        userName={viewNotesModal.userName}
      />

      {/* Pagination */}
      {users.length > 0 && (
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
      )}
    </div>
  );
};

export default UsersTable;
