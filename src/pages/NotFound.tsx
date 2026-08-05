import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { updateSEO } from '../lib/seo';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  useEffect(() => {
    updateSEO({
      title: 'Page Not Found — Apps Studio',
      description: 'The page you are looking for does not exist.',
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="font-display text-7xl font-extrabold text-accent/30">404</div>
      <h1 className="font-display mt-2 text-xl font-bold text-fg">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-mute">
        The page you are looking for doesn\'t exist or has been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-ink"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
        <Link
          to="/search"
          className="flex items-center gap-2 rounded-xl border border-line bg-panel px-5 py-2.5 text-sm font-bold text-fg"
        >
          <Search className="h-4 w-4" />
          Search
        </Link>
      </div>
    </div>
  );
}
