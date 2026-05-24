/**
 * Pure CSV serialization utility and Excel export.
 * Produces RFC 4180-compliant CSV output and XLSX buffers.
 */

/**
 * Escapes a single field value for CSV output.
 * Wraps in double-quotes if the value contains a comma, newline, or double-quote.
 * Internal double-quotes are escaped as "".
 */
function escapeField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  // Must quote if contains comma, newline (LF or CR), or double-quote
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

/**
 * Serializes an array of row objects to a CSV string.
 *
 * @param rows    Array of plain objects. May be empty — returns header row only.
 * @param columns Ordered list of column names. These become the header row and
 *                the keys used to extract values from each row object.
 * @returns       A valid CSV string with CRLF line endings per RFC 4180.
 */
export function serializeToCSV(
  rows: Record<string, unknown>[],
  columns: string[],
): string {
  const lines: string[] = []

  // Header row
  lines.push(columns.map(escapeField).join(','))

  // Data rows
  for (const row of rows) {
    const fields = columns.map((col) => escapeField(row[col]))
    lines.push(fields.join(','))
  }

  return lines.join('\r\n')
}

/**
 * Generates a simple XLSX buffer with auto-fit columns and header styling.
 */
export async function generateXLSXBuffer(
  rows: Record<string, unknown>[],
  headers: string[],
): Promise<Buffer> {
  const { utils, write } = await import('xlsx')
  
  const wsData: (string | number | null)[][] = [headers]
  for (const row of rows) {
    wsData.push(headers.map((h) => (row[h] ?? '') as string | number | null))
  }

  const ws = utils.aoa_to_sheet(wsData)
  
  // Auto-fit column widths
  const colWidths: number[] = headers.map((h) => Math.min(Math.max(h.length + 2, 12), 50))
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < headers.length; j++) {
      const cellValue = String(rows[i]?.[headers[j]] ?? '')
      colWidths[j] = Math.min(Math.max(colWidths[j], cellValue.length + 2), 50)
    }
  }
  ws['!cols'] = colWidths.map((w) => ({ wch: w }))

  // Style header row
  for (let i = 0; i < headers.length; i++) {
    const cellAddr = utils.encode_col(i) + '1'
    if (ws[cellAddr]) {
      ws[cellAddr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      }
    }
  }

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Daily Logs')

  const buffer = write(wb, { type: 'buffer', bookType: 'xlsx' })
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer)
}

/** The 18 required columns for the daily_logs CSV export, in spec order. */
export const DAILY_LOG_COLUMNS = [
  'id',
  'user_id',
  'date',
  'email',
  'age',
  'gender',
  'year_level',
  'field_of_study',
  'screen_time',
  'breaks_taken',
  'eye_strain',
  'headaches',
  'blurry_vision',
  'dry_eyes',
  'brightness',
  'sleep_hours',
  'risk_level',
  'created_at',
] as const

const boolToYesNo = (v: unknown) => v === 1 || v === true ? 'Yes' : 'No'

function formatDate(d: unknown): string {
  if (!d || typeof d !== 'string') return ''
  const [y, m, day] = d.split('T')[0].split('-')
  return `${m}/${day}/${y}`
}

function formatTimestamp(ts: unknown): string {
  if (!ts || typeof ts !== 'string') return ''
  const datePart = ts.split('T')[0]
  return formatDate(datePart)
}

export function transformLogsForExcel(
  logs: Record<string, unknown>[],
): Record<string, unknown>[] {
  return logs.map((log) => ({
    'Date': formatDate(log.date),
    'Age': log.age ?? '',
    'Gender': log.gender ?? '',
    'Year Level': log.year_level ?? '',
    'Screen Time (hours)': log.screen_time ?? '',
    'Breaks Taken': log.breaks_taken ?? 0,
    'Eye Strain': boolToYesNo(log.eye_strain),
    'Headaches': boolToYesNo(log.headaches),
    'Blurry Vision': boolToYesNo(log.blurry_vision),
    'Dry Eyes': boolToYesNo(log.dry_eyes),
    'Brightness (%)': log.brightness ?? '',
    'Sleep Hours': log.sleep_hours ?? '',
    'Risk Level': log.risk_level ?? '',
    'Email': log.email ?? '',
    'Field of Study': log.field_of_study ?? '',
    'Submitted At': formatTimestamp(log.created_at),
  }))
}
