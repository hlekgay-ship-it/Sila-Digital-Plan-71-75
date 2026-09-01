/**
 * Export helpers for exporting table data to CSV and Excel
 */
import { UserItem, Project } from '../types';

export function exportUsers(users: UserItem[], format: 'excel' | 'csv', fileName = 'users') {
  const headers = [
    'ลำดับ',
    'ชื่อ-สกุล',
    'Username',
    'ตำแหน่ง',
    'หน่วยงาน/กอง',
    'อีเมล',
    'เบอร์โทรศัพท์',
    'สิทธิ์การใช้งาน',
    'สถานะ'
  ];

  const rows = users.map((u, idx) => [
    idx + 1,
    u['ชื่อ-สกุล'],
    u.username || '',
    u['ตำแหน่ง'] || '',
    u['หน่วยงาน/กอง'] || '',
    u['อีเมล'] || '',
    u['เบอร์โทรศัพท์'] || '',
    u['สิทธิ์การใช้งาน'] || '',
    u['สถานะ'] || ''
  ]);

  downloadCsv(headers, rows, `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function downloadCsv(headers: string[], rows: (string | number)[][], fileName: string) {
  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.map(escapeCsvCell).join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCsvCell(cell: string | number): string {
  const str = String(cell ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
