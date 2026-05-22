import { describe, it, expect } from 'vitest'
import { serializeToCSV, DAILY_LOG_COLUMNS } from './csv-export'

describe('serializeToCSV', () => {
  it('returns only the header row when rows array is empty', () => {
    const result = serializeToCSV([], ['id', 'name', 'email'])
    expect(result).toBe('id,name,email')
  })

  it('includes all 18 required columns in the header in the correct order', () => {
    const result = serializeToCSV([], [...DAILY_LOG_COLUMNS])
    const header = result.split('\r\n')[0]
    expect(header).toBe(DAILY_LOG_COLUMNS.join(','))
  })

  it('wraps a field containing a comma in double-quotes', () => {
    const rows = [{ id: '1', name: 'Smith, John', email: 'john@example.com' }]
    const result = serializeToCSV(rows, ['id', 'name', 'email'])
    const dataRow = result.split('\r\n')[1]
    expect(dataRow).toBe('1,"Smith, John",john@example.com')
  })

  it('wraps a field containing a newline in double-quotes', () => {
    const rows = [{ id: '1', notes: 'line1\nline2' }]
    const result = serializeToCSV(rows, ['id', 'notes'])
    const dataRow = result.split('\r\n')[1]
    expect(dataRow).toBe('1,"line1\nline2"')
  })

  it('escapes internal double-quotes as ""', () => {
    const rows = [{ id: '1', notes: 'He said "hello"' }]
    const result = serializeToCSV(rows, ['id', 'notes'])
    const dataRow = result.split('\r\n')[1]
    expect(dataRow).toBe('1,"He said ""hello"""')
  })

  it('handles null and undefined values as empty strings', () => {
    const rows = [{ id: '1', name: null, email: undefined }]
    const result = serializeToCSV(rows as Record<string, unknown>[], ['id', 'name', 'email'])
    const dataRow = result.split('\r\n')[1]
    expect(dataRow).toBe('1,,')
  })

  it('produces correct row count for multiple rows', () => {
    const rows = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Carol' },
    ]
    const result = serializeToCSV(rows, ['id', 'name'])
    const lines = result.split('\r\n')
    expect(lines).toHaveLength(4) // 1 header + 3 data rows
  })

  it('uses CRLF line endings', () => {
    const rows = [{ id: '1', name: 'Alice' }]
    const result = serializeToCSV(rows, ['id', 'name'])
    expect(result).toContain('\r\n')
  })
})
