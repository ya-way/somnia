# Data contract

## Import a list of nights

```json
[
  {
    "date": "2026-10-14",
    "bedtime": "00:05",
    "wakeTime": "07:00",
    "sleepMinutes": 402
  }
]
```

The example is synthetic. `date` identifies the morning on which the record is reported. Times are local wall-clock values. Bedtime is the start of the preceding overnight interval; the next occurrence of wake time closes that interval. A source adapter must provide estimated sleep minutes directly: the prototype does not derive them from raw biosignals.

| Field                 | Validation                                             |
| --------------------- | ------------------------------------------------------ |
| `date`                | Real calendar date, `YYYY-MM-DD`, unique within import |
| `bedtime`, `wakeTime` | `HH:MM`, 24-hour time, zero-padded                     |
| `sleepMinutes`        | Integer, positive, no longer than the interval in bed  |
| Overnight interval    | Nonzero, no more than 960 minutes                      |
| File                  | JSON, at most 128 KB in the browser                    |
| Records               | 1–90, sorted by date after validation                  |

Unknown night-level fields are stripped. Duplicate dates and invalid records reject the entire import. There is no partial or silent import. Source accuracy, measurement calibration and clinical relevance are not verified.

## Exported workspace

A workspace includes `schemaVersion: 1`, the `nights` array, a `context` enum, `wakeTarget`, `memories` and `planAccepted`. `wakeTarget` is reserved compatibility metadata and is not a clinical target or an active recommendation. A memory contains `id`, `text`, `source` (`demo` or `user`) and `updatedAt`. The prototype limits memories to twenty and text to 240 characters.

`context` is one of `unknown`, `work`, `difficulty`, or `changed`. The current structured context uses memory ID `context-current`. Exported source labels are informational and not authenticated provenance.

Export files can contain notes entered by the user. Keep them private. The repository's `examples/nights.json` contains synthetic data only.

## Adapter example

```js
import { validateNights, summarizeNights } from "./src/core.mjs";

// Map actual provider fields explicitly before calling the validator.
const nights = validateNights(yourNormalizedRecords);
const summary = summarizeNights(nights);
console.log(summary.bedtimeDelta); // null without two full seven-record windows
```

Vendor APIs, source time zones, multiple sleep episodes, DST and device provenance belong in a future adapter layer. Do not flatten those cases into this overnight contract without evaluating information loss.
