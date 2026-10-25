import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Incident, API_BASE_URL } from '@/services/api';

// Excel Export Helper
export const exportToExcel = (incidents: Incident[]) => {
  const headers = ['ID', 'Section', 'Location', 'Description', 'Image URL', 'Date & Time'];
  const rows = incidents.map(item => [
    `#${item.id}`,
    item.section,
    item.location,
    item.description,
    item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `${API_BASE_URL}${item.image_url}`) : 'No Image',
    item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'
  ]);

  let csvContent = 'data:text/csv;charset=utf-8,' + 
    [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `EHS_Audit_Reports_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to convert image URL to Base64
const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
};

// PDF Export Helper with Fixed Image Fitting
export const exportToPDF = async (incidents: Incident[]) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('EHS Incident & Safety Audit Reports', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);

  const tableRows: any[] = [];

  for (const item of incidents) {
    let imgData = '';
    const imgFullUrl = item.image_url
      ? item.image_url.startsWith('http')
        ? item.image_url
        : `${API_BASE_URL}${item.image_url}`
      : null;

    if (imgFullUrl) {
      try {
        imgData = await getBase64ImageFromURL(imgFullUrl);
      } catch (e) {
        console.error('Error loading image for PDF:', e);
      }
    }

    tableRows.push([
      `#${item.id}`,
      item.section,
      item.location,
      item.description,
      imgData ? { content: '', image: imgData, width: 14, height: 14 } : 'No Image',
      item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'
    ]);
  }

  autoTable(doc, {
    startY: 32,
    head: [['ID', 'Section', 'Location', 'Description', 'Evidence', 'Date & Time']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 45 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 35 }
    },
    // Sets the minimum height (minHeight) of the row to be sufficient for the photograph.
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const cellValue: any = data.row.raw[4];
        if (cellValue && cellValue.image) {
          data.row.height = 18; // The row height is controlled to 18mm for the photograph.
        }
      }
    },
    didDrawCell: (data) => {
      // Draws the photo centered within the cell.
      if (data.section === 'body' && data.column.index === 4) {
        const cellValue: any = data.row.raw[4];
        if (cellValue && cellValue.image) {
          try {
            const xCoord = data.cell.x + (data.cell.width - 14) / 2;
            const yCoord = data.cell.y + (data.cell.height - 14) / 2;
            doc.addImage(
              cellValue.image,
              'JPEG',
              xCoord,
              yCoord,
              14,
              14
            );
          } catch (err) {
            console.error('PDF image draw error:', err);
          }
        }
      }
    }
  });

  doc.save(`EHS_Audit_Reports_${new Date().toISOString().split('T')[0]}.pdf`);
};