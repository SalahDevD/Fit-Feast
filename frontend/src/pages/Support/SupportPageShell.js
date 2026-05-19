import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';

const SupportPageShell = ({
  eyebrow,
  title,
  subtitle,
  highlights = [],
  sections = [],
  ctas = [],
}) => {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="ff-panel--dark overflow-hidden rounded-[2.5rem] px-6 py-8 sm:px-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            {subtitle}
          </p>

          {highlights.length ? (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {highlights.map((highlight) => (
                <div
                  key={highlight.label}
                  className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/5 dark:shadow-none"
                >
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-200">{highlight.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{highlight.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </motion.div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.section
                key={section.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="ff-panel ff-panel--strong rounded-[2rem] p-6"
              >
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                  {section.body.map((paragraph, paragraphIndex) => (
                    <p key={`${section.title}-${paragraphIndex}`}>{paragraph}</p>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="space-y-6"
          >
            <div className="ff-panel ff-panel--strong rounded-[2rem] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                Quick actions
              </p>
              <div className="mt-5 space-y-3">
                {ctas.map((cta) =>
                  cta.href ? (
                    <a
                      key={cta.label}
                      href={cta.href}
                      className="ff-button-secondary flex w-full items-center justify-between"
                    >
                      <span>{cta.label}</span>
                      <FiArrowRight />
                    </a>
                  ) : (
                    <Link
                      key={cta.label}
                      to={cta.to}
                      className={cta.primary ? 'ff-button-primary flex w-full items-center justify-between' : 'ff-button-secondary flex w-full items-center justify-between'}
                    >
                      <span>{cta.label}</span>
                      <FiArrowRight />
                    </Link>
                  )
                )}
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default SupportPageShell;
