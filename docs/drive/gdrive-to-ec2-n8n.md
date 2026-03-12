# Google Drive to AWS EC2 — n8n Transfer Guide

This guide explains how to fix permissions issues and build a workflow to move files from Google Drive to a specific folder on your AWS EC2 instance.

---

## 1. Troubleshooting: Why can't n8n see my folders?

In your n8n output, you likely only see files that have been shared with your **Service Account email**.

### The Cause:
A Google Service Account acts like a separate user. It **cannot** see your "My Drive" folders unless you explicitly invite it to those folders.

### The Fix:
1. Copy the **Service Account Email** from your n8n credentials (e.g., `n8n-drive-service-account@...iam.gserviceaccount.com`).
2. Go to your Google Drive in the browser.
3. **Right-click the folder** you want n8n to access (or the root folder).
4. Click **Share** and paste the Service Account email.
5. Give it **Editor** permissions.
6. Re-run your n8n search — all folders and files inside will now appear.

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
