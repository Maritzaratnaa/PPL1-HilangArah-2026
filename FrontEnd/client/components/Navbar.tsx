import { Link } from 'react-router-dom';
import { Search, User, BarChart3, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from './ThemeToggle';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
    const navigate = useNavigate();

    const handleProfileClick = () => {
      const token = localStorage.getItem('isLoggedIn');
      if (!token) {
        navigate('/login');
      } else {
        navigate('/profile');
      }
    };
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 high-contrast:border-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 md:gap-8">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity flex-shrink-0 high-contrast:border high-contrast:border-primary high-contrast:px-2 high-contrast:py-1"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              A
            </div>
            <span className="hidden sm:inline">ARAHIN</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search routes, guides..."
                className="pl-10 h-10 high-contrast:border-2 high-contrast:border-primary high-contrast:bg-input"
                aria-label="Search"
              />
            </div>
          </div>

          {/* Icon Group */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Profile */}
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 high-contrast:border-2 high-contrast:border-primary"
              aria-label="Profile"
              onClick={handleProfileClick}
            >
              <User className="h-5 w-5" />
            </Button>

            {/* Reports */}
            <Link to="/reporting">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 high-contrast:border-2 high-contrast:border-primary"
                aria-label="Reports"
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
            </Link>

            {/* Subscription */}
            <Link to="/subscription">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 high-contrast:border-2 high-contrast:border-primary"
                aria-label="Subscription"
              >
                <Zap className="h-5 w-5" />
              </Button>
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
