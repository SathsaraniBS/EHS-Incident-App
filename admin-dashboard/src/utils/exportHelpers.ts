import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Incident, resolveImageUrl } from '@/services/api';

const today = () => new Date().toISOString().split('T')[0];
const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : 'N/A');

// ---------- Excel (CSV) ----------
const escapeCsv = (value: unknown): string =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

export const exportToExcel = (incidents: Incident[]) => {
  const headers = ['ID', 'Section', 'Location', 'Description', 'Severity', 'Status', 'Image URL', 'Date & Time'];

  const rows = incidents.map((item) => [
    `#${item.id}`,
    item.section,
    item.location,
    item.description,
    item.severity || 'Medium',
    item.status || 'Pending',
    resolveImageUrl(item.image_url) ?? 'No Image',
    formatDate(item.created_at),
  ]);

  const csv = [headers, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\r\n');

  // The BOM (﻿) helps Excel read UTF-8 correctly.
  // Since a Blob is used, the bug where data gets truncated due to the '#' character does not occur.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `EHS_Audit_Reports_${today()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ---------- PDF ----------
const getBase64ImageFromURL = (url: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // CORS must be enabled on the backend.
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = url;
  });

export const exportToPDF = async (incidents: Incident[]) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // landscape

  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('EHS Incident & Safety Audit Reports', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 24);

  // All images are loaded simultaneously (in parallel).
  const images = await Promise.all(
    incidents.map(async (item) => {
      const url = resolveImageUrl(item.image_url);
      return url ? getBase64ImageFromURL(url) : '';
    })
  );

  const IMG_COL = 6;
  const IMG_SIZE = 14;

  const body = incidents.map((item, idx) => [
    `#${item.id}`,
    item.section,
    item.location,
    item.description,
    item.severity || 'Medium',
    item.status || 'Pending',
    images[idx] ? '' : 'No Image',
    formatDate(item.created_at),
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['ID', 'Section', 'Location', 'Description', 'Severity', 'Status', 'Evidence', 'Date & Time']],
    body,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 32 },
      2: { cellWidth: 32 },
      3: { cellWidth: 70 },
      4: { cellWidth: 20 },
      5: { cellWidth: 22 },
      6: { cellWidth: 24, halign: 'center' },
      7: { cellWidth: 45 },
    },
    // I am setting a minimum height for the rows that contain the photo.
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === IMG_COL && images[data.row.index]) {
        data.cell.styles.minCellHeight = IMG_SIZE + 4;
      }
    },
    // The photo is drawn in the center of the cell.
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === IMG_COL) {
        const img = images[data.row.index];
        if (!img) return;
        try {
          const x = data.cell.x + (data.cell.width - IMG_SIZE) / 2;
          const y = data.cell.y + (data.cell.height - IMG_SIZE) / 2;
          doc.addImage(img, 'JPEG', x, y, IMG_SIZE, IMG_SIZE);
        } catch (err) {
          console.error('PDF image draw error:', err);
        }
      }
    },
  });

  doc.save(`EHS_Audit_Reports_${today()}.pdf`);
};