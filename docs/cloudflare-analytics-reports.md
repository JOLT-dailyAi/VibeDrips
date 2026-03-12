# Cloudflare Analytics Reports — Google Sheets Guide

> **Prerequisites:**  
> - Apps Script (`cloudflare-analytics-script.js`) deployed and `setup()` + `fetchAll()` already run  
> - Google Sheet `VibeDrips — Cloudflare Analytics` has data in sheets: Daily Traffic, Weekly Traffic, Monthly Traffic, Top Countries

---

## 1. Setting Up Charts in Google Sheets

### Overview Dashboard (New Sheet)

1. In the `VibeDrips — Cloudflare Analytics` spreadsheet, click **`+`** to add a new sheet
2. Name it `📊 Dashboard`
3. Use this sheet to embed all your charts

---

### Chart 1 — Daily Traffic Trend (Line Chart)

1. Go to the `Daily Traffic` sheet
2. Select columns **A (Date)** and **B (Total Requests)** — hold Ctrl to multi-select non-adjacent columns if needed
3. `Insert → Chart`
4. In Chart Editor (right panel):
   - **Chart type:** Line chart
   - **X-axis:** Date
   - **Series:** Total Requests
   - Check **"Use column A as labels"**
5. Click the 3-dot menu on the chart → **"Move to own sheet"** OR keep on Dashboard

> **To add Unique Visitors as a second line:** In Chart Editor → Series → `+ Add Series` → select `Unique Visitors`

---

### Chart 2 — Cache Performance (Combo Chart)

1. In `Daily Traffic`, select **A (Date)**, **D (Cache Hit %)**, **B (Total Requests)**
2. `Insert → Chart` → Chart type: **Combo chart**
   - Total Requests → bars (left axis)
   - Cache Hit % → line (right axis)
3. In Chart Editor → Customize → Series → set `Cache Hit %` to use **Right axis**

---

### Chart 3 — Threats Blocked (Bar Chart)

1. Select **A (Date)** + **H (Threats Blocked)**
2. `Insert → Chart` → Chart type: **Column chart**
3. Title: `Threats Blocked Per Day`

---

### Chart 4 — Bandwidth Used (Area Chart)

1. Select **A (Date)** + **F (Total Bandwidth MB)** + **G (Cached Bandwidth MB)**
2. `Insert → Chart` → Chart type: **Stacked area chart**
3. Title: `Bandwidth: Total vs Cached (MB)`

---

### Chart 5 — Top Countries (Bar Chart)

1. Go to `Top Countries` sheet
2. Select **F (Country Name)** + **C (Requests)** (hold Ctrl to select non-adjacent columns)
3. `Insert → Chart` → Chart type: **Horizontal bar chart**
4. Title: `Top 10 Countries by Requests`
5. In Chart Editor (Setup tab):
   - **X-axis**: Country Name
   - **Series**: Requests
6. In Chart Editor (Customize tab) → Chart & axis titles → set max to top 10

---

### Chart 6 — Weekly Summary (Scorecard-style Table)

1. Go to `Weekly Traffic` sheet
2. Select all data → `Insert → Chart` → Chart type: **Table chart**
3. Move to Dashboard sheet
4. This gives you a full weekly breakdown table

---

## 2. Adding a Date Slicer (Filter by Date Range)

Google Sheets doesn't have a built-in date slicer, but you can use **Slicers**:

1. Click anywhere in your `Daily Traffic` data
2. `Data → Add a slicer`
3. In the slicer panel → Column: **Date**
4. A slicer control appears — drag it above your charts on the Dashboard
5. Use it to filter all charts connected to the same data range simultaneously

---

## 3. Auto-Refresh Setup

The Apps Script triggers handle data updates automatically:

| Trigger | Runs | Fetches |
|---------|------|---------|
| `fetchDaily` | Every day at ~1 AM UTC | Yesterday's data → Daily Traffic |
| `fetchWeekly` | Every Monday at ~2 AM UTC | Last 7 days → Weekly Traffic |
| `fetchMonthly` | 1st of each month at ~3 AM UTC | Last 30 days → Monthly Traffic |
| `fetchGeo` | Not triggered — run manually or add your own trigger | Top Countries |

> To verify triggers are active: In Apps Script → clock icon (Triggers) → confirm 3 triggers are listed

---

## 4. Publishing as a Web App (Read-Only Dashboard)

You can publish your Google Sheet as a **read-only web app** so anyone with the link can view your analytics dashboard without editing access.

### Option A — Publish the Spreadsheet as a Web Page

1. `File → Share → Publish to web`
2. Select the sheet: `📊 Dashboard`
3. Choose format: **Web page**
4. Click **Publish**
5. Copy the link — anyone can view it without a Google account

> [!WARNING]
> **Static View Only**: This creates a simple HTML snapshot. **Interactive Slicers and Filters will NOT work here.** It is purely for viewing.

---

### Option B — Publish Charts as Embeddable iFrames

Each individual chart can be published as an embed:

1. Click a chart → 3-dot menu → **"Publish chart"**
2. Change "Interactive" to **"Image"** (more reliable) or keep Interactive
3. Copy the embed code or link
4. Embed in any webpage using an `<iframe>`.

---

### Option D — Read-Only Share Link (Working Slicers)

If you want your **Slicers/Filters** to actually work for someone viewing the dashboard, this is the best method:

1. Click the **Share** button (top right).
2. Under "General access", change to **"Anyone with the link"**.
3. Set the role to **Viewer**.
4. **Copy the Link**: Send this link to anyone. They will see the full Google Sheets interface (Read-Only), and all **Slicers will work perfectly**.

---

