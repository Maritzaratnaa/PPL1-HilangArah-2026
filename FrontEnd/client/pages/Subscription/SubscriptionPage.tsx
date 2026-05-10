import { useState, useEffect } from 'react';
import SubscriptionLanding from './SubscriptionLanding';
import SubscriptionProfile from './SubscriptionProfile';

export default function SubscriptionPage() {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSubscriptionStatus = () => {
      const status = localStorage.getItem('subscriptionStatus');
      setIsSubscribed(status === 'active');
    };

    checkSubscriptionStatus();
  }, []);

  if (isSubscribed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Memuat data...</p>
      </div>
    );
  }

  if (isSubscribed) {
    return <SubscriptionProfile />;
  }
  return <SubscriptionLanding />;
}