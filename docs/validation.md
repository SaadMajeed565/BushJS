# Validation

Bush.js provides two complementary validation APIs:

- `Validator` + `rules` for rule objects
- `ValidatorV2` for string-based rules

## `ValidatorV2` (string-based rules)

```ts
import { ValidatorV2 } from 'bushjs';

const validator = ValidatorV2.make(request.body, {
  name: 'required|string|min:2|max:50',
  email: 'required|email',
  role: 'in:admin,editor,viewer',
  password: 'required|string|min:8|confirmed',
});

if (validator.fails()) {
  response.status(422).json({ errors: validator.errors() });
  return;
}
```

### Supported rules

- `required`
- `email`
- `min:n`, `max:n`
- `numeric`, `string`
- `confirmed` (expects `<field>_confirmation`)
- `regex:...`
- `url`, `date`, `after:...`, `before:...`
- `array`
- `in:a,b,c`, `not_in:a,b,c`

## `Validator` (rule-object style)

```ts
import { Validator, rules } from 'bushjs';

const validator = Validator.make(request.body)
  .rule('title', rules.required(), rules.min(3), rules.max(120))
  .rule('email', rules.required(), rules.email());

const ok = await validator.validate();
if (!ok) {
  response.status(422).json({ errors: validator.getErrors() });
  return;
}
```

## Validation in controllers

If your controller extends `Controller`, you can use the helper:

```ts
await this.validate(request, {
  title: [rules.required(), rules.min(3)],
  body: [rules.required()],
});
```

On failure, it throws `ValidationException`.

## Validation Strategy

- Use `ValidatorV2` for request payload style rules
- Use `Validator` when you need explicit rule objects
- Return `422` for validation errors in API endpoints
- Keep validation definitions close to input boundaries

---
**Previous:** [Middleware](middleware.md) | **Next:** [Authentication](authentication.md)
