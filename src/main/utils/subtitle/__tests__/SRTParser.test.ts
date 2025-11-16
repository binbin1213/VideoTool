import { describe, it, expect } from 'vitest'
import { SRTParser } from '../SRTParser'

describe('SRTParser', () => {
  const parser = new SRTParser()

  it('parses basic SRT blocks', () => {
    const content = `1\n00:00:01,120 --> 00:00:02,340\nHello\n\n2\n00:00:03,000 --> 00:00:04,000\nWorld`
    const subs = parser.parse(content)
    expect(subs.length).toBe(2)
    expect(subs[0].index).toBe(1)
    expect(subs[0].startTime).toBe('00:00:01,120')
    expect(subs[0].endTime).toBe('00:00:02,340')
    expect(subs[0].text).toBe('Hello')
  })

  it('validates content and reports warnings', () => {
    const invalid = `1\n00:00:xx,000 --> 00:00:02,000\nBad time\n\n2\n00:00:03,000 --> 00:00:04,000\nOK`
    const res = parser.validate(invalid)
    expect(res.valid).toBe(true)
    expect(res.warnings.length).toBeGreaterThan(0)
  })

  it('handles BOM and CRLF newlines', () => {
    const content = `\uFEFF1\r\n00:00:01,120 --> 00:00:02,340\r\nHello\r\n\r\n2\r\n00:00:03,000 --> 00:00:04,000\r\nWorld`
    const subs = parser.parse(content)
    expect(subs.length).toBe(2)
  })
})