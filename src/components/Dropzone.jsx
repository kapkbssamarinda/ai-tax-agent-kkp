import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function Dropzone({ onFile }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  };

  const extractFile = (e) => {
    if (e.dataTransfer && e.dataTransfer.files.length > 0) return e.dataTransfer.files[0];
    if (e.target.files && e.target.files.length > 0) return e.target.files[0];
    return null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    const file = extractFile(e);
    if (file) onFile(file);
  };

  const handleChange = (e) => {
    const file = extractFile(e);
    if (file) onFile(file);
  };

  const supportedFormats = [
    { label: 'Excel (.xlsx, .xls)', primary: true },
    { label: 'PDF Buku Besar' },
    { label: 'CSV / TXT' },
    { label: 'Accurate XML' },
    { label: 'Proyek (.aitax)' },
  ];

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'dropzone group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer select-none',
        isDragging
          ? 'active border-primary bg-primary/10 shadow-lg scale-[1.01]'
          : 'border-border/80 bg-card hover:border-primary/60 hover:bg-muted/30 shadow-xs'
      )}
      role="button"
      tabIndex={0}
      aria-label="Unggah file Excel atau PDF. Klik atau seret file ke area ini."
      onClick={openFilePicker}
      onKeyDown={handleKeyDown}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setIsDragging(true);
      }}
      onDragLeave={() => {
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
    >
      <div className={cn(
        'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105',
        isDragging
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'bg-primary/10 text-primary border border-primary/20'
      )}>
        <UploadCloud className="dropzone-icon h-8 w-8" strokeWidth={1.75} aria-hidden="true" />
      </div>

      <h3 className="dropzone-text text-base sm:text-lg font-semibold tracking-tight text-foreground mb-1.5">
        Klik atau seret file Buku Besar ke sini
      </h3>

      <p className="dropzone-hint text-xs sm:text-sm text-muted-foreground max-w-md mb-5 leading-relaxed">
        Sistem otomatis mengekstrak transaksi, mendeteksi software akuntansi, dan memetakan pos rekonsiliasi pajak.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-lg">
        {supportedFormats.map((fmt, i) => (
          <Badge
            key={i}
            variant={fmt.primary ? 'default' : 'outline'}
            className={cn(
              'text-[11px] font-normal py-0.5 px-2 rounded-md',
              fmt.primary ? 'bg-primary/90 text-primary-foreground' : 'text-muted-foreground border-border/80'
            )}
          >
            {fmt.label}
          </Badge>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        accept=".xlsx, .xls, .csv, .xml, .pdf, .txt, .aitax, .json"
        onChange={handleChange}
      />
    </motion.div>
  );
}

export default Dropzone;
