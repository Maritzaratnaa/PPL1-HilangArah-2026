import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('isLoggedIn', 'true');
    navigate('/home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg border border-border p-8 high-contrast:border-4 high-contrast:p-6">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground mb-8">
              Sign in to your ARAHIN account
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-base high-contrast:border-2 high-contrast:border-primary"
                  aria-required="true"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-semibold">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 text-base pr-12 high-contrast:border-2 high-contrast:border-primary"
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-10 w-10 flex items-center justify-center high-contrast:border high-contrast:border-primary"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to="#"
                  className="text-base font-semibold text-primary hover:underline underline-offset-2 high-contrast:border high-contrast:border-primary high-contrast:px-2 high-contrast:py-1"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-base font-semibold high-contrast:border-2 high-contrast:border-primary"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-primary font-semibold hover:underline underline-offset-2"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}