'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PublicShareInfo, PublicShareFile } from '@/types/file';
import { formatDate, formatFileSize } from '@/utils/format';

export default function SharePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [share, setShare] = useState<PublicShareInfo | null>(null);
  const [files, setFiles] = useState<PublicShareFile[]>([]);

  useEffect(() => {
    async function fetchShare() {
      try {
        const res = await fetch(`/api/public/shares/${shareId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('分享链接不存在或已被删除');
          } else if (res.status === 410) {
            setError('分享链接已过期');
          } else {
            setError('获取分享信息失败');
          }
          return;
        }
        const data = await res.json();
        setShare(data.share);
        setFiles(data.files);
      } catch {
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    }
    fetchShare();
  }, [shareId]);

  function handleDownload(fileId: string) {
    window.location.href = `/api/public/shares/${shareId}/files/${fileId}/download`;
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8fb' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #2563eb', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  if (error || !share) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8fb', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f0f2f5' }}>
          <div style={{
            width: 48, height: 48, minWidth: 48, minHeight: 48, maxWidth: 48, maxHeight: 48,
            borderRadius: 16, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.5} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#172033', margin: '0 0 8px' }}>{error}</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>请联系分享者获取新的链接</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb' }}>
      <header style={{
        background: '#fff', borderBottom: '1px solid #f0f2f5', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{
          maxWidth: 800, margin: '0 auto', padding: '0 16px', height: 56,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, minWidth: 32, minHeight: 32, maxWidth: 32, maxHeight: 32,
            borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 14, fontWeight: 700, color: '#172033', margin: 0, lineHeight: 1.3 }}>文件分享</h1>
            <p style={{ fontSize: 11, color: '#8b95a5', margin: 0, lineHeight: 1.3 }}>以下文件由分享链接提供，可直接下载</p>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{
          background: '#fff', borderRadius: 18, border: '1px solid #f0f2f5',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f2f5' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>
              分享文件 ({files.length})
            </h2>
            {share.expiresAt && (
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
                到期时间：{formatDate(share.expiresAt)}
              </p>
            )}
          </div>

          {files.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
              <div style={{
                width: 56, height: 56, minWidth: 56, minHeight: 56, maxWidth: 56, maxHeight: 56,
                borderRadius: 16, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.2} style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#9ca3af', margin: '0 0 4px' }}>暂无文件</p>
              <p style={{ fontSize: 13, color: '#c4c9d1', margin: 0 }}>分享中的文件已被删除或已过期</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0f2f5', height: 40 }}>
                    <th style={{ padding: '0 12px 0 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>文件名</th>
                    <th style={{ padding: '0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'none' }} className="table-cell-sm">大小</th>
                    <th style={{ padding: '0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'none' }} className="table-cell-lg">上传时间</th>
                    <th style={{ padding: '0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'none' }} className="table-cell-lg">到期时间</th>
                    <th style={{ padding: '0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>状态</th>
                    <th style={{ padding: '0 20px 0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const expired = file.status === 'expired';
                    return (
                      <tr key={file.id} style={{ height: 56, borderBottom: '1px solid #f3f4f6', background: expired ? '#fafbfc' : '#fff' }}>
                        <td style={{ padding: '0 12px 0 20px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <div style={{
                              width: 28, height: 28, minWidth: 28, minHeight: 28, maxWidth: 28, maxHeight: 28,
                              borderRadius: 8, background: expired ? '#f3f4f6' : '#eff6ff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={expired ? '#d1d5db' : '#3b82f6'} strokeWidth={2} style={{ flexShrink: 0 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: '#172033', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }} title={file.originalName}>
                                {file.originalName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0 12px', verticalAlign: 'middle', display: 'none' }} className="table-cell-sm">
                          <span style={{ fontSize: 13, color: '#6b7280' }}>{formatFileSize(file.size)}</span>
                        </td>
                        <td style={{ padding: '0 12px', verticalAlign: 'middle', display: 'none' }} className="table-cell-lg">
                          <span style={{ fontSize: 13, color: '#6b7280' }}>{formatDate(file.uploadedAt)}</span>
                        </td>
                        <td style={{ padding: '0 12px', verticalAlign: 'middle', display: 'none' }} className="table-cell-lg">
                          <span style={{ fontSize: 13, color: expired ? '#ef4444' : '#6b7280' }}>
                            {file.expiresAt ? formatDate(file.expiresAt) : '永久有效'}
                          </span>
                        </td>
                        <td style={{ padding: '0 12px', verticalAlign: 'middle' }}>
                          <span style={{
                            display: 'inline-flex', padding: '2px 10px', fontSize: 11, fontWeight: 600, borderRadius: 20,
                            background: expired ? '#fef2f2' : '#ecfdf5',
                            color: expired ? '#dc2626' : '#059669',
                          }}>
                            {expired ? '已过期' : '可下载'}
                          </span>
                        </td>
                        <td style={{ padding: '0 20px 0 12px', verticalAlign: 'middle' }}>
                          <button
                            onClick={() => handleDownload(file.id)}
                            disabled={expired}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '5px 14px', fontSize: 12, fontWeight: 600, borderRadius: 10,
                              border: 'none', cursor: expired ? 'not-allowed' : 'pointer',
                              background: expired ? '#f3f4f6' : '#2563eb',
                              color: expired ? '#d1d5db' : '#fff',
                            }}
                            onMouseEnter={(e) => { if (!expired) e.currentTarget.style.background = '#1d4ed8'; }}
                            onMouseLeave={(e) => { if (!expired) e.currentTarget.style.background = '#2563eb'; }}
                          >
                            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {expired ? '已过期' : '下载'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
