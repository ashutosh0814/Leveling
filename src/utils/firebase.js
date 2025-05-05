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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const ensureUserDocument = async (user) => {
  const userRef = doc(db, "users", user.uid);
  
  try {
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const defaultTimerSettings = {
        pomodoroTime: 25 * 60,
        shortBreakTime: 5 * 60,
        longBreakTime: 15 * 60,
        autoStartBreaks: true,
        autoStartPomodoros: false,
        longBreakInterval: 4,
        background: "shadow",
        alarmSound: "classic",
      };

      const defaultData = {
        user: {
          uid: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "New Adventurer",
          email: user.email,
          avatar: `/avatars/avatar${Math.floor(Math.random() * 5) + 1}.png`,
          level: 1,
          rank: "E",
          health: 100,
          xp: 0,
          elixirs: 0,
          nextRankElixirs: 10000,
          highestScore: 0,
          unlockedBackgrounds: [],
          unlockedAlarmSounds: [],
          onboardingCompleted: false, // New users start with onboarding not completed
          completedChallenges: [],
          taskHistory: [],
          dailyQuests: [],
          weeklyDungeons: [],
          monthlyGoals: [],
          currentWallpaper: "E Rank Wallpaper",
        },
        timerSettings: defaultTimerSettings,
      };

      await setDoc(userRef, defaultData);
      return defaultData;
    }

    // For existing users, ensure all required fields exist
    const userData = userSnap.data();
    const mergedUserData = {
      ...userData,
      user: {
        name: userData.user?.name || user.displayName || user.email?.split("@")[0] || "New Adventurer",
        email: userData.user?.email || user.email,
        avatar: userData.user?.avatar || `/avatars/avatar${Math.floor(Math.random() * 5) + 1}.png`,
        level: userData.user?.level || 1,
        rank: userData.user?.rank || "E",
        health: userData.user?.health || 100,
        xp: userData.user?.xp || 0,
        elixirs: userData.user?.elixirs || 0,
        nextRankElixirs: userData.user?.nextRankElixirs || 10000,
        highestScore: userData.user?.highestScore || 0,
        unlockedBackgrounds: userData.user?.unlockedBackgrounds || [],
        unlockedAlarmSounds: userData.user?.unlockedAlarmSounds || [],
        onboardingCompleted: userData.user?.onboardingCompleted || false, // Ensure field exists
        completedChallenges: userData.user?.completedChallenges || [],
        taskHistory: userData.user?.taskHistory || [],
      },
      timerSettings: {
        pomodoroTime: userData.timerSettings?.pomodoroTime || 25 * 60,
        shortBreakTime: userData.timerSettings?.shortBreakTime || 5 * 60,
        longBreakTime: userData.timerSettings?.longBreakTime || 15 * 60,
        autoStartBreaks: userData.timerSettings?.autoStartBreaks !== undefined ? userData.timerSettings.autoStartBreaks : true,
        autoStartPomodoros: userData.timerSettings?.autoStartPomodoros !== undefined ? userData.timerSettings.autoStartPomodoros : false,
        longBreakInterval: userData.timerSettings?.longBreakInterval || 4,
        background: userData.timerSettings?.background || "shadow",
        alarmSound: userData.timerSettings?.alarmSound || "classic",
      },
      dailyQuests: userData.dailyQuests || [],
      weeklyDungeons: userData.weeklyDungeons || [],
      monthlyGoals: userData.monthlyGoals || [],
      currentWallpaper: userData.currentWallpaper || "E Rank Wallpaper",
    };

    // Only update if we needed to merge defaults
    if (JSON.stringify(userData) !== JSON.stringify(mergedUserData)) {
      await setDoc(userRef, mergedUserData, { merge: true });
    }

    return mergedUserData;
  } catch (error) {
    console.error("Error in ensureUserDocument:", error);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "userAuthInfo",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split("@")[0] || "New Adventurer",
        })
      );
    }
    throw error;
  }
};

export const updateUserData = async (user, updates) => {
  const userRef = doc(db, "users", user.uid);
  
  try {
    // Get current data first
    const userDoc = await getDoc(userRef);
    const currentData = userDoc.exists() ? userDoc.data() : {};

    // Deep merge the updates
    const mergedData = {
      ...currentData,
      ...updates,
      user: {
        ...currentData.user,
        ...(updates.user || {}),
      },
      timerSettings: {
        ...currentData.timerSettings,
        ...(updates.timerSettings || {}),
      },
    };

    await setDoc(userRef, mergedData, { merge: true });
    return mergedData;
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
};

export const markOnboardingComplete = async (user) => {
  try {
    await updateUserData(user, {
      user: {
        onboardingCompleted: true,
      },
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("hasCompletedOnboarding", "true");
    }
  } catch (error) {
    console.error("Error marking onboarding complete:", error);
    throw error;
  }
};

export const unlockTimerItem = async (user, itemType, itemId, cost) => {
  throw new Error("Shop functionality removed, unlockTimerItem is no longer supported.");
};

export default {
  auth,
  googleProvider,
  db,
  ensureUserDocument,
  updateUserData,
  markOnboardingComplete,
  unlockTimerItem,
};