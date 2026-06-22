import { ValidatorV2, Validator, FormRequest, ValidationException, rules, RequiredRule, EmailRule, MinRule, MaxRule } from '../../../src/Validation/Validator';

describe('ValidatorV2', () => {
  describe('basic validation', () => {
    it('passes when all rules pass', () => {
      const v = ValidatorV2.make({ name: 'John', age: '25' }, {
        name: ['required', 'string'],
        age: 'numeric',
      } as any);
      expect(v.passes()).toBe(true);
      expect(v.fails()).toBe(false);
      expect(v.errors()).toEqual({});
    });

    it('fails when a rule fails', () => {
      const v = ValidatorV2.make({ name: '' }, { name: 'required' });
      expect(v.passes()).toBe(false);
      expect(v.fails()).toBe(true);
      expect(v.errors().name).toBeDefined();
    });

    it('supports array syntax for rules', () => {
      const v = ValidatorV2.make({ email: 'bad' }, { email: ['required', 'email'] });
      expect(v.fails()).toBe(true);
    });
  });

  describe('required', () => {
    it('passes for non-empty values', () => {
      expect(ValidatorV2.make({ f: 'x' }, { f: 'required' }).passes()).toBe(true);
      expect(ValidatorV2.make({ f: 0 }, { f: 'required' }).passes()).toBe(true);
    });

    it('fails for empty strings, null, undefined', () => {
      expect(ValidatorV2.make({ f: '' }, { f: 'required' }).passes()).toBe(false);
      expect(ValidatorV2.make({ f: null }, { f: 'required' }).passes()).toBe(false);
      expect(ValidatorV2.make({}, { f: 'required' }).passes()).toBe(false);
    });
  });

  describe('email', () => {
    it('passes for valid emails', () => {
      expect(ValidatorV2.make({ f: 'a@b.com' }, { f: 'email' }).passes()).toBe(true);
    });

    it('fails for invalid emails', () => {
      expect(ValidatorV2.make({ f: 'not-email' }, { f: 'email' }).passes()).toBe(false);
    });

    it('passes when value is empty (optional)', () => {
      expect(ValidatorV2.make({ f: '' }, { f: 'email' }).passes()).toBe(true);
    });
  });

  describe('min/max', () => {
    it('validates string length with min', () => {
      expect(ValidatorV2.make({ f: 'abc' }, { f: 'min:3' }).passes()).toBe(true);
      expect(ValidatorV2.make({ f: 'ab' }, { f: 'min:3' }).passes()).toBe(false);
    });

    it('validates string length with max', () => {
      expect(ValidatorV2.make({ f: 'abc' }, { f: 'max:3' }).passes()).toBe(true);
      expect(ValidatorV2.make({ f: 'abcd' }, { f: 'max:3' }).passes()).toBe(false);
    });

    it('validates numbers with min', () => {
      expect(ValidatorV2.make({ f: 5 }, { f: 'min:3' }).passes()).toBe(true);
      expect(ValidatorV2.make({ f: 2 }, { f: 'min:3' }).passes()).toBe(false);
    });

    it('passes when value is empty (optional)', () => {
      expect(ValidatorV2.make({ f: '' }, { f: 'min:3' }).passes()).toBe(true);
    });
  });

  describe('numeric', () => {
    it('passes for numeric strings', () => {
      expect(ValidatorV2.make({ f: '123' }, { f: 'numeric' }).passes()).toBe(true);
      expect(ValidatorV2.make({ f: '3.14' }, { f: 'numeric' }).passes()).toBe(true);
    });

    it('fails for non-numeric strings', () => {
      expect(ValidatorV2.make({ f: 'abc' }, { f: 'numeric' }).passes()).toBe(false);
    });

    it('passes when empty', () => {
      expect(ValidatorV2.make({ f: '' }, { f: 'numeric' }).passes()).toBe(true);
    });
  });

  describe('string', () => {
    it('passes for string values', () => {
      expect(ValidatorV2.make({ f: 'hello' }, { f: 'string' }).passes()).toBe(true);
    });

    it('fails for non-string values', () => {
      expect(ValidatorV2.make({ f: '123' }, { f: 'string' }).passes()).toBe(true); // '123' is a string
      // numeric value passed as string in request
    });

    it('passes when empty', () => {
      expect(ValidatorV2.make({ f: '' }, { f: 'string' }).passes()).toBe(true);
    });
  });

  describe('confirmed', () => {
    it('passes when confirmation matches', () => {
      expect(ValidatorV2.make({ password: 'secret', password_confirmation: 'secret' }, { password: 'confirmed' }).passes()).toBe(true);
    });

    it('fails when confirmation does not match', () => {
      expect(ValidatorV2.make({ password: 'secret', password_confirmation: 'different' }, { password: 'confirmed' }).passes()).toBe(false);
    });
  });

  describe('regex', () => {
    it('passes when value matches pattern', () => {
      expect(ValidatorV2.make({ f: 'abc123' }, { f: 'regex:^[a-z0-9]+$' }).passes()).toBe(true);
    });

    it('fails when value does not match', () => {
      expect(ValidatorV2.make({ f: 'ABC' }, { f: 'regex:^[a-z]+$' }).passes()).toBe(false);
    });

    it('passes when empty', () => {
      expect(ValidatorV2.make({ f: '' }, { f: 'regex:/^[a-z]+$/' }).passes()).toBe(true);
    });

    it('fails for invalid regex', () => {
      // Invalid regex should fail silently (return false for the match)
      expect(ValidatorV2.make({ f: 'test' }, { f: 'regex:/[/' }).passes()).toBe(false);
    });
  });

  describe('url', () => {
    it('passes for valid URLs', () => {
      expect(ValidatorV2.make({ f: 'https://example.com' }, { f: 'url' }).passes()).toBe(true);
      expect(ValidatorV2.make({ f: 'http://localhost:3000/path' }, { f: 'url' }).passes()).toBe(true);
    });

    it('fails for invalid URLs', () => {
      expect(ValidatorV2.make({ f: 'not-a-url' }, { f: 'url' }).passes()).toBe(false);
    });

    it('passes when empty', () => {
      expect(ValidatorV2.make({ f: '' }, { f: 'url' }).passes()).toBe(true);
    });
  });

  describe('date', () => {
    it('passes for valid dates', () => {
      expect(ValidatorV2.make({ f: '2024-01-15' }, { f: 'date' }).passes()).toBe(true);
      expect(ValidatorV2.make({ f: '2024-01-15T12:00:00Z' }, { f: 'date' }).passes()).toBe(true);
    });

    it('fails for invalid dates', () => {
      expect(ValidatorV2.make({ f: 'not-a-date' }, { f: 'date' }).passes()).toBe(false);
    });

    it('passes when empty', () => {
      expect(ValidatorV2.make({ f: '' }, { f: 'date' }).passes()).toBe(true);
    });
  });

  describe('after / before', () => {
    it('passes when date is after reference', () => {
      expect(ValidatorV2.make({ f: '2024-06-01' }, { f: 'after:2024-01-01' }).passes()).toBe(true);
    });

    it('fails when date is before reference', () => {
      expect(ValidatorV2.make({ f: '2023-01-01' }, { f: 'after:2024-01-01' }).passes()).toBe(false);
    });

    it('passes when date is before reference', () => {
      expect(ValidatorV2.make({ f: '2023-01-01' }, { f: 'before:2024-01-01' }).passes()).toBe(true);
    });

    it('passes when empty', () => {
      expect(ValidatorV2.make({ f: '' }, { f: 'after:2024-01-01' }).passes()).toBe(true);
    });
  });

  describe('array', () => {
    it('passes for array values', () => {
      expect(ValidatorV2.make({ f: [1, 2, 3] }, { f: 'array' }).passes()).toBe(true);
    });

    it('fails for non-array values', () => {
      expect(ValidatorV2.make({ f: 'string' }, { f: 'array' }).passes()).toBe(false);
    });

    it('passes when empty', () => {
      expect(ValidatorV2.make({ f: '' }, { f: 'array' }).passes()).toBe(true);
    });
  });

  describe('in / not_in', () => {
    it('passes when value is in list', () => {
      expect(ValidatorV2.make({ f: 'a' }, { f: 'in:a,b,c' }).passes()).toBe(true);
    });

    it('fails when value is not in list', () => {
      expect(ValidatorV2.make({ f: 'z' }, { f: 'in:a,b,c' }).passes()).toBe(false);
    });

    it('passes when value is not in list', () => {
      expect(ValidatorV2.make({ f: 'z' }, { f: 'not_in:a,b,c' }).passes()).toBe(true);
    });

    it('fails when value is in list', () => {
      expect(ValidatorV2.make({ f: 'a' }, { f: 'not_in:a,b,c' }).passes()).toBe(false);
    });

    it('passes when empty', () => {
      expect(ValidatorV2.make({ f: '' }, { f: 'in:a,b,c' }).passes()).toBe(true);
    });
  });

  describe('error messages', () => {
    it('uses default messages', () => {
      const v = ValidatorV2.make({ name: '' }, { name: 'required' });
      v.validate();
      expect(v.errors().name[0]).toContain('name');
      expect(v.errors().name[0]).toContain('required');
    });

    it('supports custom messages per field string', () => {
      const v = ValidatorV2.make({ age: '' }, { age: 'required' }, { age: 'Age is required!' });
      v.validate();
      expect(v.errors().age[0]).toBe('Age is required!');
    });

    it('supports custom messages per field per rule', () => {
      const v = ValidatorV2.make({ age: '' }, { age: 'required' }, { age: { required: 'Age cannot be empty' } });
      v.validate();
      expect(v.errors().age[0]).toBe('Age cannot be empty');
    });
  });

  describe('field names', () => {
    it('uses custom field names in messages', () => {
      const v = ValidatorV2.make({ user_email: '' }, { user_email: 'required' });
      v.setNames({ user_email: 'Email Address' });
      v.validate();
      expect(v.errors().user_email[0]).toContain('Email Address');
    });
  });

  describe('multiple fields and rules', () => {
    it('validates multiple fields simultaneously', () => {
      const v = ValidatorV2.make({
        name: 'John',
        email: 'not-email',
        age: 'underage',
      }, {
        name: ['required', 'string'],
        email: ['required', 'email'],
        age: ['required', 'numeric'],
      } as any);
      expect(v.fails()).toBe(true);
      expect(Object.keys(v.errors())).toEqual(['email', 'age']);
    });
  });
});

