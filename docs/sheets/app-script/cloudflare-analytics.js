/**
 * VibeDrips — Cloudflare Analytics → Google Sheets Bridge
 * =========================================================
 * Fetches Cloudflare analytics via GraphQL API and writes
 * to Google Sheets for use in charts / Looker Studio.
 *
 * SETUP STEPS:
 * 1. Create a new Google Sheet named "VibeDrips — Cloudflare Analytics"
 * 2. Extensions → Apps Script → replace default code with this file
 * 3. ⚙️ Project Settings → Script Properties → add:
 *      CF_API_TOKEN  =  your Cloudflare API token
 *      CF_ZONE_ID    =  your Zone ID (Cloudflare dashboard → Overview → right sidebar)
 * 4. Run setup() once → grant permissions
 * 5. Run fetchAll() to immediately populate data
 * 6. Triggers run automatically: daily, weekly, monthly
 */

// ─── CONFIG ──────────────────────────────────────────────────────────────────

function getConfig() {
    const props = PropertiesService.getScriptProperties();
    return {
        apiToken: props.getProperty('CF_API_TOKEN'),
        zoneId: props.getProperty('CF_ZONE_ID'),
        endpoint: 'https://api.cloudflare.com/client/v4/graphql',
    };
}

// ─── SHEET NAMES ─────────────────────────────────────────────────────────────

const SHEETS = {
    DAILY: 'Daily Traffic',
    WEEKLY: 'Weekly Traffic',
    MONTHLY: 'Monthly Traffic',
    THREATS: 'Threats & Bots',
    GEO: 'Top Countries',
};

const HEADERS = {
    TRAFFIC: [
        'Date', 'Total Requests', 'Cached Requests', 'Cache Hit %', 'Uncached Requests',
        'Total Bandwidth (MB)', 'Cached Bandwidth (MB)', 'Threats Blocked',
        'Unique Visitors', 'Page Views', 'Encrypted Requests', 'Error 4xx', 'Error 5xx'
    ],
    THREATS: ['Date', 'Total Threats', 'Bot Challenges', 'Bot Solved', 'Firewall Events'],
    GEO: ['Date', 'Country', 'Country Code', 'Requests', 'Bandwidth (MB)', 'Threats'],
};

// ─── COUNTRY CODE LOOKUP ──────────────────────────────────────────────────────

