import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaCalendar,
  FaCheckCircle,
  FaCrown,
  FaFire,
  FaRunning,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import { socialAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const normalizeList = (payload) =>
  Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

const sortLeaderboardEntries = (entries) =>
  [...entries].sort((left, right) => {
    const completedDelta = Number(right.completed_count || 0) - Number(left.completed_count || 0);
    if (completedDelta !== 0) {
      return completedDelta;
    }

    const progressDelta = Number(right.total_progress || 0) - Number(left.total_progress || 0);
    if (progressDelta !== 0) {
      return progressDelta;
    }

    const pointsDelta = Number(right.points_gained || 0) - Number(left.points_gained || 0);
    if (pointsDelta !== 0) {
      return pointsDelta;
    }

    return String(left.username || '').localeCompare(String(right.username || ''));
  });

const rankLeaderboardEntries = (entries, currentUserId) =>
  sortLeaderboardEntries(entries).map((entry, index) => ({
    ...entry,
    rank: index + 1,
    is_current_user: entry.user_id === currentUserId,
  }));

const Challenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [myChallenges, setMyChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joiningIds, setJoiningIds] = useState({});
  const [updatingIds, setUpdatingIds] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadChallengesData = async () => {
      setLoading(true);
      try {
        const [allChallenges, myChallengesRes, leaderboardRes] = await Promise.all([
          socialAPI.getChallenges(),
          socialAPI.getMyChallenges(),
          socialAPI.getLeaderboard(),
        ]);

        if (!isMounted) {
          return;
        }

        const challengesData = normalizeList(allChallenges.data);
        const myChallengesData = normalizeList(myChallengesRes.data);
        const leaderboardPayload = leaderboardRes.data || {};
        const entries = Array.isArray(leaderboardPayload)
          ? leaderboardPayload
          : leaderboardPayload.entries || [];
        const rankedEntries = rankLeaderboardEntries(entries, user?.id);
        const currentUserEntry =
          rankedEntries.find((entry) => entry.user_id === user?.id) ||
          (Array.isArray(leaderboardPayload) ? null : leaderboardPayload.current_user || null);

        setChallenges(challengesData);
        setMyChallenges(myChallengesData);
        setLeaderboard(rankedEntries);
        setCurrentUserRank(currentUserEntry);
        setTotalParticipants(
          Array.isArray(leaderboardPayload)
            ? rankedEntries.length
            : leaderboardPayload.total_participants || rankedEntries.length
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error('Erreur chargement defis', error);
        setChallenges([]);
        setMyChallenges([]);
        setLeaderboard([]);
        setCurrentUserRank(null);
        setTotalParticipants(0);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChallengesData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const leaderboardEntry = leaderboard.find((entry) => entry.user_id === user.id);
    if (leaderboardEntry) {
      setCurrentUserRank(leaderboardEntry);
    }
  }, [leaderboard, user?.id]);

  const participationByChallenge = useMemo(
    () =>
      new Map(
        (Array.isArray(myChallenges) ? myChallenges : []).map((participation) => [
          participation.challenge,
          participation,
        ])
      ),
    [myChallenges]
  );

  const syncCurrentUserLeaderboard = ({ completedDelta = 0, pointsDelta = 0, progressDelta = 0 }) => {
    if (!user?.id) {
      return;
    }

    setLeaderboard((current) => {
      if (!current.some((entry) => entry.user_id === user.id)) {
        return current;
      }

      return rankLeaderboardEntries(
        current.map((entry) =>
          entry.user_id === user.id
            ? {
                ...entry,
                completed_count: Number(entry.completed_count || 0) + completedDelta,
                points_gained: Number(entry.points_gained || 0) + pointsDelta,
                total_progress: Number(entry.total_progress || 0) + progressDelta,
              }
            : entry
        ),
        user.id
      );
    });

    setCurrentUserRank((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        completed_count: Number(current.completed_count || 0) + completedDelta,
        points_gained: Number(current.points_gained || 0) + pointsDelta,
        total_progress: Number(current.total_progress || 0) + progressDelta,
      };
    });
  };

  const joinChallenge = async (challengeId) => {
    if (joiningIds[challengeId]) {
      return;
    }

    const challenge = challenges.find((item) => item.id === challengeId);
    if (!challenge) {
      return;
    }

    const previousChallenges = challenges;
    const previousMyChallenges = myChallenges;
    const previousParticipants = totalParticipants;
    const hadAnyChallenge = myChallenges.length > 0;

    setJoiningIds((current) => ({ ...current, [challengeId]: true }));
    setChallenges((current) =>
      current.map((item) =>
        item.id === challengeId
          ? {
              ...item,
              is_participating: true,
              participants_count: Number(item.participants_count || 0) + 1,
              progress: {
                current: 0,
                target: item.target_value,
                percentage: 0,
              },
            }
          : item
      )
    );
    setMyChallenges((current) =>
      current.some((participation) => participation.challenge === challengeId)
        ? current
        : [
            {
              id: `optimistic-${challengeId}`,
              challenge: challengeId,
              progress_value: 0,
              completed_at: null,
              challenge_details: challenge,
              user_details: { id: user?.id, username: user?.username },
            },
            ...current,
          ]
    );
    if (!hadAnyChallenge) {
      setTotalParticipants((current) => current + 1);
    }

    try {
      const response = await socialAPI.joinChallenge(challengeId);
      setMyChallenges((current) =>
        current.map((participation) =>
          participation.challenge === challengeId
            ? { ...participation, id: response.data?.participation_id || participation.id }
            : participation
        )
      );
      toast.success('Defi rejoint !');
    } catch (error) {
      setChallenges(previousChallenges);
      setMyChallenges(previousMyChallenges);
      setTotalParticipants(previousParticipants);
      toast.error("Erreur lors de l'inscription");
    } finally {
      setJoiningIds((current) => ({ ...current, [challengeId]: false }));
    }
  };

  const updateProgress = async (challengeId) => {
    if (updatingIds[challengeId]) {
      return;
    }

    const challenge = challenges.find((item) => item.id === challengeId);
    const participation = participationByChallenge.get(challengeId);

    if (!challenge) {
      toast.error('Defi non trouve');
      return;
    }

    if (!challenge.is_participating || !participation) {
      toast.error("Vous n'avez pas rejoint ce defi");
      return;
    }

    const previousChallenges = challenges;
    const previousMyChallenges = myChallenges;
    const previousLeaderboard = leaderboard;
    const previousCurrentUserRank = currentUserRank;
    const currentProgress = Number(participation.progress_value || 0);
    const nextProgress = currentProgress + 1;
    const targetValue = Number(challenge.target_value || 0);
    const wasCompleted = Boolean(participation.completed_at);
    const willComplete = !wasCompleted && targetValue > 0 && nextProgress >= targetValue;
    const optimisticPoints = willComplete
      ? Number(challenge.reward_points || 40 + Math.min(targetValue * 5, 60))
      : 0;

    setUpdatingIds((current) => ({ ...current, [challengeId]: true }));
    setMyChallenges((current) =>
      current.map((item) =>
        item.challenge === challengeId
          ? {
              ...item,
              progress_value: nextProgress,
              completed_at: willComplete ? item.completed_at || new Date().toISOString() : item.completed_at,
            }
          : item
      )
    );
    setChallenges((current) =>
      current.map((item) =>
        item.id === challengeId
          ? {
              ...item,
              progress: {
                current: nextProgress,
                target: item.target_value,
                percentage:
                  Number(item.target_value || 0) > 0
                    ? Math.min(Math.round((nextProgress / Number(item.target_value || 1)) * 100), 100)
                    : 0,
              },
            }
          : item
      )
    );
    syncCurrentUserLeaderboard({
      completedDelta: willComplete ? 1 : 0,
      pointsDelta: optimisticPoints,
      progressDelta: 1,
    });

    try {
      const response = await socialAPI.updateChallengeProgress(challengeId, nextProgress);
      const payload = response.data || {};
      const completed = Boolean(payload.completed);
      const pointsAwarded = Number(payload.points_awarded || 0);

      setMyChallenges((current) =>
        current.map((item) =>
          item.challenge === challengeId
            ? {
                ...item,
                progress_value: Number(payload.progress ?? nextProgress),
                completed_at: completed
                  ? item.completed_at || new Date().toISOString()
                  : item.completed_at,
              }
            : item
        )
      );
      setChallenges((current) =>
        current.map((item) =>
          item.id === challengeId
            ? {
                ...item,
                progress: {
                  current: Number(payload.progress ?? nextProgress),
                  target: Number(payload.target ?? item.target_value),
                  percentage:
                    Number(payload.target ?? item.target_value) > 0
                      ? Math.min(
                          Math.round(
                            (Number(payload.progress ?? nextProgress) /
                              Number((payload.target ?? item.target_value) || 1)) *
                              100
                          ),
                          100
                        )
                      : 0,
                },
              }
            : item
        )
      );

      if (pointsAwarded !== optimisticPoints || completed !== willComplete) {
        setLeaderboard(previousLeaderboard);
        setCurrentUserRank(previousCurrentUserRank);
        syncCurrentUserLeaderboard({
          completedDelta: completed && !wasCompleted ? 1 : 0,
          pointsDelta: pointsAwarded,
          progressDelta: 1,
        });
      }

      toast.success('Progression mise a jour !');
    } catch (error) {
      setChallenges(previousChallenges);
      setMyChallenges(previousMyChallenges);
      setLeaderboard(previousLeaderboard);
      setCurrentUserRank(previousCurrentUserRank);
      console.error('Erreur mise a jour progression:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la mise a jour');
    } finally {
      setUpdatingIds((current) => ({ ...current, [challengeId]: false }));
    }
  };

  const summary = useMemo(() => {
    const completed = myChallenges.filter((challenge) => challenge.completed_at).length;
    const points = Number(currentUserRank?.points_gained || 0);
    return {
      joined: myChallenges.length,
      completed,
      points,
      rank: currentUserRank?.rank || null,
    };
  }, [currentUserRank, myChallenges]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="ff-page">
      <div className="ff-page__inner space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Defis Healthy</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            Relevez des defis, gagnez des points et transformez vos habitudes alimentaires.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="ff-panel ff-panel--strong rounded-[1.75rem] p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Defis rejoints</p>
            <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">{summary.joined}</p>
          </div>
          <div className="ff-panel ff-panel--strong rounded-[1.75rem] p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Defis completes</p>
            <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">{summary.completed}</p>
          </div>
          <div className="ff-panel ff-panel--strong rounded-[1.75rem] p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Points challenge</p>
            <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">{summary.points}</p>
          </div>
          <div className="ff-panel ff-panel--strong rounded-[1.75rem] p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Mon rang</p>
            <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
              {summary.rank ? `#${summary.rank}` : '-'}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
              <FaRunning className="text-primary" /> Defis en cours
            </h2>

            <div className="space-y-4">
              {Array.isArray(challenges) &&
                challenges
                  .filter((challenge) => challenge.is_active)
                  .map((challenge, idx) => {
                    const participating = challenge.is_participating;
                    const participation = participating ? participationByChallenge.get(challenge.id) : null;
                    const progressData =
                      challenge.progress ||
                      (participation
                        ? {
                            current: participation.progress_value,
                            target: challenge.target_value,
                            percentage:
                              Number(challenge.target_value || 0) > 0
                                ? Math.round(
                                    (Number(participation.progress_value || 0) /
                                      Number(challenge.target_value || 1)) *
                                      100
                                  )
                                : 0,
                          }
                        : null);
                    const progressPercent = Math.min(Number(progressData?.percentage || 0), 100);

                    return (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="ff-panel ff-panel--strong rounded-[1.75rem] p-6"
                      >
                        <div className="mb-4 flex justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                              {challenge.title}
                            </h3>
                            <p className="mt-1 text-gray-600 dark:text-gray-400">
                              {challenge.description}
                            </p>
                          </div>

                          <div className="h-fit rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                            {challenge.goal_type_display}
                          </div>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaCalendar /> {new Date(challenge.start_date).toLocaleDateString()} -{' '}
                            {new Date(challenge.end_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaUsers /> Objectif: {challenge.target_value} {challenge.goal_type_display}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaFire /> {challenge.reward_points || 0} points
                          </span>
                        </div>

                        {participating ? (
                          <div>
                            <div className="mb-1 flex justify-between text-sm">
                              <span>Progression</span>
                              <span>
                                {progressData?.current || 0} / {challenge.target_value}
                              </span>
                            </div>

                            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-2 rounded-full bg-primary transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>

                            <button
                              onClick={() => updateProgress(challenge.id)}
                              disabled={Boolean(participation?.completed_at) || updatingIds[challenge.id]}
                              className="btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {participation?.completed_at
                                ? 'Defi complete'
                                : updatingIds[challenge.id]
                                  ? 'Mise a jour...'
                                  : 'Mettre a jour la progression'}
                            </button>

                            {participation?.completed_at ? (
                              <div className="mt-3 flex items-center gap-1 text-green-500">
                                <FaCheckCircle /> Defi complete !
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <button
                            onClick={() => joinChallenge(challenge.id)}
                            disabled={joiningIds[challenge.id]}
                            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {joiningIds[challenge.id] ? 'Connexion...' : 'Rejoindre le defi'}
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
            </div>
          </div>

          <div>
            <div className="mb-6 rounded-xl bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <FaTrophy className="mb-3 text-3xl" />
              <h3 className="text-xl font-bold">Classement</h3>
              <p className="mt-2 text-sm opacity-90">
                {totalParticipants > 0
                  ? `${totalParticipants} participant${totalParticipants > 1 ? 's' : ''} classes en direct`
                  : 'Le classement se remplit au fur et a mesure des participations.'}
              </p>
            </div>

            <div className="ff-panel ff-panel--strong rounded-[1.75rem] p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold">Leaderboard</h3>
                {currentUserRank?.rank ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Moi #{currentUserRank.rank}
                  </span>
                ) : null}
              </div>

              <div className="space-y-3">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aucun classement disponible pour le moment.
                  </p>
                ) : (
                  leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`rounded-lg border px-4 py-3 ${
                        entry.is_current_user
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                            {entry.rank === 1 ? <FaCrown /> : `#${entry.rank}`}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-white">{entry.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {entry.completed_count} defi(s) completes
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-primary">{entry.points_gained} pts</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Progression {entry.total_progress}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {currentUserRank && !leaderboard.some((entry) => entry.user_id === user?.id) ? (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                  Vous etes actuellement classe #{currentUserRank.rank} avec {currentUserRank.points_gained} points challenge.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Challenges;
