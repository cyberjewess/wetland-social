import {
  assertCircleLimit,
  assertMemberLimit,
  canCreateMoreCircles,
  MAX_CIRCLES_PER_USER,
  MAX_CIRCLE_MEMBERS,
} from './circleRules'

describe('Circle Rules', () => {
  describe('assertCircleLimit', () => {
    it('should not throw for users under limit', () => {
      expect(() => assertCircleLimit(0)).not.toThrow()
      expect(() => assertCircleLimit(4)).not.toThrow()
    })

    it('should throw when limit reached', () => {
      expect(() => assertCircleLimit(5)).toThrow(`Cannot create more circles. Maximum allowed: ${MAX_CIRCLES_PER_USER}`)
    })

    it('should throw when limit exceeded', () => {
      expect(() => assertCircleLimit(6)).toThrow()
    })
  })

  describe('assertMemberLimit', () => {
    it('should not throw for valid member counts', () => {
      expect(() => assertMemberLimit(0)).not.toThrow()
      expect(() => assertMemberLimit(100)).not.toThrow()
      expect(() => assertMemberLimit(MAX_CIRCLE_MEMBERS)).not.toThrow()
    })

    it('should throw for negative member counts', () => {
      expect(() => assertMemberLimit(-1)).toThrow('Circle member count cannot be negative')
    })

    it('should throw when exceeding member limit', () => {
      expect(() => assertMemberLimit(MAX_CIRCLE_MEMBERS + 1)).toThrow(
        `Circle cannot have more than ${MAX_CIRCLE_MEMBERS} members`
      )
    })
  })

  describe('canCreateMoreCircles', () => {
    it('should return true when under limit', () => {
      expect(canCreateMoreCircles(0)).toBe(true)
      expect(canCreateMoreCircles(4)).toBe(true)
    })

    it('should return false when at or over limit', () => {
      expect(canCreateMoreCircles(5)).toBe(false)
      expect(canCreateMoreCircles(6)).toBe(false)
    })
  })
})
