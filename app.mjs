import {
  initialState,
  validateState,
  importWorkspace,
  makeMemory,
  insight,
  formatDuration,
  createDemoNights,
} from "./src/core.mjs";

const $ = (selector) => document.querySelector(selector);
const KEY = "somnia.workspace.v1";
let state = initialState();
let persistent = false;
let editingId = null;
let startupMessage = "";
try {
  const saved = localStorage.getItem(KEY);
  if (saved) {
    state = validateState(JSON.parse(saved));
    persistent = true;
  }
} catch {
  startupMessage =
    "Saved workspace could not be loaded. A fresh session is ready.";
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

function announce(message) {
  $("#feedback").textContent = message;
}
function store() {
  if (!persistent || !state) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    persistent = false;
    $("#persist").checked = false;
    $("#storage-status").textContent = "Session only";
    announce(
      "Device storage is unavailable. Your workspace remains in this session.",
    );
  }
}
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderChart(nights) {
  const width = 900,
    height = 150,
    top = 12,
    bottom = 126,
    left = 32,
    right = 12;
  const maxHours = Math.max(
    10,
    ...nights.map((n) => Math.ceil(n.sleepMinutes / 60)),
  );
  const span = (width - left - right) / nights.length;
  const barWidth = Math.max(2, Math.min(35, span * 0.55));
  let svg = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">`;
  for (const h of [0, maxHours / 2, maxHours]) {
    const y = bottom - (h / maxHours) * (bottom - top);
    svg += `<line x1="${left}" y1="${y}" x2="${width}" y2="${y}" stroke="#dfe5d6" stroke-dasharray="3 4"/><text x="2" y="${y + 3}" fill="#8a967d" font-family="monospace" font-size="8">${h}h</text>`;
  }
  nights.forEach((night, i) => {
    const x = left + i * span + (span - barWidth) / 2;
    const h = (night.sleepMinutes / (60 * maxHours)) * (bottom - top);
    const recent = i >= nights.length - 7;
    svg += `<rect x="${x}" y="${bottom - h}" width="${barWidth}" height="${h}" rx="1" fill="${recent ? "#8da463" : "#d0d8c3"}"/><line x1="${x}" y1="${bottom - h}" x2="${x + barWidth}" y2="${bottom - h}" stroke="${recent ? "#506a28" : "#b3bda5"}"/>`;
    if (nights.length <= 18 || i % Math.ceil(nights.length / 14) === 0)
      svg += `<text x="${x + barWidth / 2}" y="145" text-anchor="middle" fill="#8a967d" font-family="monospace" font-size="8">${night.date.slice(8)}</text>`;
  });
  $("#sleep-chart").innerHTML = svg + "</svg>";
  $("#sleep-chart").setAttribute(
    "aria-label",
    `Sleep duration across ${nights.length} recorded nights. Recent seven highlighted. Exact values are in the data table below.`,
  );
  $("#night-table").replaceChildren(
    ...nights.map((n) => {
      const row = element("tr");
      for (const value of [
        n.date,
        n.bedtime,
        n.wakeTime,
        formatDuration(n.sleepMinutes),
      ])
        row.append(element("td", value));
      return row;
    }),
  );
}

function renderMemories() {
  $("#memory-count").textContent =
    `${state.memories.length} RECORD${state.memories.length === 1 ? "" : "S"}`;
  const rows = state.memories.map((memory) => {
    const row = element("div", undefined, "memory-row");
    const content = element("div");
    content.append(
      element("p", memory.text),
      element(
        "small",
        `${memory.source === "demo" ? "SAMPLE CONTEXT" : "USER-CONFIRMED"} / ${memory.updatedAt.slice(0, 10)}`,
      ),
    );
    const controls = element("div");
    const edit = element("button", "Edit");
    edit.type = "button";
    edit.setAttribute("aria-label", `Edit memory: ${memory.text}`);
    edit.addEventListener("click", () => {
      editingId = memory.id;
      $("#edit-text").value = memory.text;
      $("#edit-dialog").showModal();
      $("#edit-text").focus();
    });
    const remove = element("button", "Forget");
    remove.type = "button";
    remove.setAttribute("aria-label", `Forget memory: ${memory.text}`);
    remove.addEventListener("click", () => {
      state.memories = state.memories.filter((m) => m.id !== memory.id);
      if (memory.id === "context-current") state.context = "unknown";
      state.planAccepted = false;
      render();
      store();
      announce("Memory removed from this workspace.");
    });
    controls.append(edit, remove);
    row.append(content, controls);
    return row;
  });
  $("#memory-list").replaceChildren(
    ...(rows.length
      ? rows
      : [
          element(
            "p",
            "No memories yet. Add only the context you want to keep.",
            "helper",
          ),
        ]),
  );
}

