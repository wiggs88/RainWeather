import { useEffect, useRef, useState } from 'react';
import { summarizeAlertText } from '../weather/alertText';
import { formatClockTime } from '../weather/format';
import type { WeatherAlert } from '../weather/types';
import { CloseIcon } from './Icons';

interface WeatherAlertCalloutProps {
  alerts: WeatherAlert[];
  timezone?: string;
}

const DIALOG_TITLE_ID = 'weather-alert-title';

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function alertTitle(alert: WeatherAlert): string {
  return alert.event ? capitalize(alert.event) : alert.headline;
}

function formatAlertTime(epochMs: number, timezone?: string, nowMs = Date.now()): string {
  const day = (value: number) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: timezone, dateStyle: 'short' }).format(value);
  const time = formatClockTime(epochMs, timezone);
  if (day(epochMs) === day(nowMs)) return time;
  const weekday = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    timeZone: timezone,
  }).format(epochMs);
  return `${weekday} ${time}`;
}

function alertTiming(
  alert: WeatherAlert,
  timezone?: string,
  compact = false,
  nowMs = Date.now(),
): string {
  const { onsetEpochMs: onset, expiresEpochMs: expires } = alert;
  if (onset !== undefined && onset > nowMs) {
    const start = formatAlertTime(onset, timezone, nowMs);
    if (expires === undefined) return `from ${start}`;
    const end = formatAlertTime(expires, timezone, nowMs);
    return compact ? `${start}–${end}` : `from ${start} to ${end}`;
  }
  if (expires !== undefined) return `until ${formatAlertTime(expires, timezone, nowMs)}`;
  return 'in effect';
}

export function WeatherAlertCallout({ alerts, timezone }: WeatherAlertCalloutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hasAlerts = alerts.length > 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      // Start focus on the dialog itself, not the close button, so no focus ring
      // greets touch users; Tab still reaches the close button first.
      dialog.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close?.();
      dialog.removeAttribute('open');
    }
  }, [isOpen, hasAlerts]);

  if (alerts.length === 0) return null;
  const [primary] = alerts;
  const others = alerts.length - 1;
  const kicker = primary.severity === 'unknown' ? 'Warning' : `${capitalize(primary.severity)} warning`;
  const timing = `${alertTiming(primary, timezone, true)}${others > 0 ? ` · +${others}` : ''}`;

  return (
    <>
      <div className="alert-callout">
        <img
          className="alert-duck"
          src={`${import.meta.env.BASE_URL}duck.png`}
          alt=""
          width={21}
          height={21}
        />
        <button
          className={`alert-bubble severity-${primary.severity}`}
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          aria-label={`${kicker}: ${alertTitle(primary)}, ${alertTiming(primary, timezone)}${
            others > 0 ? `, plus ${others} more` : ''
          }. Show details`}
        >
          <span className="alert-kicker">WARNING</span>
          <strong>{alertTitle(primary)}</strong>
          <span className="alert-meta">{timing}</span>
          <span className="alert-chevron" aria-hidden="true">
            ›
          </span>
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="alert-dialog"
        aria-labelledby={DIALOG_TITLE_ID}
        tabIndex={-1}
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          // Clicking the backdrop (the dialog element itself) closes it.
          if (event.target === event.currentTarget) setIsOpen(false);
        }}
      >
        <div className="alert-dialog-body">
          <header className="alert-dialog-header">
            <img
              className="alert-dialog-duck"
              src={`${import.meta.env.BASE_URL}duck.png`}
              alt=""
              width={42}
              height={42}
            />
            <div className="alert-dialog-heading">
              <h2 id={DIALOG_TITLE_ID}>
                {alerts.length > 1 ? `${alerts.length} weather warnings` : 'Weather warning'}
              </h2>
              <p>Official, from the DWD</p>
            </div>
            <button
              className="icon-button alert-dialog-close"
              type="button"
              aria-label="Close"
              onClick={() => setIsOpen(false)}
            >
              <CloseIcon />
            </button>
          </header>
          {alerts.map((alert, index) => {
            const { level, facts, hazards, notes } = summarizeAlertText(alert.description, alert.instruction);
            const timing = alertTiming(alert, timezone);
            return (
              // Only the most severe warning starts expanded; the rest are one line each.
              <details key={alert.id} className="alert-detail" open={index === 0}>
                <summary>
                  <span className="alert-detail-title">
                    <strong className="alert-detail-name">{alertTitle(alert)}</strong>
                    {alert.severity === 'unknown' ? null : (
                      <span className={`alert-severity severity-${alert.severity}`}>
                        {capitalize(alert.severity)}
                      </span>
                    )}
                  </span>
                  <span className="alert-detail-meta">
                    {timing.charAt(0).toUpperCase() + timing.slice(1)}
                    {level ? ` · ${level}` : ''}
                  </span>
                </summary>
                <div className="alert-detail-body">
                  {facts.length > 0 ? (
                    <dl className="alert-facts">
                      {facts.map((fact) => (
                        <div key={fact.label}>
                          <dt>{fact.label}</dt>
                          <dd>{fact.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  {hazards ? (
                    <section className="alert-section">
                      <h3>Hazards</h3>
                      <p>{hazards}</p>
                    </section>
                  ) : null}
                  {notes.map((note) => (
                    <p key={note} className="alert-note">
                      {note}
                    </p>
                  ))}
                </div>
              </details>
            );
          })}
          {primary.sourceUrl ? (
            <a
              className="alert-source"
              href={primary.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Full warning map at DWD ↗
            </a>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
