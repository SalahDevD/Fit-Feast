import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaThumbsDown,
  FaThumbsUp,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import { faqAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const FAQ = () => {
  const { isAuthenticated } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openFaqs, setOpenFaqs] = useState({});
  const [userFeedback, setUserFeedback] = useState({});
  const [votingInProgress, setVotingInProgress] = useState({});

  useEffect(() => {
    fetchData();
    if (isAuthenticated) {
      loadUserFeedback();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [faqsRes, categoriesRes] = await Promise.all([
        faqAPI.getAll(),
        faqAPI.getCategories ? faqAPI.getCategories() : Promise.resolve({ data: [] }),
      ]);

      const faqData = Array.isArray(faqsRes.data)
        ? faqsRes.data
        : faqsRes.data.results || faqsRes.data.data || [];
      const categoryData = Array.isArray(categoriesRes.data)
        ? categoriesRes.data
        : categoriesRes.data.results || categoriesRes.data.data || [];

      setFaqs(faqData);
      setCategories(categoryData);
    } catch (error) {
      console.error('FAQ loading error', error);
      setFaqs([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserFeedback = async () => {
    try {
      const response = await faqAPI.getUserFeedback();
      setUserFeedback(response.data || {});
    } catch (error) {
      console.error('FAQ feedback loading error', error);
      setUserFeedback({});
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await fetchData();
      return;
    }

    setLoading(true);
    try {
      const response = await faqAPI.search(searchQuery.trim());
      const faqData = Array.isArray(response.data)
        ? response.data
        : response.data.results || response.data.data || [];
      setFaqs(faqData);
    } catch (error) {
      console.error('FAQ search error', error);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = async (categoryId) => {
    setSelectedCategory(categoryId);
    setLoading(true);
    try {
      const response = await faqAPI.getByCategory(categoryId);
      const faqData = Array.isArray(response.data)
        ? response.data
        : response.data.results || response.data.data || [];
      setFaqs(faqData);
    } catch (error) {
      console.error('FAQ category filter error', error);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (faqId) => {
    setOpenFaqs((current) => ({ ...current, [faqId]: !current[faqId] }));
  };

  const giveFeedback = async (faqId, wasHelpful) => {
    if (!isAuthenticated) {
      toast.error('Sign in to vote on answers.');
      return;
    }

    if (votingInProgress[faqId]) {
      return;
    }

    setVotingInProgress((current) => ({ ...current, [faqId]: true }));

    try {
      const response = await faqAPI.giveFeedback(faqId, wasHelpful);

      setFaqs((current) =>
        current.map((faq) =>
          faq.id === faqId
            ? {
                ...faq,
                helpful_count: response.data.helpful_count,
                not_helpful_count: response.data.not_helpful_count,
              }
            : faq
        )
      );

      setUserFeedback((current) => ({ ...current, [faqId]: wasHelpful }));
    } catch (error) {
      console.error('FAQ feedback error', error);
      toast.error('Your vote could not be saved.');
    } finally {
      setVotingInProgress((current) => ({ ...current, [faqId]: false }));
    }
  };

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="ff-panel--dark overflow-hidden rounded-[2.5rem] px-6 py-8 sm:px-8">
          <p className="ff-eyebrow text-emerald-300">Support knowledge base</p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
            Find answers quickly without leaving the platform.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Search delivery, payment, ordering, loyalty, and product guidance from one polished
            help center.
          </p>

          <div className="mt-8 grid gap-3 rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/10 dark:backdrop-blur dark:shadow-none lg:grid-cols-[1fr,auto]">
            <label className="flex items-center gap-3 rounded-full border border-black/10 bg-black px-4 py-3 text-white dark:border-white/10 dark:bg-slate-950/30">
              <FaSearch className="text-emerald-200" />
              <input
                type="text"
                placeholder="Search for payments, delivery, rewards, or account help..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/60 dark:placeholder:text-white/55"
              />
            </label>
            <button type="button" onClick={handleSearch} className="ff-button-primary">
              Search
            </button>
          </div>
        </section>

        {Array.isArray(categories) && categories.length > 0 ? (
          <section className="ff-panel ff-panel--strong rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  fetchData();
                }}
                className={`ff-chip ${!selectedCategory ? 'ff-chip--active' : ''}`}
              >
                All topics
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => filterByCategory(category.id)}
                  className={`ff-chip ${selectedCategory === category.id ? 'ff-chip--active' : ''}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="ff-panel ff-panel--strong animate-pulse rounded-[2rem] p-6">
                <div className="h-6 w-2/3 rounded-full bg-slate-200/80 dark:bg-white/10" />
                <div className="mt-4 h-4 w-full rounded-full bg-slate-200/80 dark:bg-white/10" />
                <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-200/80 dark:bg-white/10" />
              </div>
            ))}
          </div>
        ) : (
          <section className="space-y-4">
            {!Array.isArray(faqs) || faqs.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center dark:border-white/10 dark:bg-white/5">
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  No answers match this search
                </p>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Try a broader keyword or switch back to all topics.
                </p>
              </div>
            ) : (
              faqs.map((faq, index) => (
                <motion.article
                  key={faq.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="ff-panel ff-panel--strong overflow-hidden rounded-[2rem]"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                  >
                    <span className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                      {faq.question}
                    </span>
                    {openFaqs[faq.id] ? (
                      <FaChevronUp className="text-slate-400" />
                    ) : (
                      <FaChevronDown className="text-slate-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {openFaqs[faq.id] ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-200/80 dark:border-white/10"
                      >
                        <div className="px-5 py-5 sm:px-6">
                          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                            {faq.answer}
                          </p>

                          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                            <span className="font-medium text-slate-500 dark:text-slate-400">
                              Was this answer helpful?
                            </span>
                            <button
                              type="button"
                              onClick={() => giveFeedback(faq.id, true)}
                              disabled={votingInProgress[faq.id]}
                              className={`ff-chip ${userFeedback[faq.id] === true ? 'ff-chip--active' : ''}`}
                            >
                              <FaThumbsUp />
                              Yes ({faq.helpful_count || 0})
                            </button>
                            <button
                              type="button"
                              onClick={() => giveFeedback(faq.id, false)}
                              disabled={votingInProgress[faq.id]}
                              className={`ff-chip ${userFeedback[faq.id] === false ? 'ff-chip--active' : ''}`}
                            >
                              <FaThumbsDown />
                              No ({faq.not_helpful_count || 0})
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.article>
              ))
            )}
          </section>
        )}

        <section className="ff-panel ff-panel--strong rounded-[2rem] p-6 text-center">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Still need a human answer?
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Open support for account, order, payment, or delivery help.
          </p>
          <Link to="/contact" className="ff-button-primary mt-6">
            Contact support
          </Link>
        </section>
      </div>
    </div>
  );
};

export default FAQ;
