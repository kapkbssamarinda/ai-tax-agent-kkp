import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

/* role="button" + tabIndex + keydown handler make this reachable and
   operable by keyboard. The real <input type="file"> is kept in the DOM
   via .sr-only (not display:none, which strips it from the a11y tree)
   but taken out of tab order (tabIndex=-1) so this div is the single,
   consistent tab stop and accessible name for the control. */
function Dropzone({ onFile }) {
  const fileInputRef = useRef(null);
  // Umpan balik visual saat file diseret di atas zona — kelas .active dulunya
  // CSS mati karena tidak ada handler drag-enter/leave (impeccable audit, P3).
  const [isDragging, setIsDragging] = useState(false);
  // dragenter/dragleave juga menyala saat melintasi elemen anak; counter
  // mencegah highlight berkedip.
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

  return (
    <div
      className={`dropzone ${isDragging ? 'active' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Unggah file Excel atau PDF. Klik atau seret file ke area ini."
      onClick={openFilePicker}
      onKeyDown={handleKeyDown}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => { e.preventDefault(); dragDepth.current += 1; setIsDragging(true); }}
      onDragLeave={() => { dragDepth.current -= 1; if (dragDepth.current <= 0) { dragDepth.current = 0; setIsDragging(false); } }}
      onDrop={handleDrop}
    >
      <UploadCloud className="dropzone-icon" size={40} strokeWidth={1.5} aria-hidden="true" />
      <span className="dropzone-text">Klik atau seret file ke sini untuk mengunggah</span>
      <span className="dropzone-hint">Mendukung Buku Besar (.xlsx, .xls, .pdf, .txt) atau File Proyek (.aitax)</span>
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        accept=".xlsx, .xls, .csv, .xml, .pdf, .txt, .aitax, .json"
        onChange={handleChange}
      />
    </div>
  );
}

export default Dropzone;
