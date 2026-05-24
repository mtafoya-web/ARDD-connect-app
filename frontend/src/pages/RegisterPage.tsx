import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, UserPlus, Award, X } from 'lucide-react';
import { ArddLogo } from '../components/ArddLogo';
import { updateMe } from '../services/usersService';
import { checkExpertProfile, claimExpertByEmail, Expert } from '../services/expertsService';

const fieldClass =
  'w-full rounded-lg border border-border-secondary bg-surface-muted px-4 py-3 text-foreground-primary outline-none placeholder:text-foreground-tertiary focus:border-border-focus focus:bg-surface focus:ring-4 focus:ring-accent/15';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone_number: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expertProfile, setExpertProfile] = useState<Expert | null>(null);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [claimingExpert, setClaimingExpert] = useState(false);
  const navigate = useNavigate();
  const { register, login, refreshUser } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleClaimExpert = async () => {
    if (!expertProfile) return;
    
    setClaimingExpert(true);
    try {
      const result = await claimExpertByEmail(formData.email.trim().toLowerCase());
      if (result.success) {
        setExpertProfile(result.expert);
        setShowExpertModal(false);
        navigate('/feed');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to claim expert profile');
    } finally {
      setClaimingExpert(false);
    }
  };

  const handleSkipExpert = () => {
    setShowExpertModal(false);
    navigate('/feed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fullName = formData.full_name.trim();
      if (!fullName) {
        setError('Enter your full name.');
        return;
      }

      const email = formData.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Enter a real email address you can access.');
        return;
      }

      await register({
        username: formData.username,
        email,
        phone_number: formData.phone_number.trim() || undefined,
        password: formData.password,
      });
      await login({
        username: formData.username,
        password: formData.password,
      });
      await updateMe({ full_name: fullName });
      await refreshUser();

      // Check for expert profile
      try {
        const expertCheck = await checkExpertProfile(email);
        if (expertCheck.has_expert_profile && expertCheck.expert) {
          setExpertProfile(expertCheck.expert);
          setShowExpertModal(true);
        } else {
          navigate('/feed');
        }
      } catch (err) {
        // If expert check fails, just proceed to feed
        navigate('/feed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas px-4 py-12 text-foreground-primary sm:py-16">
      <section className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-md flex-col justify-center">
        <div className="rounded-lg border border-border-secondary bg-surface p-6 shadow-sm sm:p-8">
          <ArddLogo />

          <div className="mt-10">
            <p className="text-sm font-bold uppercase tracking-wide text-accent">Create account</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground-primary">
              Start your research profile
            </h1>
            <p className="mt-3 leading-relaxed text-foreground-secondary">
              Join the ARDD conference community for aging research, drug discovery, and useful scientific connections.
            </p>

            {error && (
              <div className="mt-6 rounded-lg border border-status-error/25 bg-status-error/10 px-4 py-3 text-sm font-medium text-status-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="full_name" className="mb-2 block text-sm font-bold text-foreground-primary">
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-bold text-foreground-primary">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-bold text-foreground-primary">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="phone_number" className="mb-2 block text-sm font-bold text-foreground-primary">
                  Phone number
                </label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                  autoComplete="tel"
                  className={fieldClass}
                />
                <p className="mt-2 text-xs leading-relaxed text-foreground-tertiary">
                  Optional, but it can authorize password recovery if you lose access to email.
                </p>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-bold text-foreground-primary">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className={fieldClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-foreground-inverse shadow-sm hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus size={18} />
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-foreground-secondary">
              Already have an account?{' '}
              <Link to="/login" className="inline-flex items-center gap-1 font-bold text-accent hover:text-accent-hover">
                Sign in
                <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Expert Profile Modal */}
      {showExpertModal && expertProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg border border-border-secondary bg-surface p-6 shadow-lg sm:p-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/10 p-3">
                  <Award className="text-accent" size={24} />
                </div>
                <h2 className="text-xl font-bold text-foreground-primary">Expert Profile Found!</h2>
              </div>
              <button
                onClick={handleSkipExpert}
                className="text-foreground-tertiary hover:text-foreground-primary"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-4 text-sm text-foreground-secondary">
              We found your profile from the ARDD speakers directory. Would you like to claim it?
            </p>

            <div className="mt-6 space-y-3 rounded-lg bg-surface-muted p-4">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                  ✓
                </span>
                <div>
                  <p className="font-medium text-foreground-primary">{expertProfile.csv_name}</p>
                  <p className="text-sm text-foreground-tertiary">{expertProfile.csv_affiliation}</p>
                </div>
              </div>

              <div className="border-t border-border-secondary pt-3">
                <p className="text-xs uppercase tracking-wide text-accent font-bold">Expertise</p>
                <p className="mt-1 text-sm text-foreground-secondary">{expertProfile.csv_field}</p>
              </div>

              {expertProfile.csv_keywords && (
                <div className="border-t border-border-secondary pt-3">
                  <p className="text-xs uppercase tracking-wide text-accent font-bold">Keywords</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {expertProfile.csv_keywords.split(',').map((keyword, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent"
                      >
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSkipExpert}
                className="flex-1 rounded-lg border border-border-secondary px-4 py-2.5 text-sm font-bold text-foreground-primary hover:bg-surface-muted focus:outline-none focus:ring-4 focus:ring-accent/20"
              >
                Skip for now
              </button>
              <button
                onClick={handleClaimExpert}
                disabled={claimingExpert}
                className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-foreground-inverse hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {claimingExpert ? 'Claiming...' : 'Claim profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
