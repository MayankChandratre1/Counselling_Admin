import { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Colleges from './pages/Colleges';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Users from './pages/Users';
import Forms from './pages/Forms';
import Lists from './pages/Lists';
import { UsersProvider } from './contexts/UsersContext';
import Analytics from './pages/Analytics';
import { ListsProvider } from './contexts/ListsContext';

// Protected Route component to handle authentication
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  
  if (!token) {
    // Redirect to login if no token exists
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Login route */}
          <Route path='/' element={<Login />} />
          
          {/* Protected routes */}
          <Route 
            path='/colleges' 
            element={
              <ProtectedRoute>
                <Colleges />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path='/users' 
            element={
              <ProtectedRoute>
                <UsersProvider>
                  <Users />
                </UsersProvider>
              </ProtectedRoute>
            }
          />

          <Route 
            path='/forms' 
            element={
              <ProtectedRoute>
                <Forms/>
              </ProtectedRoute>
            }
          />

          <Route 
            path='/lists' 
            element={
              <ProtectedRoute>
                <Lists />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path='/change-password' 
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path='/home' 
            element={
              <ProtectedRoute>
                 
                          <Analytics />
               
              </ProtectedRoute>
            }
          />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;