const PDFDocument = require('pdfkit');

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatMoney = amount => {
  return `Rs. ${Number(amount || 0).toFixed(2)}`;
};

const formatDate = date => {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = date => {
  if (!date) return '-';

  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatPeriod = (reportType, year, month) => {
  if (reportType === 'monthly') {
    return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric'
    });
  }

  return String(year);
};

const COLORS = {
  primary: '#0F766E',
  primaryDark: '#115E59',
  primaryLight: '#CCFBF1',

  dark: '#0F172A',
  text: '#334155',
  muted: '#64748B',

  border: '#CBD5E1',
  lightBorder: '#E2E8F0',

  background: '#F8FAFC',
  white: '#FFFFFF',

  green: '#15803D',
  orange: '#D97706',

  tableHeader: '#134E4A',
  tableAlternate: '#F8FAFC'
};


/*
|--------------------------------------------------------------------------
| Draw Section Title
|--------------------------------------------------------------------------
*/

const drawSectionTitle = (doc, title, y) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(COLORS.dark)
    .text(title, 40, y);

  doc
    .moveTo(40, y + 19)
    .lineTo(555, y + 19)
    .lineWidth(0.7)
    .strokeColor(COLORS.lightBorder)
    .stroke();

  return y + 30;
};


/*
|--------------------------------------------------------------------------
| Draw Small Information Box
|--------------------------------------------------------------------------
*/

const drawInfoBox = (
  doc,
  x,
  y,
  width,
  height,
  title,
  value
) => {
  doc
    .roundedRect(x, y, width, height, 6)
    .fillAndStroke(
      COLORS.white,
      COLORS.lightBorder
    );

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(COLORS.muted)
    .text(
      title.toUpperCase(),
      x + 10,
      y + 10,
      {
        width: width - 20
      }
    );

  doc
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .fillColor(COLORS.dark)
    .text(
      String(value || '-'),
      x + 10,
      y + 25,
      {
        width: width - 20,
        height: height - 30,
        ellipsis: true
      }
    );
};


/*
|--------------------------------------------------------------------------
| Draw Earnings Card
|--------------------------------------------------------------------------
*/

const drawEarningsCard = (
  doc,
  x,
  y,
  width,
  title,
  amount,
  amountColor
) => {
  doc
    .roundedRect(x, y, width, 75, 7)
    .fillAndStroke(
      COLORS.white,
      COLORS.lightBorder
    );

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      title.toUpperCase(),
      x + 12,
      y + 13
    );

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(amountColor)
    .text(
      formatMoney(amount),
      x + 12,
      y + 36
    );
};


/*
|--------------------------------------------------------------------------
| Draw Page Header
|--------------------------------------------------------------------------
*/

const drawPageHeader = (
  doc,
  reportType,
  year,
  month,
  station
) => {
  const pageWidth = doc.page.width;

  /*
   * Header background
   */
  doc
    .rect(0, 0, pageWidth, 88)
    .fill(COLORS.primary);

  /*
   * Logo / brand
   */
  doc
    .font('Helvetica-Bold')
    .fontSize(23)
    .fillColor(COLORS.white)
    .text(
      'VoltFlow',
      40,
      22
    );

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#CCFBF1')
    .text(
      'EV Charging Management System',
      40,
      51
    );

  /*
   * Report title
   */
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(COLORS.white)
    .text(
      'OWNER EARNINGS',
      350,
      22,
      {
        width: 205,
        align: 'right'
      }
    );

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#CCFBF1')
    .text(
      `${reportType === 'monthly' ? 'Monthly' : 'Yearly'} Report`,
      350,
      44,
      {
        width: 205,
        align: 'right'
      }
    );

  /*
   * Station name in header
   */
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#CCFBF1')
    .text(
      station?.stationName || '-',
      350,
      61,
      {
        width: 205,
        align: 'right',
        ellipsis: true
      }
    );
};


/*
|--------------------------------------------------------------------------
| Draw Footer
|--------------------------------------------------------------------------
*/

const drawFooter = doc => {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  const y = pageHeight - 35;

  doc
    .moveTo(40, y - 8)
    .lineTo(pageWidth - 40, y - 8)
    .lineWidth(0.6)
    .strokeColor(COLORS.lightBorder)
    .stroke();

  /*
   * No Confidential text.
   */
};


/*
|--------------------------------------------------------------------------
| Draw Payment Table Header
|--------------------------------------------------------------------------
*/

