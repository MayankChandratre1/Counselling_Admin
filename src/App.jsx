import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Colleges from "./pages/Colleges";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import Users from "./pages/Users";
import Forms from "./pages/Forms";
import Lists from "./pages/Lists";
import { UsersProvider } from "./contexts/UsersContext";
import Analytics from "./pages/Analytics";
import DataCollectionForms from "./pages/DataCollectionForms";
import CutOff from "./pages/CutOff";
import UserDetailsPage from "./pages/UserDetailsPage";
import AddUsers from "./pages/AddUsers";
import AdminSettings from "./pages/AdminSettings";
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';
import LandingPage from "./pages/LandingPage";
import StaticPagesManagement from "./pages/StaticPagesManagement";
import PremiumPageManagement from "./pages/PremiumPageManagement";
import PaymentLogs from "./pages/PaymentLogs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
    {/* Add ToastContainer for react-toastify */}
      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={
            <Analytics />
        } />
         <Route 
            path='/colleges' 
            element={
              <ProtectedRoute requiredPermission={"colleges"}>
                <Colleges />
              </ProtectedRoute>
            }
          />
        <Route path="/users" element={
          <ProtectedRoute requiredPermission="users">
            <UsersProvider>
              <Users />
            </UsersProvider>
          </ProtectedRoute>
        } />
        <Route path="/users/:id" element={
          <ProtectedRoute requiredPermission="users">
            <UsersProvider>
              <UserDetailsPage />
            </UsersProvider>
          </ProtectedRoute>
        } />
        <Route path="/forms" element={
          <ProtectedRoute requiredPermission="forms">
            <Forms />
          </ProtectedRoute>
        } />
        <Route path="/lists" element={
          <ProtectedRoute requiredPermission="lists">
            <Lists />
          </ProtectedRoute>
        } />
        <Route path="/change-password" element={
          <ProtectedRoute requiredPermission="change-password">
            <ChangePassword />
          </ProtectedRoute>
        } />
        <Route path="/registrationform" element={
          <ProtectedRoute requiredPermission="registrationform">
            <DataCollectionForms />
          </ProtectedRoute>
        } />
        <Route path="/add-user" element={
          <ProtectedRoute requiredPermission="add-user">
            <AddUsers />
          </ProtectedRoute>
        } />
        <Route path="/cutoff" element={
          <ProtectedRoute requiredPermission="cutoff">
            <CutOff />
          </ProtectedRoute>
        } />
        <Route path="/admin-settings" element={
          <ProtectedRoute requiredPermission="admin-settings">
            <AdminSettings />
          </ProtectedRoute>
        } />
        <Route path="/landing-page" element={
          <ProtectedRoute requiredPermission="landing-page">
            <StaticPagesManagement />
          </ProtectedRoute>
        } />
        <Route path="/premium-plans" element={
          <ProtectedRoute requiredPermission="landing-page">
            <PremiumPageManagement />
          </ProtectedRoute>
        } />
        <Route path="/payment-logs" element={
          <ProtectedRoute requiredPermission="landing-page">
            <PaymentLogs />
          </ProtectedRoute>
        } />
    
        <Route path="/edit-user-list/:id" element={
          <ProtectedRoute requiredPermission="edit-user-list">
            <PaymentLogs />
          </ProtectedRoute>
        } />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </>

  );
}

export default App;
