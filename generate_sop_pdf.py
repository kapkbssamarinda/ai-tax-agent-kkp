import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas
import pypdfium2 as pdfium

class NumberedCanvas(canvas.Canvas):
    """Canvas with running header and footer with total page count."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1B2A4A"))
        
        # Header (page 2)
        if self._pageNumber > 1:
            self.drawString(18 * mm, 285 * mm, "KAP KUNCARA BUDI SANTOSA & REKAN")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawRightString(192 * mm, 285 * mm, "SOP Alur Pemeriksaan Pajak (AI Tax Agent v2.2.0)")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(18 * mm, 282 * mm, 192 * mm, 282 * mm)
            
        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(18 * mm, 10 * mm, "Dokumen Standar Operasional Prosedur Internal — KAP Kuncara Budi Santosa & Rekan (Cabang Samarinda)")
        page_str = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(192 * mm, 10 * mm, page_str)
        self.restoreState()

def generate_pdf(output_filename):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm
    )

    # Color Palette
    NAVY = colors.HexColor("#1B2A4A")
    STEEL_BLUE = colors.HexColor("#2E5090")
    LIGHT_BLUE = colors.HexColor("#EBF3FA")
    PALE_GRAY = colors.HexColor("#F8FAFC")
    BORDER_COLOR = colors.HexColor("#CBD5E1")
    TEXT_DARK = colors.HexColor("#1E293B")
    TEXT_MUTED = colors.HexColor("#64748B")
    HEADER_BG = colors.HexColor("#1B2A4A")
    ROW_ALT = colors.HexColor("#F1F5F9")
    CARD_BG_1 = colors.HexColor("#EFF6FF")
    CARD_BG_2 = colors.HexColor("#F0FDF4")

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=NAVY,
        alignment=1,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=STEEL_BLUE,
        alignment=1,
        spaceAfter=8
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=NAVY,
        spaceBefore=8,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK
    )

    body_bold = ParagraphStyle(
        'BodyDarkBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK,
        alignment=1
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white,
        alignment=1
    )

    badge_flow = ParagraphStyle(
        'BadgeFlow',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=STEEL_BLUE,
        alignment=1
    )

    story = []

    # ══════════════════════════════════════════════════════════════════
    # PAGE 1: HEADER, METADATA, WORKFLOW DIAGRAM, TAHAP 1 & TAHAP 2
    # ══════════════════════════════════════════════════════════════════

    # 1. Header Banner
    banner_data = [
        [
            Paragraph("<b>KAP KUNCARA BUDI SANTOSA & REKAN</b><br/><font size=7.5 color='#4472C4'>Cabang Samarinda — Divisi Audit & Konsultasi Perpajakan</font>", ParagraphStyle('BannerLeft', parent=styles['Normal'], fontName='Helvetica', fontSize=9.5, leading=13, textColor=NAVY)),
            Paragraph("<b>STANDAR OPERASIONAL PROSEDUR (SOP)</b><br/><font size=7.5 color='#64748B'>Panduan Alur Kerja Pengguna Web-App</font>", ParagraphStyle('BannerRight', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=12, textColor=NAVY, alignment=2))
        ]
    ]
    banner_table = Table(banner_data, colWidths=[104*mm, 74*mm])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BLUE),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 1, STEEL_BLUE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 6))

    # Title
    story.append(Paragraph("PROSEDUR LANGKAH INPUT & PEMERIKSAAN PAJAK", title_style))
    story.append(Paragraph("Panduan Runtut End-to-End: Ingesti Buku Besar (GL) s.d. Ekspor KKP 13-Sheet Excel", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=BORDER_COLOR, spaceBefore=0, spaceAfter=6))

    # Meta Grid
    meta_data = [
        [
            Paragraph("<b>Aplikasi:</b> AI Tax Agent & KKP Platform", body_style),
            Paragraph("<b>Pengguna:</b> Staff, Senior, Manager & Partner", body_style),
            Paragraph("<b>Versi:</b> 2.2.0 (Client-Side Privacy)", body_style),
            Paragraph("<b>Status:</b> Berlaku Aktif", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[52*mm, 58*mm, 44*mm, 24*mm])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PALE_GRAY),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6))

    # Diagram Alur 5 Tahap
    story.append(Paragraph("1. DIAGRAM ALUR PROSES PEMERIKSAAN (5 TAHAPAN)", h1_style))
    flow_steps = [
        [
            Paragraph("<b>TAHAP 1</b><br/><font color='#1B2A4A'><b>Persiapan & GL</b></font><br/><font size=6.5 color='#64748B'>• Role Pajak<br/>• Profil Klien<br/>• Upload GL</font>", badge_flow),
            Paragraph("➔", ParagraphStyle('Arrow', parent=styles['Normal'], alignment=1, fontName='Helvetica-Bold', fontSize=12, textColor=STEEL_BLUE)),
            Paragraph("<b>TAHAP 2</b><br/><font color='#1B2A4A'><b>Mapping & Faktur</b></font><br/><font size=6.5 color='#64748B'>• 9 Pos Mapping<br/>• Upload Faktur<br/>• Sinkron DPP</font>", badge_flow),
            Paragraph("➔", ParagraphStyle('Arrow', parent=styles['Normal'], alignment=1, fontName='Helvetica-Bold', fontSize=12, textColor=STEEL_BLUE)),
            Paragraph("<b>TAHAP 3</b><br/><font color='#1B2A4A'><b>Scan Anomali</b></font><br/><font size=6.5 color='#64748B'>• Keyword Scan<br/>• Deteksi Salah<br/>  Kamar COA</font>", badge_flow),
            Paragraph("➔", ParagraphStyle('Arrow', parent=styles['Normal'], alignment=1, fontName='Helvetica-Bold', fontSize=12, textColor=STEEL_BLUE)),
            Paragraph("<b>TAHAP 4</b><br/><font color='#1B2A4A'><b>Ekualisasi & AI</b></font><br/><font size=6.5 color='#64748B'>• PPN & PPh 23<br/>• AI Diagnostic<br/>• Risk Register</font>", badge_flow),
            Paragraph("➔", ParagraphStyle('Arrow', parent=styles['Normal'], alignment=1, fontName='Helvetica-Bold', fontSize=12, textColor=STEEL_BLUE)),
            Paragraph("<b>TAHAP 5</b><br/><font color='#1B2A4A'><b>Review & KKP</b></font><br/><font size=6.5 color='#64748B'>• Partner Dash.<br/>• Top 5 Matters<br/>• Unduh KKP</font>", badge_flow),
        ]
    ]
    flow_table = Table(flow_steps, colWidths=[31.5*mm, 5*mm, 31.5*mm, 5*mm, 31.5*mm, 5*mm, 31.5*mm, 5*mm, 32*mm])
    flow_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), LIGHT_BLUE),
        ('BACKGROUND', (2, 0), (2, 0), LIGHT_BLUE),
        ('BACKGROUND', (4, 0), (4, 0), LIGHT_BLUE),
        ('BACKGROUND', (6, 0), (6, 0), LIGHT_BLUE),
        ('BACKGROUND', (8, 0), (8, 0), LIGHT_BLUE),
        ('BOX', (0, 0), (0, 0), 0.8, STEEL_BLUE),
        ('BOX', (2, 0), (2, 0), 0.8, STEEL_BLUE),
        ('BOX', (4, 0), (4, 0), 0.8, STEEL_BLUE),
        ('BOX', (6, 0), (6, 0), 0.8, STEEL_BLUE),
        ('BOX', (8, 0), (8, 0), 0.8, STEEL_BLUE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(flow_table)
    story.append(Spacer(1, 8))

    # Section 2: Prosedur Tahap 1 & 2 (Bagian Pertama)
    story.append(Paragraph("2. RINCIAN LANGKAH OPERASIONAL — BAGIAN I (TAHAP 1 S.D. 2)", h1_style))
    
    table_p1_data = [
        [
            Paragraph("No", table_header_style),
            Paragraph("Tahapan & Lokasi Menu", table_header_style),
            Paragraph("Tindakan Pengguna (Aksi Input)", table_header_style),
            Paragraph("Keluaran & Verifikasi Sistem", table_header_style)
        ],
        # Tahap 1
        [
            Paragraph("<b>1</b>", body_bold),
            Paragraph("<b>Pemilihan Peran</b><br/><font color='#64748B'>Awal Buka Web-App</font>", body_style),
            Paragraph("Pilih opsi <b>Role Pajak (Tax Specialist)</b> pada jendela awal untuk mengaktifkan seluruh modul diagnostik & KKP.", body_style),
            Paragraph("Seluruh fitur (Ekualisasi PPN/PPh23, Faktur, Scanner, AI & KKP Excel) siap digunakan.", body_style)
        ],
        [
            Paragraph("<b>2</b>", body_bold),
            Paragraph("<b>Profil Master Klien</b><br/><font color='#64748B'>Topbar: Tombol [Klien]</font>", body_style),
            Paragraph("Isi <b>Nama Wajib Pajak</b>, <b>NPWP (15/16 digit)</b>, <b>Tahun Pajak</b>, dan nama Tim Audit (Partner, Manager, Senior, Staff).", body_style),
            Paragraph("Metadata profil tersimpan dan otomatis menjadi header resmi pada seluruh sheet KKP Excel.", body_style)
        ],
        [
            Paragraph("<b>3</b>", body_bold),
            Paragraph("<b>Setup API Key AI</b><br/><font color='#64748B'>Topbar: Tombol [AI Key]</font>", body_style),
            Paragraph("Masukkan Anthropic API Key (sk-ant-...), pilih <b>Claude 3.5 Haiku</b>, klik <b>Uji Koneksi</b>, lalu <b>Simpan</b>.", body_style),
            Paragraph("AI Semantic Engine siap aktif. <i>*Jika tanpa API Key, sistem tetap berjalan 100% mode deterministik offline.</i>", body_style)
        ],
        [
            Paragraph("<b>4</b>", body_bold),
            Paragraph("<b>Upload Buku Besar</b><br/><font color='#64748B'>Menu: Buku Besar (GL)</font>", body_style),
            Paragraph("Drag & Drop file GL hasil ekspor <b>Accurate</b> (.xlsx/.xls/.pdf), <b>MYOB</b> (.xlsx/.txt), atau <b>Krishand</b> (.xlsx).", body_style),
            Paragraph("Sistem menstandardisasi ribuan baris data transaksi via Web Worker, auto-detect nama PT & tahun buku.", body_style)
        ],
        # Tahap 2
        [
            Paragraph("<b>5</b>", body_bold),
            Paragraph("<b>Verifikasi Mapping</b><br/><font color='#64748B'>Tab: [Tax Mapping]</font>", body_style),
            Paragraph("Buka menu <i>AI Tax & KKP</i> ➔ Tab <i>Tax Mapping</i>. Periksa klasifikasi COA ke 9 pos pajak (REVENUE, PPH23, PPH21, NDE, dll).", body_style),
            Paragraph("Saldo total debit/kredit per pos pajak terakumulasi sebagai dasar pembanding rekonsiliasi fiskal.", body_style)
        ],
        [
            Paragraph("<b>6</b>", body_bold),
            Paragraph("<b>Impor & Matching Faktur</b><br/><font color='#64748B'>Tab: [Faktur Pajak]</font>", body_style),
            Paragraph("Unggah file rekap Faktur Pajak multi-item (merger-faktur.xlsx). Periksa kecocokan strict matching NSFP/Invoice ke GL.", body_style),
            Paragraph("Klik tombol hijau <b>'Sinkronkan ke Ekualisasi PPN'</b> untuk memindahkan total DPP faktur ke form rekonsiliasi.", body_style)
        ],
    ]
    table_p1 = Table(table_p1_data, colWidths=[8*mm, 36*mm, 68*mm, 66*mm], repeatRows=1)
    table_p1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 4.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, ROW_ALT]),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
    ]))
    story.append(table_p1)

    # ══════════════════════════════════════════════════════════════════
    # PAGE 2: PROSEDUR TAHAP 3, 4, 5, CHEATSHEET & TANDA TANGAN
    # ══════════════════════════════════════════════════════════════════
    story.append(PageBreak())

    story.append(Paragraph("2. RINCIAN LANGKAH OPERASIONAL — BAGIAN II (TAHAP 3 S.D. 5)", h1_style))

    table_p2_data = [
        [
            Paragraph("No", table_header_style),
            Paragraph("Tahapan & Lokasi Menu", table_header_style),
            Paragraph("Tindakan Pengguna (Aksi Input)", table_header_style),
            Paragraph("Keluaran & Verifikasi Sistem", table_header_style)
        ],
        # Tahap 3
        [
            Paragraph("<b>7</b>", body_bold),
            Paragraph("<b>Keyword Scanner</b><br/><font color='#64748B'>Tab: [Keyword Scanner]</font>", body_style),
            Paragraph("Pilih preset kata kunci: <i>Objek PPh 23 (jasa/service)</i>, <i>PPh 4(2) (sewa/renovasi)</i>, <i>NDE (jamuan/natura)</i>, atau <i>Akun Penampung</i>.", body_style),
            Paragraph("Memindai seluruh uraian transaksi GL tanpa batas mapping. Mendeteksi objek pajak tersembunyi.", body_style)
        ],
        [
            Paragraph("<b>8</b>", body_bold),
            Paragraph("<b>Analisis Salah Kamar</b><br/><font color='#64748B'>Anomaly Warning</font>", body_style),
            Paragraph("Cermati baris bertanda <b>'Misclassification Warning'</b> (transaksi jasa/sewa yang dicatat pada akun Biaya Lain-Lain/Kasbon).", body_style),
            Paragraph("Memberikan peringatan potensi koreksi fiskal atau kewajiban withholding tax yang terlewat.", body_style)
        ],
        # Tahap 4
        [
            Paragraph("<b>9</b>", body_bold),
            Paragraph("<b>Input Data SPT & Rekon</b><br/><font color='#64748B'>Tab: [Ekualisasi & Rekon]</font>", body_style),
            Paragraph("• Masukkan DPP SPT Masa PPN 1111 Jan–Des.<br/>• Masukkan DPP e-Bupot Unifikasi PPh 23.<br/>• Masukkan pos penyesuaian (Uang Muka, BAST, dll).", body_style),
            Paragraph("Kalkulasi matematis presisi 100%: Selisih Omzet/Beban, Potensi PPN (11%/12%), PPh 23 (2%), dan Sanksi Bunga Ps 19 KUP.", body_style)
        ],
        [
            Paragraph("<b>10</b>", body_bold),
            Paragraph("<b>Eksekusi AI Diagnostic</b><br/><font color='#64748B'>Tombol [AI Diagnostic]</font>", body_style),
            Paragraph("Klik tombol ungu <b>'Jalankan AI Tax Diagnostic'</b> untuk memulai penalaran hukum semantik oleh AI Claude.", body_style),
            Paragraph("AI membedah risiko <i>Substance Over Form</i>, mencantumkan dasar hukum Coretax/UU HPP, dan menyusun PBC Request List.", body_style)
        ],
        [
            Paragraph("<b>11</b>", body_bold),
            Paragraph("<b>Tax Risk Register</b><br/><font color='#64748B'>Register Temuan</font>", body_style),
            Paragraph("Tinjau kartu temuan risiko dengan skor kuantitatif (1–25: Critical, High, Medium, Low). Gunakan filter AI vs Non-AI.", body_style),
            Paragraph("Matriks risiko terstruktur lengkap dengan nilai eksposur pajak dan bukti dokumen yang harus diminta.", body_style)
        ],
        # Tahap 5
        [
            Paragraph("<b>12</b>", body_bold),
            Paragraph("<b>Executive Review</b><br/><font color='#64748B'>Menu: Partner Dashboard</font>", body_style),
            Paragraph("Partner/Manager menelaah ringkasan KPI: <i>Total Potential Tax Exposure</i>, Level Risiko Klien, dan <b>Top 5 Matters</b>.", body_style),
            Paragraph("Memberikan arahan langsung bagi tim audit atas area kepatuhan perpajakan yang paling kritis.", body_style)
        ],
        [
            Paragraph("<b>13</b>", body_bold),
            Paragraph("<b>Unduh KKP 13-Sheet</b><br/><font color='#64748B'>Topbar: Tombol [Unduh KKP]</font>", body_style),
            Paragraph("Klik tombol hijau <b>'Unduh KKP 13-Sheet Excel'</b> di Topbar untuk mengunduh seluruh kertas kerja pemeriksaan.", body_style),
            Paragraph("Workbook Excel (.xlsx) 13 Sheet resmi bertema KAP (Navy/Steel Blue), lengkap dengan formula aktif dan daftar PBC.", body_style)
        ],
    ]
    table_p2 = Table(table_p2_data, colWidths=[8*mm, 36*mm, 68*mm, 66*mm], repeatRows=1)
    table_p2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 4.2),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, ROW_ALT]),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
    ]))
    story.append(table_p2)
    story.append(Spacer(1, 8))

    # Section 3: Cheatsheet & Petunjuk Kepatuhan
    story.append(Paragraph("3. RINGKASAN JALUR CEPAT & PRINSIP KEPATUHAN (AUDITOR'S CHEATSHEET)", h1_style))

    summary_boxes = [
        [
            Paragraph("<b>Jalur Cepat 6 Langkah Auditor:</b><br/>"
                      "1. <b>Upload GL</b> ➔ 2. <b>Cek Tax Mapping</b> ➔ 3. <b>Upload Faktur & Sync DPP</b> ➔ "
                      "4. <b>Scan Akun Penampung (Biaya Lain)</b> ➔ 5. <b>Input SPT & Klik AI Diagnostic</b> ➔ "
                      "6. <b>Review Dashboard & Download KKP Excel</b>.", body_style),
            Paragraph("<b>Keamanan & Privasi Data Klien (100% Client-Side):</b><br/>"
                      "• Seluruh data Buku Besar diproses lokal di peramban pengguna.<br/>"
                      "• Tidak ada penyimpanan data keuangan di server perantara.<br/>"
                      "• API Key Claude tersimpan secara aman di localStorage browser.", body_style)
        ]
    ]
    summary_table = Table(summary_boxes, colWidths=[92*mm, 86*mm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), CARD_BG_1),
        ('BACKGROUND', (1, 0), (1, 0), CARD_BG_2),
        ('BOX', (0, 0), (0, 0), 1, STEEL_BLUE),
        ('BOX', (1, 0), (1, 0), 1, colors.HexColor("#16A34A")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 8))

    # Footer Sign-off Box
    signoff_data = [
        [
            Paragraph("<b>Disiapkan Oleh:</b><br/><font color='#64748B'>Divisi IT Support & Pengembang Sistem</font>", body_style),
            Paragraph("<b>Diverifikasi Oleh:</b><br/><font color='#64748B'>Tax Senior & Tax Manager</font>", body_style),
            Paragraph("<b>Disetujui Oleh:</b><br/><font color='#64748B'>Partner in Charge (KAP Kuncara Budi Santosa)</font>", body_style)
        ]
    ]
    signoff_table = Table(signoff_data, colWidths=[59*mm, 59*mm, 60*mm])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PALE_GRAY),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(signoff_table)

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Clean 2-Page PDF Generated successfully: {output_filename}")

    # Re-render PNGs
    pdf = pdfium.PdfDocument(output_filename)
    for i, page in enumerate(pdf):
        page.render(scale=2).to_pil().save(f"sop_page_{i+1}.png")
    print("Updated preview images generated.")

if __name__ == "__main__":
    output_pdf = os.path.join(os.getcwd(), "md", "SOP_Panduan_Penggunaan_AI_Tax_Agent.pdf")
    generate_pdf(output_pdf)

