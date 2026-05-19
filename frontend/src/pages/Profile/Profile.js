import React, { useEffect, useMemo, useState } from 'react';
import { FaAllergies, FaLeaf, FaSave, FaUser } from 'react-icons/fa';
import { FaShieldHalved } from 'react-icons/fa6';
import toast from 'react-hot-toast';

import FileUploadField from '../../components/Common/FileUploadField';
import { useAuth } from '../../context/AuthContext';
import {
  useAllergensQuery,
  useDietTypesQuery,
  usePreferenceMutations,
  useUserAllergiesQuery,
  useUserDietsQuery,
} from '../../queries/useProfileQueries';

const tabs = [
  { id: 'info', label: 'Account', icon: FaUser },
  { id: 'preferences', label: 'Food profile', icon: FaLeaf },
  { id: 'security', label: 'Security', icon: FaShieldHalved },
];

const normalizeOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const buildProfilePayload = (formData, profilePictureFile) => {
  const normalizedPayload = {
    first_name: formData.first_name?.trim() || '',
    last_name: formData.last_name?.trim() || '',
    phone: formData.phone?.trim() || '',
    timezone: formData.timezone?.trim() || 'Africa/Casablanca',
    height_cm: normalizeOptionalNumber(formData.height_cm),
    weight_kg: normalizeOptionalNumber(formData.weight_kg),
  };

  if (!(profilePictureFile instanceof File)) {
    return normalizedPayload;
  }

  const formPayload = new FormData();
  Object.entries(normalizedPayload).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      formPayload.append(key, '');
      return;
    }

    formPayload.append(key, String(value));
  });
  formPayload.append('profile_picture', profilePictureFile);
  return formPayload;
};

