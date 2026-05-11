'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileItem as FileItemType } from '@/types/file';
import FileItem from './FileItem';

interface FileListProps {
  files: FileItemType[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onDelete: (fileId: string) => void;
  onPin: (fileId: string, isPinned: boolean) => void;
  selectedIds: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  filter: string;
  sort: string;
  search: string;
  onFilterChange: (v: string) => void;
  onSortChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onOpenShareModal: () => void;
}

function getStoredPageSize(): number {
  if (typeof window === 'undefined') return 10;
  try {
    const v = localStorage.getItem('fileListPageSize');
    const n = v ? parseInt(v, 10) : 10;
    return [10, 20, 50, 100].includes(n) ? n : 10;
  } catch {
    return 10;
  }
}

function storePageSize(n: number) {
  try {
    localStorage.setItem('fileListPageSize', String(n));
  } catch {
    // ignore
  }
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function FileList({
  files, loading, error, onRefresh, onDelete, onPin,
  selectedIds, onSelectionChange,
  filter, sort, search,
  onFilterChange, onSortChange, onSearchChange,
  onOpenShareModal,
}: FileListProps) {
  const [pageSize, setPageSize] = useState(getStoredPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  const totalCount = files.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedFiles = useMemo(
    () => files.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [files, currentPage, pageSize]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [files.length, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const allSelected = paginatedFiles.length > 0 && paginatedFiles.every((f) => selectedIds.has(f.id));
  const someSelected = paginatedFiles.some((f) => selectedIds.has(f.id));

  function toggleSelectAll() {
    const next = new Set(selectedIds);
    if (allSelected) {
      paginatedFiles.forEach((f) => next.delete(f.id));
    } else {
      paginatedFiles.forEach((f) => next.add(f.id));
    }
    onSelectionChange(next);
  }

  function handleSelect(fileId: string, checked: boolean) {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(fileId);
    } else {
      next.delete(fileId);
    }
    onSelectionChange(next);
  }

  function handlePageSizeChange(n: number) {
    setPageSize(n);
    storePageSize(n);
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
    flexWrap: 'wrap',
    gap: 8,
  };

  const emptyContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
  };

  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="搜索文件名..."
        style={{
          width: 152, height: 32, padding: '0 10px', fontSize: 12,
          border: '1px solid #e0e4eb', borderRadius: 8, background: '#f9fafb',
          color: '#172033',
        }}
      />
      <select
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        style={{
          height: 32, padding: '0 8px', fontSize: 12,
          border: '1px solid #e0e4eb', borderRadius: 8,
          background: '#f9fafb', color: '#374151', cursor: 'pointer',
        }}
      >
        <option value="">全部文件</option>
        <option value="active">有效文件</option>
        <option value="expired">已过期文件</option>
        <option value="permanent">永久有效</option>
        <option value="pinned">已置顶</option>
      </select>
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        style={{
          height: 32, padding: '0 8px', fontSize: 12,
          border: '1px solid #e0e4eb', borderRadius: 8,
          background: '#f9fafb', color: '#374151', cursor: 'pointer',
        }}
      >
        <option value="">默认排序</option>
        <option value="oldest">从旧到新</option>
        <option value="name">文件名</option>
        <option value="size">文件大小</option>
        <option value="expiry">到期时间</option>
      </select>
      <button
        onClick={onOpenShareModal}
        disabled={selectedIds.size === 0}
        style={{
          height: 32, padding: '0 14px', fontSize: 12, fontWeight: 600,
          color: '#fff', background: selectedIds.size === 0 ? '#93c5fd' : '#2563eb',
          border: 'none', borderRadius: 10, cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { if (selectedIds.size > 0) e.currentTarget.style.background = '#1d4ed8'; }}
        onMouseLeave={(e) => { if (selectedIds.size > 0) e.currentTarget.style.background = '#2563eb'; }}
      >
        {selectedIds.size > 0 ? `生成分享链接 (${selectedIds.size})` : '生成分享链接'}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>文件列表</h2>
        </div>
        <div style={emptyContainerStyle}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <svg width={20} height={20} viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite', color: '#2563eb' }}>
              <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} fill="none" opacity={0.25} />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity={0.75} />
            </svg>
          </div>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>文件列表</h2>
        </div>
        <div style={emptyContainerStyle}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.5} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p style={{ fontSize: 13, color: '#4b5563', margin: '0 0 12px' }}>{error}</p>
          <button onClick={onRefresh} style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: 12, cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; }}>
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>文件列表</h2>
        </div>
        <div style={emptyContainerStyle}>
          <div style={{ width: 56, height: 56, minWidth: 56, minHeight: 56, maxWidth: 56, maxHeight: 56, borderRadius: 16, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.2} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#9ca3af', margin: '0 0 4px' }}>暂无文件</p>
          <p style={{ fontSize: 13, color: '#c4c9d1', margin: 0 }}>上传文件后会显示在这里</p>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>文件列表</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12, color: '#9ca3af', background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.background = '#f3f4f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
        </div>
      </div>

      <div style={{ padding: '8px 20px', borderBottom: '1px solid #f0f2f5' }}>
        {toolbar}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ width: 'auto' }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 260 }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid #f0f2f5', height: 40 }}>
              <th style={{ padding: '0 4px 0 20px', textAlign: 'left', width: 36 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={toggleSelectAll}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563eb' }}
                />
              </th>
              <th style={{ padding: '0 12px 0 4px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>文件名</th>
              <th style={{ padding: '0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'none' }} className="table-cell-sm">大小</th>
              <th style={{ padding: '0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'none' }} className="table-cell-lg">上传时间</th>
              <th style={{ padding: '0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'none' }} className="table-cell-lg">到期时间</th>
              <th style={{ padding: '0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>状态</th>
              <th style={{ padding: '0 20px 0 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFiles.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                selected={selectedIds.has(file.id)}
                onSelect={(checked) => handleSelect(file.id, checked)}
                onDelete={onDelete}
                onPin={onPin}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        padding: '10px 20px', borderTop: '1px solid #f0f2f5',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>每页显示</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
            style={{
              height: 28, padding: '0 6px', fontSize: 12,
              border: '1px solid #e0e4eb', borderRadius: 6,
              background: '#f9fafb', color: '#374151', cursor: 'pointer',
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: '#6b7280' }}>条</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e4eb', borderRadius: 6, background: currentPage <= 1 ? '#f9fafb' : '#fff', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', color: currentPage <= 1 ? '#d1d5db' : '#6b7280', fontSize: 11, fontWeight: 600 }}
            onMouseEnter={(e) => { if (currentPage > 1) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; } }}
            onMouseLeave={(e) => { if (currentPage > 1) { e.currentTarget.style.borderColor = '#e0e4eb'; e.currentTarget.style.color = '#6b7280'; } }}
          >«</button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e4eb', borderRadius: 6, background: currentPage <= 1 ? '#f9fafb' : '#fff', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', color: currentPage <= 1 ? '#d1d5db' : '#6b7280', fontSize: 11, fontWeight: 600 }}
            onMouseEnter={(e) => { if (currentPage > 1) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; } }}
            onMouseLeave={(e) => { if (currentPage > 1) { e.currentTarget.style.borderColor = '#e0e4eb'; e.currentTarget.style.color = '#6b7280'; } }}
          >‹</button>
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 600, minWidth: 60, textAlign: 'center' }}>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e4eb', borderRadius: 6, background: currentPage >= totalPages ? '#f9fafb' : '#fff', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: currentPage >= totalPages ? '#d1d5db' : '#6b7280', fontSize: 11, fontWeight: 600 }}
            onMouseEnter={(e) => { if (currentPage < totalPages) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; } }}
            onMouseLeave={(e) => { if (currentPage < totalPages) { e.currentTarget.style.borderColor = '#e0e4eb'; e.currentTarget.style.color = '#6b7280'; } }}
          >›</button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e4eb', borderRadius: 6, background: currentPage >= totalPages ? '#f9fafb' : '#fff', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: currentPage >= totalPages ? '#d1d5db' : '#6b7280', fontSize: 11, fontWeight: 600 }}
            onMouseEnter={(e) => { if (currentPage < totalPages) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; } }}
            onMouseLeave={(e) => { if (currentPage < totalPages) { e.currentTarget.style.borderColor = '#e0e4eb'; e.currentTarget.style.color = '#6b7280'; } }}
          >»</button>
        </div>

        <div style={{ fontSize: 12, color: '#6b7280' }}>
          当前页 {paginatedFiles.length} 条 / 共 {totalCount} 条
        </div>
      </div>
    </div>
  );
}
