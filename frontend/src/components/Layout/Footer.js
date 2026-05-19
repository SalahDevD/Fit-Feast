import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaHeart, FaInstagram, FaLinkedin, FaXTwitter } from 'react-icons/fa6';

const footerColumns = [
  {
    title: 'Platform',
    links: [
      { label: 'Menu', to: '/menu' },
      { label: 'Custom meals', to: '/custom-dish' },
      { label: 'Meal prep', to: '/meal-prep' },
      { label: 'Challenges', to: '/challenges' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Orders', to: '/orders' },
      { label: 'Profile', to: '/profile' },
      { label: 'Loyalty', to: '/loyalty' },
      { label: 'Community', to: '/social' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQ', to: '/faq' },
      { label: 'Contact', to: '/contact' },
      { label: 'Delivery', to: '/livraison' },
      { label: 'Terms', to: '/cgv' },
    ],
  },
];

const socialLinks = [
  { label: 'Instagram', icon: FaInstagram, href: 'https://instagram.com' },
  { label: 'LinkedIn', icon: FaLinkedin, href: 'https://linkedin.com' },
  { label: 'X', icon: FaXTwitter, href: 'https://x.com' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL || 'support@fitfeast.local';

  return (
    <footer className="relative z-10 px-4 pb-6 pt-6 sm:px-6 lg:px-8">
      <div className="ff-shell-section">
        <div className="ff-panel ff-panel--strong overflow-hidden rounded-[2.5rem] px-6 py-7 sm:px-8">
          <div className="grid gap-8 xl:grid-cols-[1.1fr,0.85fr,0.85fr,0.85fr]">
            <div className="space-y-4">
              <div className="ff-brand-mark inline-flex">
                <span className="ff-brand-mark__icon">FF</span>
                <span className="ff-brand-mark__text">Fit Feast</span>
              </div>

              <h2 className="max-w-md text-2xl font-semibold text-slate-950 dark:text-white">
                A polished nutrition platform built for everyday momentum.
              </h2>
              <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Meal planning, premium ordering, loyalty, and community now live inside one
                consistent experience designed to feel fast, calm, and trustworthy.
              </p>

              <div className="flex flex-wrap gap-3">
                {socialLinks.map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="ff-icon-button"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                  {column.title}
                </p>
                <div className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <Link key={link.to} to={link.to} className="ff-footer-link">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 rounded-[2rem] border border-white/60 bg-white/65 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5 lg:grid-cols-[1fr,auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Need help fast?
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Reach support at{' '}
                <a href={`mailto:${supportEmail}`} className="font-semibold text-emerald-600">
                  {supportEmail}
                </a>{' '}
                or jump straight into the FAQ and orders flows.
              </p>
            </div>
            <Link to="/contact" className="ff-button-primary">
              Contact support
              <FaArrowRight />
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200/80 pt-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {currentYear} Fit Feast. Crafted with{' '}
              <FaHeart className="mx-1 inline text-rose-500" /> for a smoother healthy routine.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/cgv" className="ff-footer-link">
                Terms
              </Link>
              <Link to="/livraison" className="ff-footer-link">
                Delivery
              </Link>
              <Link to="/faq" className="ff-footer-link">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
