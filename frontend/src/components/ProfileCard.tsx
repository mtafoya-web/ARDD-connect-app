import { User } from '../types';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Briefcase, MapPin } from 'lucide-react';
import { Avatar } from './Avatar';

interface ProfileCardProps {
  user: User;
}

export const ProfileCard = ({ user }: ProfileCardProps) => {
  return (
    <Link to={`/profile/${user.id}`} className="group block h-full">
      <article className="flex h-full flex-col rounded-lg border border-border-secondary bg-surface p-5 shadow-sm hover:border-border-primary hover:shadow-md">
        <div className="flex items-start gap-3">
          <Avatar name={user.full_name} username={user.username} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-foreground-primary">{user.full_name || user.username}</h3>
          </div>
          <ArrowUpRight size={18} className="text-foreground-tertiary group-hover:text-accent" />
        </div>

        {user.bio && <p className="mt-4 text-sm leading-6 text-foreground-secondary">{user.bio}</p>}

        <div className="mt-4 flex-1 space-y-2 text-sm text-foreground-secondary">
          {user.affiliation && (
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-foreground-tertiary" />
              <span className="truncate">{user.affiliation}</span>
            </div>
          )}
          {user.area_of_study && (
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-accent-secondary" />
              <span className="truncate">{user.area_of_study}</span>
            </div>
          )}
          {user.location && (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-accent" />
              <span className="truncate">{user.location}</span>
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-border-secondary pt-4">
          <p className="inline-flex items-center gap-2 text-sm font-bold text-foreground-primary group-hover:text-accent">
            View profile
            <ArrowUpRight size={15} />
          </p>
        </div>
      </article>
    </Link>
  );
};
