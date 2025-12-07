# How to Get Firebase Service Account

This guide shows you exactly where to find and download your Firebase Service Account JSON file.

## Step-by-Step Instructions

### Step 1: Go to Firebase Console

1. Visit [Firebase Console](https://console.firebase.google.com)
2. Sign in with your Google account
3. Select your project: **`stockfantasysimulator`** (or your project name)

### Step 2: Navigate to Project Settings

1. Click the **⚙️ Settings** icon (gear icon) in the top left
2. Select **"Project settings"** from the dropdown menu
   - Or go directly: [Project Settings](https://console.firebase.google.com/project/stockfantasysimulator/settings/general)

### Step 3: Go to Service Accounts Tab

1. In the Project Settings page, click the **"Service accounts"** tab
   - It's at the top of the settings page, next to "General", "Users and permissions", etc.

### Step 4: Generate New Private Key

1. You'll see a section titled **"Firebase Admin SDK"**
2. Look for the button: **"Generate new private key"**
3. Click **"Generate new private key"**
4. A popup will appear warning you about keeping the key secure
5. Click **"Generate key"** to confirm

### Step 5: Download JSON File

1. A JSON file will automatically download to your computer
2. The file name will be something like: `stockfantasysimulator-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
3. **Save this file securely** - you'll need it for deployment

### Step 6: Copy JSON Content

1. **Open the downloaded JSON file** in a text editor
2. The file contains something like:
   ```json
   {
     "type": "service_account",
     "project_id": "stockfantasysimulator",
     "private_key_id": "abc123...",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@stockfantasysimulator.iam.gserviceaccount.com",
     "client_id": "123456789",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40stockfantasysimulator.iam.gserviceaccount.com"
   }
   ```

3. **Copy the entire JSON content** (all of it, including the curly braces)

### Step 7: Add to Render

1. Go to your Render service dashboard
2. Click **"Environment"** tab
3. Find or add: `FIREBASE_SERVICE_ACCOUNT`
4. **Paste the entire JSON** as the value
   - You can paste it as multi-line (Render supports this)
   - Or as a single line (remove all newlines)
5. Click **"Save Changes"**

---

## Visual Guide

```
Firebase Console
  └─ Project: stockfantasysimulator
      └─ ⚙️ Settings (gear icon)
          └─ Project settings
              └─ Service accounts tab
                  └─ Firebase Admin SDK section
                      └─ "Generate new private key" button
                          └─ Download JSON file
                              └─ Copy entire JSON content
                                  └─ Paste in Render Environment Variables
```

---

## Alternative: If You Already Have the File

If you've already generated a service account key before:

1. **Check your Downloads folder** for the JSON file
2. **Or check your project files** if you saved it somewhere
3. The file name pattern: `[project-id]-firebase-adminsdk-[random]-[random].json`

---

## Important Security Notes

⚠️ **Keep this file secure!**

- ✅ **DO**: Add it to Render environment variables (secure)
- ✅ **DO**: Keep it in a secure location on your computer
- ❌ **DON'T**: Commit it to GitHub (it's in `.gitignore`)
- ❌ **DON'T**: Share it publicly
- ❌ **DON'T**: Include it in client-side code

The service account has admin access to your Firebase project, so treat it like a password.

---

## Troubleshooting

### "Generate new private key" button is disabled/grayed out

**Solution:**
- Make sure you have **Owner** or **Editor** permissions on the Firebase project
- Check that you're in the correct project
- Try refreshing the page

### Can't find Service Accounts tab

**Solution:**
- Make sure you're in **Project settings** (not User settings)
- Look for tabs at the top: General, Service accounts, Users and permissions, etc.
- The tab might be named slightly differently in some Firebase versions

### JSON file won't download

**Solution:**
- Check your browser's download settings
- Try a different browser
- Check if popup blockers are preventing the download
- Try right-clicking the button and "Save link as"

### Need to regenerate the key

**Solution:**
- You can generate multiple keys
- Old keys remain valid until you delete them
- To delete: Go to Google Cloud Console → IAM & Admin → Service Accounts → Find the service account → Keys tab → Delete old keys

---

## Quick Reference

**Firebase Console URL:**
```
https://console.firebase.google.com/project/stockfantasysimulator/settings/serviceaccounts/adminsdk
```

**Direct Link to Service Accounts:**
1. Replace `stockfantasysimulator` with your project ID
2. Visit: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/serviceaccounts/adminsdk`

---

## What the Service Account Does

The Firebase Service Account allows your server to:
- ✅ Verify Firebase authentication tokens
- ✅ Access Firebase Admin SDK features
- ✅ Manage users and permissions
- ✅ Access Firebase services from your backend

This is required for your Render server to authenticate users and verify Firebase tokens.

---

## Summary

1. ✅ Go to Firebase Console
2. ✅ Select your project
3. ✅ Settings → Project settings
4. ✅ Service accounts tab
5. ✅ Generate new private key
6. ✅ Download JSON file
7. ✅ Copy entire JSON content
8. ✅ Paste in Render `FIREBASE_SERVICE_ACCOUNT` environment variable

**That's it!** Your server will now be able to authenticate with Firebase.

