/**
 * Pure CSV serialization utility.
 * Produces RFC 4180-compliant CSV output.
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
