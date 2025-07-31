import { ExampleSharedType } from '../../../packages/shared/src/index';

describe('ExampleSharedType', () => {
  it('should be assignable', () => {
    const value: ExampleSharedType = { id: 'test', createdAt: new Date() };
    expect(value.id).toBe('test');
  });
});
