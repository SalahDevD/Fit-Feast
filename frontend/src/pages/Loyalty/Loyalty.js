import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaBolt,
  FaCheckCircle,
  FaClock,
  FaGem,
  FaGift,
  FaHistory,
  FaLayerGroup,
  FaStar,
  FaTrophy,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import { loyaltyAPI } from '../../api/axios';

const tierConfig = {
  BRONZE: { label: 'Bronze', icon: FaTrophy, accent: 'text-amber-600', nextPoints: 500 },
  SILVER: { label: 'Silver', icon: FaStar, accent: 'text-slate-400', nextPoints: 1000 },
  GOLD: { label: 'Gold', icon: FaGem, accent: 'text-yellow-500', nextPoints: null },
};

const stateStyles = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  claimed: 'bg-sky-50 text-sky-700 border-sky-200',
  redeemed: 'bg-violet-50 text-violet-700 border-violet-200',
  expired: 'bg-slate-100 text-slate-600 border-slate-200',
};

const formatStateLabel = (state) =>
  ({
    available: 'Available',
    claimed: 'Claimed',
    redeemed: 'Redeemed',
    expired: 'Expired',
  }[state] || 'Available');

const Loyalty = () => {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingRewardId, setClaimingRewardId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountRes, transactionsRes, rewardsRes, redemptionsRes] = await Promise.all([
        loyaltyAPI.getAccount(),
        loyaltyAPI.getTransactions(),
        loyaltyAPI.getRewards(),
        loyaltyAPI.getRedemptions(),
      ]);

      setAccount(accountRes.data);
      setTransactions(
        Array.isArray(transactionsRes.data)
          ? transactionsRes.data
          : transactionsRes.data.results || transactionsRes.data.data || []
      );
      setRewards(
        Array.isArray(rewardsRes.data)
          ? rewardsRes.data
          : rewardsRes.data.results || rewardsRes.data.data || []
      );
      setRedemptions(
        Array.isArray(redemptionsRes.data)
          ? redemptionsRes.data
          : redemptionsRes.data.results || redemptionsRes.data.data || []
      );
    } catch (error) {
      console.error('Loyalty loading error', error);
      setTransactions([]);
      setRewards([]);
      setRedemptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const claimReward = async (reward) => {
    if (!reward?.id || !reward.can_claim) {
      return;
    }

    setClaimingRewardId(reward.id);
    try {
      const response = await loyaltyAPI.redeemReward(reward.id);
      toast.success(response.data?.message || 'Reward claimed successfully.');
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'The reward could not be claimed.');
    } finally {
      setClaimingRewardId(null);
    }
  };

  const tier = tierConfig[(account?.tier || 'BRONZE').toUpperCase()] || tierConfig.BRONZE;
  const TierIcon = tier.icon;
  const progressPercent = useMemo(() => {
    if (!tier.nextPoints) {
      return 100;
    }
    return Math.min(((account?.points_balance || 0) / tier.nextPoints) * 100, 100);
  }, [account?.points_balance, tier.nextPoints]);

  const claimedRewards = redemptions.filter((reward) => reward.reward_state === 'claimed');
  const redemptionHistory = redemptions.filter((reward) => reward.reward_state !== 'claimed');

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full bg-white px-6 py-4 shadow-lg">
          <FaBolt className="animate-pulse text-emerald-600" />
          <span className="text-sm font-medium text-slate-700">Loading your loyalty space...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="ff-panel--dark overflow-hidden rounded-[2.75rem] px-6 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">
                Loyalty program
              </p>
              <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
                Claim first, redeem later, track every reward clearly.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Rewards only become usable in checkout after you claim them here, so every discount
                is intentional and easy to verify.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 text-slate-900 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/10 dark:text-white dark:backdrop-blur dark:shadow-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-600 dark:text-emerald-200">Current tier</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{tier.label}</p>
                </div>
                <TierIcon className={`text-4xl ${tier.accent}`} />
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Points balance</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{account?.points_balance || 0} pts</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  {tier.nextPoints
                    ? `${Math.max(tier.nextPoints - (account?.points_balance || 0), 0)} pts to the next tier`
                    : 'You are already at the highest tier.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          {[
            {
              label: 'Available rewards',
              value: rewards.filter((reward) => reward.reward_state === 'available').length,
              icon: FaGift,
            },
            {
              label: 'Claimed for checkout',
              value: claimedRewards.length,
              icon: FaLayerGroup,
            },
            {
              label: 'Redeemed history',
              value: redemptionHistory.length,
              icon: FaCheckCircle,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="ff-kpi-card min-w-0 w-full overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="ff-kpi-label">{label}</p>
                <Icon className="text-emerald-500" />
              </div>
              <p className="ff-kpi-value break-words overflow-hidden text-ellipsis">{value}</p>
            </div>
          ))}
        </section>

        <section className="ff-panel ff-panel--strong rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <FaGift className="text-emerald-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                Rewards catalog
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">Claim rewards before checkout</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rewards.map((reward, index) => (
              <motion.article
                key={reward.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.4)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{reward.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{reward.description}</p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-2 text-xs font-semibold ${stateStyles[reward.reward_state] || stateStyles.available}`}
                  >
                    {formatStateLabel(reward.reward_state)}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Cost</span>
                    <span className="font-semibold text-slate-900">{reward.points_cost} pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Type</span>
                    <span className="font-semibold text-slate-900">{reward.reward_type.replaceAll('_', ' ')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => claimReward(reward)}
                  disabled={!reward.can_claim || claimingRewardId === reward.id}
                  className={`mt-5 w-full rounded-full px-4 py-3 text-sm font-semibold transition ${
                    reward.can_claim
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_20px_48px_-28px_rgba(16,185,129,0.6)] hover:-translate-y-0.5'
                      : 'cursor-not-allowed bg-slate-100 text-slate-400'
                  }`}
                >
                  {claimingRewardId === reward.id
                    ? 'Claiming...'
                    : reward.reward_state === 'claimed'
                      ? 'Already claimed'
                      : reward.can_claim
                        ? 'Claim reward'
                        : 'Not enough points'}
                </button>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr,1fr]">
          <div className="ff-panel ff-panel--strong rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <FaClock className="text-sky-500" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
                  Claimed rewards
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">Ready for checkout</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {claimedRewards.length ? (
                claimedRewards.map((reward) => (
                  <div key={reward.id} className="rounded-[1.5rem] border border-sky-200 bg-sky-50/80 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{reward.reward_name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          This reward is now unlocked for your next checkout.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-sky-700">
                        Claimed
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center text-sm text-slate-500">
                  Claim a reward above to make it available in checkout.
                </div>
              )}
            </div>
          </div>

          <div className="ff-panel ff-panel--strong rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <FaHistory className="text-violet-500" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">
                  Reward history
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">Redeemed and expired states</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {redemptionHistory.length ? (
                redemptionHistory.map((reward) => (
                  <div key={reward.id} className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{reward.reward_name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {reward.order_number
                            ? `Applied on order ${reward.order_number}.`
                            : 'This reward is no longer active.'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-2 text-xs font-semibold ${stateStyles[reward.reward_state] || stateStyles.available}`}
                      >
                        {formatStateLabel(reward.reward_state)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center text-sm text-slate-500">
                  Your redemption history will appear here after a claimed reward is used.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="ff-panel ff-panel--strong rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <FaHistory className="text-emerald-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                Points ledger
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">Everything that changed your balance</h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {transactions.length ? (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between rounded-[1.4rem] border border-slate-200 bg-white/85 px-4 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{transaction.reason}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(transaction.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-2 text-sm font-semibold ${
                      transaction.delta_points > 0
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {transaction.delta_points > 0 ? '+' : ''}
                    {transaction.delta_points} pts
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center text-sm text-slate-500">
                No loyalty transactions yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Loyalty;
