'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { appConfig } from '@/config';
import Header from './Header';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem(appConfig.tokenStorageKey);
    if (token) {
      setAuthenticated(true);
    } else {
      router.replace('/');
    }
    setChecking(false);
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem(appConfig.tokenStorageKey);
    setAuthenticated(false);
    router.replace('/');
  }

  if (checking || !authenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8fb' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #2563eb', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb' }}>
      <Header onLogout={handleLogout} />
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 16px' }}>
        {children}
      </main>
    </div>
  );
}
