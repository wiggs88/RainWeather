import { describe, expect, it } from 'vitest';
import { summarizeAlertText } from './alertText';

describe('summarizeAlertText', () => {
  it('turns DWD English text into a level and labelled facts', () => {
    const summary = summarizeAlertText(
      'There is a risk of gale-force gusts (level 2 of 4).\nMax. gusts: 60-75 km/h; Wind direction: south then south-west',
      'Hazard(s) caused by: single branches falling; objects flying through the air. \nRecommendations for what to do: \nSecure free-standing objects (e.g. screens and furniture).',
    );

    expect(summary).toEqual({
      level: 'Level 2 of 4',
      facts: [
        { label: 'Max. gusts', value: '60-75 km/h' },
        { label: 'Wind direction', value: 'south then south-west' },
        { label: 'Hazards', value: 'single branches falling; objects flying through the air' },
        { label: 'What to do', value: 'Secure free-standing objects (e.g. screens and furniture)' },
      ],
      notes: [],
    });
  });

  it('keeps prose it cannot label', () => {
    const summary = summarizeAlertText('Es treten Sturmböen auf.', 'Gegenstände sichern.');

    expect(summary.level).toBeUndefined();
    expect(summary.notes).toEqual(['Es treten Sturmböen auf.']);
    expect(summary.facts).toEqual([{ label: 'What to do', value: 'Gegenstände sichern' }]);
  });
});