function render() {
  const empty = !state;
  for (const child of $(".workspace-main").children)
    if (!child.matches(".workspace-top,#data-controls,#feedback"))
      child.hidden = empty;
  $("#export-data").disabled = empty;
  $("#persist").disabled = empty;
  $("#persist").checked = persistent;
  $(".workspace-top h3").textContent = empty
    ? "Your workspace is clear."
    : "Your night, in perspective.";
  if (empty) return;
  const result = insight(state),
    s = result.summary;
  $("#last-sleep").textContent = formatDuration(s.latest.sleepMinutes);
  $("#average-sleep").textContent = formatDuration(s.averageMinutes);
  $("#bedtime-shift").replaceChildren(
    document.createTextNode(
      s.bedtimeDelta === null
        ? "—"
        : `${s.bedtimeDelta >= 0 ? "+" : ""}${s.bedtimeDelta}`,
    ),
  );
  if (s.bedtimeDelta !== null)
    $("#bedtime-shift").append(element("span", " min"));
  const isSample =
    JSON.stringify(state.nights) === JSON.stringify(createDemoNights());
  $("#data-origin").textContent = isSample
    ? "14 synthetic nights / Oct 01–14, 2026"
    : `${s.count} imported nights / provenance unverified`;
  $("#storage-status").textContent = persistent
    ? "Saved on this device"
    : "Session only";
  $("#observation").textContent = result.observation;
  $("#context-response").textContent = result.context;
  $("#plan-steps").replaceChildren(
    ...result.nextSteps.map((step) => element("li", step)),
  );
  $("#plan-tag").textContent = state.planAccepted
    ? "SAVED BY YOU"
    : "YOUR CHOICE";
  $("#accept-plan").textContent = state.planAccepted
    ? "Remove saved plan ×"
    : "Save this plan ↗";
  document
    .querySelectorAll("[data-context]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.context === state.context),
      ),
    );
  renderChart(s.nights);
  renderMemories();
}

document.querySelectorAll("[data-context]").forEach((button) =>
  button.addEventListener("click", () => {
    if (
      state.memories.length >= 20 &&
      !state.memories.some((m) => m.id === "context-current")
    ) {
      announce(
        "Forget a note before adding new context. This prototype supports up to 20 memories.",
      );
      return;
    }
    state.context = button.dataset.context;
    state.planAccepted = false;
    const texts = {
      work: "I have been working late recently.",
      difficulty: "I have been having trouble falling asleep.",
      changed: "My schedule has changed; the old baseline may not apply.",
    };
    state.memories = state.memories.filter((m) => m.id !== "context-current");
    if (state.memories.length < 20)
      state.memories.push(makeMemory("context-current", texts[state.context]));
    render();
    store();
    announce(
      "Context updated. The response and next steps now reflect your choice.",
    );
  }),
);

$("#accept-plan").addEventListener("click", () => {
  state.planAccepted = !state.planAccepted;
  render();
  store();
  announce(
    state.planAccepted
      ? "Plan saved in this workspace. No notifications or reminders have been scheduled."
      : "Saved plan removed.",
  );
});
$("#memory-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    if (state.memories.length >= 20)
      throw new Error(
        "This prototype supports up to 20 memories. Forget a note to add another.",
      );
    state.memories.push(
      makeMemory(crypto.randomUUID(), $("#memory-input").value),
    );
    $("#memory-input").value = "";
    render();
    store();
    announce(
      "Note added. Free-text notes are visible context; this demo does not interpret them.",
    );
  } catch (error) {
    announce(error.message);
  }
});
$("#cancel-edit").addEventListener("click", () => $("#edit-dialog").close());
$("#edit-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const correction = makeMemory(editingId, $("#edit-text").value);
    state.memories = state.memories.map((m) =>
      m.id === editingId ? correction : m,
    );
    if (editingId === "context-current") {
      state.context = "unknown";
      state.planAccepted = false;
    }
    $("#edit-dialog").close();
    render();
    store();
    announce(
      editingId === "context-current"
        ? "Memory corrected. Choose a context again to update the rule-based response."
        : "Memory corrected. Your updated note replaces the old text.",
    );
  } catch (error) {
    $("#edit-text").setCustomValidity(error.message);
    $("#edit-text").reportValidity();
  }
});
$("#edit-text").addEventListener("input", () =>
  $("#edit-text").setCustomValidity(""),
);
$("#persist").addEventListener("change", () => {
  if ($("#persist").checked) {
    persistent = true;
    render();
    store();
    if (persistent)
      announce(
        "Workspace saved on this device. Disable this option to remove the saved copy.",
      );
  } else {
    try {
      localStorage.removeItem(KEY);
      persistent = false;
      render();
      announce("Saved copy removed. You are working in this session only.");
    } catch {
      persistent = true;
      $("#persist").checked = true;
      announce(
        "This browser prevented removal. Clear site data in browser settings to remove the saved copy.",
      );
    }
  }
});
$("#reset-demo").addEventListener("click", () => {
  state = initialState();
  render();
  store();
  announce(
    "Synthetic example restored. Earlier workspace content has been replaced.",
  );
});
$("#clear-data").addEventListener("click", () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    announce(
      "Could not remove device storage. Clear site data in browser settings, then try again.",
    );
    return;
  }
  state = null;
  persistent = false;
  render();
  announce(
    "Workspace and device copy cleared. Import JSON or reset the demo to start again.",
  );
});
$("#export-data").addEventListener("click", () => {
  if (!state) return;
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
  );
  const link = element("a");
  link.href = url;
  link.download = "somnia-workspace.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce(
    "Workspace exported as JSON. Keep this file private if you added personal notes.",
  );
});
$("#import-data").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 131072)
      throw new Error("Choose a JSON file smaller than 128 KB.");
    const value = JSON.parse(await file.text());
    const next = importWorkspace(value);
    state = next;
    render();
    store();
    announce(
      "Import complete. Records were validated; their source and accuracy are not verified.",
    );
  } catch (error) {
    announce(`Import rejected: ${error.message}`);
  } finally {
    event.target.value = "";
  }
});
render();
if (startupMessage) announce(startupMessage);
document.body.classList.add("ready");