const drawPaymentTableHeader = doc => {
  const y = doc.y;

  const columns = {
    date: 40,
    transaction: 125,
    amount: 300,
    tax: 385,
    total: 470
  };

  const widths = {
    date: 80,
    transaction: 165,
    amount: 75,
    tax: 75,
    total: 85
  };

  /*
   * Header background
   */
  doc
    .roundedRect(
      40,
      y,
      515,
      25,
      4
    )
    .fill(COLORS.tableHeader);

  /*
   * Header text
   */
  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(COLORS.white);

  doc.text(
    'DATE',
    columns.date + 7,
    y + 8,
    {
      width: widths.date
    }
  );

  doc.text(
    'TRANSACTION ID',
    columns.transaction + 7,
    y + 8,
    {
      width: widths.transaction
    }
  );

  doc.text(
    'AMOUNT',
    columns.amount,
    y + 8,
    {
      width: widths.amount,
      align: 'right'
    }
  );

  doc.text(
    'TAX',
    columns.tax,
    y + 8,
    {
      width: widths.tax,
      align: 'right'
    }
  );

  doc.text(
    'TOTAL',
    columns.total,
    y + 8,
    {
      width: widths.total - 7,
      align: 'right'
    }
  );

  doc.y = y + 25;
};


/*
|--------------------------------------------------------------------------
| Draw Payment Table Row
|--------------------------------------------------------------------------
*/

const drawPaymentRow = (
  doc,
  payment,
  index
) => {
  const rowHeight = 28;
  const y = doc.y;

  const columns = {
    date: 40,
    transaction: 125,
    amount: 300,
    tax: 385,
    total: 470
  };

  const widths = {
    date: 80,
    transaction: 165,
    amount: 75,
    tax: 75,
    total: 85
  };

  /*
   * Alternating background
   */
  if (index % 2 === 0) {
    doc
      .rect(
        40,
        y,
        515,
        rowHeight
      )
      .fill(COLORS.tableAlternate);
  }

  /*
   * Bottom border
   */
  doc
    .moveTo(40, y + rowHeight)
    .lineTo(555, y + rowHeight)
    .lineWidth(0.4)
    .strokeColor(COLORS.lightBorder)
    .stroke();

  /*
   * Row text
   */
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(COLORS.text);

  doc.text(
    formatDate(payment.date),
    columns.date + 7,
    y + 9,
    {
      width: widths.date
    }
  );

  doc.text(
    payment.transactionID || '-',
    columns.transaction + 7,
    y + 9,
    {
      width: widths.transaction,
      ellipsis: true
    }
  );

  doc.text(
    formatMoney(payment.amount),
    columns.amount,
    y + 9,
    {
      width: widths.amount,
      align: 'right'
    }
  );

  doc.text(
    formatMoney(payment.taxAmount),
    columns.tax,
    y + 9,
    {
      width: widths.tax,
      align: 'right'
    }
  );

  doc
    .font('Helvetica-Bold')
    .fillColor(COLORS.dark)
    .text(
      formatMoney(payment.totalAmount),
      columns.total,
      y + 9,
      {
        width: widths.total - 7,
        align: 'right'
      }
    );

  doc.y = y + rowHeight;
};


/*
|--------------------------------------------------------------------------
| Create Earnings Report PDF
|--------------------------------------------------------------------------
*/

