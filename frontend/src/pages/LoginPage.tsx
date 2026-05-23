import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clearStoredAuth } from '../api/client';
import { ArrowRight, LogIn, Sparkles } from 'lucide-react';
import { ArddLogo } from '../components/ArddLogo';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, string | number | boolean>) => void;
        };
      };
    };
  }
}

const DEMO_USERS: { label: string; username: string; subtitle: string }[] = [
  { label: 'Dr. Maya Chen', username: 'maya_chen', subtitle: 'Stanford · computational aging' },
  { label: 'Alex Vargas', username: 'alex_vargas', subtitle: 'ReprogramBio · seed founder' },
  { label: 'Sam Okafor', username: 'sam_okafor', subtitle: 'Long Run Capital · VC' },
];
const DEMO_PASSWORD = 'ARDD-demo-2026!';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const fieldClass =
  'w-full rounded-lg border border-border-secondary bg-surface-muted px-4 py-3 text-foreground-primary outline-none placeholder:text-foreground-tertiary focus:border-border-focus focus:bg-surface focus:ring-4 focus:ring-accent/15';

export const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          if (!credential) return;
          setError('');
          setLoading(true);
          try {
            await googleLogin(credential);
            navigate('/feed');
          } catch (err: any) {
            setError(err.response?.data?.detail || 'Google login failed');
          } finally {
            setLoading(false);
          }
        },
      });

      googleButtonRef.current.innerHTML = '';
      const width = Math.min(320, googleButtonRef.current.offsetWidth || 320);
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width,
        text: 'continue_with',
        shape: 'rectangular',
      });
    };

    if (window.google) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setError('Google sign-in could not be loaded.');
    document.head.appendChild(script);
  }, [googleLogin, navigate]);

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
      await login(formData);
      navigate('/feed');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (username: string) => {
    setError('');
    setLoading(true);
    try {
      clearStoredAuth();
      await login({ username, password: DEMO_PASSWORD });
      navigate('/people');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Demo login failed — make sure the seed has been run.');
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
            <p className="text-sm font-bold uppercase tracking-wide text-accent">Welcome back</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground-primary">
              Sign in to ARDD Connect
            </h1>
            <p className="mt-3 leading-relaxed text-foreground-secondary">
              Your personalized companion for ARDD 2026 and Boston Longevity Week.
            </p>

            <section className="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent">
                <Sparkles size={13} /> Judges · enter as a seeded demo attendee
              </p>
              <div className="space-y-2">
                {DEMO_USERS.map((d) => (
                  <button
                    key={d.username}
                    type="button"
                    onClick={() => handleDemoLogin(d.username)}
                    disabled={loading}
                    className="flex w-full items-center justify-between rounded-md border border-border-secondary bg-surface px-3 py-2 text-left transition hover:border-accent/40 hover:bg-accent/5 disabled:opacity-50"
                  >
                    <span>
                      <span className="block text-sm font-bold text-foreground-primary">{d.label}</span>
                      <span className="text-xs text-foreground-secondary">{d.subtitle}</span>
                    </span>
                    <ArrowRight size={14} className="text-accent" />
                  </button>
                ))}
              </div>
            </section>

            {error && (
              <div className="mt-6 rounded-lg border border-status-error/25 bg-status-error/10 px-4 py-3 text-sm font-medium text-status-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-bold text-foreground-primary">
                  Username or email
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
                  autoComplete="current-password"
                  className={fieldClass}
                />
              </div>

              <div className="-mt-2 text-right">
                <Link to="/reset-password" className="text-sm font-bold text-accent hover:text-accent-hover">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-foreground-inverse shadow-sm hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogIn size={18} />
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-foreground-tertiary">
              <span className="h-px flex-1 bg-border-secondary" />
              or
              <span className="h-px flex-1 bg-border-secondary" />
            </div>

            {GOOGLE_CLIENT_ID ? (
              <div className="flex justify-center" ref={googleButtonRef} />
            ) : (
              <div className="rounded-lg border border-border-secondary bg-surface-muted px-4 py-3 text-center text-sm text-foreground-secondary">
                Google login needs VITE_GOOGLE_CLIENT_ID in the frontend env and GOOGLE_CLIENT_ID in the backend env.
              </div>
            )}

            <p className="mt-7 text-center text-sm text-foreground-secondary">
              New here?{' '}
              <Link to="/register" className="inline-flex items-center gap-1 font-bold text-accent hover:text-accent-hover">
                Join the community
                <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};
