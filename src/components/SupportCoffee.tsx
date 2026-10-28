import { useEffect, useRef, useState } from 'react';
import { SUPPORT_URL } from '../app/support';
import { CloseIcon } from './Icons';

const COFFEE_SRC = `${import.meta.env.BASE_URL}coffee.png`;

export function SupportCoffee() {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  return (
    <>
      <button
        className="icon-button support-button"
        type="button"
        aria-haspopup="dialog"
        aria-label="Support HOWDRY?!"
        onClick={() => setIsOpen(true)}
      >
        <img src={COFFEE_SRC} alt="" width={17} height={17.5} />
      </button>

      <dialog
        ref={dialogRef}
        className="alert-dialog support-dialog"
        aria-labelledby="support-hi"
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
          <div className="support-greeting">
            <img
              className="support-duck"
              src={`${import.meta.env.BASE_URL}duck.png`}
              alt=""
              width={21}
              height={21}
            />
            <h2 id="support-hi" className="support-hi">
              HI
            </h2>
          </div>
          <div className="support-text">
            <p>This rain radar is completely free and will always be free.</p>
            <p>I don't want your data, I just want you to stay dry.</p>
            <p>But I do like coffee. If you want to buy me a coffee, press that coffee.</p>
          </div>
          {SUPPORT_URL ? (
            <a className="support-cup" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
              <img src={COFFEE_SRC} alt="" width={68} height={70} />
              <span>Buy me a coffee ↗</span>
            </a>
          ) : (
            <span className="support-cup is-pending">
              <img src={COFFEE_SRC} alt="" width={68} height={70} />
              <span>Coffee button coming soon</span>
            </span>
          )}
        </div>
      </dialog>
    </>
  );
}
