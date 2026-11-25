import { useState, useEffect } from 'react';
import SubscriptionLanding from './SubscriptionLanding';
import SubscriptionProfile from './SubscriptionProfile';
import { Loader2 } from 'lucide-react';
import { useIsHighContrast } from '@/hooks/useTheme';

export default function SubscriptionPage() {
  const isHC = useIsHighContrast();
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsSubscribed(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/subscription/my-subs`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const json = await res.json();
          const subs = json.data;
          let daysLeft = 0;
          if (subs?.end_date) {
            const end = new Date(subs.end_date).getTime();
            const now = new Date().getTime();
            daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
          } else if (subs?.days_left !== undefined) {
            daysLeft = Number(subs.days_left);
          }

          const isActive = subs && (
            (subs.status === 'Active' && daysLeft > 0) ||
            subs.status === 'Pending'
          );

          if (isActive) {
            setIsSubscribed(true);
          } else {
            // Bersihkan data lokal jika langganan sudah kedaluwarsa/tidak aktif
            localStorage.removeItem('subscriptionStatus');
            localStorage.removeItem('activePlanLabel');
            localStorage.removeItem('activePlanPeriod');
            setIsSubscribed(false);
          }
        } else {
          localStorage.removeItem('subscriptionStatus');
          setIsSubscribed(false);
        }
      } catch (err) {
        console.error("Error checking subscription status:", err);
        setIsSubscribed(false);
      }
    };

    checkSubscriptionStatus();
  }, []);

  if (isSubscribed === null) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isHC ? 'bg-black text-[#ffff00]' : 'bg-background text-muted-foreground'}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={`h-8 w-8 animate-spin ${isHC ? 'text-[#ffff00]' : 'text-primary'}`} />
          <p className="font-medium">Memuat data langganan...</p>
        </div>
      </div>
    );
  }

  if (isSubscribed) {
    return <SubscriptionProfile />;
  }
  return <SubscriptionLanding />;
}