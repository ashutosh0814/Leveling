import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDjmfJ_sOaUtoPDIViobaQcuw-7JRexxRU",
  authDomain: "levelup-f67c5.firebaseapp.com",
  projectId: "levelup-f67c5",
  storageBucket: "levelup-f67c5.firebasestorage.app",
  messagingSenderId: "343069769982",
  appId: "1:343069769982:web:21a169afdfcc9a1ab6e5af",
  measurementId: "G-9ZVQZCRV4X",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const ensureUserDocument = async (user) => {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef).catch((error) => {
    console.error("Error getting user document:", error);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "userAuthInfo",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName:
            user.displayName || user.email?.split("@")[0] || "New Adventurer",
        })
      );
    }
    throw error;
  });

  if (!userSnap.exists()) {
    const defaultTimerSettings = {
      pomodoroTime: 25 * 60,
      shortBreakTime: 5 * 60,
      longBreakTime: 15 * 60,
      autoStartBreaks: true,
      autoStartPomodoros: false,
      longBreakInterval: 4,
      background: "shadow", // Default wallpaper set here
      alarmSound: "classic",
    };

    const defaultData = {
      user: {
        uid: user.uid,
        name: user.displayName || user.email?.split("@")[0] || "New Adventurer",
        email: user.email,
        avatar: `/avatars/avatar${Math.floor(Math.random() * 6) + 1}.png`,
        level: 1,
        rank: "E",
        health: 100,
        xp: 0,
        elixirs: 0,
        nextRankElixirs: 10000,
        highestScore: 0, // Add this line
        unlockedBackgrounds: [],
        unlockedAlarmSounds: [],
      },
      timerSettings: defaultTimerSettings,
    };

    await setDoc(userRef, defaultData).catch((error) => {
      console.error("Error creating user document:", error);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "userAuthInfo",
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName:
              user.displayName || user.email?.split("@")[0] || "New Adventurer",
          })
        );
        localStorage.setItem("needsUserSetup", "true");
      }
      throw error;
    });
    return defaultData;
  }

  const userData = userSnap.data();
  if (!userData.timerSettings) {
    const defaultTimerSettings = {
      pomodoroTime: 25 * 60,
      shortBreakTime: 5 * 60,
      longBreakTime: 15 * 60,
      autoStartBreaks: true,
      autoStartPomodoros: false,
      longBreakInterval: 4,
      background: "shadow", // Default wallpaper set here
      alarmSound: "classic",
    };

    await setDoc(
      userRef,
      {
        timerSettings: defaultTimerSettings,
        user: {
          ...userData.user,
          unlockedBackgrounds: userData.user?.unlockedBackgrounds || [],
          unlockedAlarmSounds: userData.user?.unlockedAlarmSounds || [],
        },
      },
      { merge: true }
    ).catch((error) => {
      console.error("Error updating legacy user data:", error);
      throw error;
    });

    return {
      ...userData,
      timerSettings: defaultTimerSettings,
      user: {
        ...userData.user,
        unlockedBackgrounds: userData.user?.unlockedBackgrounds || [],
        unlockedAlarmSounds: userData.user?.unlockedAlarmSounds || [],
      },
    };
  }

  return userData;
};

export const updateUserData = async (user, updates) => {
  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef).catch((error) => {
    console.error("Error getting current user data:", error);
    throw error;
  });

  const currentData = userDoc.data() || {};
  const mergedData = {
    ...currentData,
    ...updates,
    user: { ...currentData.user, ...(updates.user || {}) },
    timerSettings: {
      ...currentData.timerSettings,
      ...(updates.timerSettings || {}),
    },
  };

  await setDoc(userRef, mergedData, { merge: true }).catch((error) => {
    console.error("Error updating user data:", error);
    throw error;
  });

  return mergedData;
};

export const unlockTimerItem = async (user, itemType, itemId, cost) => {
  throw new Error(
    "Shop functionality removed, unlockTimerItem is no longer supported."
  );
};

export default {
  auth,
  googleProvider,
  db,
  ensureUserDocument,
  updateUserData,
  unlockTimerItem,
};
