// pdfTheme.js
export const standardColors = {
  headerGray: [100, 100, 100],  // #646464
  titleDark: [30, 30, 30],      // #1E1E1E
  textMedium: [50, 50, 50],     // #323232
  borderLight: [200, 200, 200], // #C8C8C8
  tableBlue: [37, 99, 235],     // #2563EB
  white: [255, 255, 255],       // #FFFFFF
  rowEven: [240, 248, 255],     // #F0F8FF
  black: [0, 0, 0]              // #000000
};

export const addHeaderAndSetStartY = (doc, reportTitle, img, imgWidth, imgHeight) => {
  const marginX = 14, marginY = 10, textOffset = 5;

  if (img) doc.addImage(img, 'JPEG', marginX, marginY, imgWidth, imgHeight);

  // Date
  doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(...standardColors.headerGray);
  doc.text(`Date: ${new Date().toLocaleString()}`, 
    doc.internal.pageSize.width - marginX, marginY + 10, { align: 'right' });

  // Company Info
  const companyName = "GOOD LUCK BOOK STORE";
  const companyAddress = "Shop NO. 2, Shriji Tower, Ashoka Garden, Bhopal";
  const companyMobile = "Mobile Number: 7024136476";
  const companyGST = "GST NO: 23EAVPP3772F1Z8";

  doc.setFontSize(12).setFont('helvetica', 'bold').setTextColor(...standardColors.titleDark);
  let x = img ? (marginX + imgWidth + textOffset) : marginX;
  let y = marginY + textOffset;

  doc.text(companyName, x, y);

  doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(...standardColors.textMedium);
  y += 7; doc.text(companyAddress, x, y);
  y += 5; doc.text(companyMobile, x, y);
  y += 5; doc.text(companyGST, x, y);

  const maxY = Math.max(img ? (marginY + imgHeight) : marginY, y);

  // Report Title
  doc.setFontSize(18).setFont('helvetica', 'bold').setTextColor(...standardColors.titleDark);
  const reportTitleY = maxY + 10;
  doc.text(reportTitle, doc.internal.pageSize.width / 2, reportTitleY, { align: 'center' });

  // Separator
  doc.setLineWidth(0.5).setDrawColor(...standardColors.borderLight);
  doc.line(marginX, reportTitleY + 5, doc.internal.pageSize.width - marginX, reportTitleY + 5);

  return reportTitleY + 10;
};

export const addTableToDoc = (doc, columns, rows, startY) => {
  doc.autoTable({
    head: [columns],
    body: rows,
    startY: startY + 5,
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 3,
      textColor: standardColors.black,
      valign: 'middle',
      halign: 'center',
    },
    headStyles: {
      fillColor: standardColors.tableBlue,
      textColor: standardColors.white,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.1,
      lineColor: standardColors.borderLight
    },
    bodyStyles: {
      lineWidth: 0.1,
      lineColor: standardColors.borderLight
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        data.cell.styles.fillColor = data.row.index % 2 === 0 ? 
          standardColors.rowEven : standardColors.white;
      }
    },
    didDrawPage: (data) => {
      const str = "Page " + doc.internal.getNumberOfPages();
      doc.setFontSize(8).setTextColor(...standardColors.black);
      doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
    }
  });
  return doc.autoTable.previous.finalY + 10;
};
