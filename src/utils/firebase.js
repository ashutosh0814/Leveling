import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const ensureUserDocument = async (user) => {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const defaultTimerSettings = {
      pomodoroTime: 25 * 60,
      shortBreakTime: 5 * 60,
      longBreakTime: 15 * 60,
      autoStartBreaks: true,
      autoStartPomodoros: false,
      longBreakInterval: 4,
      background: 'default',
      alarmSound: 'classic'
    };

    const defaultData = {
      user: {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || "New Adventurer",
        email: user.email,
        avatar: `/avatars/avatar${Math.floor(Math.random() * 6) + 1}.png`,
        level: 1,
        rank: "E",
        health: 100,
        xp: 0,
        elixirs: 0,
        nextRankElixirs: 10000,
        unlockedBackgrounds: [],
        unlockedAlarmSounds: []
      },
      dailyQuests: [],
      weeklyDungeons: [],
      monthlyGoals: [],
      currentWallpaper: "E Rank Wallpaper",
      timerSettings: defaultTimerSettings
    };

    await setDoc(userRef, defaultData);
    return defaultData;
  }

  // Backward compatibility
  const userData = userSnap.data();
  if (!userData.timerSettings) {
    const defaultTimerSettings = {
      pomodoroTime: 25 * 60,
      shortBreakTime: 5 * 60,
      longBreakTime: 15 * 60,
      autoStartBreaks: true,
      autoStartPomodoros: false,
      longBreakInterval: 4,
      background: 'default',
      alarmSound: 'classic'
    };

    await setDoc(userRef, {
      timerSettings: defaultTimerSettings,
      user: {
        ...userData.user,
        unlockedBackgrounds: userData.user?.unlockedBackgrounds || [],
        unlockedAlarmSounds: userData.user?.unlockedAlarmSounds || []
      }
    }, { merge: true });

    return {
      ...userData,
      timerSettings: defaultTimerSettings,
      user: {
        ...userData.user,
        unlockedBackgrounds: userData.user?.unlockedBackgrounds || [],
        unlockedAlarmSounds: userData.user?.unlockedAlarmSounds || []
      }
    };
  }

  return userData;
};

export const updateUserData = async (user, updates) => {
  try {
    const userRef = doc(db, "users", user.uid);
    const currentData = (await getDoc(userRef)).data() || {};
    
    const mergedData = {
      ...currentData,
      ...updates,
      user: {
        ...currentData.user,
        ...(updates.user || {})
      },
      timerSettings: {
        ...currentData.timerSettings,
        ...(updates.timerSettings || {})
      }
    };

    await setDoc(userRef, mergedData, { merge: true });
    return mergedData;
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
};

export const unlockTimerItem = async (user, itemType, itemId, cost) => {
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    if (!userData) throw new Error("User not found");
    if (userData.user.elixirs < cost) throw new Error("Not enough elixirs");
    
    const fieldName = `unlocked${itemType === 'background' ? 'Backgrounds' : 'AlarmSounds'}`;
    const updatedItems = [...new Set([
      ...(userData.user[fieldName] || []),
      itemId
    ])];

    const updatedUser = {
      ...userData.user,
      [fieldName]: updatedItems,
      elixirs: userData.user.elixirs - cost
    };

    await setDoc(userRef, { user: updatedUser }, { merge: true });
    return updatedUser;
  } catch (error) {
    console.error("Error unlocking timer item:", error);
    throw error;
  }
};

export default {
  auth,
  googleProvider,
  db,
  ensureUserDocument,
  updateUserData,
  unlockTimerItem
};