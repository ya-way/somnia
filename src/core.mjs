/** Somnia's inspectable reference engine. No LLM, network, diagnosis, or hidden scoring. */
export const SCHEMA_VERSION = 1;
const CONTEXTS = ["unknown", "work", "difficulty", "changed"];

export function clockMinutes(value) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
    throw new Error("Time must use HH:MM (24-hour).");
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

// Anchor at noon so 23:50 and 00:10 remain adjacent across midnight.
export function nightMinutes(value) {
  const minutes = clockMinutes(value);
  return minutes < 720 ? minutes + 1440 : minutes;
}

export function formatDuration(minutes) {
  const total = Math.round(minutes);
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}m`;
}

export function validateNights(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 90)
    throw new Error("Import between 1 and 90 nights.");
  const seen = new Set();
  return input
    .map((night) => {
      if (!night || typeof night !== "object")
        throw new Error("Each night must be an object.");
      const { date, bedtime, wakeTime, sleepMinutes } = night;
      if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new Error("Each night needs a YYYY-MM-DD date.");
      const parsed = new Date(`${date}T12:00:00Z`);
      if (
        !Number.isFinite(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== date
      )
        throw new Error("Invalid calendar date.");
      if (seen.has(date))
        throw new Error("Duplicate night dates are not allowed.");
      seen.add(date);
      const bed = clockMinutes(bedtime);
      const wake = clockMinutes(wakeTime);
      const inBed = (wake - bed + 1440) % 1440;
      if (
        !Number.isInteger(sleepMinutes) ||
        sleepMinutes < 1 ||
        sleepMinutes > inBed ||
        inBed > 960
      )
        throw new Error(
          "Sleep minutes must fit a nonzero overnight interval of at most 16 hours.",
        );
      return { date, bedtime, wakeTime, sleepMinutes };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

const average = (values) => values.reduce((a, b) => a + b, 0) / values.length;

export function summarizeNights(input) {
  const nights = validateNights(input);
  const recent = nights.slice(-7);
  const baseline = nights.slice(-14, -7);
  const delta =
    baseline.length === 7 && recent.length === 7
      ? Math.round(
          average(recent.map((n) => nightMinutes(n.bedtime))) -
            average(baseline.map((n) => nightMinutes(n.bedtime))),
        )
      : null;
  const wakeDelta =
    baseline.length === 7 && recent.length === 7
      ? Math.round(
          average(recent.map((n) => nightMinutes(n.wakeTime))) -
            average(baseline.map((n) => nightMinutes(n.wakeTime))),
        )
      : null;
  return {
    nights,
    recent,
    baseline,
    count: nights.length,
    averageMinutes: Math.round(average(recent.map((n) => n.sleepMinutes))),
    bedtimeDelta: delta,
    wakeDelta,
    latest: nights.at(-1),
  };
}

export function createDemoNights() {
  const beds = [
    "23:00",
    "23:15",
    "23:05",
    "23:20",
    "23:10",
    "23:00",
    "23:20",
    "23:45",
    "00:10",
    "23:55",
    "00:00",
    "00:15",
    "23:50",
    "00:05",
  ];
  const wakes = [
    "07:00",
    "07:10",
    "07:00",
    "07:05",
    "07:00",
    "07:10",
    "07:00",
    "07:00",
    "07:10",
    "07:00",
    "07:05",
    "07:00",
    "07:10",
    "07:00",
  ];
  return validateNights(
    beds.map((bedtime, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      bedtime,
      wakeTime: wakes[i],
      sleepMinutes:
        ((clockMinutes(wakes[i]) - clockMinutes(bedtime) + 1440) % 1440) -
        [18, 22, 17, 20, 18, 25, 20, 22, 18, 25, 20, 23, 20, 13][i],
    })),
  );
}

export function makeMemory(id, text, source = "user") {
  if (typeof text !== "string" || !text.trim() || text.trim().length > 240)
    throw new Error("Memory must contain 1–240 characters.");
  return {
    id: String(id),
    text: text.trim(),
    source: source === "demo" ? "demo" : "user",
    updatedAt: new Date().toISOString(),
  };
}

export function initialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    nights: createDemoNights(),
    context: "unknown",
    wakeTarget: "07:00",
    memories: [
      makeMemory(
        "demo-1",
        "My weekday mornings usually begin at 07:00.",
        "demo",
      ),
    ],
    planAccepted: false,
  };
}

export function validateState(value) {
  if (!value || value.schemaVersion !== SCHEMA_VERSION)
    throw new Error("Unsupported workspace version.");
  if (!CONTEXTS.includes(value.context)) throw new Error("Invalid context.");
  clockMinutes(value.wakeTarget);
  if (!Array.isArray(value.memories) || value.memories.length > 20)
    throw new Error("At most 20 memories are supported.");
  const ids = new Set();
  const memories = value.memories.map((m, i) => {
    if (
      !m ||
      typeof m.id !== "string" ||
      !m.id ||
      m.id.length > 80 ||
      ids.has(m.id)
    )
      throw new Error("Memory IDs must be unique.");
    ids.add(m.id);
    const clean = makeMemory(m.id, m.text, m.source);
    if (
      typeof m.updatedAt === "string" &&
      Number.isFinite(Date.parse(m.updatedAt))
    )
      clean.updatedAt = m.updatedAt;
    return clean;
  });
  return {
    schemaVersion: SCHEMA_VERSION,
    nights: validateNights(value.nights),
    context: value.context,
    wakeTarget: value.wakeTarget,
    memories,
    planAccepted: value.planAccepted === true,
  };
}

export function importWorkspace(value) {
  if (Array.isArray(value))
    return { ...initialState(), nights: validateNights(value), memories: [] };
  return validateState(value);
}

export function insight(state) {
  const summary = summarizeNights(state.nights);
  const delta = summary.bedtimeDelta;
  const observation =
    delta === null
      ? `There are ${summary.count} recorded nights. Add at least 14 nights to compare two seven-night windows.`
      : `Your recent seven-night bedtime is ${Math.abs(delta)} minutes ${delta >= 0 ? "later" : "earlier"} than the previous seven-night average. Your wake time shifted by ${Math.abs(summary.wakeDelta)} minutes.`;
  const context = {
    unknown:
      "The times show a pattern, but they cannot tell me why. Have you been working late, having trouble falling asleep, or following a new schedule?",
    work: "You told me work is running late. That adds context to the shorter sleep opportunity; it does not establish a cause. What would make room for rest this week?",
    difficulty:
      "Thank you for clarifying: being unable to fall asleep is different from choosing to work late. Device timings alone cannot explain it. If this continues or affects your day, discuss it with a qualified healthcare professional.",
    changed:
      "Your schedule has changed. The earlier comparison may no longer be a useful reference. Let’s record the new routine before drawing conclusions.",
  }[state.context];
  const nextSteps =
    state.context === "difficulty"
      ? [
          "Keep a simple diary of sleep and daytime tiredness.",
          "Note what feels different in your routine.",
          "Discuss persistent difficulties with a qualified healthcare professional.",
        ]
      : state.context === "changed"
        ? [
            "Write down the routine you want to understand.",
            "Collect a new week of sleep and daytime context.",
            "Review whether the old baseline is still relevant.",
          ]
        : [
            "Make room in your schedule for enough sleep.",
            "Track your sleep and daytime tiredness for a week.",
            "Review the pattern together before changing your routine.",
          ];
  return { observation, context, nextSteps, summary };
}
