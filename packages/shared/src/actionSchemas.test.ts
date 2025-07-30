import { GameActionSchema, GameEventSchema } from './index';

describe('GameActionSchema', () => {
  it('accepts valid move action', () => {
    expect(GameActionSchema.parse({ type: 'move', direction: 'up' })).toBeTruthy();
  });
  it('accepts valid item_drop action', () => {
    expect(GameActionSchema.parse({ type: 'item_drop', item: 'Potion' })).toBeTruthy();
  });
  it('accepts valid combat action', () => {
    expect(GameActionSchema.parse({ type: 'combat', targetId: 'enemy-1' })).toBeTruthy();
  });
  it('rejects invalid action type', () => {
    expect(() => GameActionSchema.parse({ type: 'fly' })).toThrow();
  });
  it('rejects move with invalid direction', () => {
    expect(() => GameActionSchema.parse({ type: 'move', direction: 'sideways' })).toThrow();
  });
});

describe('GameEventSchema', () => {
  it('accepts valid item_drop event', () => {
    expect(
      GameEventSchema.parse({ event: 'item_drop', item: 'Sword', by: { id: 'user1' } }),
    ).toBeTruthy();
  });
  it('accepts valid combat event', () => {
    expect(
      GameEventSchema.parse({
        event: 'combat',
        attacker: { id: 'user1' },
        targetId: 'enemy-1',
        result: 'win',
      }),
    ).toBeTruthy();
  });
  it('rejects event with missing fields', () => {
    expect(() => GameEventSchema.parse({ event: 'combat', attacker: {}, result: 'win' })).toThrow();
  });
});
