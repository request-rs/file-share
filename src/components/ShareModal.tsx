'use client';

import { useState, useMemo } from 'react';
import { FileItem as FileItemType } from '@/types/file';
import { formatFileSize, formatDate } from '@/utils/format';
import { sharesApi } from '@/lib/api/shares';
import { copyToClipboard } from '@/utils/clipboard';

interface ShareModalProps {
  files: FileItemType[];
  selectedIds: Set<string>;
  onClose: () => void;
  onSuccess: () => void;
}

type SortMode = 'name' | 'date' | 'size' | 'none';

export default function ShareModal({ files, selectedIds, onClose, onSuccess }: ShareModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('none');
  const [expiryType, setExpiryType] = useState('permanent');
  const [customExpiry, setCustomExpiry] = useState('');
  const [shareTitle, setShareTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ url: string; token: string } | null>(null);

  const filteredFiles = useMemo(() => {
    let list = files.filter((f) => f.status === 'active');
    if (search) {
      list = list.filter((f) => f.originalName.toLowerCase().includes(search.toLowerCase()));
    }
    if (sort === 'name') list.sort((a, b) => a.originalName.localeCompare(b.originalName));
    else if (sort === 'date') list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    else if (sort === 'size') list.sort((a, b) => b.size - a.size);
    return list;
  }, [files, search, sort]);

  const allSelected = filteredFiles.length > 0 && filteredFiles.every((f) => selected.has(f.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredFiles.map((f) => f.id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function getDefaultTitle(): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return `文件分享 ${dateStr} ${timeStr}`;
  }

  async function handleGenerate() {
    if (selected.size === 0) {
      setError('请至少选择一个文件');
      return;
    }

    setLoading(true);
    setError('');

    let expiresAt: string | null = null;
    if (expiryType === '1d') {
      expiresAt = new Date(Date.now() + 86400000).toISOString();
    } else if (expiryType === '7d') {
      expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    } else if (expiryType === '30d') {
      expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    } else if (expiryType === 'custom' && customExpiry) {
      expiresAt = new Date(customExpiry).toISOString();
    }

    const title = shareTitle.trim() || getDefaultTitle();

    try {
      const res = await sharesApi.createShareLink({
        fileIds: Array.from(selected),
        expiresAt,
        title,
      });
      setResult({ url: `${window.location.origin}${res.share.url}`, token: res.share.token });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成分享链接失败');
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    try {
      await copyToClipboard(result.url);
      alert('分享链接已复制');
    } catch {
      alert('复制失败，请手动复制链接');
    }
  }

  if (result) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: '#fff', borderRadius: 16, padding: '32px',
            maxWidth: 480, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 40, height: 40, minWidth: 40, maxWidth: 40, minHeight: 40, maxHeight: 40,
              borderRadius: 12, background: '#ecfdf5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#172033' }}>分享链接已生成</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>包含 {selected.size} 个文件</div>
            </div>
          </div>
          <div style={{
            background: '#f9fafb', borderRadius: 12, padding: '12px 16px',
            border: '1px solid #e5e7eb', wordBreak: 'break-all', fontSize: 13, color: '#374151',
            marginBottom: 16,
          }}>
            {result.url}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={copyLink} style={{ flex: 1, padding: '10px 20px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: 12, cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; }}>
              复制分享链接
            </button>
            <button onClick={onClose} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 12, cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}>
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, padding: '24px 28px',
          maxWidth: 640, width: '90%', maxHeight: '85vh',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#172033', margin: 0 }}>生成分享链接</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={shareTitle}
            onChange={(e) => setShareTitle(e.target.value)}
            placeholder="可选，默认使用自动名称"
            style={{
              width: '100%', height: 36, padding: '0 12px', fontSize: 13,
              border: '1px solid #e0e4eb', borderRadius: 10, background: '#f9fafb',
              color: '#172033', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索文件名..."
            style={{
              flex: 1, height: 36, padding: '0 12px', fontSize: 13,
              border: '1px solid #e0e4eb', borderRadius: 10, background: '#f9fafb',
              color: '#172033',
            }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            style={{ height: 36, padding: '0 8px', fontSize: 13, border: '1px solid #e0e4eb', borderRadius: 10, background: '#f9fafb', color: '#374151', cursor: 'pointer' }}
          >
            <option value="none">默认排序</option>
            <option value="name">文件名</option>
            <option value="date">上传时间</option>
            <option value="size">文件大小</option>
          </select>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
            全选
          </label>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>已选 {selected.size} 个文件</span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', maxHeight: 220, marginBottom: 16, border: '1px solid #f0f2f5', borderRadius: 12 }}>
          {filteredFiles.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>没有可分享的文件</div>
          ) : (
            filteredFiles.map((f) => (
              <div
                key={f.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: selected.has(f.id) ? '#eff6ff' : '#fff' }}
                onClick={() => toggleOne(f.id)}
              >
                <input type="checkbox" checked={selected.has(f.id)} readOnly style={{ width: 16, height: 16, accentColor: '#2563eb', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#172033', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.originalName}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatFileSize(f.size)} · {formatDate(f.uploadedAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>分享链接到期时间</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { value: 'permanent', label: '永久有效' },
              { value: '1d', label: '1 天' },
              { value: '7d', label: '7 天' },
              { value: '30d', label: '30 天' },
              { value: 'custom', label: '自定义' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setExpiryType(opt.value)}
                style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 10,
                  border: expiryType === opt.value ? '2px solid #2563eb' : '1px solid #e0e4eb',
                  background: expiryType === opt.value ? '#eff6ff' : '#fff',
                  color: expiryType === opt.value ? '#2563eb' : '#6b7280',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {expiryType === 'custom' && (
            <input
              type="datetime-local"
              value={customExpiry}
              onChange={(e) => setCustomExpiry(e.target.value)}
              style={{ marginTop: 8, width: '100%', height: 36, padding: '0 12px', fontSize: 13, border: '1px solid #e0e4eb', borderRadius: 10, background: '#f9fafb', color: '#172033' }}
            />
          )}
        </div>

        {error && (
          <div style={{ marginBottom: 12, padding: '8px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 13, color: '#dc2626' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || selected.size === 0}
          style={{
            width: '100%', height: 42, fontSize: 14, fontWeight: 600,
            color: '#fff', background: loading || selected.size === 0 ? '#93c5fd' : '#2563eb',
            border: 'none', borderRadius: 12, cursor: loading || selected.size === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={(e) => { if (!loading && selected.size > 0) e.currentTarget.style.background = '#1d4ed8'; }}
          onMouseLeave={(e) => { if (!loading && selected.size > 0) e.currentTarget.style.background = '#2563eb'; }}
        >
          {loading && (
            <svg width={16} height={16} viewBox="0 0 24 24" style={{ animation: 'spin 0.6s linear infinite' }}>
              <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} fill="none" opacity={0.25} />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity={0.75} />
            </svg>
          )}
          {loading ? '生成中...' : '生成分享链接'}
        </button>
      </div>
    </div>
  );
}
