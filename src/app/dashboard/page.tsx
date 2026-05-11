'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import FileUpload from '@/components/FileUpload';
import FileList from '@/components/FileList';
import { FileItem as FileItemType } from '@/types/file';
import { filesApi } from '@/lib/api/files';

export default function DashboardPage() {
  const [files, setFiles] = useState<FileItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await filesApi.getFiles();
      setFiles(res.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取文件列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  return (
    <AuthGuard>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FileUpload onUploadSuccess={fetchFiles} />
        <FileList
          files={files}
          loading={loading}
          error={error}
          onRefresh={fetchFiles}
          onDelete={handleDelete}
        />
      </div>
    </AuthGuard>
  );
}
