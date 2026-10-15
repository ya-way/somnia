# Privacy and data boundaries

## What this release does

The application calculates everything in the visitor's browser. It does not send entered notes or imported sleep records to a server or language model. There is no analytics script, telemetry, account system or third-party font request. Site files and fonts are self-hosted.

The hosting provider still receives normal web requests, such as the visitor's IP address and requested static asset URLs. Following an external link is subject to the destination's policies.

## Storage and deletion

- Default: application state stays in JavaScript memory for the page session.
- Opt-in: “Keep this workspace on this device” writes the workspace to `localStorage` under `somnia.workspace.v1`.
- Turning storage off removes the stored copy while preserving the current session.
- “Clear workspace” removes the saved copy and all active records. “Reset demo” replaces current content with synthetic fixtures.
- “Forget” removes one note. Editing replaces its text. This release keeps no revision history or hidden memory archive.
- Export creates a file on the user's device. It cannot be recalled by clearing the website. Browser downloads and backups remain under the user's control.

Browser storage is **not encrypted by this app**. Other people with access to the same browser profile may read it. Use synthetic data for this pre-release prototype.

## Prototype scope

The experience is an engineering and interaction demonstration for general wellbeing. It is not intended for diagnosis, treatment, emergency monitoring or clinical decisions. Imported data is structurally validated but not authenticated or clinically evaluated.

The general diary and routine language draws on [NHLBI sleep education](https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits) and its [sleep diary example](https://www.nhlbi.nih.gov/files/docs/public/sleep/healthy_sleep.pdf). These references support general educational language; they do not validate Somnia, its model, or its outcomes.

## Before a real partner pilot

Define data controllers and processors, intended use, participant consent, retention, deletion, access control, incident response and any proposed model-provider processing. Review the actual deployment and jurisdictions involved. No claim of HIPAA, GDPR or medical-device compliance is made by this repository.

Do not include personal sleep data, medical information or credentials in public GitHub issues or discussions.
