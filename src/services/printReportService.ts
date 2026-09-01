import { Project, PlanType } from '../types';
import { YEARS, ORG_NAME, ORG_PROVINCE, sortStrategicIssues } from '../data/initialData';

export interface PrintReportOptions {
  title?: string;
  subTitle?: string;
  orgName?: string;
  orgProvince?: string;
  formCode?: string;
}

/**
 * Format Thai/Arabic Numbers for Currency
 */
const formatMoney = (n: number | undefined | null): string => {
  const num = Number(n) || 0;
  if (num <= 0) return '-';
  return num.toLocaleString('th-TH');
};

/**
 * Escape HTML to prevent XSS in print templates
 */
const escapeHtml = (str: string | number | null | undefined): string => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Generate full official HTML for Form ผ.02 (Covers: ฉบับแรก, ฉบับเพิ่มเติม, ฉบับเปลี่ยนแปลง, ฉบับแก้ไข)
 */
export function generateOfficialReport02Html(
  projects: Project[],
  planType: PlanType = 'ฉบับแรก',
  options: PrintReportOptions = {}
): string {
  const formCode = options.formCode || 'แบบ ผ.02';
  const orgName = options.orgName || ORG_NAME;
  const orgProvince = options.orgProvince || ORG_PROVINCE;
  
  // Format subtitle according to plan type
  let planTitleLine2 = 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)';
  if (planType === 'เพิ่มเติม') {
    planTitleLine2 = 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ฉบับเพิ่มเติม';
  } else if (planType === 'เปลี่ยนแปลง') {
    planTitleLine2 = 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ฉบับเปลี่ยนแปลง';
  } else if (planType === 'แก้ไข') {
    planTitleLine2 = 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ฉบับแก้ไข';
  }

  // Filter projects by plan type if not already filtered
  const targetProjects = projects.filter(
    (p) => (p['ประเภทรายการ'] || 'ฉบับแรก') === planType
  );

  // Group by Strategic Issue (ประเด็นการพัฒนา)
  const issueMap: Record<string, Project[]> = {};
  const issueOrder: string[] = [];

  targetProjects.forEach((p) => {
    const issue = p['ประเด็นการพัฒนา'] || '(ไม่ระบุประเด็นการพัฒนา)';
    if (!issueMap[issue]) {
      issueMap[issue] = [];
      issueOrder.push(issue);
    }
    issueMap[issue].push(p);
  });

  const sortedIssues = sortStrategicIssues(issueOrder);

  // Grand totals across all projects
  const grandTotalByYear: Record<number, number> = {
    2571: 0,
    2572: 0,
    2573: 0,
    2574: 0,
    2575: 0
  };
  let grandTotalBudget = 0;

  targetProjects.forEach((p) => {
    YEARS.forEach((y) => {
      const val = Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
      grandTotalByYear[y] += val;
      grandTotalBudget += val;
    });
  });

  const showReasonCol = planType !== 'ฉบับแรก';

  // Build issue sections HTML
  let tablesHtml = '';

  if (sortedIssues.length === 0 || targetProjects.length === 0) {
    tablesHtml = `
      <div style="padding: 40px; text-align: center; color: #64748b; font-size: 14px; border: 1px dashed #cbd5e1; margin-top: 20px;">
        ไม่มีข้อมูลโครงการในหมวด "${escapeHtml(planType)}" ที่ตรงกับเงื่อนไข
      </div>
    `;
  } else {
    sortedIssues.forEach((issueName, issueIdx) => {
      const items = issueMap[issueName] || [];
      const issueTotals: Record<number, number> = {
        2571: 0,
        2572: 0,
        2573: 0,
        2574: 0,
        2575: 0
      };

      items.forEach((p) => {
        YEARS.forEach((y) => {
          issueTotals[y] += Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
        });
      });

      const rowsHtml = items
        .map((p, idx) => {
          const budgetCells = YEARS.map((y) => {
            const val = Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
            return `<td class="text-right num-cell">${formatMoney(val)}</td>`;
          }).join('');

          const reasonCell = showReasonCol
            ? `<td class="align-top">${escapeHtml(p['เหตุผลและความจำเป็น'] || p['เหตุผลความจำเป็น'] || '-')}</td>`
            : '';

          return `
            <tr>
              <td class="text-center font-bold align-top">${idx + 1}</td>
              <td class="align-top font-semibold project-name">${escapeHtml(p['ชื่อโครงการ'])}</td>
              <td class="align-top text-slate-700">${escapeHtml(p['วัตถุประสงค์'] || '-')}</td>
              <td class="align-top text-slate-700">${escapeHtml(p['เป้าหมาย (ผลผลิต)'] || '-')}</td>
              ${budgetCells}
              <td class="align-top text-slate-700">${escapeHtml(p['ผลที่คาดว่าจะได้รับ'] || '-')}</td>
              <td class="align-top">${escapeHtml(p['หน่วยงานรับผิดชอบหลัก'] || '-')}</td>
              ${reasonCell}
            </tr>
          `;
        })
        .join('');

      const issueTotalCells = YEARS.map((y) => {
        return `<td class="text-right num-cell font-bold">${formatMoney(issueTotals[y])}</td>`;
      }).join('');

      const issueReasonSubtotal = showReasonCol
        ? `<td class="text-center font-bold">-</td>`
        : '';

      tablesHtml += `
        <div class="issue-section" style="margin-top: 24px; page-break-inside: auto;">
          <div class="issue-title" style="font-size: 13pt; font-weight: bold; margin-bottom: 6px; color: #000;">
            ${issueIdx + 1}. ประเด็นการพัฒนาท้องถิ่น: ${escapeHtml(issueName)}
          </div>
          
          <table class="report-table">
            <thead>
              <tr class="header-row-1">
                <th rowspan="2" style="width: 32px; text-align: center;">ที่</th>
                <th rowspan="2" style="min-width: 170px; width: 22%;">โครงการ</th>
                <th rowspan="2" style="min-width: 130px; width: 15%;">วัตถุประสงค์</th>
                <th rowspan="2" style="min-width: 130px; width: 15%;">เป้าหมาย<br>(ผลผลิตของโครงการ)</th>
                <th colspan="5" style="text-align: center; width: 25%;">งบประมาณ</th>
                <th rowspan="2" style="min-width: 120px; width: 13%;">ผลที่คาดว่า<br>จะได้รับ</th>
                <th rowspan="2" style="min-width: 100px; width: 10%;">หน่วยงาน<br>รับผิดชอบหลัก</th>
                ${showReasonCol ? '<th rowspan="2" style="min-width: 110px; width: 10%;">เหตุผล<br>ความจำเป็น</th>' : ''}
              </tr>
              <tr class="header-row-2">
                ${YEARS.map((y) => `<th style="width: 5%; text-align: center; font-size: 8.5pt;">พ.ศ. ${y}<br><span style="font-weight: normal; font-size: 8pt;">(บาท)</span></th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <!-- Subtotal row for issue -->
              <tr class="subtotal-row">
                <td class="text-center font-bold">รวม</td>
                <td class="font-bold">${items.length} โครงการ</td>
                <td class="text-center font-bold">-</td>
                <td class="text-center font-bold">-</td>
                ${issueTotalCells}
                <td class="text-center font-bold">-</td>
                <td class="text-center font-bold">-</td>
                ${issueReasonSubtotal}
              </tr>
            </tbody>
          </table>
        </div>
      `;
    });

    // Grand Total summary table
    const grandBudgetCells = YEARS.map((y) => {
      return `<td class="text-right num-cell font-bold" style="font-size: 10pt;">${formatMoney(grandTotalByYear[y])}</td>`;
    }).join('');

    const grandReasonCell = showReasonCol
      ? `<td class="text-center font-bold">-</td>`
      : '';

    tablesHtml += `
      <div class="grand-total-section" style="margin-top: 24px; page-break-inside: avoid;">
        <table class="report-table">
          <tfoot>
            <tr class="grand-total-row">
              <td style="width: 32px; text-align: center; font-weight: bold;">รวม</td>
              <td style="min-width: 170px; width: 22%; font-weight: bold; font-size: 10pt;">
                รวมงบประมาณทั้งสิ้น (${targetProjects.length} โครงการ)
              </td>
              <td style="min-width: 130px; width: 15%; text-align: center; font-weight: bold;">-</td>
              <td style="min-width: 130px; width: 15%; text-align: center; font-weight: bold;">-</td>
              ${grandBudgetCells}
              <td style="min-width: 120px; width: 13%; text-align: center; font-weight: bold; font-size: 9.5pt;">
                รวม 5 ปี: ${formatMoney(grandTotalBudget)} บาท
              </td>
              <td style="min-width: 100px; width: 10%; text-align: center; font-weight: bold;">-</td>
              ${grandReasonCell}
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  // Complete HTML document
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(planTitleLine2)} - ${escapeHtml(formCode)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: landscape;
      margin: 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      font-family: 'Sarabun', 'Segoe UI', Tahoma, sans-serif !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #000000;
      font-size: 9.5pt;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      padding: 10px;
    }
    .report-header-top {
      text-align: right;
      font-size: 13pt;
      font-weight: 800;
      margin-bottom: 6px;
      color: #000000;
    }
    .report-title-center {
      text-align: center;
      margin-bottom: 18px;
    }
    .report-title-line-1 {
      font-size: 15pt;
      font-weight: 800;
      margin: 0 0 4px 0;
      line-height: 1.25;
    }
    .report-title-line-2 {
      font-size: 13pt;
      font-weight: 700;
      margin: 0 0 4px 0;
      line-height: 1.25;
    }
    .report-title-line-3 {
      font-size: 12pt;
      font-weight: 700;
      margin: 0;
      line-height: 1.25;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000000;
      margin-bottom: 8px;
      page-break-inside: auto;
      font-size: 9pt;
    }
    .report-table thead {
      display: table-header-group;
    }
    .report-table tbody {
      page-break-inside: auto;
    }
    .report-table tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    .report-table tfoot {
      display: table-footer-group;
    }
    .report-table th, 
    .report-table td {
      border: 1px solid #000000;
      padding: 4px 5px;
      vertical-align: top;
      color: #000000;
    }
    .report-table th {
      background-color: #f1f5f9;
      font-weight: 700;
      text-align: center;
      vertical-align: middle;
      font-size: 9pt;
      line-height: 1.2;
    }
    .subtotal-row td {
      background-color: #f8fafc;
      font-weight: 700;
      border-top: 1.5px solid #000000;
      font-size: 9pt;
    }
    .grand-total-row td {
      background-color: #e2e8f0;
      font-weight: 800;
      border: 2px solid #000000;
      font-size: 9.5pt;
      padding: 6px 5px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .num-cell {
      white-space: nowrap;
      font-family: 'Sarabun', monospace, sans-serif !important;
    }
    .project-name {
      color: #000000;
    }
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-container">
    <!-- 1. Report Header Top Right -->
    <div class="report-header-top">${escapeHtml(formCode)}</div>

    <!-- 2. Report Header Center 3 Lines -->
    <div class="report-title-center">
      <div class="report-title-line-1">บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น</div>
      <div class="report-title-line-2">${escapeHtml(planTitleLine2)}</div>
      <div class="report-title-line-3">${escapeHtml(orgName)} ${escapeHtml(orgProvince)}</div>
    </div>

    <!-- 3. Grouped Tables by Development Issue -->
    ${tablesHtml}
  </div>

  <script>
    window.onload = function() {
      // Auto trigger print when opened in popup window
      if (window.opener || window.location.search.includes('autoprint=true')) {
        setTimeout(function() {
          window.print();
        }, 400);
      }
    };
  </script>
</body>
</html>`;
}

/**
 * Print Official Form ผ.02 via hidden iframe or popup window for perfect browser print rendering
 */
export function printOfficialReport02(
  projects: Project[],
  planType: PlanType = 'ฉบับแรก',
  options: PrintReportOptions = {}
): void {
  const html = generateOfficialReport02Html(projects, planType, options);

  // Method 1: Using Hidden Iframe (seamless, no blocked popup)
  let iframe = document.getElementById('print-report-iframe') as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'print-report-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    setTimeout(() => {
      try {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print fallback to window.print():', err);
        window.print();
      }
    }, 450);
  } else {
    // Fallback: window.print()
    window.print();
  }
}
