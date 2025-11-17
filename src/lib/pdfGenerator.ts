import jsPDF from 'jspdf';
import { marked } from 'marked';

// Function to replace unicode characters with ASCII equivalents
function sanitizeText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")  // Smart quotes
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-')  // En/em dashes
    .replace(/\u2026/g, '...')        // Ellipsis
    .replace(/\u2022/g, '*')          // Bullet point
    .replace(/\u00A9/g, '(c)')        // Copyright
    .replace(/\u00AE/g, '(R)')        // Registered
    .replace(/\u2122/g, '(TM)')       // Trademark
    .replace(/\u00B0/g, ' degrees')   // Degree symbol
    .replace(/[\u2190-\u21FF]/g, '-') // Arrows
    .replace(/[\u2200-\u22FF]/g, '')  // Math symbols
    .replace(/[\u2500-\u257F]/g, '-') // Box drawing
    .replace(/[^\x00-\x7F]/g, '');    // Remove any remaining non-ASCII
}

export async function convertMarkdownToPDF(
  markdownContent: string,
  filename: string,
  title: string
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text(sanitizeText(title), margin, yPosition);
  yPosition += 15;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, margin, yPosition);
  yPosition += 10;

  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  const lines = markdownContent.split('\n');
  pdf.setTextColor(0, 0, 0);

  for (let i = 0; i < lines.length; i++) {
    let line = sanitizeText(lines[i]);

    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    if (line.startsWith('# ')) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      line = line.replace(/^# /, '');
      yPosition += 5;
    } else if (line.startsWith('## ')) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      line = line.replace(/^## /, '');
      yPosition += 4;
    } else if (line.startsWith('### ')) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      line = line.replace(/^### /, '');
      yPosition += 3;
    } else if (line.startsWith('#### ')) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      line = line.replace(/^#### /, '');
      yPosition += 2;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      line = '  * ' + line.substring(2);
    } else if (line.startsWith('> ')) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      line = line.replace(/^> /, '');
    } else if (line.match(/^\d+\. /)) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
    } else if (line.startsWith('```')) {
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      continue;
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
    }

    line = line.replace(/\*\*(.*?)\*\*/g, '$1');
    line = line.replace(/\*(.*?)\*/g, '$1');
    line = line.replace(/`(.*?)`/g, '$1');
    line = line.replace(/\[(.*?)\]\(.*?\)/g, '$1');

    if (line.trim()) {
      const splitLines = pdf.splitTextToSize(line, maxWidth);

      for (const splitLine of splitLines) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(splitLine, margin, yPosition);
        yPosition += 6;
      }
    } else {
      yPosition += 4;
    }
  }

  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    pdf.text(
      'GigMate Documentation',
      margin,
      pageHeight - 10
    );
    pdf.text(
      '© 2025 GigMate, Inc.',
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  pdf.save(filename);
}

export async function fetchAndConvertToPDF(
  filePath: string,
  fileName: string,
  title: string
): Promise<void> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error('File not found');
    }
    const content = await response.text();
    await convertMarkdownToPDF(content, fileName, title);
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
}

export async function generateCombinedPDF(
  files: Array<{ path: string; name: string; title: string }>,
  outputFilename: string
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text('GigMate', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });

  pdf.setFontSize(18);
  pdf.text('Complete Documentation Package', pageWidth / 2, pageHeight / 2, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.text(`${files.length} Documents`, pageWidth / 2, pageHeight / 2 + 15, { align: 'center' });
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, pageWidth / 2, pageHeight / 2 + 25, { align: 'center' });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const response = await fetch(file.path);
      if (!response.ok) continue;

      const content = await response.text();
      const lines = content.split('\n');

      pdf.addPage();
      let yPosition = margin;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.text(sanitizeText(file.title), margin, yPosition);
      yPosition += 15;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Document ${i + 1} of ${files.length}`, margin, yPosition);
      yPosition += 10;

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      pdf.setTextColor(0, 0, 0);

      for (const line of lines) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        let processedLine = sanitizeText(line);
        let fontSize = 10;
        let fontStyle: 'normal' | 'bold' | 'italic' = 'normal';

        if (line.startsWith('# ')) {
          fontStyle = 'bold';
          fontSize = 18;
          processedLine = line.replace(/^# /, '');
          yPosition += 5;
        } else if (line.startsWith('## ')) {
          fontStyle = 'bold';
          fontSize = 16;
          processedLine = line.replace(/^## /, '');
          yPosition += 4;
        } else if (line.startsWith('### ')) {
          fontStyle = 'bold';
          fontSize = 14;
          processedLine = line.replace(/^### /, '');
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          processedLine = '  * ' + processedLine.substring(2);
        }

        pdf.setFont('helvetica', fontStyle);
        pdf.setFontSize(fontSize);

        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '$1');
        processedLine = processedLine.replace(/\*(.*?)\*/g, '$1');
        processedLine = processedLine.replace(/`(.*?)`/g, '$1');

        if (processedLine.trim()) {
          const splitLines = pdf.splitTextToSize(processedLine, maxWidth);
          for (const splitLine of splitLines) {
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(splitLine, margin, yPosition);
            yPosition += 6;
          }
        } else {
          yPosition += 4;
        }
      }
    } catch (error) {
      console.error(`Failed to add ${file.name} to combined PDF:`, error);
    }
  }

  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  pdf.save(outputFilename);
}
