/**
 * Where the coffee button sends people (e.g. a Stripe Payment Link).
 * While this is empty the cup only shows up in local development, so the
 * popup can be tried out before payments are approved.
 */
export const SUPPORT_URL = '';

export const SUPPORT_ENABLED = SUPPORT_URL !== '' || import.meta.env.DEV;
