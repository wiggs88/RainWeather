import { useEffect, useRef, useState } from 'react';
import { SUPPORT_ENABLED, SUPPORT_URL } from '../app/support';
import { CloseIcon } from './Icons';

interface SupportCoffeeProps {
  /** `panel` sits inside the weather panel on phones; `corner` floats bottom-right on desktop. */
  placement: 'panel' | 'corner';
}

const COFFEE_SRC = `${import.meta.env.BASE_URL}coffee.png`;

export function SupportCoffee({ placement }: SupportCoffeeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `support-title-${placement}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      dialog.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close?.();
      dialog.removeAttribute('open');
    }
  }, [isOpen]);

  if (!SUPPORT_ENABLED) return null;

  return (
    <>
      <button
        className={`support-button is-${placement}`}
        type="button"
        aria-haspopup="dialog"
        aria-label="Support HOWDRY?!"
        onClick={() => setIsOpen(true)}
      >
        <img src={COFFEE_SRC} alt="" width={17} height={16} />
      </button>

      <dialog
        ref={dialogRef}
        className="alert-dialog support-dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setIsOpen(false);
        }}
      >
        <div className="support-dialog-body">
          <button
            className="icon-button alert-dialog-close support-dialog-close"
            type="button"
            aria-label="Close"
            onClick={() => setIsOpen(false)}
          >
            <CloseIcon />
          </button>
          <h2 id={titleId}>Free, forever.</h2>
          <p>This rain radar is completely free and will always be free.</p>
          <p>I don't want your data, I just want you to stay dry.</p>
          <p>But I do like coffee. If you want to buy me one, press the coffee.</p>
          {SUPPORT_URL ? (
            <a className="support-cup" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
              <img src={COFFEE_SRC} alt="" width={68} height={64} />
              <span>Buy me a coffee ↗</span>
            </a>
          ) : (
            <span className="support-cup is-pending">
              <img src={COFFEE_SRC} alt="" width={68} height={64} />
              <span>Coffee button coming soon</span>
            </span>
          )}
        </div>
      </dialog>
    </>
  );
}
