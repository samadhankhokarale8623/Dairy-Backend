// src/utils/receiptGenerator.js

import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
// 'fs' (File System) ची आता गरज नाही, म्हणून ते काढून टाकले आहे.

// तारीख फॉरमॅट करण्यासाठी हे फंक्शन
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-IN");

// PDF जनरेटर जो फाईल सेव्ह करण्याऐवजी तिचा डेटा (Buffer) परत करेल
export const generatePdfReceiptBuffer = (data) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    // PDF चा डेटा 'buffers' नावाच्या ॲरेमध्ये जमा केला जाईल
    doc.on('data', buffers.push.bind(buffers));
    
    // PDF तयार झाल्यावर, सर्व डेटा एकत्र करून परत पाठवला जाईल
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // एरर आल्यास, तो कळवला जाईल
    doc.on('error', reject);

    // =======================================================
    // तुमचा PDF तयार करण्याचा सर्व लॉजिक (हा भाग जसाच्या तसा आहे)
    // =======================================================
    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Milk Collection Receipt', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, { align: 'center' });
    doc.moveDown(2);

    // Farmer Details
    doc.fontSize(12).font('Helvetica-Bold').text('Farmer Details');
    doc.fontSize(10).font('Helvetica').text(`Name: ${data.user.firstname} ${data.user.lastname}`);
    doc.text(`Mobile: ${data.user.mobile_number}`);
    doc.text(`Period: ${data.period.charAt(0).toUpperCase() + data.period.slice(1)}`);
    doc.text(`Date Range: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`);
    doc.moveDown();

    // Table Header
    const tableTop = doc.y;
    const itemX = 50;
    const dateX = 50;
    const morningX = 120;
    const eveningX = 350;
    const totalX = 500;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Date', dateX, tableTop);
    doc.text('Morning (L / ₹)', morningX, tableTop, { width: 100 });
    doc.text('Evening (L / ₹)', eveningX, tableTop, { width: 100 });
    doc.text('Total (₹)', totalX, tableTop, { align: 'right' });
    doc.moveTo(itemX, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Table Rows
    doc.font('Helvetica');
    Object.entries(data.dailyTotals).sort(([a], [b]) => new Date(a) - new Date(b)).forEach(([date, totals]) => {
      const y = doc.y;
      doc.text(formatDate(date), dateX, y);
      doc.text(`${totals.morning?.liters?.toFixed(1) || '0.0'}L / ${totals.morning?.amount?.toFixed(2) || '0.00'}`, morningX, y);
      doc.text(`${totals.evening?.liters?.toFixed(1) || '0.0'}L / ${totals.evening?.amount?.toFixed(2) || '0.00'}`, eveningX, y);
      doc.text(`₹${totals.total.amount.toFixed(2)}`, totalX, y, { align: 'right' });
      doc.moveDown();
    });

    // Summary
    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Summary', { align: 'right' });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Liters: ${data.totalLiters} L`, { align: 'right' });
    doc.text(`Total Amount: ₹${data.totalAmount}`, { align: 'right' });
    // =======================================================
    // PDF तयार करण्याचा लॉजिक येथे संपतो
    // =======================================================
    
    // ही ओळ सर्वात शेवटी असली पाहिजे, जी 'end' इव्हेंट सुरू करते
    doc.end(); 
  });
};

// Excel जनरेटर जो फाईल सेव्ह करण्याऐवजी तिचा डेटा (Buffer) परत करेल
export const generateExcelReceiptBuffer = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${data.period.toUpperCase()} Receipt`);

  // Title
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = 'Milk Collection Receipt';
  sheet.getCell('A1').font = { size: 16, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  // Farmer Info
  sheet.mergeCells('A3:B3');
  sheet.getCell('A3').value = `Farmer: ${data.user.firstname} ${data.user.lastname}`;
  sheet.mergeCells('C3:D3');
  sheet.getCell('C3').value = `Mobile: ${data.user.mobile_number}`;
  sheet.mergeCells('A4:B4');
  sheet.getCell('A4').value = `Period: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`;

  // Headers
  const headers = [
      'Date', 'M.Liters', 'M.Amount (₹)',
      'E.Liters', 'E.Amount (₹)', 'Daily Total (₹)'
  ];
  sheet.getRow(6).values = headers;
  sheet.getRow(6).font = { bold: true };

  // Data Rows
  let rowNum = 7;
  Object.entries(data.dailyTotals).sort(([a], [b]) => new Date(a) - new Date(b)).forEach(([date, totals]) => {
      const row = sheet.getRow(rowNum++);
      row.values = [
          formatDate(date),
          totals.morning?.liters || 0,
          totals.morning?.amount || 0,
          totals.evening?.liters || 0,
          totals.evening?.amount || 0,
          totals.total.amount
      ];
      row.getCell(2).numFmt = '0.0';
      row.getCell(3).numFmt = '"₹"#,##0.00';
      row.getCell(4).numFmt = '0.0';
      row.getCell(5).numFmt = '"₹"#,##0.00';
      row.getCell(6).numFmt = '"₹"#,##0.00';
  });

  // Totals
  const totalRow = sheet.getRow(rowNum + 1);
  totalRow.getCell(1).value = 'Grand Total';
  totalRow.font = { bold: true };
  totalRow.getCell(2).value = { formula: `SUM(B7:B${rowNum-1})` };
  totalRow.getCell(3).value = { formula: `SUM(C7:C${rowNum-1})` };
  totalRow.getCell(4).value = { formula: `SUM(D7:D${rowNum-1})` };
  totalRow.getCell(5).value = { formula: `SUM(E7:E${rowNum-1})` };
  totalRow.getCell(6).value = { formula: `SUM(F7:F${rowNum-1})` };
  
  // Formatting
  totalRow.getCell(2).numFmt = '0.0 "L"';
  totalRow.getCell(3).numFmt = '"₹"#,##0.00';
  totalRow.getCell(4).numFmt = '0.0 "L"';
  totalRow.getCell(5).numFmt = '"₹"#,##0.00';
  totalRow.getCell(6).numFmt = '"₹"#,##0.00';
  
  sheet.columns.forEach(column => {
    column.width = 15;
  });

  // फाईल लिहिण्याऐवजी बफर मिळवा
  return await workbook.xlsx.writeBuffer();
};