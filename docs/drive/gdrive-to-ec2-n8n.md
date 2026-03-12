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

Since Meta deposits folders into your **Root** (which n8n can't see), you can use a small Google Apps Script to auto-move them into your shared `00_AUTOMATION` folder.

### The "Janitor" Script:
1. Go to [script.google.com](https://script.google.com/).
2. Create a new project and paste this code:
   ```javascript
   function moveMetaFolders() {
     var sourceFolder = DriveApp.getRootFolder();
     var targetFolder = DriveApp.getFoldersByName("00_AUTOMATION").next();
     var folders = sourceFolder.getFolders();
     
     while (folders.hasNext()) {
       var folder = folders.next();
       // Adjust the name check to match your Meta folders (e.g., starts with "meta-")
       if (folder.getName().toLowerCase().startsWith("meta")) {
         folder.moveTo(targetFolder);
         console.log("Moved: " + folder.getName());
       }
     }
   }
   ```
3. Click the **Clock icon (Triggers)** on the left.
4. Add a trigger to run `moveMetaFolders` every hour (or daily).

**Result**: Your Meta folders will now automatically "teleport" into the shared folder where n8n can see them.

---

## 2. The 3-Node Workflow Implementation

To move files, you need to chain these nodes together:

### Node 1: Google Drive (Search)
- **Resource**: `File/Folder`
- **Operation**: `Search`
- **Query String**: `name = 'YourFolderName'` (to find a specific folder) or `*` for everything.
- **Goal**: This gets the `File ID` of the file you want to move.

### Node 2: Google Drive (Download)
- **Resource**: `File/Folder`
- **Operation**: `Download`
- **File ID**: `{{ $node["Search"].json["id"] }}` (Map this from the Search node).
- **Goal**: This pulls the actual file data into n8n's memory.

### Node 3: SSH (Upload)
- **Operation**: `Upload`
- **Authentication**: Use your EC2 `.pem` key.
- **Path**: `/home/ubuntu/destination_folder/`
- **File Data**: Use the binary data from the Download node.
- **Goal**: This sends the file to your EC2 instance.

---

## 3. Best Practices for EC2 Folders
- Ensure the destination folder on EC2 has correct write permissions:
  `sudo chown -R ubuntu:ubuntu /path/to/folder`
- Use the **SSH Node**'s "Upload" operation instead of "Run Command" for binary files.