const createEarningsReportPdf = ({
  owner,
  station,
  payments = [],
  reportType,
  year,
  month,
  totalBaseAmount = 0,
  totalTax = 0,
  totalEarnings = 0,
  totalPayments = 0
}) => {
  const isMonthly = reportType === 'monthly';

  /*
   * IMPORTANT
   *
   * We do NOT use:
   *
   * bufferPages: true
   * switchToPage()
   * bufferedPageRange()
   *
   * These are intentionally avoided because they can cause
   * unwanted blank pages when combined with PDFKit layout.
   */

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    autoFirstPage: true
  });

  /*
   |--------------------------------------------------------------------------
   | FIRST PAGE HEADER
   |--------------------------------------------------------------------------
   */

  drawPageHeader(
    doc,
    reportType,
    year,
    month,
    station
  );

  /*
   |--------------------------------------------------------------------------
   | REPORT PERIOD
   |--------------------------------------------------------------------------
   */

  let y = 108;

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      'REPORT PERIOD',
      40,
      y
    );

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(COLORS.dark)
    .text(
      formatPeriod(reportType, year, month),
      40,
      y + 13
    );

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      `Generated: ${formatDateTime(new Date())}`,
      330,
      y + 15,
      {
        width: 225,
        align: 'right'
      }
    );

  y += 53;

  /*
   |--------------------------------------------------------------------------
   | OWNER + STATION DETAILS
   |--------------------------------------------------------------------------
   */

  y = drawSectionTitle(
    doc,
    'Owner & Station Details',
    y
  );

  const boxGap = 10;
  const boxWidth = (515 - boxGap * 2) / 3;
  const boxHeight = 58;

  /*
   * Owner
   */
  drawInfoBox(
    doc,
    40,
    y,
    boxWidth,
    boxHeight,
    'Owner',
    owner?.name || '-'
  );

  /*
   * Email
   */
  drawInfoBox(
    doc,
    40 + boxWidth + boxGap,
    y,
    boxWidth,
    boxHeight,
    'Email',
    owner?.email || '-'
  );

  /*
   * Station
   */
  drawInfoBox(
    doc,
    40 + (boxWidth + boxGap) * 2,
    y,
    boxWidth,
    boxHeight,
    'Station',
    station?.stationName || '-'
  );

  y += boxHeight + 10;

  /*
   * Address
   */
  drawInfoBox(
    doc,
    40,
    y,
    515,
    boxHeight,
    'Station Address',
    station?.address || '-'
  );

  y += boxHeight + 25;

  /*
   |--------------------------------------------------------------------------
   | EARNINGS SUMMARY
   |--------------------------------------------------------------------------
   */

  y = drawSectionTitle(
    doc,
    'Earnings Summary',
    y
  );

  /*
   * Four cards
   */

  const cardGap = 10;
  const cardWidth = (515 - cardGap * 3) / 4;

  drawEarningsCard(
    doc,
    40,
    y,
    cardWidth,
    'Base Amount',
    totalBaseAmount,
    COLORS.dark
  );

  drawEarningsCard(
    doc,
    40 + cardWidth + cardGap,
    y,
    cardWidth,
    'Tax',
    totalTax,
    COLORS.orange
  );

  drawEarningsCard(
    doc,
    40 + (cardWidth + cardGap) * 2,
    y,
    cardWidth,
    'Total Earnings',
    totalEarnings,
    COLORS.green
  );

  /*
   * Payment count card
   */

  const paymentCountX =
    40 + (cardWidth + cardGap) * 3;

  doc
    .roundedRect(
      paymentCountX,
      y,
      cardWidth,
      75,
      7
    )
    .fillAndStroke(
      COLORS.primaryLight,
      COLORS.primaryLight
    );

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.primaryDark)
    .text(
      'COMPLETED PAYMENTS',
      paymentCountX + 12,
      y + 13
    );

  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor(COLORS.primaryDark)
    .text(
      String(totalPayments || payments.length || 0),
      paymentCountX + 12,
      y + 36
    );

  y += 100;

  /*
   |--------------------------------------------------------------------------
   | MONTHLY ONLY - PAYMENT HISTORY
   |--------------------------------------------------------------------------
   */

  if (isMonthly) {
    /*
     * Payment History title
     */

    y = drawSectionTitle(
      doc,
      'Payment History',
      y
    );

    /*
     * If there are no payments
     */

    if (!payments.length) {
      doc
        .roundedRect(
          40,
          y,
          515,
          55,
          6
        )
        .fill(COLORS.background);

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(COLORS.muted)
        .text(
          'No completed payments found for this month.',
          40,
          y + 21,
          {
            width: 515,
            align: 'center'
          }
        );
    } else {
      /*
       * Payment table header
       */

      doc.y = y;

      drawPaymentTableHeader(doc);

      /*
       * Payment rows
       */

      payments.forEach((payment, index) => {
        const rowHeight = 28;

        /*
         * Available space before footer
         *
         * If the next row does not fit, create a new page.
         *
         * This is the ONLY place where monthly payment
         * history creates another page.
         */

        const bottomLimit =
          doc.page.height - 65;

        if (
          doc.y + rowHeight >
          bottomLimit
        ) {
          /*
           * Footer on the current page
           */
          drawFooter(doc);

          /*
           * New page
           */
          doc.addPage();

          /*
           * Header on continued page
           */
          drawPageHeader(
            doc,
            reportType,
            year,
            month,
            station
          );

          doc.y = 105;

          /*
           * Continued title
           */
          doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .fillColor(COLORS.muted)
            .text(
              'Payment History — Continued',
              40,
              doc.y
            );

          doc.y += 18;

          /*
           * Table header again
           */
          drawPaymentTableHeader(doc);
        }

        drawPaymentRow(
          doc,
          payment,
          index
        );
      });
    }
  }

  /*
   |--------------------------------------------------------------------------
   | FOOTER
   |--------------------------------------------------------------------------
   */

  drawFooter(doc);

  return doc;
};


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
  createEarningsReportPdf
};