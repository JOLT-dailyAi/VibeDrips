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
   - Operation: **Search** (Resource: File/Folder)
   - Query: `*meta-{{ $node["Date & Time"].json["formattedDate"] }}*`
   - **Important**: This wildcard syntax ensures n8n finds the specific folder even with the varying timestamps at the end.

### Step 3: Destination Cleanup (Local)
Since n8n is running directly on your EC2, use the **Read/Write Files from Disk** node.
1. **Read/Write Files from Disk Node**:
   - Operation: **Delete**
   - Path: `/home/ubuntu/n8n-data/dailyAi/VibeDrips/inbox/*`
   - **Note**: If you are using Docker, see the "Docker Paths" section below.

### Step 4: Drilling down to the "Inbox" Folder
Since your files are buried inside `.../messages/inbox/`, we need to find that final folder ID:
1. **Google Drive Node (Search)**: 
   - Query: `name = 'messages' and '{{ $node["Step 2"].json["id"] }}' in parents` (This finds the "messages" sub-folder).
2. **Google Drive Node (Search)**:
   - Query: `name = 'inbox' and '{{ $node["Step 4-1"].json["id"] }}' in parents` (This finds the final "inbox" sub-folder).

### Step 5: Download & Save

This is where most users get mixed up: The **Download** node only names the file in n8n's memory. The **Read/Write Files from Disk** node actually puts it on your server.

1. **Google Drive Node (Download)**:
   - **File ID**: `{{ $json.id }}`
   - **File Name (Options)**: Set this to `{{ $json.name }}`. 
   - **CRITICAL**: *Do not* put the `/home/ubuntu/` path here. This is just for the internal label.

2. **Read/Write Files from Disk Node**: 
   - Operation: **Write**
   - File Path: `/home/ubuntu/n8n-data/dailyAi/VibeDrips/inbox/{{ $json.name }}`
   - Binary Property: `data` (mapping the output from the Download node).

### Result
Your files will now appear on your EC2 as clean names like `message_1.json` inside your `/inbox/` folder.

---

---

## 4. Troubleshooting Docker Paths & Permissions

If n8n is running in **Docker**, it can only see files *inside* its container.
- **Problem**: n8n won't find `/home/ubuntu/...` unless you mapped it in your `docker-compose.yml`.
- **The Fix**: Add a volume mapping to your n8n service:
  ```yaml
  volumes:
    - /home/ubuntu/n8n-data:/home/ubuntu/n8n-data
  ```
- **Permission Fix**: The n8n user inside Docker (usually `node` or UID `1000`) needs write access to that folder:
  `sudo chown -R 1000:1000 /home/ubuntu/n8n-data`
  `sudo chmod -R 777 /home/ubuntu/n8n-data`
