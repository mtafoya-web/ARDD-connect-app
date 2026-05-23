import { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { ArrowLeft, KeyRound, Send } from 'lucide-react';
import { ArddLogo } from '../components/ArddLogo';

const fieldClass =
  'w-full rounded-lg border border-border-secondary bg-surface-muted px-4 py-3 text-foreground-primary outline-none placeholder:text-foreground-tertiary focus:border-border-focus focus:bg-surface focus:ring-4 focus:ring-accent/15';

export const ResetPasswordPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await client.post('/auth/password-reset/request', { identifier });
      setMessage(response.data.message);
      if (response.data.reset_token) {
        setToken(response.data.reset_token);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not authorize that email or phone number.');
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await client.post('/auth/password-reset/confirm', { token, password });
      setMessage(response.data.message);
      setPassword('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Password reset failed.');
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
            <p className="text-sm font-bold uppercase tracking-wide text-accent">Password recovery</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground-primary">Reset your password</h1>
            <p className="mt-3 leading-relaxed text-foreground-secondary">
              Enter the email or phone number attached to your ARDD Connect account.
            </p>

            {error && (
              <div className="mt-6 rounded-lg border border-status-error/25 bg-status-error/10 px-4 py-3 text-sm font-medium text-status-error">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-6 rounded-lg border border-status-success/25 bg-status-success/10 px-4 py-3 text-sm font-medium text-status-success">
                {message}
              </div>
            )}

            <form onSubmit={requestReset} className="mt-8 space-y-5">
              <div>
                <label htmlFor="identifier" className="mb-2 block text-sm font-bold text-foreground-primary">
                  Email or phone number
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                  autoComplete="username"
                  className={fieldClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-foreground-inverse shadow-sm hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={18} />
                {loading ? 'Checking...' : 'Authorize reset'}
              </button>
            </form>

            <form onSubmit={confirmReset} className="mt-8 space-y-5 border-t border-border-secondary pt-6">
              <div>
                <label htmlFor="token" className="mb-2 block text-sm font-bold text-foreground-primary">
                  Reset token
                </label>
                <input
                  id="token"
                  name="token"
                  type="text"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  required
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-bold text-foreground-primary">
                  New password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  className={fieldClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border-primary bg-surface px-5 py-3 text-sm font-bold text-foreground-primary shadow-sm hover:border-accent/40 hover:bg-accent/5 focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyRound size={18} />
                {loading ? 'Resetting...' : 'Set new password'}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-foreground-secondary">
              <Link to="/login" className="inline-flex items-center gap-1 font-bold text-accent hover:text-accent-hover">
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};
