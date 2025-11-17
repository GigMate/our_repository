import { readFile, readdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from 'jspdf';
const { jsPDF } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to replace unicode characters with ASCII equivalents
function sanitizeText(text) {
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

async function generateCombinedPDF() {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  // Get all markdown files
  const files = await readdir(__dirname);
  const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('README'));

  // Create cover page
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text('GigMate', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });

  pdf.setFontSize(18);
  pdf.text('Complete Documentation Package', pageWidth / 2, pageHeight / 2, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.text(`${mdFiles.length} Documents`, pageWidth / 2, pageHeight / 2 + 15, { align: 'center' });
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, pageWidth / 2, pageHeight / 2 + 25, { align: 'center' });

  console.log(`Processing ${mdFiles.length} markdown files...`);

  for (let i = 0; i < mdFiles.length; i++) {
    const file = mdFiles[i];
    console.log(`Processing: ${file}`);

    try {
      const content = await readFile(join(__dirname, file), 'utf-8');
      const lines = content.split('\n');

      pdf.addPage();
      let yPosition = margin;

      // Document title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      const title = file.replace('.md', '').replace(/_/g, ' ');
      pdf.text(sanitizeText(title), margin, yPosition);
      yPosition += 15;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Document ${i + 1} of ${mdFiles.length}`, margin, yPosition);
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
        let fontStyle = 'normal';

        if (line.startsWith('# ')) {
          fontStyle = 'bold';
          fontSize = 18;
          processedLine = processedLine.replace(/^# /, '');
          yPosition += 5;
        } else if (line.startsWith('## ')) {
          fontStyle = 'bold';
          fontSize = 16;
          processedLine = processedLine.replace(/^## /, '');
          yPosition += 4;
        } else if (line.startsWith('### ')) {
          fontStyle = 'bold';
          fontSize = 14;
          processedLine = processedLine.replace(/^### /, '');
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
      console.error(`Failed to add ${file}:`, error.message);
    }
  }

  // Add page numbers
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

  // Save to public folder
  const pdfBytes = pdf.output('arraybuffer');
  await writeFile(join(__dirname, 'public', 'GigMate_Documentation.pdf'), Buffer.from(pdfBytes));

  console.log('PDF generated successfully: public/GigMate_Documentation.pdf');
}

generateCombinedPDF().catch(console.error);
