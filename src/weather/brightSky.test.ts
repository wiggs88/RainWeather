import { describe, expect, it } from 'vitest';
import { normalizeBrightSkyAlerts } from './brightSky';

const gusts = {
  id: 1,
  alert_id: 'minor-gusts',
  severity: 'minor',
  onset: '2026-10-23T10:00:00+00:00',
  expires: '2026-10-24T02:00:00+00:00',
  event_en: 'wind gusts',
  event_de: 'WINDBÖEN',
  headline_en: 'Official WARNING of WIND GUSTS',
  headline_de: 'Amtliche WARNUNG vor WINDBÖEN',
  description_en: 'There is a risk of wind gusts (level 1 of 4).',
  instruction_en: 'Secure loose objects.',
};

const gale = {
  ...gusts,
  id: 2,
  alert_id: 'moderate-gale',
  severity: 'moderate',
  event_en: 'gale-force gusts',
  headline_en: 'Official WARNING of GALE-FORCE GUSTS',
};

describe('normalizeBrightSkyAlerts', () => {
  it('reads the language-specific DWD fields', () => {
    const [alert] = normalizeBrightSkyAlerts([gusts], 'en');

    expect(alert).toMatchObject({
      id: 'minor-gusts',
      headline: 'Official WARNING of WIND GUSTS',
      event: 'wind gusts',
      description: 'There is a risk of wind gusts (level 1 of 4).',
      instruction: 'Secure loose objects.',
      severity: 'minor',
      onsetEpochMs: Date.parse('2026-10-23T10:00:00Z'),
      expiresEpochMs: Date.parse('2026-10-24T02:00:00Z'),
    });
    expect(alert.sourceUrl).toMatch(/^https:\/\/www\.dwd\.de\/EN\//);
  });

  it('falls back to the other language when a field is missing', () => {
    const [alert] = normalizeBrightSkyAlerts([gusts], 'de');

    expect(alert.event).toBe('WINDBÖEN');
    expect(alert.description).toBe('There is a risk of wind gusts (level 1 of 4).');
  });

  it('puts the most severe warning first', () => {
    const alerts = normalizeBrightSkyAlerts([gusts, gale], 'en');

    expect(alerts.map((alert) => alert.id)).toEqual(['moderate-gale', 'minor-gusts']);
  });
});
