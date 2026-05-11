'use client';

import { useState, FormEvent } from 'react';
import { authApi } from '@/lib/api/auth';
import { appConfig } from '@/config';

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setError('请输入访问密码');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(password);
      if (res.success) {
        sessionStorage.setItem(appConfig.tokenStorageKey, res.token);
        onSuccess();
      } else {
        setError('登录失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '40px 32px 32px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        border: '1px solid #f0f2f5',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, minWidth: 56, minHeight: 56, maxWidth: 56, maxHeight: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          textAlign: 'center',
          fontSize: 22,
          fontWeight: 700,
          color: '#172033',
          margin: '0 0 4px',
          letterSpacing: '-0.3px',
        }}>
          {appConfig.appName}
        </h1>
        <p style={{
          textAlign: 'center',
          fontSize: 14,
          color: '#8b95a5',
          margin: '0 0 32px',
        }}>
          请输入访问密码继续
        </p>

        <form onSubmit={handleSubmit}>
          {/* Password input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: '#6b7280',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              访问密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="请输入密码"
              disabled={loading}
              autoFocus
              style={{
                width: '100%',
                height: 46,
                padding: '0 16px',
                fontSize: 14,
                border: '1px solid #e0e4eb',
                borderRadius: 12,
                background: '#f9fafb',
                color: '#172033',
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxSizing: 'border-box',
                ...(loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e0e4eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 16,
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 12,
              fontSize: 13,
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: 46,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: loading ? '#93c5fd' : '#2563eb',
              border: 'none',
              borderRadius: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.15s',
              boxShadow: '0 1px 3px rgba(37,99,235,0.2)',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#1d4ed8'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#2563eb'; }}
          >
            {loading && (
              <svg width={16} height={16} viewBox="0 0 24 24" style={{ animation: 'spin 0.6s linear infinite' }}>
                <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} fill="none" opacity={0.25} />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity={0.75} />
              </svg>
            )}
            {loading ? '验证中...' : '登 录'}
          </button>
        </form>
      </div>
    </div>
  );
}
