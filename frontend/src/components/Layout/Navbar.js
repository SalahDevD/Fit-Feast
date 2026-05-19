import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  FaBars,
  FaBox,
  FaChevronDown,
  FaCompass,
  FaRocket,
  FaShoppingCart,
  FaSignOutAlt,
  FaTimes,
  FaUser,
  FaUtensils,
} from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Menu', to: '/menu' },
  { label: 'Custom meals', to: '/custom-dish' },
  { label: 'Meal prep', to: '/meal-prep' },
  { label: 'Challenges', to: '/challenges' },
  { label: 'Community', to: '/social' },
  { label: 'Support', to: '/contact' },
  { label: 'FAQ', to: '/faq' },
];

const Navbar = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { count: cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const dashboardLinks = useMemo(() => {
    const links = [
      { label: 'Profile', to: '/profile', icon: FaUser, description: 'Identity, food profile, and security' },
      { label: 'Orders', to: '/orders', icon: FaShoppingCart, description: 'Track payments and delivery progress' },
      { label: 'Loyalty', to: '/loyalty', icon: FaBox, description: 'Rewards, points, and tier history' },
    ];

    if (user?.role === 'admin' || user?.role === 'ADMIN') {
      links.push({ label: 'Admin dashboard', to: '/admin', icon: FaCompass, description: 'Payments, members, and catalog controls' });
    }

    if (
      user?.role === 'employee' ||
      user?.role === 'EMPLOYEE' ||
      user?.role === 'admin' ||
      user?.role === 'ADMIN'
    ) {
      links.push({ label: 'Operations', to: '/employee', icon: FaRocket, description: 'Kitchen and fulfillment workflow' });
    }

    return links;
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const isActiveLink = (to) => {
    if (to === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(to);
  };

  const userLabel =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.username ||
    user?.email ||
    'Account';

  return (
    <header className="sticky top-0 z-[70] px-4 pt-4 sm:px-6 lg:px-8">
      <nav className="ff-shell-section">
        <div className="ff-nav-shell">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="ff-brand-mark shrink-0">
              <span className="ff-brand-mark__icon">
                <FaUtensils />
              </span>
              <span className="ff-brand-mark__text">Fit Feast</span>
            </Link>

            <div className="hidden min-w-0 items-center gap-1 xl:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`ff-nav-link ${isActiveLink(link.to) ? 'is-active' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/cart" className="ff-icon-button relative shrink-0" aria-label="Cart">
              <FaShoppingCart />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((current) => !current)}
                  className="ff-user-trigger min-w-[14rem] justify-between"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {user?.profile_picture_url || user?.profile_picture ? (
                      <img
                        src={user.profile_picture_url || user.profile_picture}
                        alt={userLabel}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-emerald-200/75"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-sm font-bold text-slate-950">
                        {userLabel.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="hidden min-w-0 text-left sm:block">
                      <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Signed in
                      </p>
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {userLabel}
                      </p>
                    </div>
                  </div>

                  <FaChevronDown className="hidden text-slate-400 sm:block" />
                </button>

                <AnimatePresence>
                  {userMenuOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-[calc(100%+0.8rem)] z-[80] w-[min(19rem,calc(100vw-1.5rem))]"
                    >
                      <div className="ff-panel ff-panel--strong overflow-hidden rounded-[1.6rem] p-2.5 shadow-[0_32px_90px_-46px_rgba(15,23,42,0.45)]">
                        <div className="ff-panel--dark rounded-[1.25rem] px-3.5 py-3">
                          <div className="flex items-center gap-2.5">
                            {user?.profile_picture_url || user?.profile_picture ? (
                              <img
                                src={user.profile_picture_url || user.profile_picture}
                                alt={userLabel}
                                className="h-11 w-11 rounded-full object-cover ring-2 ring-emerald-300/50"
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-base font-bold text-white">
                                {userLabel.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold">{userLabel}</p>
                              <p className="truncate text-xs text-slate-300">{user?.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 max-h-[min(22rem,calc(100vh-12rem))] space-y-1.5 overflow-y-auto pr-1">
                          {dashboardLinks.map(({ label, to, icon: Icon, description }) => (
                            <Link
                              key={to}
                              to={to}
                              className="flex items-start gap-2.5 rounded-[1rem] px-3 py-2.5 transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-white/5 dark:hover:text-emerald-200"
                            >
                              <span className="mt-0.5 inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-emerald-50 text-sm text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-200">
                                <Icon />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[13px] font-semibold text-slate-900 dark:text-white">{label}</span>
                                <span className="block text-[11px] leading-4 text-slate-500 dark:text-slate-400">{description}</span>
                              </span>
                            </Link>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="mt-2.5 flex w-full items-center gap-2.5 rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
                        >
                          <FaSignOutAlt />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link to="/login" className="ff-button-secondary text-center">
                  Sign in
                </Link>
                <Link to="/register" className="ff-button-primary text-center">
                  Create account
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="ff-icon-button xl:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="ff-shell-section xl:hidden"
          >
            <div className="ff-panel ff-panel--strong mt-3 rounded-[2rem] p-4">
              <div className="grid gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`ff-mobile-link ${isActiveLink(link.to) ? 'is-active' : ''}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {!isAuthenticated ? (
                <div className="mt-4 grid gap-2 sm:hidden">
                  <Link to="/login" className="ff-button-secondary w-full">
                    Sign in
                  </Link>
                  <Link to="/register" className="ff-button-primary w-full">
                    Create account
                  </Link>
                </div>
              ) : (
                <div className="mt-4 grid gap-2 border-t border-slate-200/70 pt-4 dark:border-white/10">
                  {dashboardLinks.map(({ label, to, icon: Icon }) => (
                    <Link key={to} to={to} className="ff-mobile-link">
                      <Icon className="text-emerald-500" />
                      {label}
                    </Link>
                  ))}

                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-3 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
                  >
                    <FaSignOutAlt />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
