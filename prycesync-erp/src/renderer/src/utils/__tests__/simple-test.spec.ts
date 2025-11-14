import { describe, it, expect } from 'vitest'

describe('Simple Test', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should test string operations', () => {
    const str = 'hello world'
    expect(str.toUpperCase()).toBe('HELLO WORLD')
  })
})