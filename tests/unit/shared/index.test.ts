import { z } from 'zod';

describe('shared zod schema', () => {
  it('validates a simple object', () => {
    const schema = z.object({ foo: z.string() });
    expect(schema.parse({ foo: 'bar' })).toEqual({ foo: 'bar' });
  });
});