const COUNTRY_NAMES = {
    AF: 'Afghanistan', AG: 'Antigua and Barbuda', AL: 'Albania',
    AM: 'Armenia', AO: 'Angola', AR: 'Argentina',
    AT: 'Austria', AU: 'Australia', AZ: 'Azerbaijan',
    BA: 'Bosnia-Herzegovina', BB: 'Barbados', BD: 'Bangladesh',
    BE: 'Belgium', BF: 'Burkina Faso', BG: 'Bulgaria',
    BH: 'Bahrain', BI: 'Burundi', BJ: 'Benin',
    BN: 'Brunei', BO: 'Bolivia', BR: 'Brazil',
    BS: 'Bahamas', BT: 'Bhutan', BW: 'Botswana',
    BY: 'Belarus', BZ: 'Belize', CA: 'Canada',
    CD: 'DR Congo', CF: 'Central African Rep.', CG: 'Congo',
    CH: 'Switzerland', CI: "Côte d'Ivoire", CL: 'Chile',
    CM: 'Cameroon', CN: 'China', CO: 'Colombia',
    CR: 'Costa Rica', CU: 'Cuba', CV: 'Cape Verde',
    CY: 'Cyprus', CZ: 'Czech Republic', DE: 'Germany',
    DJ: 'Djibouti', DK: 'Denmark', DM: 'Dominica',
    DO: 'Dominican Republic', DZ: 'Algeria', EC: 'Ecuador',
    EE: 'Estonia', EG: 'Egypt', ER: 'Eritrea',
    ES: 'Spain', ET: 'Ethiopia', FI: 'Finland',
    FJ: 'Fiji', FR: 'France', GA: 'Gabon',
    GB: 'United Kingdom', GD: 'Grenada', GE: 'Georgia',
    GH: 'Ghana', GM: 'Gambia', GN: 'Guinea',
    GQ: 'Equatorial Guinea', GR: 'Greece', GT: 'Guatemala',
    GW: 'Guinea-Bissau', GY: 'Guyana', HN: 'Honduras',
    HR: 'Croatia', HT: 'Haiti', HU: 'Hungary',
    ID: 'Indonesia', IE: 'Ireland', IL: 'Israel',
    IN: 'India', IQ: 'Iraq', IR: 'Iran',
    IS: 'Iceland', IT: 'Italy', JM: 'Jamaica',
    JO: 'Jordan', JP: 'Japan', KE: 'Kenya',
    KG: 'Kyrgyzstan', KH: 'Cambodia', KI: 'Kiribati',
    KM: 'Comoros', KP: 'North Korea', KR: 'South Korea',
    KW: 'Kuwait', KZ: 'Kazakhstan', LA: 'Laos',
    LB: 'Lebanon', LI: 'Liechtenstein', LK: 'Sri Lanka',
    LR: 'Liberia', LS: 'Lesotho', LT: 'Lithuania',
    LU: 'Luxembourg', LV: 'Latvia', LY: 'Libya',
    MA: 'Morocco', MC: 'Monaco', MD: 'Moldova',
    ME: 'Montenegro', MG: 'Madagascar', MK: 'North Macedonia',
    ML: 'Mali', MM: 'Myanmar', MN: 'Mongolia',
    MR: 'Mauritania', MT: 'Malta', MU: 'Mauritius',
    MV: 'Maldives', MW: 'Malawi', MX: 'Mexico',
    MY: 'Malaysia', MZ: 'Mozambique', NA: 'Namibia',
    NE: 'Niger', NG: 'Nigeria', NI: 'Nicaragua',
    NL: 'Netherlands', NO: 'Norway', NP: 'Nepal',
    NR: 'Nauru', NZ: 'New Zealand', OM: 'Oman',
    PA: 'Panama', PE: 'Peru', PG: 'Papua New Guinea',
    PH: 'Philippines', PK: 'Pakistan', PL: 'Poland',
    PT: 'Portugal', PW: 'Palau', PY: 'Paraguay',
    QA: 'Qatar', RO: 'Romania', RS: 'Serbia',
    RU: 'Russia', RW: 'Rwanda', SA: 'Saudi Arabia',
    SB: 'Solomon Islands', SC: 'Seychelles', SD: 'Sudan',
    SE: 'Sweden', SG: 'Singapore', SI: 'Slovenia',
    SK: 'Slovakia', SL: 'Sierra Leone', SM: 'San Marino',
    SN: 'Senegal', SO: 'Somalia', SR: 'Suriname',
    SS: 'South Sudan', ST: 'São Tomé and Príncipe', SV: 'El Salvador',
    SY: 'Syria', SZ: 'Eswatini', TD: 'Chad',
    TG: 'Togo', TH: 'Thailand', TJ: 'Tajikistan',
    TL: 'Timor-Leste', TM: 'Turkmenistan', TN: 'Tunisia',
    TO: 'Tonga', TR: 'Turkey', TT: 'Trinidad and Tobago',
    TV: 'Tuvalu', TW: 'Taiwan', TZ: 'Tanzania',
    UA: 'Ukraine', UG: 'Uganda', US: 'United States',
    UY: 'Uruguay', UZ: 'Uzbekistan', VA: 'Vatican City',
    VC: 'St. Vincent', VE: 'Venezuela', VN: 'Vietnam',
    VU: 'Vanuatu', WS: 'Samoa', YE: 'Yemen',
    ZA: 'South Africa', ZM: 'Zambia', ZW: 'Zimbabwe',
};

