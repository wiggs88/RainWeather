export interface AlertFact {
  label: string;
  value: string;
}

export interface AlertSummary {
  /** Warning level from DWD's "(level 2 of 4)" phrasing, when present. */
  level?: string;
  /** Measured or expected values, e.g. "Max. gusts: 60-75 km/h". */
  facts: AlertFact[];
  /** What the weather may cause. */
  hazards?: string;
  /** What to do, one sentence per item. */
  advice: string[];
  /** Free text that didn't fit the shapes above (e.g. German prose). */
  notes: string[];
}

const LEVEL_SENTENCE = /^There is a risk of [^.]*\(level (\d) of (\d)\)\.?\s*/i;
const LABELLED = /^([^:]{2,32}):\s*(.+)$/;
const ADVICE_LABEL = /(recommendations for what to do|handlungsempfehlungen)\s*:/i;
// "Hazard(s) caused by:", "Great danger due to:", "Gefahr durch:" …
const LEADING_LABEL = /^[^:.]{2,40}:\s*/;

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function splitDescription(description: string, summary: AlertSummary) {
  const match = description.match(LEVEL_SENTENCE);
  const rest = match ? description.slice(match[0].length) : description;
  if (match) summary.level = `Level ${match[1]} of ${match[2]}`;

  for (const line of rest.split('\n').map(clean).filter(Boolean)) {
    const parts = line.split(/;\s*/);
    const labelled = parts.map((part) => part.match(LABELLED));
    if (labelled.every(Boolean)) {
      for (const found of labelled) {
        summary.facts.push({ label: capitalize(found![1]), value: found![2] });
      }
    } else {
      summary.notes.push(line);
    }
  }
}

function sentences(text: string): string[] {
  // Split after a full stop followed by a capital, keeping "e.g. screens" intact.
  return text
    .split(/(?<=[.!])\s+(?=[A-ZÄÖÜ])/)
    .map((sentence) => sentence.replace(/[.;]\s*$/, ''))
    .filter(Boolean);
}

function splitInstruction(instruction: string, summary: AlertSummary) {
  const text = clean(instruction);
  const advice = text.match(ADVICE_LABEL);
  const hazardText = advice ? text.slice(0, advice.index) : '';
  const adviceText = advice ? text.slice(advice.index! + advice[0].length) : text;

  const hazards = clean(hazardText.replace(LEADING_LABEL, '')).replace(/[.;]\s*$/, '');
  if (hazards) summary.hazards = capitalize(hazards);
  summary.advice.push(...sentences(clean(adviceText)));
}

export function summarizeAlertText(description?: string, instruction?: string): AlertSummary {
  const summary: AlertSummary = { facts: [], advice: [], notes: [] };
  if (description) splitDescription(description, summary);
  if (instruction) splitInstruction(instruction, summary);
  return summary;
}
