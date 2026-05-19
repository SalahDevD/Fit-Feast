import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaMoon, FaSun } from 'react-icons/fa';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import PageSkeleton from './components/Feedback/PageSkeleton';
import ChatbotWidget from './components/Chatbot/ChatbotWidget';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import GrainientThemed from './components/GrainientThemed';
import Footer from './components/Layout/Footer';
import Navbar from './components/Layout/Navbar';
import { useAuth } from './context/AuthContext';
import { useLiveQuerySync } from './hooks/useLiveQuerySync';
import { applyThemeMode, getStoredThemeMode } from './lib/theme';

const Home = lazy(() => import('./pages/Home/Home'));
const Menu = lazy(() => import('./pages/Menu/Menu'));
const DishDetail = lazy(() => import('./pages/Menu/DishDetail'));
const CartPage = lazy(() => import('./pages/Cart/CartPage'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const SocialAuthCallback = lazy(() => import('./pages/Auth/SocialAuthCallback'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const CustomDish = lazy(() => import('./pages/CustomDish/CustomDish'));
const MealPrep = lazy(() => import('./pages/MealPrep/MealPrep'));
const Challenges = lazy(() => import('./pages/Challenges/Challenges'));
const SocialFeed = lazy(() => import('./pages/Social/SocialFeed'));
const FAQ = lazy(() => import('./pages/FAQ/FAQ'));
const Orders = lazy(() => import('./pages/Orders/Orders'));
const Loyalty = lazy(() => import('./pages/Loyalty/Loyalty'));
const Checkout = lazy(() => import('./pages/Checkout/Checkout'));
const CheckoutSuccess = lazy(() => import('./pages/Checkout/CheckoutSuccess'));
const Contact = lazy(() => import('./pages/Support/Contact'));
const Livraison = lazy(() => import('./pages/Support/Livraison'));
const CGV = lazy(() => import('./pages/Support/CGV'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/Employee/EmployeeDashboard'));

const AuthGateLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="rounded-full border border-white/60 bg-white/80 px-6 py-4 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:text-white">
      Loading...
    </div>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AuthGateLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <AuthGateLoader />;
  return isAuthenticated && (user?.role === 'admin' || user?.role === 'ADMIN')
    ? children
    : <Navigate to="/" replace />;
};

const EmployeeRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <AuthGateLoader />;

  const isEmployee = user && (
    user.role === 'employee' ||
    user.role === 'EMPLOYEE' ||
    user.role === 'admin' ||
    user.role === 'ADMIN'
  );

  if (!isAuthenticated || !isEmployee) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [themeMode, setThemeMode] = useState(getStoredThemeMode);
  const location = useLocation();
  useLiveQuerySync();

  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback'].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith('/admin');
  const isEmployeePage = location.pathname.startsWith('/employee');
  const isCheckoutPage = location.pathname.startsWith('/checkout');
  const hideChatbot = isAuthPage || isAdminPage || isEmployeePage || isCheckoutPage;
  const isDarkTheme = themeMode === 'dark';

  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  const shellClassName = useMemo(
    () => `min-h-screen flex flex-col relative fitfeast-shell ${isAuthPage ? 'ff-shell--auth' : ''}`,
    [isAuthPage]
  );

  const toggleFloatingTheme = () => {
    setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={shellClassName}>
      <div className="fixed inset-0 w-full h-full pointer-events-none">
        <GrainientThemed theme={themeMode} />
      </div>

      <button
        type="button"
        onClick={toggleFloatingTheme}
        className="ff-theme-toggle ff-floating-action ff-floating-action--left"
        aria-label="Toggle theme between light and dark mode"
      >
        {isDarkTheme ? <FaSun size={24} /> : <FaMoon size={24} />}
      </button>

      <Navbar />

      <main
        className={`flex-1 relative z-10 ${
          isAuthPage
            ? 'flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8'
            : ''
        }`}
      >
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton variant="grid" />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="h-full w-full"
              >
                <Routes location={location}>
                  <Route path="/" element={<Home />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/dish/:id" element={<DishDetail />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/livraison" element={<Livraison />} />
                  <Route path="/cgv" element={<CGV />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/callback" element={<SocialAuthCallback />} />
                  <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
                  <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
                  <Route path="/checkout/:orderId" element={<PrivateRoute><Checkout /></PrivateRoute>} />
                  <Route path="/checkout/result" element={<PrivateRoute><CheckoutSuccess /></PrivateRoute>} />
                  <Route path="/checkout/success" element={<PrivateRoute><CheckoutSuccess /></PrivateRoute>} />
                  <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/custom-dish" element={<PrivateRoute><CustomDish /></PrivateRoute>} />
                  <Route path="/ai-generator" element={<Navigate to="/custom-dish" replace />} />
                  <Route path="/meal-prep" element={<PrivateRoute><MealPrep /></PrivateRoute>} />
                  <Route path="/challenges" element={<PrivateRoute><Challenges /></PrivateRoute>} />
                  <Route path="/social" element={<PrivateRoute><SocialFeed /></PrivateRoute>} />
                  <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
                  <Route path="/loyalty" element={<PrivateRoute><Loyalty /></PrivateRoute>} />
                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/employee" element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
      {!hideChatbot && <ChatbotWidget />}
    </div>
  );
}

export default App;
