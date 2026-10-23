export interface AlertFact {
  label: string;
  value: string;
}

export interface AlertSummary {
  /** Warning level from DWD's "(level 2 of 4)" phrasing, when present. */
  level?: string;
  facts: AlertFact[];
  /** Free text that didn't fit the label/value shape. */
  notes: string[];
}

const LEVEL_SENTENCE = /^There is a risk of [^.]*\(level (\d) of (\d)\)\.?\s*/i;
const LABELLED = /^([^:]{2,32}):\s*(.+)$/;
const HAZARD_LABEL = /^(hazard\(s\)[^:]*|gefahr[^:]*):\s*/i;
const ADVICE_LABEL = /^(recommendations for what to do|handlungsempfehlungen):\s*/i;

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function splitDescription(description: string, summary: AlertSummary) {
  const match = description.match(LEVEL_SENTENCE);
  const rest = match ? description.slice(match[0].length) : description;
  if (match) summary.level = `Level ${match[1]} of ${match[2]}`;

  for (const line of rest.split('\n').map(clean).filter(Boolean)) {
    const parts = line.split(/;\s*/);
    const labelled = parts.map((part) => part.match(LABELLED));
    if (labelled.every(Boolean)) {
      for (const found of labelled) summary.facts.push({ label: found![1], value: found![2] });
    } else {
      summary.notes.push(line);
    }
  }
}

function splitInstruction(instruction: string, summary: AlertSummary) {
  // DWD instructions read "Hazard(s) …: x. Recommendations for what to do: y."
  // across several lines; regroup them into two labelled facts.
  const lines = instruction.split('\n').map(clean).filter(Boolean);
  let current: AlertFact | undefined;
  const facts: AlertFact[] = [];
  for (const line of lines) {
    const hazard = line.match(HAZARD_LABEL);
    const advice = line.match(ADVICE_LABEL);
    if (hazard || advice) {
      current = { label: hazard ? 'Hazards' : 'What to do', value: '' };
      facts.push(current);
      const remainder = line.slice((hazard ?? advice)![0].length);
      if (remainder) current.value = remainder;
    } else if (current) {
      current.value = clean(`${current.value} ${line}`);
    } else {
      facts.push((current = { label: 'What to do', value: line }));
    }
  }
  for (const fact of facts) {
    const value = fact.value.replace(/[.;]\s*$/, '');
    if (value) summary.facts.push({ label: fact.label, value });
  }
}

export function summarizeAlertText(description?: string, instruction?: string): AlertSummary {
  const summary: AlertSummary = { facts: [], notes: [] };
  if (description) splitDescription(description, summary);
  if (instruction) splitInstruction(instruction, summary);
  return summary;
}
