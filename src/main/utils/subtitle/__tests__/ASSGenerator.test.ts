import { describe, it, expect } from 'vitest'
import { ASSGenerator } from '../ASSGenerator'

describe('ASSGenerator time conversion', () => {
  it('converts SRT milliseconds to ASS centiseconds with rounding', () => {
    const styles = [
      {
        name: 'Default', fontname: 'Arial', fontsize: 20,
        primaryColour: '&H00FFFFFF', secondaryColour: '&H00000000', outlineColour: '&H00000000', backColour: '&H00000000',
        bold: 0, italic: 0, underline: 0, strikeOut: 0,
        scaleX: 100, scaleY: 100, spacing: 0, angle: 0,
        borderStyle: 1, outline: 2, shadow: 0, alignment: 2,
        marginL: 10, marginR: 10, marginV: 20, encoding: 1, lineSpacing: 0,
      }
    ]
    const options = {
      resolution: { width: 1920, height: 1080 },
      scriptType: 'v4.00+',
      wrapStyle: 0,
      scaledBorderAndShadow: false,
    }
    const gen = new ASSGenerator(styles as any, options as any)

    const subs = [
      { index: 1, startTime: '00:00:01,005', endTime: '00:00:02,094', text: 'Test' },
      { index: 2, startTime: '00:00:02,990', endTime: '00:00:03,000', text: 'End' },
    ] as any

    const ass = gen.generate(subs, 'Default')
    expect(ass).toMatch(/Dialogue: 0,0:00:01\.00,0:00:02\.09,Default/)
    expect(ass).toMatch(/Dialogue: 0,0:00:02\.99,0:00:03\.00,Default/)
  })
})