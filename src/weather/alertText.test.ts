import { describe, expect, it } from 'vitest';
import { summarizeAlertText } from './alertText';

describe('summarizeAlertText', () => {
  it('turns DWD English text into a level, facts and hazards, dropping advice', () => {
    const summary = summarizeAlertText(
      'There is a risk of gale-force gusts (level 2 of 4).\nMax. gusts: 60-75 km/h; Wind direction: south then south-west',
      'Hazard(s) caused by: single branches falling; objects flying through the air. \nRecommendations for what to do: \nSecure free-standing objects (e.g. screens and furniture). Watch out for falling objects outdoors.',
    );

    expect(summary).toEqual({
      level: 'Level 2 of 4',
      facts: [
        { label: 'Max. gusts', value: '60-75 km/h' },
        { label: 'Wind direction', value: 'south then south-west' },
      ],
      hazards: 'Single branches falling; objects flying through the air',
      notes: [],
    });
  });

  it('handles other hazard labels such as "Great danger due to"', () => {
    const summary = summarizeAlertText(
      'There is a risk of heavy persistent rain (level 3 of 4).\nHeight range: > 800 m; Precipitation amounts: 40-60 l/m²; in windward areas: ~ 80 l/m²',
      'Great danger due to: flooding of roads, subways and buildings near water bodies; possible mudslides\nRecommendations for what to do: Avoid flooded areas and areas at risk. Keep up to date at www.hochwasserzentralen.de',
    );

    expect(summary.facts.map((fact) => fact.label)).toEqual([
      'Height range',
      'Precipitation amounts',
      'In windward areas',
    ]);
    expect(summary.hazards).toBe(
      'Flooding of roads, subways and buildings near water bodies; possible mudslides',
    );
  });

  it('keeps description prose it cannot label and skips unlabelled advice', () => {
    const summary = summarizeAlertText('Es treten Sturmböen auf.', 'Gegenstände sichern.');

    expect(summary.level).toBeUndefined();
    expect(summary.notes).toEqual(['Es treten Sturmböen auf.']);
    expect(summary.hazards).toBeUndefined();
  });
});
