
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadAsPDF = async (elementId: string, fileName: string): Promise<void> => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  try {
    const canvas = await html2canvas(input, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = imgWidth / imgHeight;
    const widthInPdf = pdfWidth;
    const heightInPdf = widthInPdf / ratio;

    let heightLeft = heightInPdf;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, widthInPdf, heightInPdf);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - heightInPdf;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, widthInPdf, heightInPdf);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Sorry, there was an error creating the PDF. Please try again.");
  }
};