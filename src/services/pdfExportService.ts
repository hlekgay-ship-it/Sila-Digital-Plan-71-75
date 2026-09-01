import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Project, Report01Data } from '../types';
import { YEARS, ORG_NAME, ORG_PROVINCE } from '../data/initialData';

export interface PdfExportOptions {
  reportType: 'ผ01' | 'ผ02-baseline' | 'ผ02-additional' | 'change-diff' | 'edit-diff' | 'ผ02-all';
  orientation: 'landscape' | 'portrait';
  paperSize: 'a4' | 'legal';
  marginMode: 'standard' | 'binder' | 'compact';
  fontSizeMode: 'normal' | 'compact' | 'dense';
  includeCoverPage: boolean;
  includeSummaryPage: boolean;
  includeSignatures: boolean;
  showPageNumbers: boolean;
  showTimestamp: boolean;
  orgName: string;
  provinceName: string;
  districtName?: string;
  selectedDepartment?: string;
  selectedIssue?: string;
  selectedPlan?: string;
}

/**
 * Generate PDF file directly from an HTML element using html2canvas & jsPDF
 * with precise A4 page slicing and high DPI rendering.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  orientation: 'landscape' | 'portrait' = 'landscape',
  onProgress?: (progressText: string) => void
): Promise<void> {
  if (onProgress) onProgress('กำลังประมวลผลการจัดหน้ากระดาษ...');

  // A4 dimensions in mm
  const isLandscape = orientation === 'landscape';
  const pdfWidthMm = isLandscape ? 297 : 210;
  const pdfHeightMm = isLandscape ? 210 : 297;

  // Render canvas with high resolution scale
  if (onProgress) onProgress('กำลังเรนเดอร์เอกสารความละเอียดสูง...');
  const canvas = await html2canvas(element, {
    scale: 2, // 2x for sharp text
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  if (onProgress) onProgress('กำลังสร้างไฟล์ PDF และจัดแบ่งหน้า...');
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Calculate ratio
  const imgHeightMm = (canvasHeight * pdfWidthMm) / canvasWidth;
  let heightLeft = imgHeightMm;
  let position = 0;

  // First page
  pdf.addImage(imgData, 'JPEG', 0, position, pdfWidthMm, imgHeightMm, undefined, 'FAST');
  heightLeft -= pdfHeightMm;

  // Subsequent pages
  while (heightLeft > 0) {
    position -= pdfHeightMm;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidthMm, imgHeightMm, undefined, 'FAST');
    heightLeft -= pdfHeightMm;
  }

  if (onProgress) onProgress('กำลังบันทึกไฟล์...');
  pdf.save(filename);
}

/**
 * Build official report filename
 */
export function getOfficialPdfFilename(
  reportType: string,
  orgName: string = ORG_NAME,
  planYears: string = '2571-2575'
): string {
  const cleanOrg = orgName.replace(/\s+/g, '_');
  let typeLabel = 'รายงานแผนพัฒนาท้องถิ่น';
  if (reportType === 'ผ01') {
    typeLabel = 'แบบ_ผ01_บัญชีสรุปโครงการ';
  } else if (reportType === 'ผ02-baseline') {
    typeLabel = 'แบบ_ผ02_บัญชีรายละเอียด_ฉบับแรก';
  } else if (reportType === 'ผ02-additional') {
    typeLabel = 'แบบ_ผ02_บัญชีรายละเอียด_ฉบับเพิ่มเติม';
  } else if (reportType === 'change-diff') {
    typeLabel = 'แบบ_ผ02_บัญชีเปรียบเทียบ_ฉบับเปลี่ยนแปลง';
  } else if (reportType === 'edit-diff') {
    typeLabel = 'แบบ_ผ02_บัญชีแก้ไข_ฉบับแก้ไข';
  } else if (reportType === 'ผ02-all') {
    typeLabel = 'แบบ_ผ02_บัญชีรายละเอียด_ฉบับรวม';
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  return `${typeLabel}_(พศ${planYears})_${cleanOrg}_${dateStr}.pdf`;
}
