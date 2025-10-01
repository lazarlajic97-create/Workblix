import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Extended interface to include scale property which exists in html2canvas but may not be in the type definitions
interface Html2CanvasOptionsExtended {
  scale?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
  backgroundColor?: string;
  width?: number;
  height?: number;
  scrollX?: number;
  scrollY?: number;
}

export interface PDFGenerationOptions {
  filename: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number;
  scale?: number;
  addWatermark?: boolean;
  userPlan?: string;
}

export const generatePDFFromElement = async (
  element: HTMLElement,
  options: PDFGenerationOptions
): Promise<void> => {
  const {
    filename,
    format = 'a4',
    orientation = 'portrait',
    quality = 1,
    scale = 2,
    addWatermark = false,
    userPlan = 'free'
  } = options;

  try {
    // Configure html2canvas for better quality
    const html2canvasOptions: Html2CanvasOptionsExtended = {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    };

    const canvas = await html2canvas(element, html2canvasOptions as any);

    const imgData = canvas.toDataURL('image/png', quality);
    
    // Calculate PDF dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // A4 dimensions in mm
    const pdfWidth = orientation === 'portrait' ? 210 : 297;
    const pdfHeight = orientation === 'portrait' ? 297 : 210;
    
    // Calculate scaling to fit content
    const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
    
    const scaledWidth = imgWidth * 0.264583 * ratio;
    const scaledHeight = imgHeight * 0.264583 * ratio;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format,
    });

    // Center the content
    const xOffset = (pdfWidth - scaledWidth) / 2;
    const yOffset = (pdfHeight - scaledHeight) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);
    
    // Add watermark for free users
    if (addWatermark || userPlan === 'free') {
      // Add small watermark at bottom only
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text('Erstellt mit Workblix Free - Upgrade auf Pro für wasserzeichenfreie PDFs', 10, pdfHeight - 5);
    }
    
    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

export const generatePDFFromReactComponent = async (
  componentElement: React.ReactElement,
  options: PDFGenerationOptions
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.height = 'auto';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.zIndex = '-1';
    
    document.body.appendChild(tempContainer);

    try {
      // Render the React component to the temporary container
      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(tempContainer);
        root.render(componentElement);

        // Wait for rendering to complete
        setTimeout(async () => {
          try {
            await generatePDFFromElement(tempContainer, options);
            
            // Clean up
            root.unmount();
            document.body.removeChild(tempContainer);
            resolve();
          } catch (error) {
            // Clean up on error
            root.unmount();
            document.body.removeChild(tempContainer);
            reject(error);
          }
        }, 1000); // Give time for fonts and styles to load
      });
    } catch (error) {
      // Clean up on error
      document.body.removeChild(tempContainer);
      reject(error);
    }
  });
};
