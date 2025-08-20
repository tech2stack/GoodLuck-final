// src/utils/pdfTheme.js

// jspdf और jspdf-autotable लाइब्रेरीज को इंपोर्ट करें
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// सभी PDF में इस्तेमाल होने वाले सामान्य रंग और स्टाइल
export const standardColors = {
  headerGray: [100, 100, 100],  // हेडर का ग्रे रंग: #646464
  titleDark: [30, 30, 30],      // शीर्षक का गहरा रंग: #1E1E1E
  textMedium: [50, 50, 50],     // सामान्य टेक्स्ट का मध्यम रंग: #323232
  borderLight: [200, 200, 200], // बॉर्डर का हल्का रंग: #C8C8C8
  tableBlue: [37, 99, 235],     // टेबल हेडर का नीला रंग: #2563EB
  white: [255, 255, 255],       // सफेद रंग: #FFFFFF
  rowEven: [240, 248, 255],     // टेबल की सम पंक्तियों का रंग: #F0F8FF
  black: [0, 0, 0]              // काला रंग: #000000
};

// यह फ़ंक्शन PDF में हेडर जोड़ता है (लोगो और कंपनी की जानकारी)
// और अगले कंटेंट के लिए शुरुआती Y-कोऑर्डिनेट लौटाता है।
export const addHeaderAndSetStartY = (doc, img, imgWidth, imgHeight) => {
  const marginX = 14, marginY = 10;
  const pageWidth = doc.internal.pageSize.width;
  const rightAlignX = pageWidth - marginX;

  // लोगो को बाईं ओर जोड़ें
  const imgY = marginY - 4;
  const imgX = marginX;
  const adjustedImgHeight = 22;
  if (img) doc.addImage(img, 'JPEG', imgX, imgY, imgWidth, adjustedImgHeight);

  // कंपनी की जानकारी को दाईं ओर जोड़ें
  const companyName = "GOOD LUCK BOOK STORE";
  const companyAddress = "Shop NO. 2, Shriji Tower, Ashoka Garden, Bhopal";
  const companyMobile = "Mobile Number: 7024136476";
  const companyGST = "GST NO: 23EAVPP3772F1Z8";

  doc.setFontSize(12).setFont('helvetica', 'bold').setTextColor(...standardColors.titleDark);
  let y = marginY;
  const companyNameX = rightAlignX; 

  doc.text(companyName, companyNameX, y, { align: 'right' });

  doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(...standardColors.textMedium);
  y += 5; doc.text(companyAddress, rightAlignX, y, { align: 'right' });
  y += 5; doc.text(companyMobile, rightAlignX, y, { align: 'right' });
  y += 5; doc.text(companyGST, rightAlignX, y, { align: 'right' });

  // यह सुनिश्चित करें कि विभाजक (separator) सही जगह पर आए
  const maxY = Math.max(img ? (imgY + adjustedImgHeight) : y);

  // हेडर के नीचे एक लाइन खींचें
  doc.setLineWidth(0.5).setDrawColor(...standardColors.borderLight);
  doc.line(marginX, maxY + 5, pageWidth - marginX, maxY + 5);

  // हेडर के बाद कंटेंट के लिए शुरुआती Y-कोऑर्डिनेट लौटाएँ
  return maxY + 15;
};

// यह फ़ंक्शन रिपोर्ट का शीर्षक जोड़ता है और उसे थोड़ा ऊपर करता है
export const addReportTitle = (doc, startY, reportTitle) => {
    // यहाँ Y-कोऑर्डिनेट को कम किया गया है ताकि शीर्षक ऊपर चला जाए
    doc.setFontSize(14).setFont('helvetica', 'bold').setTextColor(...standardColors.titleDark);
    doc.text(reportTitle, doc.internal.pageSize.width / 2, startY, { align: 'center' });

    // शीर्षक के बाद अगले कंटेंट के लिए Y-कोऑर्डिनेट लौटाएँ
    // इसे भी कम किया गया है ताकि अगली सामग्री ऊपर रहे
    return startY + 10; 
};

// यह फ़ंक्शन PDF में टेबल जोड़ता है
export const addTableToDoc = (doc, columns, rows, startY) => {
  doc.autoTable({
    head: [columns],
    body: rows,
    // यहाँ Y-कोऑर्डिनेट को कम किया गया है ताकि टेबल ऊपर चली जाए
    startY: startY, 
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 2,
      textColor: standardColors.black,
      valign: 'middle',
      halign: 'left'
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

  if (doc.lastAutoTable) {
    return doc.lastAutoTable.finalY + 10;
  }
  
  return startY + 30;
};