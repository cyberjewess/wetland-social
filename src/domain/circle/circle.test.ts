import {
  createCircle,
  updateCircle,
  validateCircle,
  validateCircleName,
  validateCircleDescription,
  validateCircleMembers,
  CircleValidationError,
  isMember,
  addMember,
  removeMember,
} from './circle'
import { MAX_CIRCLE_MEMBERS } from './circleRules'

describe('Circle Domain', () => {
  const validMembers = [
    'did:plc:abc123',
    'did:plc:def456',
    'did:web:example.com',
  ]

  describe('validateCircleName', () => {
    it('should accept valid names', () => {
      expect(() => validateCircleName('Friends')).not.toThrow()
      expect(() => validateCircleName('Work Team')).not.toThrow()
      expect(() => validateCircleName('A'.repeat(50))).not.toThrow()
    })

    it('should reject empty names', () => {
      expect(() => validateCircleName('')).toThrow(
        'Circle name cannot be empty'
      )
      expect(() => validateCircleName('   ')).toThrow(
        'Circle name cannot be empty'
      )
    })

    it('should reject null/undefined', () => {
      expect(() => validateCircleName(null as unknown as string)).toThrow(
        'Circle name is required'
      )
      expect(() => validateCircleName(undefined as unknown as string)).toThrow(
        'Circle name is required'
      )
    })

    it('should reject names exceeding 50 graphemes', () => {
      const longName = 'A'.repeat(51)
      expect(() => validateCircleName(longName)).toThrow(CircleValidationError)
      expect(() => validateCircleName(longName)).toThrow(
        'exceeds maximum length of 50 graphemes'
      )
    })
  })

  describe('validateCircleDescription', () => {
    it('should accept valid descriptions', () => {
      expect(() => validateCircleDescription('My close friends')).not.toThrow()
      expect(() => validateCircleDescription('A'.repeat(200))).not.toThrow()
    })

    it('should accept undefined (optional)', () => {
      expect(() => validateCircleDescription(undefined)).not.toThrow()
    })

    it('should reject descriptions exceeding 200 graphemes', () => {
      const longDesc = 'A'.repeat(201)
      expect(() => validateCircleDescription(longDesc)).toThrow(
        'exceeds maximum length of 200 graphemes'
      )
    })
  })

  describe('validateCircleMembers', () => {
    it('should accept valid member arrays', () => {
      expect(() => validateCircleMembers(validMembers)).not.toThrow()
      expect(() => validateCircleMembers([])).not.toThrow()
    })

    it('should reject non-array inputs', () => {
      expect(() => validateCircleMembers(null as unknown as string[])).toThrow(
        'Circle members must be an array'
      )
    })

    it('should reject invalid DIDs', () => {
      expect(() =>
        validateCircleMembers(['invalid', 'did:plc:abc123'])
      ).toThrow('All circle members must be valid DIDs')
    })

    it('should reject duplicate members', () => {
      expect(() =>
        validateCircleMembers(['did:plc:abc123', 'did:plc:abc123'])
      ).toThrow('Circle members must be unique')
    })

    it('should reject exceeding member limit', () => {
      const tooManyMembers = Array.from(
        { length: MAX_CIRCLE_MEMBERS + 1 },
        (_, i) => `did:plc:member${i}`
      )
      expect(() => validateCircleMembers(tooManyMembers)).toThrow(
        `Circle cannot have more than ${MAX_CIRCLE_MEMBERS} members`
      )
    })
  })

  describe('validateCircle', () => {
    it('should validate complete circle', () => {
      const circle = {
        name: 'Friends',
        description: 'My close friends',
        members: validMembers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(() => validateCircle(circle)).not.toThrow()
    })

    it('should validate circle without description', () => {
      const circle = {
        name: 'Friends',
        members: validMembers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(() => validateCircle(circle)).not.toThrow()
    })

    it('should reject invalid createdAt', () => {
      const circle = {
        name: 'Friends',
        members: validMembers,
        createdAt: 'invalid',
        updatedAt: new Date().toISOString(),
      }
      expect(() => validateCircle(circle)).toThrow(
        'createdAt must be a valid ISO datetime'
      )
    })

    it('should reject invalid updatedAt', () => {
      const circle = {
        name: 'Friends',
        members: validMembers,
        createdAt: new Date().toISOString(),
        updatedAt: 'invalid',
      }
      expect(() => validateCircle(circle)).toThrow(
        'updatedAt must be a valid ISO datetime'
      )
    })
  })

  describe('createCircle', () => {
    it('should create valid circle', () => {
      const circle = createCircle({
        name: 'Friends',
        description: 'My close friends',
        members: validMembers,
      })

      expect(circle.name).toBe('Friends')
      expect(circle.description).toBe('My close friends')
      expect(circle.members).toEqual(validMembers)
      expect(circle.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(circle.updatedAt).toBe(circle.createdAt)
    })

    it('should create circle without description', () => {
      const circle = createCircle({
        name: 'Friends',
        members: validMembers,
      })

      expect(circle.description).toBeUndefined()
    })

    it('should throw for invalid circle', () => {
      expect(() =>
        createCircle({
          name: '',
          members: validMembers,
        })
      ).toThrow(CircleValidationError)
    })
  })

  describe('updateCircle', () => {
    const existingCircle = createCircle({
      name: 'Friends',
      description: 'Original description',
      members: validMembers,
    })

    it('should update name', () => {
      const updated = updateCircle(existingCircle, {
        name: 'Best Friends',
      })

      expect(updated.name).toBe('Best Friends')
      expect(updated.description).toBe('Original description')
      expect(updated.updatedAt).not.toBe(existingCircle.updatedAt)
    })

    it('should update description', () => {
      const updated = updateCircle(existingCircle, {
        description: 'New description',
      })

      expect(updated.description).toBe('New description')
    })

    it('should update members', () => {
      const newMembers = ['did:plc:newmember']
      const updated = updateCircle(existingCircle, {
        members: newMembers,
      })

      expect(updated.members).toEqual(newMembers)
    })

    it('should validate updated circle', () => {
      expect(() =>
        updateCircle(existingCircle, {
          name: '',
        })
      ).toThrow(CircleValidationError)
    })
  })

  describe('isMember', () => {
    const circle = createCircle({
      name: 'Friends',
      members: validMembers,
    })

    it('should return true for existing member', () => {
      expect(isMember(circle, 'did:plc:abc123')).toBe(true)
    })

    it('should return false for non-member', () => {
      expect(isMember(circle, 'did:plc:notamember')).toBe(false)
    })
  })

  describe('addMember', () => {
    const circle = createCircle({
      name: 'Friends',
      members: ['did:plc:abc123'],
    })

    it('should add new member', () => {
      const updated = addMember(circle, 'did:plc:newmember')

      expect(updated.members).toContain('did:plc:abc123')
      expect(updated.members).toContain('did:plc:newmember')
      expect(updated.members.length).toBe(2)
    })

    it('should throw if member already exists', () => {
      expect(() => addMember(circle, 'did:plc:abc123')).toThrow(
        'Member already exists in circle'
      )
    })

    it('should validate member DID', () => {
      expect(() => addMember(circle, 'invalid')).toThrow(CircleValidationError)
    })
  })

  describe('removeMember', () => {
    const circle = createCircle({
      name: 'Friends',
      members: ['did:plc:abc123', 'did:plc:def456'],
    })

    it('should remove existing member', () => {
      const updated = removeMember(circle, 'did:plc:abc123')

      expect(updated.members).not.toContain('did:plc:abc123')
      expect(updated.members).toContain('did:plc:def456')
      expect(updated.members.length).toBe(1)
    })

    it('should throw if member does not exist', () => {
      expect(() => removeMember(circle, 'did:plc:notamember')).toThrow(
        'Member does not exist in circle'
      )
    })
  })
})
