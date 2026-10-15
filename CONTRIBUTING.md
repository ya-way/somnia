# Contributing to Somnia

Thanks for helping make sleep intelligence more understandable and controllable.

## Local workflow

Use Node.js 22 or newer. `npm start` serves the app at http://127.0.0.1:4173. No packages need to be installed.

Run `npm test`, `npm run check` and `npm run build` before submitting a pull request. For interface changes, check a desktop viewport, a narrow mobile viewport, keyboard navigation and reduced motion.

## Principles

- Separate observed signals, user-supplied context and system interpretation.
- Keep sample data synthetic and label it clearly.
- Never add fabricated customer, efficacy, commercial or benchmark claims.
- Make memories visible, correctable and removable.
- Treat imported strings as untrusted text; do not render them as HTML.
- Keep privacy defaults conservative. Discuss new network calls and storage changes.
- Prefer small, dependency-free contributions with a clear user benefit.

Bug reports should include reproduction steps and synthetic fixtures. Do not post personal sleep records, medical information, confidential partner data or credentials. Security concerns belong in the process described in [SECURITY.md](SECURITY.md).

By contributing, you agree to license your first-party contribution under the repository's MIT license. Third-party assets must retain their original license and attribution.
