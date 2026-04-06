import { useState, useEffect } from 'react';

export function useIsHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsHighContrast(document.documentElement.classList.contains('high-contrast'));
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isHighContrast;
}