function getCountryName(code) {
    return COUNTRY_NAMES[code] || code; // fallback to code if not found
}

// ─── SETUP ───────────────────────────────────────────────────────────────────

/**
 * Run this ONCE to initialize sheets and set up scheduled triggers.
 */
function setup() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Create sheets if they don't exist
    Object.values(SHEETS).forEach(name => {
        if (!ss.getSheetByName(name)) ss.insertSheet(name);
    });

    // Write headers to empty sheets
    writeHeaders(SHEETS.DAILY, HEADERS.TRAFFIC);
    writeHeaders(SHEETS.WEEKLY, HEADERS.TRAFFIC);
    writeHeaders(SHEETS.MONTHLY, HEADERS.TRAFFIC);
    writeHeaders(SHEETS.THREATS, HEADERS.THREATS);
    writeHeaders(SHEETS.GEO, HEADERS.GEO);

    // Remove existing triggers to avoid duplicates
    ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

    // Daily → every day at ~1 AM UTC (6:30 AM IST)
    ScriptApp.newTrigger('fetchDaily')
        .timeBased().everyDays(1).atHour(1).create();

    // Weekly → every Monday at ~2 AM UTC
    ScriptApp.newTrigger('fetchWeekly')
        .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(2).create();

    // Monthly → 1st of each month at ~3 AM UTC
    ScriptApp.newTrigger('fetchMonthly')
        .timeBased().onMonthDay(1).atHour(3).create();

    Logger.log('✅ Setup complete! Sheets created and triggers scheduled.');
}

function writeHeaders(sheetName, headers) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (sheet && sheet.getLastRow() === 0) {
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length)
            .setFontWeight('bold')
            .setBackground('#1a73e8')
            .setFontColor('#ffffff');
        sheet.setFrozenRows(1);
    }
}

// ─── GRAPHQL QUERIES ──────────────────────────────────────────────────────────

function buildTrafficQuery(zoneId, startDate, endDate) {
    return JSON.stringify({
        query: `
      query VibeDripsTraffic($zoneTag: String!, $start: Date!, $end: Date!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1dGroups(
              limit: 100,
              filter: { date_geq: $start, date_leq: $end },
              orderBy: [date_ASC]
            ) {
              dimensions { date }
              sum {
                requests
                cachedRequests
                bytes
                cachedBytes
                threats
                pageViews
                encryptedRequests
                responseStatusMap { edgeResponseStatus requests }
              }
              uniq { uniques }
            }
          }
        }
      }
    `,
        variables: { zoneTag: zoneId, start: startDate, end: endDate }
    });
}

function buildGeoQuery(zoneId, startDate, endDate) {
    return JSON.stringify({
        query: `
      query VibeDripsGeo($zoneTag: String!, $start: Date!, $end: Date!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1dGroups(
              limit: 100,
              filter: { date_geq: $start, date_leq: $end },
              orderBy: [date_ASC]
            ) {
              dimensions { date }
              sum {
                countryMap { clientCountryName requests bytes threats }
              }
            }
          }
        }
      }
    `,
        variables: { zoneTag: zoneId, start: startDate, end: endDate }
    });
}

// ─── API CALL ─────────────────────────────────────────────────────────────────

