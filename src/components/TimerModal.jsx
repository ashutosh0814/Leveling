import { useState, useEffect, useRef } from "react";
import { auth, updateUserData, db } from "../utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FiSettings, FiRepeat, FiSkipForward, FiX, FiRotateCw, FiStopCircle } from "react-icons/fi";

const TimerModal = ({ user, onClose, isOpen }) => {
  const [mode, setMode] = useState("pomodoro");
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(user?.timerSettings?.pomodoroTime || 25 * 60);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [settings, setSettings] = useState({
    pomodoroTime: user?.timerSettings?.pomodoroTime || 25 * 60,
    shortBreakTime: user?.timerSettings?.shortBreakTime || 5 * 60,
    longBreakTime: user?.timerSettings?.longBreakTime || 15 * 60,
    autoStartBreaks: user?.timerSettings?.autoStartBreaks ?? true,
    autoStartPomodoros: user?.timerSettings?.autoStartPomodoros ?? false,
    longBreakInterval: user?.timerSettings?.longBreakInterval || 4,
    loopEnabled: user?.timerSettings?.loopEnabled ?? false,
    soundEnabled: user?.timerSettings?.soundEnabled ?? true,
    background: user?.timerSettings?.background || "shadow",
  });
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const animationRef = useRef(null);

  const getTotalTime = () => {
    switch (mode) {
      case "pomodoro": return settings.pomodoroTime;
      case "shortBreak": return settings.shortBreakTime;
      case "longBreak": return settings.longBreakTime;
      default: return settings.pomodoroTime;
    }
  };

  const totalTime = getTotalTime();

  // Load timer state when component mounts or modal is reopened
  useEffect(() => {
    const loadTimerState = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const timerState = userDoc.data().timerState;
            if (timerState) {
              const currentTime = Date.now();
              if (timerState.isActive && timerState.expectedEndTime > currentTime) {
                const remainingMs = timerState.expectedEndTime - currentTime;
                const remainingSec = Math.ceil(remainingMs / 1000);
                setMode(timerState.mode);
                setIsActive(timerState.isActive);
                setTimeLeft(remainingSec);
                setPomodoroCount(timerState.pomodoroCount || 0);
                startTimeRef.current = currentTime - (timerState.totalTime - remainingSec) * 1000;
              } else if (timerState.isActive) {
                handleTimerComplete();
              }
            }
          }
        } catch (error) {
          console.error("Error loading timer state:", error);
        }
      }
    };

    if (isOpen) {
      loadTimerState();
    }
  }, [user, isOpen]);

  // Save timer state to Firebase whenever it changes
  useEffect(() => {
    const saveTimerState = async () => {
      if (user) {
        try {
          const timerState = {
            mode,
            isActive,
            timeLeft,
            totalTime,
            expectedEndTime: Date.now() + timeLeft * 1000,
            startTime: startTimeRef.current,
            pomodoroCount,
          };
          await updateUserData(auth.currentUser, { 
            timerState: isActive ? timerState : null 
          });
        } catch (error) {
          console.error("Failed to save timer state:", error);
        }
      }
    };

    saveTimerState();
  }, [isActive, timeLeft, mode, totalTime, pomodoroCount, user]);

  // Timer logic
  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now() - (totalTime - timeLeft) * 1000;
      intervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(totalTime - elapsedSeconds, 0);
        setTimeLeft(newTimeLeft);
        if (newTimeLeft <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          if (settings.soundEnabled) playAlarm();
          handleTimerComplete();
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, totalTime, settings.soundEnabled]);

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActive) {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(totalTime - elapsedSeconds, 0);
        if (newTimeLeft <= 0) handleTimerComplete();
        else setTimeLeft(newTimeLeft);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive, totalTime]);

  const playAlarm = () => {
    audioRef.current = new Audio("/sounds/alarm.mp3");
    audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
  };

  const handleTimerComplete = async () => {
    setIsActive(false);
    if (mode === "pomodoro") {
      const newPomodoroCount = pomodoroCount + 1;
      setPomodoroCount(newPomodoroCount);
      setMode(newPomodoroCount % settings.longBreakInterval === 0 ? "longBreak" : "shortBreak");
      if (settings.autoStartBreaks) {
        setIsActive(true);
        startTimeRef.current = Date.now();
      }
    } else {
      setMode("pomodoro");
      if (settings.autoStartPomodoros && settings.loopEnabled) {
        setIsActive(true);
        startTimeRef.current = Date.now();
      }
    }
  };

  const skipToNextPhase = () => {
    setIsActive(false);
    setMode(
      mode === "pomodoro"
        ? pomodoroCount % settings.longBreakInterval === settings.longBreakInterval - 1
          ? "longBreak"
          : "shortBreak"
        : "pomodoro"
    );
    setTimeLeft(getTotalTime());
  };

  const handleRestart = () => {
    const newTimeLeft = getTotalTime();
    setTimeLeft(newTimeLeft);
    
    if (isActive) {
      startTimeRef.current = Date.now();
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (isActive) {
      intervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(totalTime - elapsedSeconds, 0);
        setTimeLeft(newTimeLeft);
        if (newTimeLeft <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          if (settings.soundEnabled) playAlarm();
          handleTimerComplete();
        }
      }, 1000);
    }
  };

  const handleCancel = async () => {
    setIsActive(false);
    setTimeLeft(getTotalTime());
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (user) {
      try {
        await updateUserData(auth.currentUser, { timerState: null });
      } catch (error) {
        console.error("Failed to clear timer state:", error);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const saveSettings = async () => {
    try {
      await updateUserData(auth.currentUser, { timerSettings: settings });
      setShowSettings(false);
      if (!isActive) setTimeLeft(getTotalTime());
    } catch (error) {
      console.error("Failed to save timer settings:", error);
    }
  };

  const handleTimeChange = (type, value) => {
    if (value === "") {
      setSettings((prev) => ({ ...prev, [`${type}Time`]: 0 }));
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue))
      setSettings((prev) => ({ ...prev, [`${type}Time`]: numValue * 60 }));
  };

  const handleIntervalChange = (value) => {
    if (value === "") {
      setSettings((prev) => ({ ...prev, longBreakInterval: 0 }));
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue))
      setSettings((prev) => ({
        ...prev,
        longBreakInterval: Math.max(1, numValue),
      }));
  };

  const handleModeChange = (newMode) => {
    const wasActive = isActive;
    setIsActive(false);
    setMode(newMode);
    if (wasActive) {
      if (
        (newMode === "shortBreak" || newMode === "longBreak") &&
        settings.autoStartBreaks
      ) {
        setIsActive(true);
        startTimeRef.current = Date.now();
      } else if (newMode === "pomodoro" && settings.autoStartPomodoros) {
        setIsActive(true);
        startTimeRef.current = Date.now();
      }
    }
  };

  const handleResetAll = () => {
    setSettings({
      pomodoroTime: 25 * 60,
      shortBreakTime: 5 * 60,
      longBreakTime: 15 * 60,
      autoStartBreaks: true,
      autoStartPomodoros: false,
      longBreakInterval: 4,
      loopEnabled: false,
      soundEnabled: true,
      background: "shadow",
    });
  };

  const renderTimer = () => (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-screen-md mx-auto px-4 py-4 sm:py-8">
      <div className="flex space-x-2 mb-4 sm:mb-8">
        {["pomodoro", "shortBreak", "longBreak"].map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm hover:bg-white/10 transition-colors ${
              mode === m ? "bg-purple-700/70 text-white" : "text-white/70"
            }`}
          >
            {m.charAt(0).toUpperCase() + m.slice(1).replace(/([A-Z])/g, ' $1')}
          </button>
        ))}
      </div>

      <div className="text-xs sm:text-sm text-purple-300 mb-2 text-center px-2">
        {mode === "pomodoro"
          ? `Session ${pomodoroCount + 1}`
          : `Completed: ${pomodoroCount}`}
        {settings.longBreakInterval > 0 && (
          <span className="ml-1 sm:ml-2">
            (Long break after {settings.longBreakInterval} sessions)
          </span>
        )}
      </div>

      <div className="my-4 sm:my-8 text-center relative">
        <div
          className="text-6xl sm:text-8xl md:text-9xl font-bold font-mono tracking-tighter text-white"
          style={{
            textShadow: isActive
              ? "0 0 10px rgba(128, 0, 255, 0.8), 0 0 20px rgba(128, 0, 255, 0.5)"
              : "none",
          }}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="mt-6 sm:mt-8 flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={() => setIsActive(!isActive)}
          className="px-6 py-2 sm:px-10 sm:py-3 rounded-full text-base sm:text-lg font-medium bg-purple-600 text-white hover:bg-purple-500 active:bg-purple-700 transform active:scale-95 transition-all shadow-lg"
          style={{
            boxShadow: isActive
              ? "0 0 15px rgba(128, 0, 255, 0.6)"
              : "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          {isActive ? "Pause" : "Start"}
        </button>
        <button
          onClick={skipToNextPhase}
          className="p-2 sm:p-3 rounded-full bg-gray-800/50 text-white/80 hover:bg-gray-700/50 active:bg-gray-800/70 transform active:scale-95 transition-all"
          title="Skip to next phase"
        >
          <FiSkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      <div className="mt-4 sm:mt-6 flex space-x-2 sm:space-x-4">
        <button
          onClick={handleRestart}
          className="px-3 py-1 sm:px-4 sm:py-2 flex items-center space-x-1 sm:space-x-2 bg-gray-800/50 text-white/80 hover:bg-gray-700/50 rounded-full text-xs sm:text-sm transition-colors"
          title="Restart current phase"
        >
          <FiRotateCw className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Restart</span>
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1 sm:px-4 sm:py-2 flex items-center space-x-1 sm:space-x-2 bg-gray-800/50 text-white/80 hover:bg-gray-700/50 rounded-full text-xs sm:text-sm transition-colors"
          title="Cancel timer"
        >
          <FiStopCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Cancel</span>
        </button>
      </div>

      {settings.loopEnabled && (
        <div className="mt-3 sm:mt-4 flex items-center text-purple-300 text-xs sm:text-sm">
          <FiRepeat className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span>Loop enabled</span>
        </div>
      )}

      <button
        onClick={() => setShowSettings(true)}
        className="mt-6 sm:mt-8"
        aria-label="Settings"
      >
        <FiSettings className="h-5 w-5 sm:h-6 sm:w-6 text-white/70 hover:text-white transition-colors" />
      </button>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-black/90 rounded-lg text-white p-4 sm:p-6 max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-medium">Timer Settings</h2>
        <button
          onClick={() => setShowSettings(false)}
          className="text-white/70 hover:text-white p-1"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="pb-2 sm:pb-3 border-b border-white/10">
          <h3 className="text-xs sm:text-sm font-medium text-purple-300 mb-1 sm:mb-2">
            Time (minutes)
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {["pomodoro", "shortBreak", "longBreak"].map((type) => (
              <div key={type}>
                <label className="block text-xs text-white/70 mb-1">
                  {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  type="number"
                  value={settings[`${type}Time`] / 60}
                  onChange={(e) => handleTimeChange(type, e.target.value)}
                  className="w-full px-2 py-1 bg-gray-800/50 text-white rounded border border-white/10 focus:outline-none focus:border-purple-400 text-xs sm:text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pb-2 sm:pb-3 border-b border-white/10">
          <h3 className="text-xs sm:text-sm font-medium text-purple-300 mb-1 sm:mb-2">
            Interval Settings
          </h3>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex-1 pr-2 text-xs text-white/70">
              Long break after
            </div>
            <input
              type="number"
              value={settings.longBreakInterval}
              onChange={(e) => handleIntervalChange(e.target.value)}
              className="w-12 sm:w-16 px-2 py-1 bg-gray-800/50 text-white rounded border border-white/10 focus:outline-none focus:border-purple-400 text-xs sm:text-sm"
              min="1"
            />
            <div className="pl-2 text-xs text-white/70">sessions</div>
          </div>
        </div>

        <div className="pb-2 sm:pb-3 border-b border-white/10">
          <h3 className="text-xs sm:text-sm font-medium text-purple-300 mb-1 sm:mb-2">
            Automation
          </h3>
          {[
            { key: "autoStartBreaks", label: "Auto-start breaks" },
            { key: "autoStartPomodoros", label: "Auto-start pomodoros" },
            { key: "loopEnabled", label: "Loop enabled" },
            { key: "soundEnabled", label: "Sound alerts" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1 sm:py-2">
              <span className="text-xs text-white/70">{label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={() =>
                    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                  className="sr-only peer"
                />
                <div className="w-8 h-4 sm:w-9 sm:h-5 bg-gray-700 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 sm:after:h-4 sm:after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1 sm:pt-2">
          <button
            onClick={handleResetAll}
            className="px-2 py-1 sm:px-3 sm:py-1 bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-full text-xs"
          >
            Reset all
          </button>
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setShowSettings(false)}
              className="px-2 py-1 sm:px-3 sm:py-1 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              className="px-3 py-1 sm:px-4 sm:py-1 bg-purple-600 text-white rounded-full text-xs hover:bg-purple-500"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {isOpen && (
        <div
          className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            backgroundImage: `url('/images/timer-bgs/${settings.background
              .toLowerCase()
              .replace(/\s+/g, "-")}.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#10041a",
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-blue-900/70 z-0"></div>
          
          <canvas
            id="shadowCanvas"
            className="absolute inset-0 z-0"
            style={{ opacity: 0.8 }}
          ></canvas>
          
          {/* Stronger overlay for better text contrast */}
          <div className="absolute inset-0 bg-black/60 z-10"></div>
          
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30 text-white/70 hover:text-white transition-colors p-1 sm:p-2"
            aria-label="Close timer"
          >
            <FiX className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          
          {showSettings ? (
            <div className="relative z-20 w-full max-w-md px-2 sm:px-4 py-4">
              {renderSettings()}
            </div>
          ) : (
            <div className="relative z-20 w-full h-full flex items-center justify-center">
              {renderTimer()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimerModal;