import { ExampleSharedType } from '../../../packages/shared/src/index';

describe('Server shared import', () => {
  it('should import ExampleSharedType', () => {
    const value: ExampleSharedType = { id: 'server', createdAt: new Date() };
    expect(value.id).toBe('server');
  });
});
