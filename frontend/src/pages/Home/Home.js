import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight, FaBolt, FaLeaf, FaRobot, FaShieldHeart, FaWandMagicSparkles } from 'react-icons/fa6';

import { dishesAPI } from '../../api/axios';
import DishCard from '../Menu/DishCard';

const featureCards = [
  {
    icon: FaWandMagicSparkles,
    title: 'AI-guided personalization',
    description: 'Compose meals around your macros, dietary preferences, and daily goals.',
  },
  {
    icon: FaRobot,
    title: 'Always-on nutrition assistant',
    description: 'Get quick answers about ingredients, planning, and healthier swaps in context.',
  },
  {
    icon: FaLeaf,
    title: 'Precision healthy ordering',
    description: 'Browse a polished catalog with clear macros, favorites, and premium filters.',
  },
  {
    icon: FaShieldHeart,
    title: 'Loyalty, community, and trust',
    description: 'Track rewards, publish progress, and keep payments and orders transparent.',
  },
];

const heroStats = [
  { label: 'Curated dishes', value: '120+' },
  { label: 'Average delivery', value: '30-60 min' },
  { label: 'Live experiences', value: 'Menu, loyalty, social' },
];

const Home = () => {
  const [featuredDishes, setFeaturedDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedDishes = async () => {
      try {
        const response = await dishesAPI.getRecommended();
        setFeaturedDishes((response.data || []).slice(0, 4));
      } catch (error) {
        console.error('Featured dishes loading error', error);
        setFeaturedDishes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedDishes();
  }, []);

  const featuredContent = useMemo(() => {
    if (loading) {
      return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="ff-panel ff-panel--strong animate-pulse rounded-[2rem] p-5">
              <div className="h-56 rounded-[1.6rem] bg-slate-200/80 dark:bg-white/10" />
              <div className="mt-5 h-5 w-2/3 rounded-full bg-slate-200/80 dark:bg-white/10" />
              <div className="mt-3 h-4 w-full rounded-full bg-slate-200/80 dark:bg-white/10" />
              <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-200/80 dark:bg-white/10" />
            </div>
          ))}
        </div>
      );
    }

    if (!featuredDishes.length) {
      return (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center dark:border-white/10 dark:bg-white/5">
          <p className="text-xl font-semibold text-slate-900 dark:text-white">
            Featured dishes will appear here shortly
          </p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            The catalog is available already. Open the menu to explore everything live.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {featuredDishes.map((dish) => (
          <DishCard key={dish.id} dish={dish} />
        ))}
      </div>
    );
  }, [featuredDishes, loading]);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="ff-shell-section space-y-8">
        <section className="ff-panel--dark overflow-hidden rounded-[2.75rem] px-6 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] lg:items-end">
            <div>
              <p className="ff-eyebrow text-emerald-300">
                <FaBolt />
                Premium healthy food platform
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
                Healthy ordering, meal planning, and loyalty finally feel like one premium product.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Fit Feast now combines a refined menu, intelligent personalization, social momentum,
                and a production-ready checkout flow inside a single polished experience.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/menu" className="ff-button-primary">
                  Explore the menu
                  <FaArrowRight />
                </Link>
                <Link to="/meal-prep" className="ff-button-secondary border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                  Build your week
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {heroStats.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="rounded-[1.8rem] border border-white/10 bg-white/10 p-5 backdrop-blur"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-4">
          {featureCards.map(({ icon: Icon, title, description }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.05 }}
              className="ff-panel ff-panel--strong rounded-[2rem] p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                <Icon className="text-lg" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
            </motion.article>
          ))}
        </section>

        <section className="ff-panel ff-panel--strong rounded-[2.5rem] px-6 py-7 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="ff-eyebrow">Featured now</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
                Popular dishes with faster discovery and cleaner product cards
              </h2>
            </div>
            <Link to="/menu" className="ff-button-secondary">
              Browse full catalog
            </Link>
          </div>

          <div className="mt-8">{featuredContent}</div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr,0.9fr]">
          <div className="ff-panel ff-panel--strong rounded-[2.5rem] p-6 sm:p-8">
            <p className="ff-eyebrow">Built for flow</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
              Move from inspiration to checkout without switching mental models.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              The menu, checkout, loyalty, social feed, and admin experience now share the same
              rhythm: premium depth, clearer spacing, responsive behavior, and subtle motion.
            </p>
          </div>

          <div className="ff-panel--dark rounded-[2.5rem] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Start now
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white">
              Turn healthy habits into a daily default.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Create an account to save favorites, plan meals, claim rewards, and keep every order
              inside one elegant dashboard.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="ff-button-primary">
                Create account
              </Link>
              <Link to="/social" className="ff-button-secondary border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                See the community
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
