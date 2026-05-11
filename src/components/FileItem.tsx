'use client';

import { FileItem as FileItemType, DownloadProgress } from '@/types/file';
import { formatDate, formatFileSize } from '@/utils/format';
import { filesApi } from '@/lib/api/files';
import { useState } from 'react';

interface FileItemProps {
  file: FileItemType;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: (fileId: string) => void;
  onPin: (fileId: string, isPinned: boolean) => void;
}

export default function FileItem({ file, selected, onSelect, onDelete, onPin }: FileItemProps) {
  const expired = file.status === 'expired';
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [downloadError, setDownloadError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pinning, setPinning] = useState(false);

  async function handleDownload() {
    if (expired || downloading) return;
    setDownloading(true);
    setDownloadError('');
    try {
      const url = await filesApi.getNativeDownloadUrl(file.id);
      window.location.href = url;
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : '下载失败');
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopyDownloadLink() {
    try {
      const url = await filesApi.getNativeDownloadUrl(file.id);
      const fullUrl = `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setDownloadError('复制失败');
    }
  }

  async function handlePin() {
    setPinning(true);
    try {
      await filesApi.pinFile(file.id, !file.isPinned);
      onPin(file.id, !file.isPinned);
    } catch {
      // ignore
    } finally {
      setPinning(false);
    }
  }

  async function handleDeleteConfirm() {
    setShowConfirm(false);
    setDeleting(true);
    setDeleteError('');
    try {
      await filesApi.deleteFile(file.id);
      onDelete(file.id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '删除失败');
      setDeleting(false);
    }
  }

  const rowStyle: React.CSSProperties = {
    height: 56,
    borderBottom: '1px solid #f3f4f6',
    background: expired ? '#fafbfc' : '#fff',
  };

  return (
    <>
      <tr style={rowStyle}>
        <td style={{ padding: '0 4px 0 20px', verticalAlign: 'middle', width: 36 }}>
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563eb' }}
          />
        </td>
        <td style={{ padding: '0 12px 0 4px', verticalAlign: 'middle' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 28, height: 28, minWidth: 28, minHeight: 28, maxWidth: 28, maxHeight: 28,
              borderRadius: 8,
              background: expired ? '#f3f4f6' : '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={expired ? '#d1d5db' : '#3b82f6'} strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#172033', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }} title={file.originalName}>
                {file.originalName}
              </div>
              {(deleteError || downloadError) && (
                <div style={{ fontSize: 11, color: '#ef4444' }}>{deleteError || downloadError}</div>
              )}
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
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 20,
            background: expired ? '#fef2f2' : '#ecfdf5',
            color: expired ? '#dc2626' : '#059669',
          }}>
            {expired ? '已过期' : '可下载'}
          </span>
        </td>
        <td style={{ padding: '0 20px 0 12px', verticalAlign: 'middle' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={handleDownload}
              disabled={expired || downloading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 10px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 10,
                border: 'none',
                cursor: expired || downloading ? 'not-allowed' : 'pointer',
                background: expired ? '#f3f4f6' : '#2563eb',
                color: expired ? '#d1d5db' : '#fff',
              }}
              onMouseEnter={(e) => { if (!expired && !downloading) e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={(e) => { if (!expired && !downloading) e.currentTarget.style.background = '#2563eb'; }}
            >
              {downloading ? (
                <svg width={12} height={12} viewBox="0 0 24 24" style={{ animation: 'spin 0.6s linear infinite', flexShrink: 0 }}>
                  <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} fill="none" opacity={0.25} />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity={0.75} />
                </svg>
              ) : (
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {expired ? '不可用' : '下载'}
            </button>

            <button
              onClick={handleCopyDownloadLink}
              disabled={expired}
              title={copied ? '已复制' : '复制下载链接'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 10px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 10,
                border: '1px solid #d1d5db',
                cursor: expired ? 'not-allowed' : 'pointer',
                background: copied ? '#ecfdf5' : 'transparent',
                color: expired ? '#d1d5db' : copied ? '#059669' : '#6b7280',
              }}
              onMouseEnter={(e) => { if (!expired) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; } }}
              onMouseLeave={(e) => { if (!expired) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = copied ? '#059669' : '#6b7280'; } }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                {copied ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </>
                )}
              </svg>
            </button>

            <button
              onClick={handlePin}
              disabled={pinning}
              title={file.isPinned ? '取消置顶' : '置顶'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 10,
                border: '1px solid #d1d5db',
                cursor: pinning ? 'not-allowed' : 'pointer',
                background: file.isPinned ? '#eff6ff' : 'transparent',
                color: file.isPinned ? '#2563eb' : '#6b7280',
              }}
              onMouseEnter={(e) => { if (!pinning) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; } }}
              onMouseLeave={(e) => { if (!pinning) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = file.isPinned ? '#2563eb' : '#6b7280'; } }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill={file.isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v16l7-5 7 5V3H5z" />
              </svg>
            </button>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={deleting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 10,
                border: '1px solid #fca5a5',
                cursor: deleting ? 'not-allowed' : 'pointer',
                background: deleting ? '#fef2f2' : 'transparent',
                color: deleting ? '#fca5a5' : '#ef4444',
                opacity: deleting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => { if (!deleting) { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#ef4444'; } }}
              onMouseLeave={(e) => { if (!deleting) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#fca5a5'; } }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '24px 28px',
              maxWidth: 400,
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, minWidth: 36, maxWidth: 36, minHeight: 36, maxHeight: 36,
                borderRadius: 12, background: '#fef2f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#172033' }}>确认删除</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>此操作不可撤销</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#4b5563', margin: '0 0 20px', wordBreak: 'break-all' }}>
              确定要删除文件 <strong style={{ color: '#172033' }}>{file.originalName}</strong> 吗？
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#6b7280',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444'; }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
