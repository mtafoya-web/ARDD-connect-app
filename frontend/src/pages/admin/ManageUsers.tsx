import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Shield, User as UserIcon, Tag, Check, X, ShieldAlert } from 'lucide-react';
import client from '../../api/client';
import { User } from '../../types';
import { Avatar } from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';

const ManageUsers = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await client.get<User[]>('/users/', {
        params: { q: search }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const updateUserRole = async (userId: number, role: string, isSuperuser: boolean = false) => {
    try {
      setUpdating(userId);
      await client.put(`/users/${userId}/admin`, {
        role,
        is_superuser: isSuperuser
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user.');
    } finally {
      setUpdating(null);
    }
  };

  const toggleAnnouncementPermission = async (userId: number, currentMeta: any) => {
    try {
      setUpdating(userId);
      const newMeta = {
        ...(currentMeta || {}),
        can_post_announcements: !(currentMeta?.can_post_announcements)
      };
      await client.put(`/users/${userId}/admin`, {
        ardd_meta: newMeta
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <main className="min-h-screen bg-canvas pt-20 pb-12">
      <div className="mx-auto max-w-6xl px-4">
        <button
          onClick={() => navigate('/admin')}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-foreground-tertiary transition-colors hover:text-foreground-primary"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground-primary">Manage Users</h1>
            <p className="text-foreground-tertiary">Assign roles and permissions to conference attendees.</p>
          </div>
          
          <form onSubmit={handleSearch} className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-tertiary" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or affiliation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border-secondary bg-surface pl-11 pr-4 py-2.5 outline-none transition-all focus:border-accent focus:ring-4 focus:ring-accent/5"
            />
          </form>
        </header>

        <div className="rounded-2xl border border-border-secondary bg-surface shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-secondary bg-surface-muted/50 text-xs font-bold uppercase tracking-wider text-foreground-tertiary">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Current Role</th>
                  <th className="px-6 py-4">Expert Status</th>
                  <th className="px-6 py-4">Special Permissions</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border-secondary">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-foreground-tertiary">
                      Loading attendees...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-foreground-tertiary">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="group hover:bg-surface-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.full_name} username={u.username} url={u.profile_photo_url} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-foreground-primary">{u.full_name || u.username}</p>
                            <p className="truncate text-xs text-foreground-tertiary">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.is_superuser ? 'admin' : u.role || 'user'}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateUserRole(u.id, val === 'admin' ? 'admin' : val, val === 'admin');
                          }}
                          disabled={updating === u.id || u.id === currentUser?.id}
                          className="rounded-lg border border-border-secondary bg-surface px-2 py-1 text-sm font-semibold outline-none focus:border-accent"
                        >
                          <option value="user">User</option>
                          <option value="expert">Expert</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {u.is_expert ? (
                          <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
                            Expert
                          </span>
                        ) : (
                          <span className="text-xs text-foreground-tertiary italic">Regular Attendee</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleAnnouncementPermission(u.id, u.ardd_meta)}
                          disabled={updating === u.id}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                            u.ardd_meta?.can_post_announcements
                              ? "bg-status-success/10 text-status-success"
                              : "bg-surface-muted text-foreground-tertiary hover:bg-surface-muted/80"
                          }`}
                        >
                          {u.ardd_meta?.can_post_announcements ? (
                            <><Check size={12} /> Can Post Announcements</>
                          ) : (
                            <><X size={12} /> No Official Posting</>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          {u.role !== 'admin' && !u.is_superuser && (
                            <button
                              onClick={() => updateUserRole(u.id, 'admin', true)}
                              className="rounded-lg border border-border-secondary p-2 text-foreground-tertiary hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
                              title="Make Admin"
                            >
                              <ShieldAlert size={16} />
                            </button>
                          )}
                          {u.role === 'admin' && u.is_superuser && (
                            <button
                              onClick={() => updateUserRole(u.id, 'user', false)}
                              className="rounded-lg border border-border-secondary p-2 text-foreground-tertiary hover:border-status-error/30 hover:bg-status-error/5 hover:text-status-error"
                              title="Revoke Admin"
                            >
                              <Shield size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/profile/${u.id}`)}
                            className="rounded-lg border border-border-secondary p-2 text-foreground-tertiary hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
                            title="View Profile"
                          >
                            <UserIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ManageUsers;
