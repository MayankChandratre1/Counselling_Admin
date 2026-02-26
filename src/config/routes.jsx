import { 
  Home, User, Building, FormInput, List, Lock, FileLineChart, 
  CheckCheck, Settings2, Globe2, Crown, Banknote, Clock10, Bell, PieChart, RefreshCcwDot
} from 'lucide-react';

/**
 * Centralized route configuration for the admin panel.
 * Each route defines:
 * - key: Unique identifier for permissions
 * - path: React Router path
 * - label: Display name  
 * - icon: Lucide icon component
 * - description: What this page does
 * - showInNav: Whether to show in sidebar (false for auxiliary routes)
 * - permission: Permission key required to access
 */
export const ROUTES = [
  {
    key: 'home',
    path: '/home',
    label: 'Home',
    icon: <Home className="mr-3 text-white" />,
    description: 'Main analytics dashboard with metrics, user stats, and tracking',
    showInNav: true,
    permission: 'home'
  },
  {
    key: 'form-progress',
    path: '/form-progress',
    label: 'Form Progress',
    icon: <PieChart className="mr-3 text-white" />,
    description: 'Standalone form progress tracking page',
    showInNav: true,
    permission: 'form-progress'
  },
  {
    key: 'appointments',
    path: '/appointments',
    label: 'Appointments',
    icon: <Clock10 className="mr-3 text-white" />,
    description: 'Manage counselling appointments and bookings',
    showInNav: true,
    permission: 'appointments'
  },
  {
    key: 'users',
    path: '/users',
    label: 'Users',
    icon: <User className="mr-3 text-blue-400" />,
    description: 'View, edit, and manage all users',
    showInNav: true,
    permission: 'users'
  },
  {
    key: 'premium-users',
    path: '/premium-users',
    label: 'Premium Users',
    icon: <Crown className="mr-3 text-blue-400" />,
    description: 'Manage premium/enrolled users',
    showInNav: true,
    permission: 'users'
  },
  {
    key: 'user-details',
    path: '/users/:id',
    label: 'User Details',
    icon: null,
    description: 'View detailed information about a specific user',
    showInNav: false,
    permission: 'users'
  },
  {
    key: 'user-details-phone',
    path: '/users/phone/:id',
    label: 'User Details by Phone',
    icon: null,
    description: 'View user details by phone number',
    showInNav: false,
    permission: 'users'
  },
  {
    key: 'user-lists-overview',
    path: '/user-lists',
    label: 'User Lists Overview',
    icon: <List className="mr-3 text-blue-400" />,
    description: 'Overview of all user-created college lists',
    showInNav: false,
    permission: 'user-lists'
  },
  {
    key: 'user-lists-detail',
    path: '/user-lists/:userId',
    label: 'User Lists Detail',
    icon: null,
    description: 'View specific user\'s lists',
    showInNav: false,
    permission: 'user-lists'
  },
  {
    key: 'users-lists',
    path: '/users/lists/:id',
    label: 'User Lists',
    icon: null,
    description: 'User list management',
    showInNav: false,
    permission: 'users'
  },
  {
    key: 'users-lists-detail',
    path: '/users/lists/:id/:listId',
    label: 'User List Detail',
    icon: null,
    description: 'Specific user list details',
    showInNav: false,
    permission: 'users'
  },
  {
    key: 'colleges',
    path: '/colleges',
    label: 'Colleges',
    icon: <Building className="mr-3 text-green-400" />,
    description: 'Manage college data, branches, and cutoffs',
    showInNav: true,
    permission: 'colleges'
  },
  {
    key: 'forms',
    path: '/forms',
    label: 'Forms',
    icon: <FormInput className="mr-3 text-green-400" />,
    description: 'Manage counselling forms and submissions',
    showInNav: true,
    permission: 'forms'
  },
  {
    key: 'registrationform',
    path: '/registrationform',
    label: 'Data Collection Form',
    icon: <FileLineChart className="mr-3 text-green-400" />,
    description: 'Data collection forms and responses',
    showInNav: true,
    permission: 'registrationform'
  },
  {
    key: 'lists',
    path: '/lists',
    label: 'Lists',
    icon: <List className="mr-3 text-green-400" />,
    description: 'Create and manage college lists for users',
    showInNav: true,
    permission: 'lists'
  },
  {
    key: 'lists-detail',
    path: '/lists/:id',
    label: 'List Detail',
    icon: null,
    description: 'Edit specific college list',
    showInNav: false,
    permission: 'lists'
  },
  {
    key: 'cutoff',
    path: '/cutoff',
    label: 'Cutoff',
    icon: <CheckCheck className="mr-3 text-yellow-400" />,
    description: 'Manage college admission cutoffs',
    showInNav: false,
    permission: 'cutoff'
  },
  {
    key: 'landing-page',
    path: '/landing-page',
    label: 'Static Details',
    icon: <Globe2 className="mr-3 text-green-400" />,
    description: 'Manage landing page and static content',
    showInNav: true,
    permission: 'landing-page'
  },
  {
    key: 'premium-plans',
    path: '/premium-plans',
    label: 'Premium Plans & Screens',
    icon: <Crown className="mr-3 text-green-400" />,
    description: 'Manage premium plans and pricing screens',
    showInNav: true,
    permission: 'premium-plans'
  },
  {
    key: 'send-notifications',
    path: '/send-notifications',
    label: 'Push Notifications',
    icon: <Bell className="mr-3 text-yellow-400" />,
    description: 'Send push notifications to users',
    showInNav: true,
    permission: 'send-notifications'
  },
  {
    key: 'payment-logs',
    path: '/payment-logs',
    label: 'Payments',
    icon: <Banknote className="mr-3 text-yellow-400" />,
    description: 'View payment transactions and history',
    showInNav: true,
    permission: 'payment-logs'
  },
  {
    key: 'check-orders',
    path: '/check-orders',
    label: 'Refresh Orders',
    icon: <RefreshCcwDot className="mr-3 text-yellow-400" />,
    description: 'Sync and refresh payment orders from gateway',
    showInNav: true,
    permission: 'check-orders'
  },
  {
    key: 'add-user',
    path: '/add-user',
    label: 'Add User',
    icon: null,
    description: 'Manually add new users to the system',
    showInNav: false,
    permission: 'add-user'
  },
  {
    key: 'change-password',
    path: '/change-password',
    label: 'Change Password',
    icon: <Lock className="mr-3 text-yellow-400" />,
    description: 'Change your admin password',
    showInNav: true,
    permission: 'change-password'
  },
  {
    key: 'admin-settings',
    path: '/admin-settings',
    label: 'Admin Settings',
    icon: <Settings2 className="mr-3 text-yellow-400" />,
    description: 'Manage admins and their permissions (super-admin only)',
    showInNav: true,
    permission: 'admin-settings'
  }
];

