import { Project, ProjectTrackingItem, BudgetApproval, PlanApproval, UserItem } from '../types';
import { YEARS, ORG_NAME } from '../data/initialData';

/**
 * Trigger browser file download
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Clean cell content for CSV
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export generic 2D table data to CSV
 */
export function exportTableToCsv(headers: string[], rows: (string | number)[][], filename: string) {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCsvCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  downloadFile(csvContent, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export generic 2D table data to Excel (.xlsx / XML Spreadsheet)
 */
export function exportTableToExcel(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  sheetName = 'ข้อมูล'
) {
  // Use SheetJS (xlsx.full.min.js) if available in browser/GAS
  if (typeof window !== 'undefined' && (window as any).XLSX) {
    try {
      const XLSX = (window as any).XLSX;
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
      XLSX.writeFile(wb, cleanFilename);
      return;
    } catch (e) {
      console.warn('SheetJS export fallback:', e);
    }
  }

  const excelHeaderRows = headers
    .map(
      (h) =>
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`
    )
    .join('');

  const dataRowsXml = rows
    .map((row) => {
      const cellsXml = row
        .map((cell) => {
          const isNum = typeof cell === 'number' && !isNaN(cell);
          const val = cell !== null && cell !== undefined ? String(cell) : '';
          return `<Cell ss:StyleID="${isNum ? 'Number' : 'Default'}"><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(val)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cellsXml}</Row>`;
    })
    .join('');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Sarabun" x:CharSet="222" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#065F46"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#065F46"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#065F46"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#065F46"/>
   </Borders>
   <Font ss:FontName="Sarabun" x:CharSet="222" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#065F46" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Number">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0"/>
   <Font ss:FontName="Sarabun" x:CharSet="222" ss:Size="11" ss:Color="#000000"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(sheetName)}">
  <Table>
   <Row ss:Height="26">
    ${excelHeaderRows}
   </Row>
   ${dataRowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  downloadFile(
    xmlContent,
    filename.endsWith('.xls') || filename.endsWith('.xlsx') ? filename : `${filename}.xls`,
    'application/vnd.ms-excel;charset=utf-8;'
  );
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Projects exporter
 */
export function exportProjects(projects: Project[], format: 'csv' | 'excel', planType = 'แผนพัฒนาท้องถิ่น') {
  const headers = [
    'ลำดับ',
    'รหัสโครงการ',
    'ประเด็นการพัฒนา',
    'ยุทธศาสตร์',
    'แผนงาน',
    'ชื่อโครงการ',
    'วัตถุประสงค์',
    'เป้าหมาย (ผลผลิต)',
    ...YEARS.map((y) => `งบประมาณ พ.ศ. ${y}`),
    'งบประมาณรวม (บาท)',
    'ผลที่คาดว่าจะได้รับ',
    'หน่วยงานรับผิดชอบหลัก',
    'ประเภทรายการ',
    'สถานะโครงการ'
  ];

  const rows = projects.map((p, idx) => {
    const totalBudget = YEARS.reduce((sum, y) => sum + (Number(p[`งบประมาณ ${y}` as keyof Project]) || 0), 0);
    return [
      idx + 1,
      p.ID,
      p['ประเด็นการพัฒนา'] || '',
      p['ยุทธศาสตร์'] || '',
      p['แผนงาน'] || '',
      p['ชื่อโครงการ'] || '',
      p['วัตถุประสงค์'] || '',
      p['เป้าหมาย (ผลผลิต)'] || '',
      ...YEARS.map((y) => Number(p[`งบประมาณ ${y}` as keyof Project]) || 0),
      totalBudget,
      p['ผลที่คาดว่าจะได้รับ'] || '',
      p['หน่วยงานรับผิดชอบหลัก'] || '',
      p['ประเภทรายการ'] || 'ฉบับแรก',
      p['สถานะโครงการ'] || 'บรรจุในแผน'
    ];
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `โครงการ_${planType}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, planType);
  }
}

/**
 * Tracking items exporter
 */
