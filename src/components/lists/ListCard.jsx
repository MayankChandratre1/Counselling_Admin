import React, { useState } from 'react';
import { Edit, Trash2, School, Users, ChevronDown, ChevronUp, Calendar, User, Folder, FolderOpen, Lock, Archive, ArchiveRestore, Copy, MoveVertical } from 'lucide-react';
import ListDetails from './ListDetails';

const ListCard = ({ 
  list, 
  expandedListId, 
  handleListClick, 
  handleEdit, 
  handleDelete, 
  folder, 
  handleRestore, 
  originalFolder, 
  handleFolderMove, 
  handleFolderCopy,
  folders = []
}) => {
  const isExpanded = expandedListId === list.id;
  const isInArchivedFolder = folder?.archived;
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  
  const handleMoveAction = async () => {
    if (!targetFolderId) return;
    
    setIsProcessing(true);
    try {
      const success = await handleFolderMove(list.id, targetFolderId);
      if (success) {
        setActionSuccess('List successfully moved to folder.');
        setTimeout(() => {
          setShowMoveModal(false);
          setActionSuccess(null);
        }, 2000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyAction = async () => {
    if (!targetFolderId) return;
    
    setIsProcessing(true);
    try {
      const success = await handleFolderCopy(list.id, targetFolderId);
      if (success) {
        setActionSuccess('List successfully copied to folder.');
        setTimeout(() => {
          setShowCopyModal(false);
          setActionSuccess(null);
        }, 2000);
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className={`border-l-4 ${
      isInArchivedFolder 
        ? 'border-l-amber-400 bg-amber-50/30' 
        : 'border-l-blue-400 bg-white'
    } rounded-md shadow-sm hover:shadow transition-all duration-200 overflow-hidden mb-2`}>
      {/* Record Header */}
      <div 
        className={`relative transition-colors duration-200 ${
          isExpanded 
            ? isInArchivedFolder
              ? 'bg-amber-50 border-b border-amber-200' 
              : 'bg-blue-50 border-b border-gray-200'
            : ''
        }`}
      >
        {/* Main clickable area */}
        <div 
          className="flex items-center cursor-pointer p-3 pr-24 sm:pr-32" 
          onClick={() => handleListClick(list.id)}
        >
          {/* Expand/Collapse icon */}
          <div className="mr-3">
            {isExpanded ? (
              <ChevronUp size={18} className={isInArchivedFolder ? "text-amber-600" : "text-blue-600"} />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </div>
          
          {/* List title and metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h3 className={`font-semibold truncate ${
                isInArchivedFolder ? 'text-amber-900' : 'text-gray-800'
              }`}>
                {list.title}
              </h3>
            </div>
            
            {/* Folder info (if present) */}
            {folder && (<div>
                  <div className="flex items-center text-blue-600">
                    <Folder size={12} className="mr-1" />
                    {
                      list.isDeleted
                        ? <span className="line-through text-gray-500">{originalFolder?.name || "No Folder"}</span>
                        : <span className="font-medium">{folder.name}</span>
                    }
                  </div>
              </div>
            )}
            
            {/* List stats */}
            <div className="flex items-center space-x-4 mt-1 text-sm">
              <div className="flex items-center text-gray-600">
                <School size={14} className="mr-1" />
                <span>
                  <span className="font-semibold">{list.colleges?.length || 0}</span> 
                  {(list.colleges?.length || 0) === 1 ? ' college' : ' colleges'}
                </span>
              </div>
              
              {list.userIds && list.userIds.length > 0 && (
                <div className="flex items-center text-gray-600">
                  <Users size={14} className="mr-1" />
                  <span>
                    <span className="font-semibold">{list.userIds.length}</span> 
                    {list.userIds.length === 1 ? ' user' : ' users'}
                  </span>
                </div>
              )}
              
              {list.createdAt && (
                <div className="hidden sm:flex items-center text-gray-500">
                  <Calendar size={14} className="mr-1" />
                  <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                </div>
              )}
              {list.createdBy && (
                <div className="hidden sm:flex items-center text-gray-500">
                  <User size={14} className="mr-1" />
                  <span>{list.createdBy}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons (absolute positioned to stay in place) */}
        <div className="absolute top-0 right-0 h-full flex items-center pr-2">
          <div className="flex space-x-1">
            {/* Move to Folder Button */}
            {!list.isDeleted && handleFolderMove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoveModal(true);
                  setTargetFolderId('');
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Move to folder"
              >
                <MoveVertical size={16} />
              </button>
            )}

            {/* Copy to Folder Button */}
            {!list.isDeleted && handleFolderCopy && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCopyModal(true);
                  setTargetFolderId('');
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Copy to folder"
              >
                <Copy size={16} />
              </button>
            )}

            {/* Edit Button */}
           {!list.isDeleted && <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(list);
              }}
              className={`p-2 rounded-md transition-colors ${
                isInArchivedFolder
                  ? 'text-amber-600 hover:bg-amber-100'
                  : 'text-blue-600 hover:bg-blue-100'
              }`}
              title="Edit list"
            >
              <Edit size={16} />
            </button>}
            
            {/* Delete/Restore Button */}
            {list.isDeleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestore(list.id);
                }}
                className="p-2 text-green-500 hover:bg-green-50 rounded-md transition-colors"
                title="Restore list"
              >
                <ArchiveRestore size={16} />
              </button>
            ) } 
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(list.id);
                }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                title="Delete list"
              >
                <Trash2 size={16} />
              </button>
            
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={isInArchivedFolder ? "bg-amber-50/50" : "bg-gray-50"}>
          <ListDetails list={list} />
        </div>
      )}

      {/* Move to Folder Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
             onClick={() => setShowMoveModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4" 
               onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Move List to Folder</h3>
            
            {actionSuccess ? (
              <div className="text-center py-4">
                <div className="bg-green-100 text-green-800 p-3 rounded-md mb-4">
                  {actionSuccess}
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Select a destination folder for <strong>"{list.title}"</strong>:
                </p>
                
                <div className="mb-4">
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={targetFolderId}
                    onChange={(e) => setTargetFolderId(e.target.value)}
                    disabled={isProcessing}
                  >
                    <option value="">Select a folder...</option>
                    {/* Show No Folder option */}
                    <option value="null">No Folder</option>
                    {folders.map(f => (
                      // Skip current folder to prevent moving to same folder
                      f.id !== folder?.id && (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      )
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    onClick={() => setShowMoveModal(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
                      !targetFolderId || isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleMoveAction}
                    disabled={!targetFolderId || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Moving...
                      </>
                    ) : (
                      <>
                        <MoveVertical size={16} />
                        Move List
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Copy to Folder Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
             onClick={() => setShowCopyModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4" 
               onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Copy List to Folder</h3>
            
            {actionSuccess ? (
              <div className="text-center py-4">
                <div className="bg-green-100 text-green-800 p-3 rounded-md mb-4">
                  {actionSuccess}
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Select a destination folder to copy <strong>"{list.title}"</strong> to:
                </p>
                
                <div className="mb-4">
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={targetFolderId}
                    onChange={(e) => setTargetFolderId(e.target.value)}
                    disabled={isProcessing}
                  >
                    <option value="">Select a folder...</option>
                    {/* Show No Folder option */}
                    <option value="null">No Folder</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    onClick={() => setShowCopyModal(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
                      !targetFolderId || isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleCopyAction}
                    disabled={!targetFolderId || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Copying...
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy List
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListCard;