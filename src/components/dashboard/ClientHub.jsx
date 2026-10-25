import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  RotateCw,
  Calendar,
  FileSpreadsheet,
  ShieldAlert,
  ArrowRight,
  Download,
  Trash2,
  FolderOpen,
  Clock
} from 'lucide-react';
import { Segment } from '../ui/segment';
import { FeaturedIcon } from '../ui/featured-icon';
import { StatusBadge } from '../ui/status-badge';

/**
 * ClientHub
 * Halaman Menu Utama (Workspace Dashboard) untuk mengelola dan beralih antar-klien.
 * Menampilkan proyek yang tersinkronisasi di Google Drive / Google Sheets.
 */
export default function ClientHub({
  projects = [],
  isLoading = false,
  onRefresh,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onExportProject,
  userProfile = null,
  activeProjectId = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');

  // Filter dan sort proyek
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch =
        (p.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.npwp || '').includes(searchTerm);
      const matchYear = selectedYear === 'ALL' || String(p.tax_year) === String(selectedYear);
      return matchSearch && matchYear;
    });
  }, [projects, searchTerm, selectedYear]);

  // Daftar tahun unik untuk filter dropdown
  const availableYears = useMemo(() => {
    const years = new Set();
    projects.forEach(p => {
      if (p.tax_year) years.add(String(p.tax_year));
    });
    return Array.from(years).sort().reverse();
  }, [projects]);

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch {
      return isoString;
    }
  };

  const CARD_COLORS = ['blue', 'emerald', 'purple'];

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-900 flex flex-col font-sans">
      {/* Top Banner / Workspace Header */}
      <header className="border-b border-border bg-white sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <FeaturedIcon
                icon={Building2}
                color="brand"
                size="md"
                variant="light-square"
                className="shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    Daftar Proyek Klien
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Client Hub
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Workspace KAP Zaidan Jauhari &bull; Google Drive Auto-Sync Aktif
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh"
              title="Refresh"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors disabled:opacity-50"
            >
              <RotateCw className={`h-3.5 w-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:via-indigo-700 hover:to-indigo-800 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Klien Baru</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col">
        {/* Controls: Search & Filters */}
        <div className="mb-6 p-3 bg-white rounded-xl border border-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama klien atau NPWP..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-slate-50/70 focus:bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Tahun Pajak:</span>
            </div>
            <select
              aria-label="Filter Tahun Pajak"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="rounded-lg border border-border bg-slate-50/70 focus:bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Tahun</option>
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && projects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
            <RotateCw className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-900">Menghubungkan ke Google Drive...</p>
            <p className="text-xs text-slate-500 mt-1">Mengambil riwayat proyek klien Anda</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-16 px-4 text-center shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <FolderOpen className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {searchTerm ? 'Tidak ada klien yang cocok' : 'Belum ada proyek klien'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
              {searchTerm
                ? 'Coba gunakan kata kunci pencarian yang berbeda atau reset filter tahun pajak.'
                : 'Mulai analisis kepatuhan pajak pertama Anda dengan mengunggah Buku Besar klien baru.'}
            </p>
            <button
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Klien Baru</span>
            </button>
          </div>
        ) : (
          /* Project Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project, idx) => {
              const isActive = activeProjectId && activeProjectId === project.project_id;
              const cardColor = CARD_COLORS[idx % CARD_COLORS.length];
              const isDraft = Boolean(
                project.sync_status === 'draft' ||
                project.sync_status === 'local_draft' ||
                project.is_draft ||
                project.is_local ||
                project.cloud_synced === false
              );

              return (
                <Segment
                  key={project.project_id}
                  raised
                  color={cardColor}
                  className={`relative flex flex-col bg-white rounded-xl border p-5 transition-all hover:shadow-lg group ${
                    isActive
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-border hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <FeaturedIcon
                        icon={Building2}
                        color="brand"
                        size="md"
                        variant="light-square"
                        className="shrink-0 mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {project.tax_year || '2024'}
                          </span>
                          <StatusBadge
                            status={isDraft ? 'warning' : 'success'}
                            size="sm"
                            dot
                          >
                            {isDraft ? 'Draft Lokal' : 'Tersinkron Cloud'}
                          </StatusBadge>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                              Aktif
                            </span>
                          )}
                        </div>

                        <h3
                          className="mt-2 text-base font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => onSelectProject?.(project)}
                          title={project.client_name}
                        >
                          {project.client_name || 'Klien Tanpa Nama'}
                        </h3>

                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {project.npwp || 'NPWP Belum Diisi'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {onExportProject && (
                        <button
                          type="button"
                          onClick={() => onExportProject(project)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                          title="Unduh KKP"
                          aria-label="Unduh KKP"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}

                      {onDeleteProject && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Yakin ingin menghapus proyek "${project.client_name}" dari cloud?`)) {
                              onDeleteProject(project.project_id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                          title="Hapus"
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Metadata Chips */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-2.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60 font-medium">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
                      <strong className="text-slate-900 font-semibold">{project.total_rows || 0}</strong> baris GL
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-slate-600 bg-amber-50/70 px-2.5 py-1 rounded-md border border-amber-200/60 font-medium">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                      <strong className="text-amber-900 font-semibold">{project.findings_count || 0}</strong> temuan
                    </span>
                  </div>

                  {/* Card Footer: Timestamp & Action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1 truncate" title={`Diperbarui: ${formatDate(project.updated_at)}`}>
                      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{formatDate(project.updated_at)}</span>
                    </div>

                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      {onExportProject && (
                        <button
                          type="button"
                          onClick={() => onExportProject(project)}
                          className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          <Download className="h-3 w-3" />
                          <span>Unduh KKP</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectProject?.(project)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs transition-colors"
                      >
                        <span>Buka Proyek</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </Segment>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
