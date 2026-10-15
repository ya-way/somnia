# Roadmap

Items marked planned are proposals, not shipped functionality or delivery commitments.

| Stage                                  | Status          | Evidence to produce                                                          |
| -------------------------------------- | --------------- | ---------------------------------------------------------------------------- |
| Editorial homepage and visual identity | Shipped in v0.1 | Responsive English site and four generated artworks                          |
| Inspectable reference engine           | Shipped in v0.1 | Validated imports, overnight comparison and context-specific rules           |
| User-controlled memory workspace       | Shipped in v0.1 | Edit, forget, optional storage and export                                    |
| First manufacturer adapter             | Planned         | Documented source semantics and a tested integration with permission         |
| Model-backed explanations              | Planned         | Evidence references, secure provider access, evaluation and review           |
| Longitudinal memory service            | Planned         | Versioned corrections, deletion guarantees and stale-memory evaluation       |
| Partner pilot                          | Planned         | Consenting participants, agreed metrics and a written continue/stop decision |
| Commercial product                     | Conditional     | Repeatable value, operating economics and willingness to pay                 |

## Good first contributions

1. Improve assistive-technology behavior and browser coverage.
2. Add synthetic edge cases for midnight, missing nights and irregular schedules.
3. Propose a richer device adapter contract with clear time-zone and provenance semantics.
4. Design evaluation cases that distinguish observations, user statements and hypotheses.

Please discuss scope before implementing a hosted backend or collecting real participant data. An external model integration should not be bolted onto the static page with browser-visible secrets.
