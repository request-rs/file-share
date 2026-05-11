'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import AuthGuard from '@/components/AuthGuard';
import FileUpload from '@/components/FileUpload';
import FileList from '@/components/FileList';
import ShareModal from '@/components/ShareModal';
import ShareLinkList from '@/components/ShareLinkList';
import { FileItem as FileItemType, ShareLinkItem } from '@/types/file';
import { filesApi } from '@/lib/api/files';
import { sharesApi } from '@/lib/api/shares';

export default function DashboardPage() {
  const [files, setFiles] = useState<FileItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [shares, setShares] = useState<ShareLinkItem[]>([]);
  const [sharesLoading, setSharesLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('');
  const [search, setSearch] = useState('');

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (filter) params.filter = filter;
      if (sort) params.sort = sort;
      if (search) params.search = search;
      const res = await filesApi.getFiles(params);
      setFiles(res.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取文件列表失败');
    } finally {
      setLoading(false);
    }
  }, [filter, sort, search]);

  const fetchShares = useCallback(async () => {
    setSharesLoading(true);
    try {
      const res = await sharesApi.getShares();
      setShares(res.shares);
    } catch {
      // ignore
    } finally {
      setSharesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const handleDelete = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
  }, []);

  const handlePin = useCallback((fileId: string, isPinned: boolean) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isPinned } : f))
    );
  }, []);

  const handleShareDelete = useCallback((id: string) => {
    setShares((prev) => prev.filter((s) => s.id !== id));
  }, []);

  function handleFilterChange(v: string) {
    setFilter(v);
    setSelectedIds(new Set());
  }

  function handleSortChange(v: string) {
    setSort(v);
  }

  function handleSearchChange(v: string) {
    setSearch(v);
    setSelectedIds(new Set());
  }

  function handleShareSuccess() {
    setShowShareModal(false);
    setSelectedIds(new Set());
    fetchShares();
  }

  const activeFiles = useMemo(() => files.filter((f) => f.status === 'active'), [files]);

  return (
    <AuthGuard>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FileUpload onUploadSuccess={() => { fetchFiles(); fetchShares(); }} />

        <FileList
          files={files}
          loading={loading}
          error={error}
          onRefresh={fetchFiles}
          onDelete={handleDelete}
          onPin={handlePin}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          filter={filter}
          sort={sort}
          search={search}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onSearchChange={handleSearchChange}
          onOpenShareModal={() => { if (selectedIds.size > 0) setShowShareModal(true); }}
        />

        <ShareLinkList
          shares={shares}
          loading={sharesLoading}
          onRefresh={fetchShares}
          onDelete={handleShareDelete}
        />

        {showShareModal && (
          <ShareModal
            files={activeFiles}
            selectedIds={selectedIds}
            onClose={() => setShowShareModal(false)}
            onSuccess={handleShareSuccess}
          />
        )}
      </div>
    </AuthGuard>
  );
}
