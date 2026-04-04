import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function RouteSearch() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="rounded-lg border border-border bg-card p-8 text-center high-contrast:border-4">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Route Search & Map</h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              This page is a placeholder. Continue prompting to customize it with an interactive map, route recommendations, and more.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/">
                <Button className="high-contrast:border-2 high-contrast:border-primary">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}