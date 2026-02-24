import React from 'react';

const UserDetailsModal = ({ user, showModal, onClose }) => {
  if (!showModal || !user) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date((timestamp && timestamp._seconds ? timestamp._seconds * 1000 : new Date(timestamp).getTime())).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-semibold">User Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {user.name}</p>
                <p><span className="font-medium">Phone:</span> {user.phone}</p>
                <p><span className="font-medium">Premium Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-sm ${user.isPremium ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.isPremium ? 'Premium' : 'Standard'}
                  </span>
                </p>
              </div>
            </div>

            {user.premiumPlan && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Premium Plan Details</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Plan:</span> {user.premiumPlan.planTitle}</p>
                  <p><span className="font-medium">Purchased:</span> {formatDate(user.premiumPlan.purchasedDate)}</p>
                  <p><span className="font-medium">Expires:</span> {formatDate(user.premiumPlan.expiryDate)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Counselling Data */}
          {user.counsellingData && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Counselling Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p><span className="font-medium">Full Name:</span> {user.counsellingData.fullName}</p>
                  <p><span className="font-medium">DOB:</span> {user.counsellingData.dob}</p>
                  <p><span className="font-medium">Email:</span> {user.counsellingData.email}</p>
                  <p><span className="font-medium">Mobile:</span> {user.counsellingData.mobile}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">City:</span> {user.counsellingData.city}</p>
                  <p><span className="font-medium">State:</span> {user.counsellingData.state}</p>
                  <p><span className="font-medium">Board Type:</span> {user.counsellingData.boardType}</p>
                  <p><span className="font-medium">Board Marks:</span> {user.counsellingData.boardMarks}%</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">JEE Marks:</span> {user.counsellingData.jeeMarks}</p>
                  <p><span className="font-medium">CET Marks:</span> {user.counsellingData.cetMarks}</p>
                  <p><span className="font-medium">JEE Seat No:</span> {user.counsellingData.jeeSeatNumber}</p>
                  <p><span className="font-medium">CET Seat No:</span> {user.counsellingData.cetSeatNumber}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <p><span className="font-medium">Preferred Field:</span> {user.counsellingData.preferredField}</p>
                <p><span className="font-medium">Preferred Locations:</span> {user.counsellingData.preferredLocations}</p>
                <p><span className="font-medium">Budget:</span> {user.counsellingData.budget}</p>
              </div>
            </div>
          )}

          {/* Steps Data */}
          {user.stepsData && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Progress Steps</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {user.stepsData.steps.map((step, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 text-sm">
                        {step.number}
                      </span>
                      <p className="font-medium">{step.title}</p>
                    </div>
                    <p className="mt-2">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        step.status === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {step.status}
                      </span>
                    </p>
                    {step.remark && <p className="mt-2 text-sm text-gray-600">{step.remark}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
