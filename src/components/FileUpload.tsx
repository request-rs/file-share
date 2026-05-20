'use client';

import { useState, useRef, DragEvent, ChangeEvent, useCallback } from 'react';
import { filesApi } from '@/lib/api/files';
import { copyToClipboard } from '@/utils/clipboard';
import { formatFileSize } from '@/utils/format';
import { appConfig } from '@/config';

interface UploadTaskInfo {
  id: string;
  fileName: string;
  fileSize: number;
  fileId?: string;
  downloadUrl?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled' | 'rejected';
  error: string;
  controller: AbortController | null;
}

interface FileUploadProps {
  onUploadSuccess: () => void;
}

let taskIdCounter = 0;
const MAX_SIZE_MB = appConfig.publicMaxFileSizeMB;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function validateFiles(files: File[]): { valid: File[]; rejected: { name: string; size: number }[] } {
  const valid: File[] = [];
  const rejected: { name: string; size: number }[] = [];
  for (const f of files) {
    if (f.size > MAX_SIZE_BYTES) {
      rejected.push({ name: f.name, size: f.size });
    } else {
      valid.push(f);
    }
  }
  return { valid, rejected };
}

function getStatusIcon(status: UploadTaskInfo['status']): JSX.Element {
  switch (status) {
    case 'uploading':
      return (
        <svg width={14} height={14} viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite', color: '#2563eb', flexShrink: 0 }}>
          <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} fill="none" opacity={0.25} />
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity={0.75} />
        </svg>
      );
    case 'completed':
      return (
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'failed':
    case 'rejected':
      return (
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    case 'cancelled':
      return (
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    default:
      return (
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d1d5db' }} />
        </div>
      );
  }
}

function getStatusText(status: UploadTaskInfo['status']): string {
  switch (status) {
    case 'pending': return '等待中';
    case 'uploading': return '上传中';
    case 'completed': return '已完成';
    case 'failed': return '上传失败';
    case 'cancelled': return '已取消';
    case 'rejected': return '已拒绝';
  }
}

function getStatusColor(status: UploadTaskInfo['status']): string {
  switch (status) {
    case 'completed': return '#059669';
    case 'failed':
    case 'rejected': return '#dc2626';
    case 'cancelled': return '#9ca3af';
    case 'uploading': return '#2563eb';
    default: return '#6b7280';
  }
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [tasks, setTasks] = useState<UploadTaskInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  function handleDrag(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const { valid, rejected } = validateFiles(files);
      if (rejected.length > 0) {
        addRejectedTasks(rejected);
      }
      setSelectedFiles(valid);
    }
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const { valid, rejected } = validateFiles(files);
      if (rejected.length > 0) {
        addRejectedTasks(rejected);
      }
      setSelectedFiles(valid);
    }
    e.currentTarget.value = '';
  }

  function addRejectedTasks(rejected: { name: string; size: number }[]) {
    const rejectedTasks: UploadTaskInfo[] = rejected.map((r) => ({
      id: `task-${++taskIdCounter}`,
      fileName: r.name,
      fileSize: r.size,
      fileId: undefined,
      downloadUrl: undefined,
      progress: 0,
      status: 'rejected' as const,
      error: `文件超过 ${MAX_SIZE_MB} MB 限制`,
      controller: null,
    }));
    setTasks((prev) => [...prev, ...rejectedTasks]);
  }

  function cancelUpload(taskId: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId && (t.status === 'pending' || t.status === 'uploading')) {
          t.controller?.abort();
          return { ...t, status: 'cancelled' as const };
        }
        return t;
      })
    );
  }

  async function copyDownloadLink(task: UploadTaskInfo) {
    if (!task.fileId) return;
    try {
      const url = await filesApi.getNativeDownloadUrl(task.fileId);
      const fullUrl = `${window.location.origin}${url}`;
      await copyToClipboard(fullUrl);
      alert('下载链接已复制');
    } catch {
      alert('复制失败，请检查网络后重试');
    }
  }

  const startUpload = useCallback(async () => {
    if (selectedFiles.length === 0 || uploadingRef.current) return;

    uploadingRef.current = true;

    const filesToUpload = [...selectedFiles];
    const newTasks: UploadTaskInfo[] = filesToUpload.map((file) => ({
      id: `task-${++taskIdCounter}`,
      fileName: file.name,
      fileSize: file.size,
      fileId: undefined,
      downloadUrl: undefined,
      progress: 0,
      status: 'pending' as const,
      error: '',
      controller: null,
    }));

    setTasks((prev) => [...prev, ...newTasks]);
    setSelectedFiles([]);

    let hasCompleted = false;

    for (let i = 0; i < newTasks.length; i++) {
      const task = newTasks[i];
      const file = filesToUpload[i];
      if (!file) continue;

      const controller = new AbortController();

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: 'uploading' as const, controller }
            : t
        )
      );

      try {
        const result = await filesApi.upload([file], {
          signal: controller.signal,
          onProgress: (progress) => {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === task.id ? { ...t, progress } : t
              )
            );
          },
        });

        const uploadedFile = result.files?.[0];

        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: 'completed' as const,
                  progress: 100,
                  fileId: uploadedFile?.id,
                  downloadUrl: uploadedFile?.downloadUrl,
                }
              : t
          )
        );
        hasCompleted = true;
      } catch (err) {
        const isAborted = err instanceof Error && err.message === '上传已取消';
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: isAborted ? 'cancelled' : 'failed',
                  error: isAborted ? '' : (err instanceof Error ? err.message : '上传失败'),
                }
              : t
          )
        );
      }
    }

    uploadingRef.current = false;

    if (hasCompleted) {
      setTimeout(() => onUploadSuccess(), 300);
    }
  }, [selectedFiles, onUploadSuccess]);

  function clearTasks() {
    setTasks([]);
  }

  function canClear(t: UploadTaskInfo) {
    return t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled' || t.status === 'rejected';
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
  };

  const bodyStyle: React.CSSProperties = {
    padding: 20,
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>
          上传文件
        </h2>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
          单个文件最大 {MAX_SIZE_MB} MB，支持多个文件同时上传，默认永久有效
        </p>
      </div>

      <div style={bodyStyle}>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => { inputRef.current?.click(); }}
          style={{
            border: `2px dashed ${dragActive ? '#3b82f6' : '#e0e4eb'}`,
            borderRadius: 16,
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: dragActive ? '#eff6ff' : '#fafbfc',
            minHeight: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {selectedFiles.length > 0 ? (
            <div>
              <div style={{
                width: 40, height: 40, minWidth: 40, maxWidth: 40, minHeight: 40, maxHeight: 40,
                margin: '0 auto 12px', borderRadius: '50%', background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={1.8} style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: '0 0 8px' }}>
                已选择 {selectedFiles.length} 个文件
              </p>
              <div style={{ maxHeight: 120, overflow: 'auto', textAlign: 'left', fontSize: 13, color: '#6b7280', maxWidth: 320, margin: '0 auto' }}>
                {selectedFiles.map((f, i) => (
                  <div key={i} style={{ padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.name}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); startUpload(); }}
                  style={{
                    padding: '8px 22px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#fff',
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(37,99,235,0.2)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; }}
                >
                  开始上传
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFiles([]); }}
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    color: '#9ca3af',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#4b5563'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 320 }}>
              <div style={{
                width: 48, height: 48, minWidth: 48, minHeight: 48, maxWidth: 48, maxHeight: 48,
                margin: '0 auto 12px', borderRadius: 16, background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth={1.5} style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#4b5563', margin: '0 0 4px' }}>
                拖拽文件到此处上传
              </p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                或点击此区域选择文件
              </p>
            </div>
          )}
        </div>
      </div>

      {tasks.length > 0 && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
              上传队列 ({tasks.filter((t) => t.status === 'completed').length}/{tasks.length})
            </span>
            {tasks.every(canClear) && (
              <button
                onClick={clearTasks}
                style={{
                  fontSize: 12,
                  color: '#9ca3af',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 8px',
                }}
              >
                清除
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid #f0f2f5',
                  background: '#fafbfc',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    {getStatusIcon(task.status)}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#172033', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.fileName}
                      </div>
                      <div style={{ fontSize: 11, color: getStatusColor(task.status), marginTop: 1 }}>
                        {task.error ? task.error : getStatusText(task.status)}
                        {task.status === 'uploading' && !task.error && ` ${task.progress}%`}
                        {(task.status === 'uploading' || task.status === 'pending' || task.status === 'completed') && !task.error && ` - ${formatFileSize(task.fileSize)}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                    {(task.status === 'pending' || task.status === 'uploading') && (
                      <button
                        onClick={() => cancelUpload(task.id)}
                        style={{
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#ef4444',
                          background: 'transparent',
                          border: '1px solid #fca5a5',
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        取消
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <button
                        onClick={() => copyDownloadLink(task)}
                        style={{
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#2563eb',
                          background: 'transparent',
                          border: '1px solid #93c5fd',
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        复制下载链接
                      </button>
                    )}
                  </div>
                </div>
                {task.status === 'uploading' && (
                  <div style={{ width: '100%', height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${task.progress}%`, height: 4, background: '#2563eb', borderRadius: 2, transition: 'width 0.3s ease-out' }} />
                  </div>
                )}
                {task.status === 'completed' && (
                  <div style={{ width: '100%', height: 4, background: '#ecfdf5', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: 4, background: '#059669', borderRadius: 2 }} />
                  </div>
                )}
                {(task.status === 'failed' || task.status === 'rejected') && task.error && (
                  <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{task.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
