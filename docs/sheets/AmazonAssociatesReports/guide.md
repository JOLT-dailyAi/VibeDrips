# Amazon Associates Reporting — Sheets & Excel Guide

This guide outlines the methods for pulling your Amazon Associates earnings and orders data into Google Sheets or Excel.

---

## Option 1: Manual CSV Export (Reliable & No-Code)

This is the recommended starting point. It provides the most accurate data without requiring API approval.

### Steps:
1. Log in to [Amazon Associates Central](https://affiliate-program.amazon.com/).
2. Navigate to **Reports → Earnings Report**.
3. Select your desired **Date Range** (e.g., Last 30 Days).
4. Click the **Download Reports** button.
5. Choose **CSV** format.
6. Open your Google Sheet or Excel:
   - **Google Sheets**: `File → Import → Upload` the CSV.
   - **Excel**: `Data → From Text/CSV` and select the file.

---

## Option 2: Programmatic API (Fully Automated)

Use Amazon's **Product Advertising API (PA-API) 5.0** to fetch data automatically using scripts.

### Requirements:
- **3 Qualifying Sales**: Your account must be approved with at least 3 sales to gain API access.
- **API Credentials**: You need an `Access Key` and `Secret Key` from the **Tools → Product Advertising API** section in Associates Central.

### Technical Challenges:
- Amazon requires **AWS Signature V4** encryption for every request. 
- Unlike simple APIs (like Cloudflare), this requires a complex signing library to work within Google Apps Script.

> [!NOTE]
> If you have your API keys ready, let me know and I can help draft an `amazon-reporting.js` script to handle the encryption and data fetching.

---

## Option 3: Third-Party Connectors (Fast & Easy)

If you want automated daily syncs without writing code, these "No-Code" tools have built-in Amazon connectors:

| Tool | Type | Level |
| :--- | :--- | :--- |
| **Coupler.io** | Google Sheets Add-on | Best for simple daily syncs |
| **Supermetrics** | Google Sheets Add-on | Professional-grade data analysis |
| **Zapier / Make** | Automation Platform | Good for triggering actions based on sales |

---

## Summary: Which to choose?

- **Choose Option 1** if you only check reports weekly and want zero setup.
- **Choose Option 2** if you are comfortable with technical setup and want a free, custom solution.
- **Choose Option 3** if you want professional automation and don't mind a small monthly subscription fee.