function callGraphQL(query) {
    const config = getConfig();
    if (!config.apiToken || !config.zoneId) {
        throw new Error('Missing CF_API_TOKEN or CF_ZONE_ID in Script Properties!');
    }

    const response = UrlFetchApp.fetch(config.endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.apiToken}`,
            'Content-Type': 'application/json',
        },
        payload: query,
        muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());
    if (result.errors) {
        throw new Error('GraphQL Error: ' + JSON.stringify(result.errors));
    }
    return result.data.viewer.zones[0];
}

// ─── DATA PROCESSING ──────────────────────────────────────────────────────────

function processTrafficData(groups) {
    return groups.map(group => {
        const s = group.sum;
        const errors4xx = (s.responseStatusMap || [])
            .filter(r => r.edgeResponseStatus >= 400 && r.edgeResponseStatus < 500)
            .reduce((acc, r) => acc + r.requests, 0);
        const errors5xx = (s.responseStatusMap || [])
            .filter(r => r.edgeResponseStatus >= 500)
            .reduce((acc, r) => acc + r.requests, 0);
        const cacheHitPct = s.requests > 0
            ? ((s.cachedRequests / s.requests) * 100).toFixed(1) + '%' : '0%';

        return [
            group.dimensions.date,
            s.requests,
            s.cachedRequests,
            cacheHitPct,
            s.requests - s.cachedRequests,
            (s.bytes / 1048576).toFixed(2),
            (s.cachedBytes / 1048576).toFixed(2),
            s.threats,
            group.uniq.uniques,
            s.pageViews,
            s.encryptedRequests,
            errors4xx,
            errors5xx,
        ];
    });
}

function aggregateByPeriod(groups) {
    const agg = groups.reduce((acc, group) => {
        const s = group.sum;
        const errors4xx = (s.responseStatusMap || [])
            .filter(r => r.edgeResponseStatus >= 400 && r.edgeResponseStatus < 500)
            .reduce((sum, r) => sum + r.requests, 0);
        const errors5xx = (s.responseStatusMap || [])
            .filter(r => r.edgeResponseStatus >= 500)
            .reduce((sum, r) => sum + r.requests, 0);
        acc.requests += s.requests;
        acc.cachedRequests += s.cachedRequests;
        acc.bytes += s.bytes;
        acc.cachedBytes += s.cachedBytes;
        acc.threats += s.threats;
        acc.pageViews += s.pageViews;
        acc.encryptedReq += s.encryptedRequests;
        acc.uniques += group.uniq.uniques;
        acc.errors4xx += errors4xx;
        acc.errors5xx += errors5xx;
        return acc;
    }, {
        requests: 0, cachedRequests: 0, bytes: 0, cachedBytes: 0, threats: 0,
        pageViews: 0, encryptedReq: 0, uniques: 0, errors4xx: 0, errors5xx: 0
    });

    const cacheHitPct = agg.requests > 0
        ? ((agg.cachedRequests / agg.requests) * 100).toFixed(1) + '%' : '0%';

    return [
        agg.requests, agg.cachedRequests, cacheHitPct,
        agg.requests - agg.cachedRequests,
        (agg.bytes / 1048576).toFixed(2),
        (agg.cachedBytes / 1048576).toFixed(2),
        agg.threats, agg.uniques, agg.pageViews,
        agg.encryptedReq, agg.errors4xx, agg.errors5xx,
    ];
}

// ─── FETCH FUNCTIONS ──────────────────────────────────────────────────────────

function fetchDaily() {
    const config = getConfig();
    const yesterday = getDateOffset(-1);
    const zone = callGraphQL(buildTrafficQuery(config.zoneId, yesterday, yesterday));
    const groups = zone.httpRequests1dGroups;
    if (!groups || groups.length === 0) { Logger.log('No data for ' + yesterday); return; }
    appendToSheet(SHEETS.DAILY, processTrafficData(groups));
    Logger.log('✅ Daily written for ' + yesterday);
}

function fetchWeekly() {
    const config = getConfig();
    const start = getDateOffset(-7), end = getDateOffset(-1);
    const zone = callGraphQL(buildTrafficQuery(config.zoneId, start, end));
    const groups = zone.httpRequests1dGroups;
    if (!groups || groups.length === 0) { Logger.log('No weekly data'); return; }
    appendToSheet(SHEETS.WEEKLY, [[start + ' → ' + end, ...aggregateByPeriod(groups)]]);
    Logger.log('✅ Weekly written');
}

function fetchMonthly() {
    const config = getConfig();
    const start = getDateOffset(-30), end = getDateOffset(-1);
    const zone = callGraphQL(buildTrafficQuery(config.zoneId, start, end));
    const groups = zone.httpRequests1dGroups;
    if (!groups || groups.length === 0) { Logger.log('No monthly data'); return; }
    appendToSheet(SHEETS.MONTHLY, [[start + ' to ' + end, ...aggregateByPeriod(groups)]]);
    Logger.log('✅ Monthly written');
}

function fetchGeo() {
    const config = getConfig();
    const start = getDateOffset(-7), end = getDateOffset(-1);
    const zone = callGraphQL(buildGeoQuery(config.zoneId, start, end));
    const groups = zone.httpRequests1dGroups;
    if (!groups || groups.length === 0) return;

    // Aggregate by country code across all days
    const countryMap = {};
    groups.forEach(group => {
        (group.sum.countryMap || []).forEach(c => {
            const code = c.clientCountryName; // Cloudflare returns ISO 2-letter code here
            if (!countryMap[code]) countryMap[code] = { requests: 0, bytes: 0, threats: 0 };
            countryMap[code].requests += c.requests;
            countryMap[code].bytes += c.bytes;
            countryMap[code].threats += c.threats;
        });
    });

    const today = getDateOffset(0);
    const rows = Object.entries(countryMap)
        .sort((a, b) => b[1].requests - a[1].requests)
        .slice(0, 50)
        .map(([code, data]) => [
            today,
            getCountryName(code),        // ← Full name e.g. "India", "Netherlands"
            code,                        // ← Keep code too e.g. "IN", "NL"
            data.requests,
            (data.bytes / 1048576).toFixed(2),
            data.threats,
        ]);

    // Replace geo sheet data (fresh each run)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.GEO);
    if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
    if (rows.length > 0) sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);

    Logger.log('✅ Geo: ' + rows.length + ' countries written with full names');
}

/** Run all fetchers at once — use this for manual testing */
function fetchAll() {
    fetchDaily();
    fetchWeekly();
    fetchMonthly();
    fetchGeo();
    Logger.log('✅ All fetches complete');
}

// ─── WEB APP ──────────────────────────────────────────────────────────────────

/** Deploy as Web App to get a shareable analytics dashboard URL */
function doGet() {
    return HtmlService.createHtmlOutputFromFile('Dashboard')
        .setTitle('VibeDrips Analytics')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getSummary() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = ss.getSheetByName(SHEETS.DAILY).getDataRange().getValues().slice(1);
    return {
        totalRequests: data.reduce((s, r) => s + (Number(r[1]) || 0), 0),
        uniqueVisitors: data.reduce((s, r) => s + (Number(r[8]) || 0), 0),
        threatsBlocked: data.reduce((s, r) => s + (Number(r[7]) || 0), 0),
        cacheHitPct: data.length > 0 ? data[data.length - 1][3] : '0%',
    };
}

function getRecentDays(n) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = ss.getSheetByName(SHEETS.DAILY).getDataRange().getValues().slice(1);
    return data.slice(-n).map(r => [r[0], r[1], r[8], r[3], r[7], r[5]]);
}

// ─── MONTHLY EMAIL REPORT ─────────────────────────────────────────────────────

function emailMonthlyReport() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const pdf = DriveApp.getFileById(ss.getId()).getAs('application/pdf');
    MailApp.sendEmail({
        to: Session.getActiveUser().getEmail(),
        subject: 'VibeDrips — Monthly Cloudflare Analytics Report',
        body: 'Monthly analytics report attached.',
        attachments: [pdf.setName('VibeDrips-Analytics-' + getDateOffset(0) + '.pdf')]
    });
    Logger.log('✅ Monthly report emailed');
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getDateOffset(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd');
}

function appendToSheet(sheetName, rows) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    rows.forEach(row => sheet.appendRow(row));
}