export function exportTrackings(trackings: ProjectTrackingItem[], format: 'csv' | 'excel', title = 'รายงานติดตามโครงการ') {
  const headers = [
    'ลำดับ',
    'รหัสโครงการ',
    'ปีงบประมาณ',
    'ชื่อโครงการ',
    'หน่วยงานรับผิดชอบ',
    'แหล่งที่มาของงบ',
    'ความคืบหน้า (%)',
    'สถานะโครงการ',
    'งบประมาณที่อนุมัติ (บาท)',
    'ลงนามสัญญา (บาท)',
    'เบิกจ่าย (บาท)',
    'คงเหลือ (บาท)',
    'วันเริ่มโครงการ',
    'วันสิ้นสุดโครงการ',
    'ปัญหาและอุปสรรค'
  ];

  const rows = trackings.map((t, idx) => {
    const approved = Number(t['งบประมาณที่อนุมัติ'] ?? t['งบประมาณที่ได้รับจัดสรร']) || 0;
    const contract = Number(t['ลงนามสัญญา']) || 0;
    const disbursed = Number(t['เบิกจ่าย'] ?? t['ผลการเบิกจ่าย']) || 0;
    const remaining = t['คงเหลือ'] !== undefined ? Number(t['คงเหลือ']) : Math.max(0, approved - disbursed);

    return [
      idx + 1,
      t.ID,
      t['ปีงบประมาณ'] || '',
      t['ชื่อโครงการ'] || '',
      t['หน่วยงาน'] || t['ผู้รับผิดชอบ'] || '',
      t['แหล่งที่มา'] || t['แหล่งงบประมาณ'] || '',
      Number(t['ความคืบหน้า (%)']) || 0,
      t['สถานะโครงการ'] || 'ยังไม่เริ่มดำเนินการ',
      approved,
      contract,
      disbursed,
      remaining,
      t['วันเริ่มต้น'] || '',
      t['วันสิ้นสุด'] || '',
      t['ปัญหาและอุปสรรค'] || ''
    ];
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${title}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, 'ติดตามโครงการ');
  }
}

/**
 * Approvals exporter
 */
export function exportApprovals(approvals: PlanApproval[], format: 'csv' | 'excel', title = 'รายงานการอนุมัติประกาศใช้') {
  const headers = [
    'ลำดับ',
    'รหัส',
    'ประเภทแผน',
    'ครั้งที่',
    'ปี พ.ศ.',
    'วันที่อนุมัติประกาศใช้',
    'วันที่มีผลบังคับใช้',
    'เลขที่ประกาศ',
    'ผู้อนุมัติ/ผู้ลงนาม',
    'สถานะการประกาศ',
    'จำนวนโครงการ'
  ];

  const rows = approvals.map((a, idx) => [
    idx + 1,
    a.ID,
    a['ประเภท'] || '',
    a['ครั้งที่'] || '',
    a['ปี พ.ศ.'] || '',
    a['วันที่อนุมัติประกาศใช้'] || '',
    a['วันที่มีผลบังคับใช้'] || '',
    a['เลขที่ประกาศ'] || '',
    a['ผู้อนุมัติ'] || a['ผู้ลงนาม'] || '',
    a['สถานะการประกาศ'] || 'อนุมัติ',
    a['จำนวนโครงการ'] !== undefined ? a['จำนวนโครงการ'] : (String(a.ProjectIDs || '').split(',').filter(Boolean).length)
  ]);

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${title}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, 'การอนุมัติประกาศใช้');
  }
}

/**
 * Users exporter
 */
export function exportUsers(users: UserItem[], format: 'csv' | 'excel', title = 'รายชื่อผู้ใช้งานระบบ') {
  const headers = [
    'ลำดับ',
    'ID',
    'ชื่อ-สกุล',
    'ตำแหน่ง',
    'หน่วยงาน/กอง',
    'อีเมล',
    'เบอร์โทรศัพท์',
    'สิทธิ์การใช้งาน',
    'สถานะ'
  ];

  const rows = users.map((u, idx) => [
    idx + 1,
    u.ID,
    u['ชื่อ-สกุล'] || '',
    u['ตำแหน่ง'] || '',
    u['หน่วยงาน/กอง'] || '',
    u['อีเมล'] || '',
    u['เบอร์โทรศัพท์'] || '',
    u['สิทธิ์การใช้งาน'] || '',
    u['สถานะ'] || ''
  ]);

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${title}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, 'ผู้ใช้งาน');
  }
}

/**
 * Report 01 (แบบ ผ.01 บัญชีสรุปโครงการพัฒนาท้องถิ่น) Exporter
 */
