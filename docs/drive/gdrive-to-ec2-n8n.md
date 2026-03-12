# Google Drive to AWS EC2 — n8n Transfer Guide

This guide explains how to fix permissions issues and build a workflow to move files from Google Drive to a specific folder on your AWS EC2 instance.

---

## 1. Troubleshooting: Why can't n8n see my folders?

In your n8n output, you likely only see files that have been shared with your **Service Account email**.

### The Cause:
A Google Service Account acts like a separate user. It **cannot** see your "My Drive" folders unless you explicitly invite it to those folders.

### The Fix:
1. Copy your Service Account Email:
   `n8n-google-sheets@youtube-data-api-xxxxx.iam.gserviceaccount.com`
2. Go to your Google Drive in the browser.
3. **Right-click the folder** you want to move (e.g., `GITHUB` or `DIRCORD`).
4. Click **Share** and paste that email address.
5. Give it **Editor** permissions.
6. Re-run your n8n search — the folder will now appear in your results.

---

## 2. Handling New Folders from Meta (The "Janitor" Script)

Since Meta deposits folders into your **Root** (which n8n can't see), use this script to move them.

### Updated "Janitor" Script:
This version catches both "meta-" and "instagram-" folders.
```javascript
function moveMetaFolders() {
  var sourceFolder = DriveApp.getRootFolder();
  var targetFolder = DriveApp.getFoldersByName("00_AUTOMATION").next();
  var folders = sourceFolder.getFolders();
  
  while (folders.hasNext()) {
    var folder = folders.next();
    var name = folder.getName().toLowerCase();
    
    // Catches meta-YYYY-MON and instagram-XXXX formats
    if (name.includes("meta") || name.includes("instagram")) {
      folder.moveTo(targetFolder);
      console.log("Moved: " + folder.getName());
    }
  }
}
```

---

## 3. The Monthly Automation Workflow (n8n)

Follow these steps to build the automated monthly transfer.

### Step 1: Schedule & Date (Timing)
1. **Schedule Trigger**: Set to "Every Month" on the **15th** at 00:00.
2. **Date & Time Node**: 
   - Operations: `Format a Date`
   - Date: `{{ $now }}`
   - Format: `yyyy-MMM` (This outputs e.g., `2026-Mar`).

### Step 2: Dynamic Search (Finding the Month's Folder)
1. **Google Drive Node (Search)**:
   - Operation: `Find Files/Folders`
   - Query: `name contains 'meta-{{ $node["Date & Time"].json["formattedDate"] }}'`
   - **Important**: This finds the specific backup folder for the current month.

### Step 3: Destination Cleanup (SSH)
Before uploading new files, clean the old ones inside the EC2.
1. **SSH Node (Run Command)**:
   - Command: `rm -rf /home/ubuntu/n8n-data/dailyAi/VibeDrips/inbox/*`
   - **Warning**: This wipes the destination folder to ensure no old files remain.

### Step 4: Recursive File Fetch
1. **Google Drive Node (List Files)**:
   - Operation: `List`
   - Folder ID: Use the ID from Step 2.
   - Filters: Navigate down to `messages/inbox/`.

### Step 5: Download & Upload
1. **Google Drive Node (Download)**: Fetch each file found in Step 4.
2. **SSH Node (Upload file)**: 
   - Path: `/home/ubuntu/n8n-data/dailyAi/VibeDrips/inbox/{{ $json.name }}`
   - File Content: The binary data from the Download node.

---

---

## 3. Best Practices for EC2 Folders
- Ensure the destination folder on EC2 has correct write permissions:
  `sudo chown -R ubuntu:ubuntu /path/to/folder`
- Use the **SSH Node**'s "Upload" operation instead of "Run Command" for binary files.
