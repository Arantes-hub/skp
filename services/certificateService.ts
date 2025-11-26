
import jsPDF from 'jspdf';

interface CertificateOptions {
    name: string;
    courseTitle: string;
    customName?: string;
    color?: string;
    score?: string; // New field for the grade
}

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 108, g: 99, b: 255 }; // Default to #6C63FF
};

export const generateCertificate = (options: CertificateOptions) => {
  const { name, courseTitle, customName, color = '#6C63FF', score } = options;
  const displayName = customName || name;
  const themeColor = hexToRgb(color);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Border
  doc.setLineWidth(1.5);
  doc.setDrawColor(themeColor.r, themeColor.g, themeColor.b);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Title
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Certificate of Completion', pageWidth / 2, 50, { align: 'center' });

  // Subtitle
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.text('This certificate is proudly presented to', pageWidth / 2, 70, { align: 'center' });

  // User Name
  doc.setFontSize(32);
  doc.setFont('times', 'italic');
  doc.setTextColor(themeColor.r, themeColor.g, themeColor.b);
  doc.text(displayName, pageWidth / 2, 90, { align: 'center' });

  // Description
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('for successfully completing the course', pageWidth / 2, 110, { align: 'center' });

  // Course Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(courseTitle, pageWidth / 2, 125, { align: 'center' });

  // Score (If available)
  if (score) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(themeColor.r, themeColor.g, themeColor.b);
      doc.text(`Final Grade: ${score}`, pageWidth / 2, 140, { align: 'center' });
  }

  // Date and Signature
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  doc.text(dateStr, 45, pageHeight - 30, { align: 'center' });
  doc.line(25, pageHeight - 35, 65, pageHeight - 35);
  doc.text('Date', 45, pageHeight - 25, { align: 'center' });

  doc.text('SkillSpark Platform', pageWidth - 65, pageHeight - 30, { align: 'center' });
  doc.line(pageWidth - 85, pageHeight - 35, pageWidth - 45, pageHeight - 35);
  doc.text('Signature', pageWidth - 65, pageHeight - 25, { align: 'center' });
  
  doc.save(`Certificate_${courseTitle.replace(/\s+/g, '_')}.pdf`);
};
