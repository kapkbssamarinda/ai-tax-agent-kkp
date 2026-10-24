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
  Cloud,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Banner / Workspace Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Daftar Proyek Klien
                </h1>
                <p className="text-xs text-muted-foreground">
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title="Perbarui daftar dari Google Drive"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>

            <button
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>+ Klien Baru</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col">
        {/* Controls: Search & Filters */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama klien atau NPWP..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Tahun Pajak:</span>
            </div>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
            <RotateCw className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium text-foreground">Menghubungkan ke Google Drive...</p>
            <p className="text-xs text-muted-foreground mt-1">Mengambil riwayat proyek klien Anda</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <FolderOpen className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {searchTerm ? 'Tidak ada klien yang cocok' : 'Belum ada proyek klien'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
              {searchTerm
                ? 'Coba gunakan kata kunci pencarian yang berbeda atau reset filter tahun pajak.'
                : 'Mulai analisis kepatuhan pajak pertama Anda dengan mengunggah Buku Besar klien baru.'}
            </p>
            <button
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Mulai Klien Baru</span>
            </button>
          </div>
        ) : (
          /* Project Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => {
              const isActive = activeProjectId && activeProjectId === project.project_id;

              return (
                <div
                  key={project.project_id}
                  className={`group relative flex flex-col rounded-xl border bg-card p-5 transition-all hover:shadow-md ${
                    isActive
                      ? 'border-primary ring-1 ring-primary/40 bg-primary/5'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          {project.tax_year || '2024'}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        )}
                      </div>

                      <h3
                        className="mt-2 text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors cursor-pointer"
                        onClick={() => onSelectProject(project)}
                        title={project.client_name}
                      >
                        {project.client_name || 'Klien Tanpa Nama'}
                      </h3>

                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {project.npwp || 'NPWP Belum Diisi'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {onExportProject && (
                        <button
                          type="button"
                          onClick={() => onExportProject(project)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Ekspor snapshot .aitax"
                        >
                          <Download className="h-3.5 w-3.5" />
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
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Hapus proyek dari cloud"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Metadata Chips */}
                  <div className="mt-4 pt-3.5 border-t border-border/70 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                      <strong className="text-foreground">{project.total_rows || 0}</strong> baris GL
                    </span>

                    <span className="text-border">&bull;</span>

                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                      <strong className="text-foreground">{project.findings_count || 0}</strong> temuan
                    </span>
                  </div>

                  {/* Card Footer: Timestamp & Action */}
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1 truncate" title={`Diperbarui: ${formatDate(project.updated_at)}`}>
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="truncate">{formatDate(project.updated_at)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectProject(project)}
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline ml-2 shrink-0"
                    >
                      <span>Buka</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

