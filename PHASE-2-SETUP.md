# DOUBTDESK Phase 2: Firebase Authentication

## 1. Create the Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Create a project named `doubtdesk`.
3. Add a Web app and copy its configuration object.
4. Open `firebase-config.js` in VS Code.
5. Replace every `YOUR_...` value with the matching Firebase value.

## 2. Enable sign-in providers

In Firebase Console, open **Build → Authentication → Sign-in method** and enable:

- Email/Password
- Google

The app supports both methods. If the configuration is still a placeholder, it stays in demo mode and does not send data anywhere.

## 3. Run the website

Because Phase 2 uses browser modules, open the project through a local server. In VS Code, install the **Live Server** extension, then right-click `index.html` and choose **Open with Live Server**.

Do not open the file directly with `file://` when testing Firebase.