const Profile = () => {
  const { user, updateProfile, removeProfilePicture, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');

  const allergensQuery = useAllergensQuery();
  const dietsQuery = useDietTypesQuery();
  const userAllergiesQuery = useUserAllergiesQuery(Boolean(user));
  const userDietsQuery = useUserDietsQuery(Boolean(user));
  const { toggleAllergy, toggleDiet } = usePreferenceMutations();

  const allergens = useMemo(() => allergensQuery.data || [], [allergensQuery.data]);
  const diets = useMemo(() => dietsQuery.data || [], [dietsQuery.data]);
  const userAllergies = useMemo(() => userAllergiesQuery.data || [], [userAllergiesQuery.data]);
  const userDiets = useMemo(() => userDietsQuery.data || [], [userDietsQuery.data]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    timezone: 'UTC',
    height_cm: '',
    weight_kg: '',
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      timezone: user.timezone || 'UTC',
      height_cm: user.height_cm || '',
      weight_kg: user.weight_kg || '',
    });
    setProfilePreview(user.profile_picture_url || user.profile_picture || '');
    setProfilePictureFile(null);
  }, [user]);

  const selectedAllergyIds = useMemo(
    () => new Set(userAllergies.map((item) => item.allergen)),
    [userAllergies]
  );
  const selectedDietIds = useMemo(
    () => new Set(userDiets.map((item) => item.diet)),
    [userDiets]
  );

  const handleInfoSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const payload = buildProfilePayload(formData, profilePictureFile);
      const success = await updateProfile(payload);
      if (success) {
        setProfilePictureFile(null);
      }
    } catch (error) {
      console.error('Profile update error', error);
      toast.error('The profile could not be updated.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProfilePictureFile(null);
      return;
    }

    setProfilePictureFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleRemoveProfilePicture = async () => {
    setSavingProfile(true);
    const success = await removeProfilePicture();
    setSavingProfile(false);
    if (success) {
      toast.success('Profile photo removed.');
      setProfilePictureFile(null);
      setProfilePreview('');
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('The passwords do not match.');
      return;
    }

    setSavingPassword(true);
    const success = await changePassword(
      passwordData.old_password,
      passwordData.new_password,
      passwordData.confirm_password
    );
    setSavingPassword(false);

    if (success) {
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    }
  };

  const handleToggleAllergy = async (allergenId) => {
    const hasAllergy = userAllergies.some((item) => item.allergen === allergenId);
    try {
      await toggleAllergy.mutateAsync({ allergenId, hasAllergy, userAllergies });
    } catch (error) {
      console.error('Allergy toggle error', error);
      toast.error('That allergy preference could not be changed.');
    }
  };

  const handleToggleDiet = async (dietId) => {
    const hasDiet = userDiets.some((item) => item.diet === dietId);
    try {
      await toggleDiet.mutateAsync({ dietId, hasDiet, userDiets });
    } catch (error) {
      console.error('Diet toggle error', error);
      toast.error('That diet preference could not be changed.');
    }
  };

  const userLabel =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.username ||
    user?.email ||
    'Member';

  return (
    <div className="ff-page">
      <div className="ff-page__inner ff-page__inner--narrow space-y-8">
        <section className="ff-panel--dark overflow-hidden rounded-[2.5rem] px-6 py-8 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr,auto] lg:items-end">
            <div>
              <p className="ff-eyebrow text-emerald-300">Account center</p>
              <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
                Keep your preferences, nutrition profile, and security in sync.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Update your identity, dietary fit, and password from one consistent dashboard.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 text-slate-900 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/10 dark:text-white dark:backdrop-blur dark:shadow-none">
              <div className="flex items-center gap-4">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt={userLabel}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-emerald-300/70"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-xl font-bold text-slate-950">
                    {userLabel.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{userLabel}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ff-panel ff-panel--strong rounded-[2rem] p-4 sm:p-5">
          <div className="ff-tab-group" role="tablist" aria-label="Profile sections">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`profile-panel-${id}`}
                className="ff-tab-pill"
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'info' ? (
          <section id="profile-panel-info" className="ff-panel ff-panel--strong rounded-[2rem] p-6 sm:p-8">
            <form onSubmit={handleInfoSubmit} className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
                <div className="rounded-[1.8rem] border border-slate-200/80 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Profile photo</p>
                  <div className="mt-5 flex flex-col items-center gap-4 text-center">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      {profilePreview ? (
                        <img src={profilePreview} alt={userLabel} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-emerald-600">
                          {userLabel.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <FileUploadField
                      id="profile-picture"
                      name="profile_picture"
                      label=""
                      accept="image/*"
                      value={profilePictureFile}
                      previewUrl={profilePreview}
                      onChange={handleProfilePictureChange}
                      description="Drag in a square profile image or browse your device."
                    />

                    {profilePreview ? (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        disabled={savingProfile}
                        className="ff-button-secondary border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
                      >
                        Remove photo
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">First name</span>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(event) => setFormData({ ...formData, first_name: event.target.value })}
                      className="ff-input"
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Last name</span>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(event) => setFormData({ ...formData, last_name: event.target.value })}
                      className="ff-input"
                    />
                  </label>
                  <label className="md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
                    <input type="email" value={user?.email || ''} disabled className="ff-input opacity-75" />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Phone</span>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                      className="ff-input"
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Timezone</span>
                    <input
                      type="text"
                      value={formData.timezone}
                      onChange={(event) => setFormData({ ...formData, timezone: event.target.value })}
                      className="ff-input"
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Height (cm)</span>
                    <input
                      type="number"
                      value={formData.height_cm}
                      onChange={(event) => setFormData({ ...formData, height_cm: event.target.value })}
                      className="ff-input"
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Weight (kg)</span>
                    <input
                      type="number"
                      value={formData.weight_kg}
                      onChange={(event) => setFormData({ ...formData, weight_kg: event.target.value })}
                      className="ff-input"
                    />
                  </label>
                </div>
              </div>

              <button type="submit" disabled={savingProfile} className="ff-button-primary">
                <FaSave />
                {savingProfile ? 'Saving...' : 'Save profile'}
              </button>
            </form>
          </section>
        ) : null}

        {activeTab === 'preferences' ? (
          <section id="profile-panel-preferences" className="grid gap-6 lg:grid-cols-2">
            <div className="ff-panel ff-panel--strong rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <FaAllergies className="text-rose-500" />
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Allergens</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Keep risky ingredients visible across your meal flow.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {allergensQuery.isPending && !allergens.length ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading allergens...</p>
                ) : allergens.length ? (
                  allergens.map((allergen) => (
                    <button
                      key={allergen.id}
                      type="button"
                      onClick={() => handleToggleAllergy(allergen.id)}
                      className={`ff-chip ${selectedAllergyIds.has(allergen.id) ? 'ff-chip--active bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200' : ''}`}
                    >
                      {allergen.name}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No allergens available.</p>
                )}
              </div>
            </div>

            <div className="ff-panel ff-panel--strong rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <FaLeaf className="text-emerald-500" />
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Dietary preferences</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Mark your preferred eating styles to improve recommendations.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {dietsQuery.isPending && !diets.length ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading diets...</p>
                ) : diets.length ? (
                  diets.map((diet) => (
                    <button
                      key={diet.id}
                      type="button"
                      onClick={() => handleToggleDiet(diet.id)}
                      className={`ff-chip ${selectedDietIds.has(diet.id) ? 'ff-chip--active' : ''}`}
                    >
                      {diet.name}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No diets available.</p>
                )}
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 px-4 py-4 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                Meals that conflict with your allergen profile should stay easier to spot across the
                menu and planning flows.
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'security' ? (
          <section id="profile-panel-security" className="ff-panel ff-panel--strong rounded-[2rem] p-6 sm:p-8">
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50/80 px-4 py-4 text-sm text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
                Your next password should contain at least 8 characters and should not be a common
                or purely numeric password.
              </div>

              <label>
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Current password</span>
                <input
                  type="password"
                  value={passwordData.old_password}
                  onChange={(event) => setPasswordData({ ...passwordData, old_password: event.target.value })}
                  required
                  className="ff-input"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">New password</span>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(event) => setPasswordData({ ...passwordData, new_password: event.target.value })}
                  required
                  className="ff-input"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Confirm new password</span>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(event) => setPasswordData({ ...passwordData, confirm_password: event.target.value })}
                  required
                  className="ff-input"
                />
              </label>

              <button type="submit" disabled={savingPassword} className="ff-button-primary">
                {savingPassword ? 'Updating password...' : 'Change password'}
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default Profile;
