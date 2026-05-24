import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Home,
  LogOut,
  Users,
  Calendar,
  Megaphone,
  ShieldCheck,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { ArddLogo } from './ArddLogo';
import { ThemeToggle } from './ui/ThemeToggle';
import { useEffect, useState } from 'react';
import { getUnreadNotificationCount } from '../services/notificationsService';

export const Navbar = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!token || !user) {
      setUnreadNotifications(0);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const count = await getUnreadNotificationCount();
        if (active) setUnreadNotifications(count);
      } catch {
        if (active) setUnreadNotifications(0);
      }
    };
    load();
    const id = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [token, user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? 'bg-accent text-foreground-inverse'
        : 'text-foreground-secondary hover:bg-surface-muted hover:text-foreground-primary'
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-border-secondary bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="shrink-0 text-foreground-primary">
          <ArddLogo compact />
        </Link>

        <div className="flex flex-1 justify-center gap-1 md:gap-2">
          {token && user && (
            <NavLink to="/feed" className={navClass}>
              <Home size={18} />
              <span className="hidden lg:inline">Feed</span>
            </NavLink>
          )}
          <NavLink to="/events" className={navClass}>
            <Calendar size={18} />
            <span className="hidden lg:inline">Schedule</span>
          </NavLink>
          {token && user && (
            <NavLink to="/people" className={navClass}>
              <Sparkles size={18} />
              <span className="hidden lg:inline">Matches</span>
            </NavLink>
          )}
          <NavLink to="/announcements" className={navClass}>
            <Megaphone size={18} />
            <span className="hidden lg:inline">Updates</span>
          </NavLink>
          {token && user && (
            <NavLink to="/messages" className={navClass}>
              <MessageSquare size={18} />
              <span className="hidden lg:inline">Intros</span>
            </NavLink>
          )}
          {token && user && (
            <NavLink to="/notifications" className={navClass}>
              <span className="relative inline-flex">
                <Bell size={18} />
                {unreadNotifications > 0 && (
                  <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-status-error px-1 text-[10px] font-black leading-4 text-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </span>
              <span className="hidden lg:inline">Alerts</span>
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {token && user ? (
            <>
              {user.is_superuser && (
                <NavLink to="/admin" className={navClass}>
                  <ShieldCheck size={18} className="text-accent-secondary" />
                  <span className="hidden sm:inline">Admin</span>
                </NavLink>
              )}

              <NavLink
                to={`/profile/${user.id}`}
                className="hidden items-center gap-2 transition hover:opacity-80 sm:flex"
              >
                <Avatar
                  name={user.full_name}
                  username={user.username}
                  url={user.profile_photo_url}
                  size="sm"
                />
                <span className="hidden text-sm font-bold text-foreground-primary md:inline">
                  {user.full_name}
                </span>
              </NavLink>

              <button
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border-secondary bg-surface text-foreground-secondary transition hover:border-status-error/40 hover:text-status-error focus:outline-none focus:ring-4 focus:ring-status-error/15"
                aria-label="Log out"
                type="button"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md px-3 py-2 text-sm font-semibold text-foreground-secondary hover:bg-surface-muted hover:text-foreground-primary"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="hidden rounded-md bg-accent px-4 py-2 text-sm font-semibold text-foreground-inverse hover:bg-accent-hover sm:inline-flex"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
