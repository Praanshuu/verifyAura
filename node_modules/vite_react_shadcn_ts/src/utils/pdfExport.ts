// frontend/src/utils/pdfExport.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFColumn {
  header: string;
  dataKey: string;
}

export interface PDFExportOptions {
  title: string;
  filename: string;
  columns: PDFColumn[];
  data: any[];
  orientation?: 'portrait' | 'landscape';
  additionalInfo?: { label: string; value: string | number }[];
}

/**
 * Export data to PDF with customizable options
 */
export const exportToPDF = (options: PDFExportOptions) => {
  const {
    title,
    filename,
    columns,
    data,
    orientation = 'portrait',
    additionalInfo = []
  } = options;

  // Create new PDF document
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  // Add header with logo/branding
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('VerifyAura', 14, 15);
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 25);

  // Add generation date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const dateStr = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generated on: ${dateStr}`, 14, 32);

  let startY = 38;

  // Add additional info if provided
  if (additionalInfo.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    additionalInfo.forEach((info, index) => {
      doc.text(`${info.label}: ${info.value}`, 14, startY + (index * 6));
    });
    startY += (additionalInfo.length * 6) + 4;
  }

  // Add table
  autoTable(doc, {
    startY: startY,
    head: [columns.map(col => col.header)],
    body: data.map(row => 
      columns.map(col => {
        const value = row[col.dataKey];
        // Format dates
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        // Format booleans
        if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
        }
        return value || '-';
      })
    ),
    theme: 'striped',
    headStyles: {
      fillColor: [34, 197, 94], // Brand green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 10, left: 14, right: 14 }
  });

  // Add footer with page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`${filename}_${Date.now()}.pdf`);
};

/**
 * Export participants to PDF
 */
export const exportParticipantsToPDF = (
  participants: any[],
  eventName?: string
) => {
  const columns: PDFColumn[] = [
    { header: 'Name', dataKey: 'name' },
    { header: 'Email', dataKey: 'email' },
    { header: 'Certificate ID', dataKey: 'certificate_id' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Event', dataKey: 'event_name' },
    { header: 'Created Date', dataKey: 'created_date' }
  ];

  const formattedData = participants.map(p => ({
    name: p.name,
    email: p.email,
    certificate_id: p.certificate_id,
    status: p.revoked ? 'Revoked' : 'Active',
    event_name: p.event_name || eventName || 'N/A',
    created_date: new Date(p.created_at).toLocaleDateString()
  }));

  const additionalInfo = [
    { label: 'Total Participants', value: participants.length },
    { label: 'Active Certificates', value: participants.filter(p => !p.revoked).length },
    { label: 'Revoked Certificates', value: participants.filter(p => p.revoked).length }
  ];

  exportToPDF({
    title: eventName ? `${eventName} - Participants Report` : 'All Participants Report',
    filename: eventName ? `${eventName.replace(/\s+/g, '_')}_participants` : 'all_participants',
    columns,
    data: formattedData,
    orientation: 'landscape',
    additionalInfo
  });
};

/**
 * Export events to PDF
 */
export const exportEventsToPDF = (events: any[]) => {
  const columns: PDFColumn[] = [
    { header: 'Event Name', dataKey: 'event_name' },
    { header: 'Event Code', dataKey: 'event_code' },
    { header: 'Date', dataKey: 'event_date' },
    { header: 'Participants', dataKey: 'participant_count' },
    { header: 'Status', dataKey: 'status' }
  ];

  const formattedData = events.map(e => ({
    event_name: e.event_name,
    event_code: e.event_code,
    event_date: new Date(e.event_date).toLocaleDateString(),
    participant_count: e.participant_count || 0,
    status: e.is_active ? 'Active' : 'Inactive'
  }));

  exportToPDF({
    title: 'Events Report',
    filename: 'events_report',
    columns,
    data: formattedData,
    additionalInfo: [
      { label: 'Total Events', value: events.length },
      { label: 'Active Events', value: events.filter(e => e.is_active).length }
    ]
  });
};

/**
 * Export activity logs to PDF
 */
export const exportActivityLogsToPDF = (logs: any[]) => {
  const columns: PDFColumn[] = [
    { header: 'User', dataKey: 'user_email' },
    { header: 'Action', dataKey: 'action' },
    { header: 'Details', dataKey: 'details' },
    { header: 'Timestamp', dataKey: 'timestamp' }
  ];

  const formattedData = logs.map(log => ({
    user_email: log.user_email || 'System',
    action: log.action,
    details: log.metadata ? JSON.stringify(log.metadata).substring(0, 50) : '-',
    timestamp: new Date(log.created_at).toLocaleString()
  }));

  exportToPDF({
    title: 'Activity Logs Report',
    filename: 'activity_logs',
    columns,
    data: formattedData,
    orientation: 'landscape',
    additionalInfo: [
      { label: 'Total Activities', value: logs.length }
    ]
  });
};
