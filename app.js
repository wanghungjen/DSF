// ==========================
// CONFIG
// ==========================
const selected_cols = ["race_geo", "annual_inc", "int_rate", "dti", "zip_code"];

// Toggle options → numeric codes for DB lookup
const OPTIONS = [
  { label: "Decrease", value: "decrease", code: 1 },
  { label: "Mute", value: "mute", code: 2 },
  { label: "Unchanged", value: "unchanged", code: 3, default: true },
  { label: "Increase", value: "increase", code: 4 },
];

// Race columns to display
const RACE_VARS = [
  "White alone",
  "Black or African American alone",
  "American Indian and Alaska Native alone",
  "Asian alone",
  "Native Hawaiian and Other Pacific Islander alone",
  "Some other race alone",
  "Two or more races",
];

let DB_ROWS = []; // holds parsed mock.csv
const state = {}; // active toggle code per attribute

// Initialize state (all default=3)
selected_cols.forEach((attr) => {
  const def = OPTIONS.find((o) => o.default) || OPTIONS[2];
  state[attr] = def.code;
});

// ==========================
// CSV PARSER
// ==========================
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row = {};

    headers.forEach((h, i) => {
      const raw = cells[i];
      row[h] = raw !== "" && !isNaN(raw) ? Number(raw) : raw;
    });

    return row;
  });
}

// ==========================
// RENDER LEFT-SIDE TOGGLES
// ==========================
function renderAttributeToggles(container) {
  selected_cols.forEach((attr) => {
    const wrapper = document.createElement("div");
    wrapper.className = "attribute";

    const label = document.createElement("div");
    label.className = "attribute-label";
    label.textContent = attr;

    const switcher = document.createElement("div");
    switcher.className = "option-switcher";

    OPTIONS.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.textContent = opt.label;
      btn.dataset.value = opt.value;

      if (state[attr] === opt.code) {
        btn.classList.add("active");
      }

      btn.addEventListener("click", () => {
        switcher
          .querySelectorAll(".option")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state[attr] = opt.code; // update numeric code
        updateBenchmarks(); // re-render right side
      });

      switcher.appendChild(btn);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(switcher);
    container.appendChild(wrapper);
  });
}

// ==========================
// FIND MATCHING CSV ROW
// ==========================
function findRowForState() {
  return DB_ROWS.find((row) =>
    selected_cols.every((col) => Number(row[col]) === Number(state[col]))
  );
}

// Formatting helper
function fmt(x) {
  return typeof x === "number" && isFinite(x) ? x.toFixed(3) : "—";
}

// ==========================
// RENDER RIGHT-SIDE TABLE
// ==========================
function updateBenchmarks() {
  const container = document.getElementById("benchmarks");
  container.innerHTML = "";

  const row = findRowForState();

  const wrap = document.createElement("div");
  wrap.className = "table-wrap";

  const table = document.createElement("table");
  table.className = "table";

  // Header
  table.innerHTML = `
  <thead>
    <tr>
      <th>Race</th>
      <th>Accuracy</th>
      <th>Fraction Given Loan</th>
      <th>Fraction Given Loan (Original)</th>
    </tr>
  </thead>
`;
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);

  if (!row) {
    tbody.innerHTML = `<tr><td colspan="2">No data for this combination.</td></tr>`;
    wrap.appendChild(table);
    container.appendChild(wrap);
    return;
  }

  // Per-race accuracies
  RACE_VARS.forEach((race) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td>${race}</td>
    <td>${fmt(row[race])}</td>
    <td>${fmt(row[`${race}_fraction_given`])}</td>
    <td>${fmt(row[`${race}_fraction_given_original`])}</td>
  `;
    tbody.appendChild(tr);
  });

  wrap.appendChild(table);
  container.appendChild(wrap);

  // Summary rows BELOW
  const summary = document.createElement("div");
  summary.className = "table-wrap summary-table";

  summary.innerHTML = `
    <table class="table">
      <tbody>
        <tr>
          <td><strong>Equalized Odds (overall)</strong></td>
          <td>${fmt(row.equalized_odds)}</td>
        </tr>
        <tr>
          <td><strong>Predicted Parity (overall)</strong></td>
          <td>${fmt(row.predicted_parity)}</td>
        </tr>
      </tbody>
    </table>
  `;
  container.appendChild(summary);
}

// ==========================
// INIT — load CSV + render UI
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  // load mock.csv automatically
  fetch("./mock.csv")
    .then((resp) => resp.text())
    .then((text) => {
      DB_ROWS = parseCSV(text);
      renderAttributeToggles(document.getElementById("attributes"));
      updateBenchmarks();
    })
    .catch((err) => {
      console.error("Failed to load mock.csv:", err);
    });
});
