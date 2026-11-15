import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

/**
 * Renders the invoice paper to a canvas and saves it as an A4 PDF,
 * slicing onto extra pages when the invoice is taller than one page.
 */
export async function downloadPdf(paper: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(paper, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= pageHeight) {
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
  } else {
    // Slice the tall canvas into page-sized strips.
    const pxPerMm = canvas.width / imgWidth;
    const pageHeightPx = Math.floor(pageHeight * pxPerMm);

    let renderedPx = 0;
    let page = 0;
    while (renderedPx < canvas.height) {
      const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedPx);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceHeight;
      const ctx = slice.getContext("2d");
      if (!ctx) throw new Error("Could not create PDF page canvas");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      if (page > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL("image/png"), "PNG", 0, 0, imgWidth, sliceHeight / pxPerMm);
      renderedPx += sliceHeight;
      page += 1;
    }
  }

  pdf.save(filename);
}
