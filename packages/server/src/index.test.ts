import { ExampleSharedType } from '@gameboilerplate/shared';

describe('Server shared import', () => {
  it('should import ExampleSharedType', () => {
    const value: ExampleSharedType = { id: 'server', createdAt: new Date() };
    expect(value.id).toBe('server');
  });
});