export function exportReport01(
  reportData: { rows: any[]; totals: Record<string, number>; grandTotalCount: number; grandTotalBudget: number },
  format: 'csv' | 'excel',
  title = 'แบบ_ผ.01_บัญชีสรุปโครงการพัฒนาท้องถิ่น'
) {
  const headers = [
    'ลำดับ',
    'ประเด็นการพัฒนาท้องถิ่น',
    'พ.ศ. 2571 (โครงการ)',
    'พ.ศ. 2571 (งบประมาณ บาท)',
    'พ.ศ. 2572 (โครงการ)',
    'พ.ศ. 2572 (งบประมาณ บาท)',
    'พ.ศ. 2573 (โครงการ)',
    'พ.ศ. 2573 (งบประมาณ บาท)',
    'พ.ศ. 2574 (โครงการ)',
    'พ.ศ. 2574 (งบประมาณ บาท)',
    'พ.ศ. 2575 (โครงการ)',
    'พ.ศ. 2575 (งบประมาณ บาท)',
    'รวม 5 ปี (โครงการ)',
    'รวม 5 ปี (งบประมาณ บาท)'
  ];

  const rows: (string | number)[][] = reportData.rows.map((r, idx) => [
    idx + 1,
    r.strategicIssue || '',
    r.year2571Count || 0,
    r.year2571Budget || 0,
    r.year2572Count || 0,
    r.year2572Budget || 0,
    r.year2573Count || 0,
    r.year2573Budget || 0,
    r.year2574Count || 0,
    r.year2574Budget || 0,
    r.year2575Count || 0,
    r.year2575Budget || 0,
    r.total5YearCount || 0,
    r.total5YearBudget || 0
  ]);

  // Add Grand Total Row
  rows.push([
    '',
    'รวมทั้งสิ้น',
    reportData.totals['2571Count'] || 0,
    reportData.totals['2571Budget'] || 0,
    reportData.totals['2572Count'] || 0,
    reportData.totals['2572Budget'] || 0,
    reportData.totals['2573Count'] || 0,
    reportData.totals['2573Budget'] || 0,
    reportData.totals['2574Count'] || 0,
    reportData.totals['2574Budget'] || 0,
    reportData.totals['2575Count'] || 0,
    reportData.totals['2575Budget'] || 0,
    reportData.grandTotalCount || 0,
    reportData.grandTotalBudget || 0
  ]);

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${title}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, 'แบบ ผ.01');
  }
}

/**
 * Report 02 Change Comparison (แบบ ผ.02 ฉบับเปลี่ยนแปลง) Exporter
 */
export function exportReport02Change(
  projects: Project[],
  format: 'csv' | 'excel',
  title = 'แบบ_ผ.02_เปรียบเทียบฉบับเปลี่ยนแปลง'
) {
  const headers = [
    'ลำดับ',
    'ประเด็นการพัฒนา',
    'โครงการเดิม (ชื่อโครงการ)',
    'โครงการเดิม (วัตถุประสงค์)',
    'โครงการเดิม (เป้าหมาย)',
    'โครงการเดิม (งบประมาณรวม 5 ปี)',
    'โครงการที่ขอเปลี่ยนแปลง (ชื่อโครงการ)',
    'โครงการที่ขอเปลี่ยนแปลง (วัตถุประสงค์)',
    'โครงการที่ขอเปลี่ยนแปลง (เป้าหมาย)',
    'โครงการที่ขอเปลี่ยนแปลง (งบประมาณรวม 5 ปี)',
    'ส่วนต่างงบประมาณ (เพิ่ม/ลด)',
    'เหตุผลและความจำเป็นในการเปลี่ยนแปลง',
    'หน่วยงานรับผิดชอบ'
  ];

  const rows = projects.map((p, idx) => {
    let sumBefore = 0;
    let sumAfter = 0;
    YEARS.forEach((y) => {
      sumBefore += Number(p[`งบประมาณ ${y} (เดิม)` as keyof Project]) || 0;
      sumAfter += Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
    });
    const diff = sumAfter - sumBefore;

    return [
      idx + 1,
      p['ประเด็นการพัฒนา'] || '',
      p['ชื่อโครงการ (เดิม)'] || p['ชื่อโครงการ'] || '',
      p['วัตถุประสงค์ (เดิม)'] || p['วัตถุประสงค์'] || '',
      p['เป้าหมาย (เดิม)'] || p['เป้าหมาย (ผลผลิต)'] || '',
      sumBefore,
      p['ชื่อโครงการ'] || '',
      p['วัตถุประสงค์'] || '',
      p['เป้าหมาย (ผลผลิต)'] || '',
      sumAfter,
      diff,
      p['เหตุผลและความจำเป็น'] || '',
      p['หน่วยงานรับผิดชอบหลัก'] || ''
    ];
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${title}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, 'แบบ ผ.02 เปลี่ยนแปลง');
  }
}

/**
 * Report 02 Edit Comparison (แบบ ผ.02 ฉบับแก้ไข) Exporter
 */
