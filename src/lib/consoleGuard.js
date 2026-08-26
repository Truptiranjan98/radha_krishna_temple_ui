/**
 * A warning printed straight into the browser console on load.
 *
 * There is no code vulnerability this patches — React escapes every string it
 * renders and nothing in this app touches innerHTML or eval, so there is no
 * injection point for a stranger to exploit remotely. The real risk with a
 * console is social engineering: a scammer walks a signed-in admin through
 * pasting a snippet here that reads the tokens out of localStorage (see
 * lib/api.js) and mails them off, effectively "logging in" as the temple
 * admin without ever knowing the password. This is the same warning
 * Facebook, Google and GitHub show, aimed at exactly that trick — it cannot
 * stop someone who deliberately opens devtools to poke around, only someone
 * being talked into it.
 */
export function warnConsole() {
  if (!import.meta.env.PROD) return;

  const shout = 'font-size: 28px; font-weight: bold; color: #a83f52;';
  const body = 'font-size: 14px; line-height: 1.5; color: #1f1743;';

  console.log('%cStop.', shout);
  console.log(
    '%cThis panel is a browser developer feature. If someone told you to paste ' +
      'something here to "verify" your account, "unlock" a feature or "fix" an ' +
      'error, it is a scam — pasting it can hand over this temple admin ' +
      'account. Close this panel and do not paste anything you did not write ' +
      'yourself.',
    body,
  );
}
