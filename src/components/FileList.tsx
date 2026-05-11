'use client';

import { FileItem as FileItemType } from '@/types/file';
import FileItem from './FileItem';

interface FileListProps {
  files: FileItemType[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onDelete: (fileId: string) => void;
}

export default function FileList({ files, loading, error, onRefresh, onDelete }: FileListProps) {
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

  const emptyContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
  };

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
          <button
            onClick={onRefresh}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              background: '#2563eb',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; }}
          >
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
          <div style={{
            width: 56, height: 56, minWidth: 56, minHeight: 56, maxWidth: 56, maxHeight: 56,
            borderRadius: 16, background: '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
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
        <button
          onClick={onRefresh}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            fontSize: 12,
            color: '#9ca3af',
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
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

      {/* Desktop table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <colgroup>
            <col style={{ width: 'auto' }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 180 }} />
          </colgroup>
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
            {files.map((file) => (
              <FileItem key={file.id} file={file} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>


    </div>
  );
}
