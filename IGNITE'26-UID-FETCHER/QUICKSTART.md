# Quick Start Guide

## Prerequisites (One-time Setup)
Ensure database credentials are configured in `config.php` in this folder.

## How to Run

### Step 1: Start PHP Server
Open PowerShell and navigate to this folder, then run:

```powershell
& 'C:\xampp\php\php.exe' -S 127.0.0.1:8000
```

You should see:
```
[Time] PHP 8.2.12 Development Server (http://127.0.0.1:8000) started
```

### Step 2: Open in Browser
Open your web browser and go to:

```
http://127.0.0.1:8000/index.html
```

### Step 3: Search & Track
1. Enter a UID or Enrollment Number
2. Click "Fetch Details"
3. Update checkboxes as needed
4. Click "Save Status"

## To Stop the Server
Press `Ctrl + C` in the PowerShell terminal where the server is running.

## Shortcut (Optional - If PHP is in PATH)
If you want to use `php` command directly:
```powershell
php -S 127.0.0.1:8000
```

## Troubleshooting
- **"php not found"?** Use the full command with `C:\xampp\php\php.exe`
- **Can't connect?** Check if server is running (look for the "started" message)
- **API errors?** Verify DB credentials in `config.php`