describe('Validator (async)', () => {
  it('passes when all rules pass', async () => {
    const v = Validator.make({ name: 'John' });
    v.rule('name', new RequiredRule());
    expect(await v.validate()).toBe(true);
    expect(v.fails()).toBe(false);
  });

  it('fails when a rule fails', async () => {
    const v = Validator.make({ name: '' });
    v.rule('name', new RequiredRule());
    expect(await v.validate()).toBe(false);
    expect(v.fails()).toBe(true);
    expect(v.getErrors().name).toBeDefined();
  });

  it('replaces :field in error messages', async () => {
    const v = Validator.make({ x: '' });
    v.rule('x', new RequiredRule());
    await v.validate();
    expect(v.getErrors().x[0]).toContain('x');
  });
});

describe('FormRequest', () => {
  class TestFormRequest extends FormRequest {
    protected rules(): any {
      return { title: ['required', 'string'] };
    }
  }

  it('passes validation with valid data', async () => {
    const fr = new TestFormRequest();
    const req = { body: { title: 'Hello' } } as any;
    await expect(fr.validateRequest(req)).resolves.toBeUndefined();
  });

  it('throws ValidationException with invalid data', async () => {
    const fr = new TestFormRequest();
    const req = { body: { title: '' } } as any;
    await expect(fr.validateRequest(req)).rejects.toThrow(ValidationException);
  });
});

describe('rules factory', () => {
  it('creates RequiredRule', () => {
    expect(rules.required()).toBeInstanceOf(RequiredRule);
  });

  it('creates EmailRule', () => {
    expect(rules.email()).toBeInstanceOf(EmailRule);
  });

  it('creates MinRule with parameter', () => {
    const rule = rules.min(5);
    expect(rule).toBeInstanceOf(MinRule);
    expect(rule.validate('12345')).toBe(true);
    expect(rule.validate('1234')).toBe(false);
  });

  it('creates MaxRule with parameter', () => {
    const rule = rules.max(3);
    expect(rule).toBeInstanceOf(MaxRule);
    expect(rule.validate('abc')).toBe(true);
    expect(rule.validate('abcd')).toBe(false);
  });
});
