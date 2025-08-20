// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addHeaderAndSetStartY, addReportTitle, addTableToDoc } from './pdfTheme';

// यह मुख्य फ़ंक्शन है जो पूरी PDF जनरेट करेगा
export const generatePdf = (title, generateContent, logoUrl) => {
    const doc = new window.jspdf.jsPDF();

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = logoUrl;

    img.onload = () => {
        const imgWidth = 25;
        const imgHeight = (img.height * imgWidth) / img.width;

        let startY = addHeaderAndSetStartY(doc, img, imgWidth, imgHeight);
        startY = addReportTitle(doc, startY, title);

        // कंटेंट जनरेट करें (यह फ़ंक्शन हर PDF के लिए अलग होगा)
        generateContent(doc, startY);

        doc.save(`${title.replace(/ /g, '_')}_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
    };

    img.onerror = () => {
        console.warn("Logo image could not be loaded. Generating PDF without logo.");
        
        let startY = addHeaderAndSetStartY(doc, null, 0, 0);
        startY = addReportTitle(doc, startY, title);
        
        generateContent(doc, startY);

        doc.save(`${title.replace(/ /g, '_')}_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
    };
};

// यह फ़ंक्शन सिर्फ़ टेबल का कंटेंट जनरेट करने के लिए है
export const createTableContent = (doc, startY, columns, rows) => {
    addTableToDoc(doc, columns, rows, startY);
};