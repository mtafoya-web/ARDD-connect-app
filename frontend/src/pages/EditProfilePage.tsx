import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { ArrowLeft, Save, Upload, X, Camera } from 'lucide-react';

const inputClass =
  'w-full rounded-lg border border-border-secondary bg-canvas px-4 py-3 text-foreground-primary outline-none placeholder:text-foreground-tertiary focus:border-accent/40 focus:bg-surface focus:ring-4 focus:ring-accent/15';

const labelClass = 'mb-2 block text-sm font-bold text-foreground-primary';

export const EditProfilePage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    affiliation: '',
    role: '',
    area_of_study: '',
    research_interests: '',
    looking_for: '',
    location: '',
    website: '',
    profile_photo_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await client.get('/users/me');
      setFormData({
        full_name: response.data.full_name || '',
        bio: response.data.bio || '',
        affiliation: response.data.affiliation || '',
        role: response.data.role || '',
        area_of_study: response.data.area_of_study || '',
        research_interests: response.data.research_interests || '',
        looking_for: response.data.looking_for || '',
        location: response.data.location || '',
        website: response.data.website || '',
        profile_photo_url: response.data.profile_photo_url || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP).');
      return;
    }

    setUploading(true);
    setError('');
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await client.post('/users/me/photo', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(prev => ({ ...prev, profile_photo_url: response.data.profile_photo_url }));
      await refreshUser();
      setSuccess('Profile photo updated.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Remove profile photo?')) return;
    try {
      setUploading(true);
      await client.delete('/users/me/photo');
      setFormData(prev => ({ ...prev, profile_photo_url: '' }));
      await refreshUser();
      setSuccess('Profile photo removed.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await client.put('/users/me', formData);
      await refreshUser();
      setSuccess('Profile updated successfully.');
      setTimeout(async () => {
        const response = await client.get('/users/me');
        navigate(`/profile/${response.data.id}`);
      }, 900);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="rounded-full border border-border-secondary bg-surface px-5 py-3 text-sm font-semibold text-foreground-secondary shadow-sm">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-accent">Profile</p>
            <h1 className="mt-1 text-3xl font-black text-foreground-primary sm:text-4xl">
              Edit profile
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-border-secondary bg-surface px-4 py-2 text-sm font-bold text-foreground-primary hover:bg-surface-muted"
          >
            <ArrowLeft size={17} />
            Back
          </button>
        </div>

        <section className="rounded-lg border border-border-secondary bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-7">
          {error && (
            <div className="mb-5 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm font-medium text-status-error">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-lg border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm font-medium text-status-success">
              {success}
            </div>
          )}

          <div className="mb-8 flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative">
              <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-[#f7f9ff] bg-surface-muted shadow-sm">
                {formData.profile_photo_url ? (
                  <img src={formData.profile_photo_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-foreground-tertiary">
                    <Camera size={40} />
                  </div>
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-foreground-inverse text-xs font-bold">
                  ...
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Profile Photo</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-foreground-inverse hover:bg-accent-hover disabled:opacity-50"
                >
                  <Upload size={16} />
                  Upload Photo
                </button>
                {formData.profile_photo_url && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-2 text-sm font-bold text-status-error hover:bg-status-error/20 disabled:opacity-50"
                  >
                    <X size={16} />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-foreground-tertiary">Supports JPG, PNG, WebP. Max 5MB.</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="full_name" className={labelClass}>
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="role" className={labelClass}>
                  Role
                </label>
                <input
                  id="role"
                  name="role"
                  type="text"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="Research Scientist, PhD Student"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className={labelClass}>
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className={`${inputClass} resize-none leading-7`}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="affiliation" className={labelClass}>
                  Affiliation
                </label>
                <input
                  id="affiliation"
                  name="affiliation"
                  type="text"
                  value={formData.affiliation}
                  onChange={handleChange}
                  placeholder="Caltech, Buck Institute"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="area_of_study" className={labelClass}>
                  Area of study
                </label>
                <input
                  id="area_of_study"
                  name="area_of_study"
                  type="text"
                  value={formData.area_of_study}
                  onChange={handleChange}
                  placeholder="Aging Biology, Drug Discovery"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="research_interests" className={labelClass}>
                  Research interests
                </label>
                <textarea
                  id="research_interests"
                  name="research_interests"
                  value={formData.research_interests}
                  onChange={handleChange}
                  rows={4}
                  className={`${inputClass} resize-none leading-7`}
                />
              </div>

              <div>
                <label htmlFor="looking_for" className={labelClass}>
                  Looking for
                </label>
                <textarea
                  id="looking_for"
                  name="looking_for"
                  value={formData.looking_for}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Collaborators, mentors, datasets"
                  className={`${inputClass} resize-none leading-7`}
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="location" className={labelClass}>
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Pasadena, CA"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="website" className={labelClass}>
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border-secondary pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center rounded-full border border-border-secondary bg-surface px-5 py-2.5 text-sm font-bold text-foreground-primary hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-foreground-inverse shadow-sm hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};
