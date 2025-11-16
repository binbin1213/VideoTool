import { describe, it, expect } from 'vitest'
import { convertSubtitle, getDefaultRegexRules } from '../subtitleConverter'

describe('subtitleConverter pipeline', () => {
  const sampleSrt = `1\n00:00:01,005 --> 00:00:02,094\nHello, world!\n\n2\n00:00:02,990 --> 00:00:03,000\nNote（注：测试）`

  it('converts SRT to ASS with correct times', () => {
    const ass = convertSubtitle(sampleSrt, 'srt', 'ass', {
      styleName: '电影字幕 底部',
      videoHeight: 1080,
    })
    expect(ass).toContain('[Events]')
    expect(ass).toMatch(/Dialogue: 0,0:00:01\.00,0:00:02\.09,电影字幕 底部/)
    expect(ass).toMatch(/Dialogue: 0,0:00:02\.99,0:00:03\.00,电影字幕 底部/)
  })

  it('converts SRT to VTT', () => {
    const vtt = convertSubtitle(sampleSrt, 'srt', 'vtt')
    expect(vtt.startsWith('WEBVTT')).toBe(true)
    expect(vtt).toContain('1')
    expect(vtt).toContain('00:00:01.005')
  })

  it('applies regex rules when enabled', () => {
    const rules = getDefaultRegexRules()
    const ass = convertSubtitle(sampleSrt, 'srt', 'ass', {
      styleName: '电影字幕 底部',
      videoHeight: 1080,
      regexRules: rules,
      applyRegex: true,
    })
    // 英文标点被替换为空格的规则生效
    expect(ass).toMatch(/Dialogue:.*Hello\s\sworld/)
  })
})