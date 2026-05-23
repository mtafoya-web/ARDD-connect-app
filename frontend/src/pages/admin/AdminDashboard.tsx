import { Link } from 'react-router-dom';
import { Calendar, FileText, Users, Image as ImageIcon } from 'lucide-react';

const AdminDashboard = () => {
  const stats = [
    { label: 'Events', icon: Calendar, path: '/admin/events', count: 'Manage' },
    { label: 'Posts', icon: FileText, path: '/admin/posts', count: 'Manage' },
    { label: 'Users', icon: Users, path: '/people', count: 'View' },
    { label: 'Media', icon: ImageIcon, path: '#', count: 'System' },
  ];

  return (
    <main className="min-h-screen bg-canvas pt-20 pb-12">
      <div className="mx-auto max-w-page px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground-primary">Admin Dashboard</h1>
          <p className="text-foreground-tertiary">Welcome back, ARRD. Manage your platform here.</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="group rounded-2xl border border-border-secondary bg-surface p-6 shadow-sm transition-all hover:border-accent/20 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/[0.04] text-accent group-hover:bg-accent/[0.08]">
                <item.icon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-foreground-primary">{item.label}</h3>
              <p className="text-sm font-medium text-accent">{item.count}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