/**
 * Get routes that should appear in navigation
 */
export const getNavRoutes = () => ROUTES.filter(r => r.showInNav);

/**
 * Get all page permissions (for permission management)
 */
export const getAllPagePermissions = () => 
  ROUTES.map(r => ({ 
    key: r.permission, 
    label: r.label, 
    description: r.description 
  }))
  .filter((v, i, a) => a.findIndex(t => t.key === v.key) === i); // Deduplicate

/**
 * Analytics dashboard components
 */
export const ANALYTICS_COMPONENTS = [
  { key: 'installs-card', label: 'Installs Statistics Card', description: 'Total app installations count' },
  { key: 'enrolled-card', label: 'Enrolled Users Card', description: 'Users with active enrollments' },
  { key: 'today-enrolled-card', label: 'Today Enrolled Card', description: 'New enrollments today' },
  { key: 'payment-pending-card', label: 'Payment Pending Card', description: 'Pending payment transactions' },
  { key: 'form-progress-tracker', label: 'Form Progress Tracking', description: 'Track form completion rates' },
  { key: 'lists-tracking', label: 'Lists Tracking', description: 'College list creation stats' },
  { key: 'cap-progress-tracker', label: 'CAP Progress Tracker', description: 'CAP round progress monitoring' },
  { key: 'user-list', label: 'User List Section', description: 'Recent users table' }
];
