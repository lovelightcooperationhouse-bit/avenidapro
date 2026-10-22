/**
 * Transforme un élément de la page en PDF A4 (portrait), sur plusieurs pages si nécessaire.
 * Les bibliothèques ne sont chargées qu'au moment de l'export.
 */
export async function elementToPdf(el: HTMLElement) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff", windowWidth: el.scrollWidth });
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const pageW = 210;
  const pageH = 297;
  const margin = 8;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;
  const usable = pageH - margin * 2;

  if (imgH <= usable) {
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, imgW, imgH);
  } else {
    // Découpe en tranches de la hauteur d'une page
    const sliceH = Math.floor((usable * canvas.width) / imgW);
    for (let y = 0, page = 0; y < canvas.height; y += sliceH, page++) {
      const part = document.createElement("canvas");
      part.width = canvas.width;
      part.height = Math.min(sliceH, canvas.height - y);
      part.getContext("2d")!.drawImage(canvas, 0, y, canvas.width, part.height, 0, 0, canvas.width, part.height);
      if (page > 0) pdf.addPage();
      pdf.addImage(part.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, imgW, (part.height * imgW) / canvas.width);
    }
  }
  return pdf;
}

export async function blobToBase64(blob: Blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}
