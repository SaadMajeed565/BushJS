import { RequiredRule, EmailRule, MinRule, MaxRule } from '../../../src/Validation/Validator';

describe('Validation Rules', () => {
  describe('RequiredRule', () => {
    const rule = new RequiredRule();

    it('passes for non-null/undefined values', () => {
      expect(rule.validate('hello')).toBe(true);
      expect(rule.validate(0)).toBe(true);
      expect(rule.validate(false)).toBe(true);
      expect(rule.validate([])).toBe(true);
    });

    it('fails for null, undefined, or empty string', () => {
      expect(rule.validate(null)).toBe(false);
      expect(rule.validate(undefined)).toBe(false);
      expect(rule.validate('')).toBe(false);
    });

    it('returns error message', () => {
      expect(rule.message()).toContain('required');
    });
  });

  describe('EmailRule', () => {
    const rule = new EmailRule();

    it('passes for valid emails', () => {
      expect(rule.validate('user@example.com')).toBe(true);
      expect(rule.validate('a.b@c.co')).toBe(true);
    });

    it('fails for invalid emails', () => {
      expect(rule.validate('not-email')).toBe(false);
      expect(rule.validate('@domain.com')).toBe(false);
      expect(rule.validate('user@')).toBe(false);
    });

    it('fails for non-string values', () => {
      expect(rule.validate(123)).toBe(false);
    });
  });

  describe('MinRule', () => {
    const rule = new MinRule(3);

    it('passes when string length >= min', () => {
      expect(rule.validate('abc')).toBe(true);
      expect(rule.validate('abcd')).toBe(true);
    });

    it('fails when string length < min', () => {
      expect(rule.validate('ab')).toBe(false);
    });

    it('passes when number >= min', () => {
      expect(rule.validate(5)).toBe(true);
      expect(rule.validate(3)).toBe(true);
    });

    it('fails when number < min', () => {
      expect(rule.validate(2)).toBe(false);
    });

    it('passes when array length >= min', () => {
      expect(rule.validate([1, 2, 3])).toBe(true);
    });

    it('fails for unsupported types', () => {
      expect(rule.validate({})).toBe(false);
    });
  });

  describe('MaxRule', () => {
    const rule = new MaxRule(5);

    it('passes when string length <= max', () => {
      expect(rule.validate('abc')).toBe(true);
      expect(rule.validate('12345')).toBe(true);
    });

    it('fails when string length > max', () => {
      expect(rule.validate('123456')).toBe(false);
    });

    it('passes when number <= max', () => {
      expect(rule.validate(3)).toBe(true);
      expect(rule.validate(5)).toBe(true);
    });

    it('fails when number > max', () => {
      expect(rule.validate(10)).toBe(false);
    });
  });
});
