
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TeacherData, InstituteData } from '../types';

// Function to safely add an image and handle potential errors
const addImageToPdf = (doc: jsPDF, imageData: string, x: number, y: number, width: number, height: number) => {
    try {
        // Check if the image data is a valid base64 string
        if (imageData && imageData.startsWith('data:image')) {
            const imageType = imageData.split(';')[0].split('/')[1].toUpperCase();
            if (['JPEG', 'PNG', 'JPG'].includes(imageType)) {
                doc.addImage(imageData, imageType, x, y, width, height);
            }
        }
    } catch (e) {
        console.error("Error adding image to PDF:", e);
        // Continue without the image if it fails
    }
};

export const downloadPdfWithTables = (
  title: string,
  headers: any[],
  bodies: any[],
  teacherData: TeacherData,
  instituteData: InstituteData
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageMargin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (pageMargin * 2);

  headers.forEach((header, index) => {
    const body = bodies[index];
    
    autoTable(doc, {
      head: header,
      body: body,
      startY: 45, // Start table after the header
      margin: { top: 45, right: pageMargin, bottom: 25, left: pageMargin },
      styles: {
          fontSize: 8,
          cellPadding: 2,
      },
      headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
      },
      didDrawPage: (data: any) => {
        // --- HEADER ---
        // Logos
        const logoSize = 15;
        if (instituteData.logo) {
            addImageToPdf(doc, instituteData.logo, pageMargin, pageMargin - 5, logoSize, logoSize);
        }
        if (teacherData.logo) {
             addImageToPdf(doc, teacherData.logo, pageWidth - pageMargin - logoSize, pageMargin - 5, logoSize, logoSize);
        }
        
        // Header Text
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(instituteData.name || 'Nombre del Instituto', pageMargin + logoSize + 2, pageMargin);
        doc.text(teacherData.name || 'Nombre del Profesor', pageWidth - pageMargin - logoSize - 2, pageMargin, { align: 'right' });
        
        // Main Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40);
        doc.text(title, pageWidth / 2, 30, { align: 'center' });

        // Header Separator Line
        doc.setDrawColor(180);
        doc.line(pageMargin, 35, pageWidth - pageMargin, 35);


        // --- FOOTER ---
        const pageNum = doc.internal.pages.length > 1 ? doc.internal.getCurrentPageInfo().pageNumber : 1;
        
        // Footer Separator Line
        doc.line(pageMargin, pageHeight - 20, pageWidth - pageMargin, pageHeight - 20);

        doc.setFontSize(8);
        doc.setTextColor(120);
        
        // Left part of footer
        doc.text(`${instituteData.name || 'Instituto'} - ${teacherData.name || 'Profesor'}`, pageMargin, pageHeight - 15);
        
        // Center part of footer (Page Number)
        doc.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
        
        // Right part of footer (Date)
        const date = new Date().toLocaleDateString('es-ES');
        doc.text(date, pageWidth - pageMargin, pageHeight - 15, { align: 'right' });
      },
    });

    if (index < headers.length - 1) {
      doc.addPage();
    }
  });


  doc.save(`${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
