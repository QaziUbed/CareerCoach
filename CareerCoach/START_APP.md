# Career Coach - Start Script

## 🚀 START THE APP

Run these commands in order:

### 1. Clear Metro Cache and Start Fresh
```bash
cd CareerCoach
npx expo start --clear
```

### 2. If you get any "module not found" errors, run:
```bash
cd CareerCoach
rm -rf node_modules
npm install
npx expo start --clear
```

### 3. Once Expo starts, press:
- `w` for web browser (recommended for testing)
- `i` for iOS simulator
- `a` for Android emulator

---

## ✅ ALL PACKAGES INSTALLED

The following packages have been installed:
- ✅ @react-native-async-storage/async-storage
- ✅ expo-updates
- ✅ expo-clipboard
- ✅ expo-sharing
- ✅ expo-haptics
- ✅ expo-notifications
- ✅ All other dependencies from package.json

---

## 🐛 IF YOU STILL GET ERRORS

### Error: "Unable to resolve module"
```bash
cd CareerCoach
npm install
npx expo start --clear
```

### Error: "Metro bundler failed"
```bash
cd CareerCoach
npx expo start --clear --reset-cache
```

### Error: "Port already in use"
Expo will automatically use a different port. Just follow the new URL.

---

## 📱 EXPECTED BEHAVIOR

After running `npx expo start --clear`, you should see:

```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

Press `w` to open in web browser!

---

## ✅ BACKEND STATUS

Your backend should still be running at:
- http://localhost:8000
- http://localhost:8000/docs (API documentation)

If it's not running, open a new terminal and run:
```bash
cd career-coach-api
uvicorn main:app --reload
```

---

## 🎯 QUICK START COMMANDS

### Terminal 1 - Backend:
```bash
cd career-coach-api
uvicorn main:app --reload
```

### Terminal 2 - Frontend:
```bash
cd CareerCoach
npx expo start --clear
```

Then press `w` for web!

---

## 📝 NOTES

- All missing packages have been installed
- ErrorBoundary has been fixed to work on web
- AsyncStorage is now available
- expo-updates, expo-clipboard, expo-sharing are installed
- Cache will be cleared on startup

---

## 🎉 YOU'RE READY!

Just run:
```bash
cd CareerCoach
npx expo start --clear
```

And press `w` when it starts!
