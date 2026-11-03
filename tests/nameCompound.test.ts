import { describe, expect, it, vi } from 'vitest';
import { createTask } from '../src/renderer/nameCompound/task';
import { isCorrectName } from '../src/renderer/nameCompound/answer';

const GROUPS = [
  'Karboksilne kisline',
  'Aldehidi',
  'Ketoni',
  'Alkoholi',
  'Alkini',
  'Alkeni',
  'Alkani',
];

describe('createTask', () => {
  // known renderer issue (see the "napaka" issue); keep the test output readable
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  it.todo('places every hydrogen in the structural formula');
  
  // The generator is random, so run it many times to catch rare failures.
  const tasks = Array.from({ length: 300 }, () => createTask());

  it('always derives a complete task', () => {
    for (const task of tasks) {
      expect(task.name.trim()).not.toBe('');
      expect(task.rationalFormula.trim()).not.toBe('');
      expect(task.structure.length).toBeGreaterThan(0);
      expect(task.hint).not.toBe('');
      expect(task.explanation).toContain(task.name);
      expect(GROUPS).toContain(task.group);
    }
  });

  it('accepts its own name as a correct answer', () => {
    for (const task of tasks) {
      expect(isCorrectName(task.name, task.name)).toBe(true);
      expect(isCorrectName(task.name.toUpperCase(), task.name)).toBe(true);
    }
  });

  it('usually avoids repeating the previous compound', () => {
    let repeats = 0;
    let previous = createTask();
    for (let i = 0; i < 200; i++) {
      const next = createTask(previous);
      if (next.name === previous.name) repeats++;
      previous = next;
    }
    // with five attempts a repeat should be very rare
    expect(repeats).toBeLessThan(10);
  });
});