export function exportReport02Edit(
  projects: Project[],
  format: 'csv' | 'excel',
  title = 'แบบ_ผ.02_เปรียบเทียบฉบับแก้ไข'
) {
  const headers = [
    'ลำดับ',
    'ประเด็นการพัฒนา',
    'ข้อความเดิม (ชื่อโครงการ)',
    'ข้อความเดิม (วัตถุประสงค์)',
    'ข้อความเดิม (เป้าหมาย)',
    'ข้อความที่ขอแก้ไข (ชื่อโครงการ)',
    'ข้อความที่ขอแก้ไข (วัตถุประสงค์)',
    'ข้อความที่ขอแก้ไข (เป้าหมาย)',
    'งบประมาณรวม 5 ปี (บาท)',
    'เหตุผลและความจำเป็นในการแก้ไข',
    'หน่วยงานรับผิดชอบ'
  ];

  const rows = projects.map((p, idx) => {
    let totalBudget = 0;
    YEARS.forEach((y) => {
      totalBudget += Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
    });

    return [
      idx + 1,
      p['ประเด็นการพัฒนา'] || '',
      p['ชื่อโครงการ (เดิม)'] || p['ชื่อโครงการ'] || '',
      p['วัตถุประสงค์ (เดิม)'] || p['วัตถุประสงค์'] || '',
      p['เป้าหมาย (เดิม)'] || p['เป้าหมาย (ผลผลิต)'] || '',
      p['ชื่อโครงการ'] || '',
      p['วัตถุประสงค์'] || '',
      p['เป้าหมาย (ผลผลิต)'] || '',
      totalBudget,
      p['เหตุผลและความจำเป็น'] || '',
      p['หน่วยงานรับผิดชอบหลัก'] || ''
    ];
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${title}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, 'แบบ ผ.02 แก้ไข');
  }
}

/**
 * Direct HTML Table Export to Excel (.xlsx) using SheetJS
 */
export function exportHtmlTableToExcel(tableElement: HTMLTableElement, systemName = 'ระบบแผนพัฒนาท้องถิ่น') {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${systemName}_${timestamp}.xlsx`;

  if (typeof window !== 'undefined' && (window as any).XLSX) {
    try {
      const XLSX = (window as any).XLSX;
      const wb = XLSX.utils.table_to_book(tableElement, { sheet: 'ข้อมูลรายงาน' });
      XLSX.writeFile(wb, filename);
      return;
    } catch (e) {
      console.warn('SheetJS table_to_book error:', e);
    }
  }

  // Fallback: extract headers and rows
  const headers: string[] = [];
  const rows: string[][] = [];
  const ths = tableElement.querySelectorAll('thead th');
  ths.forEach((th) => headers.push((th.textContent || '').trim()));

  const trs = tableElement.querySelectorAll('tbody tr');
  trs.forEach((tr) => {
    const row: string[] = [];
    tr.querySelectorAll('td').forEach((td) => {
      row.push((td.textContent || '').trim());
    });
    if (row.length > 0) rows.push(row);
  });

  exportTableToExcel(headers, rows, filename.replace('.xlsx', ''));
}

/**
 * Direct HTML Table Export to CSV (.csv) with UTF-8 BOM
 */
export function exportHtmlTableToCsv(tableElement: HTMLTableElement, systemName = 'ระบบแผนพัฒนาท้องถิ่น') {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${systemName}_${timestamp}.csv`;

  const headers: string[] = [];
  const rows: string[][] = [];
  const ths = tableElement.querySelectorAll('thead th');
  ths.forEach((th) => headers.push((th.textContent || '').trim()));

  const trs = tableElement.querySelectorAll('tbody tr');
  trs.forEach((tr) => {
    const row: string[] = [];
    tr.querySelectorAll('td').forEach((td) => {
      row.push((td.textContent || '').trim());
    });
    if (row.length > 0) rows.push(row);
  });

  exportTableToCsv(headers, rows, filename);
}

/**
 * Direct HTML Element to PDF (.pdf) using html2pdf.js
 */
export function exportHtmlElementToPdf(
  element: HTMLElement,
  systemName = 'ระบบแผนพัฒนาท้องถิ่น',
  orientation: 'portrait' | 'landscape' = 'landscape'
) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${systemName}_${timestamp}.pdf`;

  if (typeof window !== 'undefined' && (window as any).html2pdf) {
    try {
      const html2pdf = (window as any).html2pdf;
      const opt = {
        margin: [8, 8, 8, 8],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation }
      };
      html2pdf().set(opt).from(element).save();
      return;
    } catch (e) {
      console.warn('html2pdf execution error:', e);
    }
  }

  // Fallback
  window.print();
}

