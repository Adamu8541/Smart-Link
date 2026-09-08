/**
 * SmartLink High-Resolution Slip Print & PDF Export Engine
 *
 * Provides crisp 300 DPI PDF generation, PNG image export,
 * and direct thermal / desktop printing routines.
 */

export class SlipPrintEngine {
  /**
   * Export DOM element as a crisp, print-ready PDF
   */
  static async exportToPdf(params: {
    elementId: string;
    filename: string;
    format?: "a4" | "card";
    orientation?: "portrait" | "landscape";
  }): Promise<boolean> {
    const { elementId, filename, format = "a4", orientation = "portrait" } = params;

    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Slip element with ID "${elementId}" not found in DOM.`);
      return false;
    }

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      // 1. Render high-resolution canvas at 2.5x - 3x display scale
      const canvas = await html2canvas(element, {
        scale: 3, // High-DPI 300 DPI equivalent
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFFFFF",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

      // 2. Determine PDF dimensions
      if (format === "card") {
        // Standard ID-1 card size: 85.6mm x 54mm (or double height for foldable 85.6mm x 108mm)
        const pdf = new jsPDF({
          orientation: orientation,
          unit: "mm",
          format: [85.6, 110], // Foldable card format
        });

        pdf.addImage(imgData, "PNG", 0, 0, 85.6, 110);
        pdf.save(`${filename}.pdf`);
      } else {
        // Standard A4 sheet: 210mm x 297mm
        const pdf = new jsPDF({
          orientation: orientation,
          unit: "mm",
          format: "a4",
        });

        const imgWidth = 190;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 10;

        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`${filename}.pdf`);
      }

      return true;
    } catch (err) {
      console.error("PDF Export Error:", err);
      // Fallback: trigger system print
      window.print();
      return false;
    }
  }

  /**
   * Export DOM element as a High-Resolution PNG image
   */
  static async exportToPng(elementId: string, filename: string): Promise<boolean> {
    const element = document.getElementById(elementId);
    if (!element) return false;

    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFFFFF",
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (err) {
      console.error("PNG Export Error:", err);
      return false;
    }
  }

  /**
   * Trigger direct system print for thermal or standard office printers
   */
  static triggerPrint(): void {
    window.print();
  }
}
