// Jom ID portal signup: creates one shared account for every
// *.taufikhamid.com app, then sends the browser back to `next` (which the
// portal only accepts on https *.taufikhamid.com).
const JOM_ID_SIGNUP_URL = 'https://jomid.taufikhamid.com/signup';
const PRODUCTION_ORIGIN = 'https://jombeelajar.taufikhamid.com';
// Same destination sign-in on /auth lands on.
const POST_SIGNUP_PATH = '/dashboard';

export const jomIdSignupHref = `${JOM_ID_SIGNUP_URL}?next=${encodeURIComponent(
  `${PRODUCTION_ORIGIN}${POST_SIGNUP_PATH}`
)}`;
