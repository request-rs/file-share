'use client';

import { useState } from 'react';
import { ShareLinkItem } from '@/types/file';
import { formatDate } from '@/utils/format';
import { sharesApi } from '@/lib/api/shares';
import { copyToClipboard } from '@/utils/clipboard';

interface ShareLinkListProps {
  shares: ShareLinkItem[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

export default function ShareLinkList({ shares, loading, onRefresh, onDelete }: ShareLinkListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(share: ShareLinkItem) {
    try {
      await copyToClipboard(`${window.location.origin}${share.url}`);
      setCopiedId(share.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await sharesApi.deleteShareLink(id);
      onDelete(id);
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 18,
    border: '1px solid #f0f2f5',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '12px 20px',
    borderBottom: '1px solid #f0f2f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>分享链接列表</h2>
        <button
          onClick={onRefresh}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', fontSize: 12, color: '#9ca3af',
            background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.background = '#f3f4f6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #2563eb', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
        </div>
      ) : shares.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px' }}>
          <div style={{
            width: 48, height: 48, minWidth: 48, minHeight: 48, maxWidth: 48, maxHeight: 48,
            borderRadius: 16, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.2} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>暂无分享链接</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f2f5', height: 40 }}>
                <th style={{ padding: '0 12px 0 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>分享链接</th>
                <th style={{ padding: '0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>文件数</th>
                <th style={{ padding: '0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'none' }} className="table-cell-lg">创建时间</th>
                <th style={{ padding: '0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'none' }} className="table-cell-lg">到期时间</th>
                <th style={{ padding: '0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>状态</th>
                <th style={{ padding: '0 20px 0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((share) => (
                <tr key={share.id} style={{ height: 52, borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0 12px 0 20px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 24, height: 24, minWidth: 24, maxWidth: 24, minHeight: 24, maxHeight: 24,
                        borderRadius: 6, background: share.status === 'expired' ? '#f3f4f6' : '#eff6ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={share.status === 'expired' ? '#d1d5db' : '#2563eb'} strokeWidth={2} style={{ flexShrink: 0 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#172033', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                        {share.title || `/share/${share.token}`}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0 12px', verticalAlign: 'middle' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{share.fileCount} 个</span>
                  </td>
                  <td style={{ padding: '0 12px', verticalAlign: 'middle', display: 'none' }} className="table-cell-lg">
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{formatDate(share.createdAt)}</span>
                  </td>
                  <td style={{ padding: '0 12px', verticalAlign: 'middle', display: 'none' }} className="table-cell-lg">
                    <span style={{ fontSize: 13, color: share.status === 'expired' ? '#ef4444' : '#6b7280' }}>
                      {share.expiresAt ? formatDate(share.expiresAt) : '永久有效'}
                    </span>
                  </td>
                  <td style={{ padding: '0 12px', verticalAlign: 'middle' }}>
                    <span style={{
                      display: 'inline-flex', padding: '2px 10px', fontSize: 11, fontWeight: 600, borderRadius: 20,
                      background: share.status === 'expired' ? '#fef2f2' : '#ecfdf5',
                      color: share.status === 'expired' ? '#dc2626' : '#059669',
                    }}>
                      {share.status === 'expired' ? '已过期' : '有效'}
                    </span>
                  </td>
                  <td style={{ padding: '0 20px 0 12px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => handleCopy(share)}
                        style={{
                          padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 8,
                          border: '1px solid #d1d5db', cursor: 'pointer',
                          background: copiedId === share.id ? '#ecfdf5' : 'transparent',
                          color: copiedId === share.id ? '#059669' : '#6b7280',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = copiedId === share.id ? '#059669' : '#6b7280'; }}
                      >
                        {copiedId === share.id ? '已复制' : '复制链接'}
                      </button>
                      <button
                        onClick={() => handleDelete(share.id)}
                        disabled={deletingId === share.id}
                        style={{
                          padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 8,
                          border: '1px solid #fca5a5', cursor: deletingId === share.id ? 'not-allowed' : 'pointer',
                          background: 'transparent', color: '#ef4444',
                          opacity: deletingId === share.id ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => { if (deletingId !== share.id) e.currentTarget.style.background = '#fef2f2'; }}
                        onMouseLeave={(e) => { if (deletingId !== share.id) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {deletingId === share.id ? '删除中' : '删除'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
