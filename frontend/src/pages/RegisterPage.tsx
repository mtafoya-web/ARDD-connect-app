import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, UserPlus } from 'lucide-react';
import { ArddLogo } from '../components/ArddLogo';

const fieldClass =
  'w-full rounded-lg border border-border-secondary bg-surface-muted px-4 py-3 text-foreground-primary outline-none placeholder:text-foreground-tertiary focus:border-border-focus focus:bg-surface focus:ring-4 focus:ring-accent/15';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = formData.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Enter a real email address you can access.');
        return;
      }

      await register({
        ...formData,
        email,
        phone_number: formData.phone_number.trim() || undefined,
      });
      await login({
        username: formData.username,
        password: formData.password,
      });
      navigate('/feed');
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
    </main>
  );
};