### Option C — Build a Custom Web App via Apps Script (Advanced)

Create an Apps Script web app that reads your Sheet and renders a custom HTML dashboard:

1. In Apps Script → **`+ New file`** → name it `Dashboard.html`
2. Paste this starter template:

```html
<!DOCTYPE html>
<html>
<head>
  <title>VibeDrips — Analytics Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4; }
    .card { background: white; padding: 20px; border-radius: 8px; margin: 10px; display: inline-block; min-width: 150px; text-align: center; }
    .card h2 { font-size: 2em; margin: 0; color: #1a73e8; }
    .card p { margin: 5px 0 0; color: #666; }
    table { background: white; border-collapse: collapse; width: 100%; margin-top: 20px; border-radius: 8px; }
    th { background: #1a73e8; color: white; padding: 10px; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <h1>VibeDrips Analytics</h1>
  <div id="summary">Loading...</div>
  <div id="table">Loading data...</div>
  <script>
    google.script.run.withSuccessHandler(renderSummary).getSummary();
    google.script.run.withSuccessHandler(renderTable).getRecentDays(7);

    function renderSummary(data) {
      document.getElementById('summary').innerHTML = `
        <div class="card"><h2>${data.totalRequests.toLocaleString()}</h2><p>Total Requests (30d)</p></div>
        <div class="card"><h2>${data.uniqueVisitors.toLocaleString()}</h2><p>Unique Visitors (30d)</p></div>
        <div class="card"><h2>${data.threatsBlocked}</h2><p>Threats Blocked (30d)</p></div>
        <div class="card"><h2>${data.cacheHitPct}</h2><p>Avg Cache Hit %</p></div>
      `;
    }

    function renderTable(rows) {
      const headers = ['Date','Requests','Unique Visitors','Cache Hit %','Threats','Bandwidth (MB)'];
      let html = '<table><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
      rows.forEach(r => {
        html += '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>';
      });
      document.getElementById('table').innerHTML = html + '</table>';
    }
  </script>
</body>
</html>
```

3. In your main `Code.gs` file, add these server-side functions:

```javascript
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Dashboard')
    .setTitle('VibeDrips Analytics')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Daily Traffic');
  const data = sheet.getDataRange().getValues().slice(1); // skip header

  return {
    totalRequests:  data.reduce((s, r) => s + (r[1] || 0), 0),
    uniqueVisitors: data.reduce((s, r) => s + (r[8] || 0), 0),
    threatsBlocked: data.reduce((s, r) => s + (r[7] || 0), 0),
    cacheHitPct:    data.length > 0 ? data[data.length - 1][3] : '0%',
  };
}

function getRecentDays(n) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Daily Traffic');
  const data = sheet.getDataRange().getValues().slice(1);
  return data.slice(-n).map(r => [r[0], r[1], r[8], r[3], r[7], r[5]]);
}
```

4. **Deploy as Web App:**
   - `Deploy → New deployment`
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (or "Anyone with link")
   - Click **Deploy** → copy the web app URL

5. Visit the URL — your custom analytics dashboard is live! 🎉

---

## 5. Keeping Data Fresh for Charts

Since the site is new (1-2 records), wait ~7 days for meaningful chart data. To check trigger health:

1. Apps Script → **Triggers (clock icon)**
2. Confirm `fetchDaily`, `fetchWeekly`, `fetchMonthly` all have **Last run** timestamps
3. If a trigger failed, check **Executions** (play icon) for error logs

> To backfill historical data: In Apps Script, run `fetchMonthly()` manually — it fetches the last 30 days in one call.

---

## 6. Exporting Reports

### Export to Excel / PDF

- `File → Download → Microsoft Excel (.xlsx)` — full spreadsheet with all sheets and data
- `File → Download → PDF` — export the Dashboard sheet as a formatted PDF report

### Schedule Email Reports (via Apps Script)

Add this function to your Apps Script to auto-email a PDF summary monthly:

```javascript
function emailMonthlyReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pdf = DriveApp.getFileById(ss.getId()).getAs('application/pdf');
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: 'VibeDrips — Monthly Cloudflare Analytics Report',
    body: 'Please find the monthly analytics report attached.',
    attachments: [pdf.setName('VibeDrips-Analytics-' + getDateOffset(0) + '.pdf')]
  });
}
```

---

---

---

---

---

## 7. Integrating with Google AppSheet (The Dynamic Action Method) — BEST 🏆

The most professional way to build this is with a single **"Universal Redirect"** button that works for any report you add in the future.

### Step 1 — Sheet Structure
Create your `Cloudflare Dashboard` sheet with two columns:
- **Menu**: The text you want on the button (e.g., `📊 Web Dashboard`, `📱 Mobile Dashboard`).
- **URL**: The actual link to that dashboard.

### Step 2 — Create the Dynamic Action
In AppSheet, create one action for the `Cloudflare Dashboard` table:
1. **Action name**: `Open Dashboard`.
2. **Do this**: `External: go to a website`.
3. **Target**: `=[URL]` (This pulls the link from your sheet).
4. **Display name**: `=[Menu]` (This pulls the button text from your sheet).
5. **Position**: Set to **Inline** and attach to the `URL` column.
6. **Behavior → Only if true**: `NOT(ISBLANK([URL]))`.

### Step 3 — View Setup
1. Create a **Deck** view for the `Cloudflare Dashboard` table.
2. In **Behavior**, set the **Row Selected** event to your `Open Dashboard` action.

### Result
Your app now has a perfectly clean, icon-based menu. To add a 3rd or 4th report (like "Weekly Stats"), you just add a new row to your Google Sheet. **AppSheet handles the rest automatically!**




