# Release validation — 2026-10-15

## Automated checks

- Seven reference-engine tests pass: overnight comparison, insufficient data, invalid records, imports, memory lifecycle, workspace validation and context branches.
- Syntax checks pass for the browser and server modules.
- Local HTML assets, font assets, fragment links and font license are present.
- Static build completes without package installation.

## Browser checks

Verified in Microsoft Edge on Windows:

- Desktop and narrow mobile layouts; no horizontal document overflow observed.
- Artwork and self-hosted fonts load.
- Context selection changes the explanation and next steps.
- Plan save, note addition, correction and deletion work.
- Correcting structured context removes the previous rule assumption.
- Opt-in persistence survives a reload.
- Clearing the workspace removes displayed records and the saved copy.
- JSON export downloads successfully; the resulting file passes the workspace validator.

## Verification limits

The browser automation extension did not permit file-chooser uploads without its optional file-URL permission. The UI import flow was therefore not completed end-to-end in automation. Import parsing, record validation and state restoration were exercised in the reference-engine tests. No real hardware, language model, participant study, medical performance or commercial outcome was tested.
