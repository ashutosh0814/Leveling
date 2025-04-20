import { useState, useEffect, useRef } from "react";
import { auth, updateUserData } from "../utils/firebase";
import { FiSettings, FiRepeat, FiSkipForward } from "react-icons/fi";

const TimerModal = ({ user, onClose }) => {
  const [mode, setMode] = useState("pomodoro");
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(
    user?.timerSettings?.pomodoroTime || 25 * 60
  );
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
    background: user?.timerSettings?.background || "shadow", // Default wallpaper
  });
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const animationRef = useRef(null);

  const getTotalTime = () => {
    switch (mode) {
      case "pomodoro":
        return settings.pomodoroTime;
      case "shortBreak":
        return settings.shortBreakTime;
      case "longBreak":
        return settings.longBreakTime;
      default:
        return settings.pomodoroTime;
    }
  };

  const totalTime = getTotalTime();

  useEffect(() => {
    const savedTimerState = localStorage.getItem("timerState");
    if (savedTimerState) {
      const parsedState = JSON.parse(savedTimerState);
      const currentTime = Date.now();
      if (parsedState.isActive && parsedState.expectedEndTime > currentTime) {
        const remainingMs = parsedState.expectedEndTime - currentTime;
        const remainingSec = Math.ceil(remainingMs / 1000);
        setMode(parsedState.mode);
        setIsActive(true);
        setTimeLeft(remainingSec);
        setPomodoroCount(parsedState.pomodoroCount || 0);
        startTimeRef.current =
          currentTime - (parsedState.totalTime - remainingSec) * 1000;
      } else if (parsedState.isActive) {
        handleTimerComplete();
        localStorage.removeItem("timerState");
      }
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      const expectedEndTime = Date.now() + timeLeft * 1000;
      localStorage.setItem(
        "timerState",
        JSON.stringify({
          mode,
          isActive,
          timeLeft,
          totalTime,
          expectedEndTime,
          startTime: startTimeRef.current,
          pomodoroCount,
        })
      );
    } else {
      localStorage.removeItem("timerState");
    }
  }, [isActive, timeLeft, mode, totalTime, pomodoroCount]);

  useEffect(() => {
    if (user?.timerSettings) {
      setSettings((prev) => ({
        ...prev,
        ...user.timerSettings,
        background: user.timerSettings.background || "shadow", // Ensure default
      }));
      setTimeLeft(
        mode === "pomodoro"
          ? user.timerSettings.pomodoroTime
          : mode === "shortBreak"
          ? user.timerSettings.shortBreakTime
          : user.timerSettings.longBreakTime
      );
    }
  }, [user, mode]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActive) {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor(
          (currentTime - startTimeRef.current) / 1000
        );
        const newTimeLeft = Math.max(totalTime - elapsedSeconds, 0);
        if (newTimeLeft <= 0) handleTimerComplete();
        else setTimeLeft(newTimeLeft);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive, totalTime]);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now() - (totalTime - timeLeft) * 1000;
      intervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor(
          (currentTime - startTimeRef.current) / 1000
        );
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

  useEffect(() => {
    setTimeLeft(getTotalTime());
    if (isActive) startTimeRef.current = Date.now();
  }, [mode, settings]);

  const playAlarm = () => {
    audioRef.current = new Audio("/sounds/alarm.mp3");
    audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
  };

  const handleTimerComplete = () => {
    setIsActive(false);
    if (mode === "pomodoro") {
      const newPomodoroCount = pomodoroCount + 1;
      setPomodoroCount(newPomodoroCount);
      setMode(
        newPomodoroCount % settings.longBreakInterval === 0
          ? "longBreak"
          : "shortBreak"
      );
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
        ? pomodoroCount % settings.longBreakInterval ===
          settings.longBreakInterval - 1
          ? "longBreak"
          : "shortBreak"
        : "pomodoro"
    );
    setTimeLeft(getTotalTime());
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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
      background: "shadow", // Reset to default wallpaper
    });
  };

  const renderTimer = () => (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-screen-md mx-auto px-4 py-8">
      <div className="flex space-x-2 mb-8">
        {["pomodoro", "shortBreak", "longBreak"].map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`px-4 py-2 rounded-full text-sm hover:bg-white/10 transition-colors ${
              mode === m ? "bg-purple-700/70 text-white" : "text-white/70"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="text-sm text-purple-300 mb-2">
        {mode === "pomodoro"
          ? `Session ${pomodoroCount + 1}`
          : `Completed: ${pomodoroCount}`}
        {settings.longBreakInterval > 0 && (
          <span className="ml-2">
            (Long break after {settings.longBreakInterval} sessions)
          </span>
        )}
      </div>

      <div className="my-8 text-center relative">
        <div
          className="text-8xl md:text-9xl font-bold font-mono tracking-tighter text-white"
          style={{
            textShadow: isActive
              ? "0 0 10px rgba(128, 0, 255, 0.8), 0 0 20px rgba(128, 0, 255, 0.5)"
              : "none",
          }}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="mt-8 flex items-center space-x-4">
        <button
          onClick={() => setIsActive(!isActive)}
          className="px-10 py-3 rounded-full text-lg font-medium bg-purple-600 text-white hover:bg-purple-500 active:bg-purple-700 transform active:scale-95 transition-all shadow-lg"
          style={{
            boxShadow: isActive
              ? "0 0 15px rgba(128, 0, 255, 0.6)"
              : "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          {isActive ? "pause" : "start"}
        </button>
        <button
          onClick={skipToNextPhase}
          className="p-3 rounded-full bg-gray-800/50 text-white/80 hover:bg-gray-700/50 active:bg-gray-800/70 transform active:scale-95 transition-all"
          title="Skip to next phase"
        >
          <FiSkipForward className="h-5 w-5" />
        </button>
      </div>

      {settings.loopEnabled && (
        <div className="mt-4 flex items-center text-purple-300 text-sm">
          <FiRepeat className="h-4 w-4 mr-1" />
          <span>Loop enabled</span>
        </div>
      )}

      <button
        onClick={() => setShowSettings(true)}
        className="mt-8"
        aria-label="Settings"
      >
        <FiSettings className="h-6 w-6 text-white/70 hover:text-white transition-colors" />
      </button>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-black/90 rounded-lg text-white p-6 max-w-md w-full mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Timer Settings</h2>
        <button
          onClick={() => setShowSettings(false)}
          className="text-white/70 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div className="pb-3 border-b border-white/10">
          <h3 className="text-sm font-medium text-purple-300 mb-2">
            Time (minutes)
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {["pomodoro", "shortBreak", "longBreak"].map((type) => (
              <div key={type}>
                <label className="block text-xs text-white/70 mb-1">
                  {type}
                </label>
                <input
                  type="number"
                  value={settings[`${type}Time`] / 60}
                  onChange={(e) => handleTimeChange(type, e.target.value)}
                  className="w-full px-2 py-1 bg-gray-800/50 text-white rounded border border-white/10 focus:outline-none focus:border-purple-400 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pb-3 border-b border-white/10">
          <h3 className="text-sm font-medium text-purple-300 mb-2">
            Interval Settings
          </h3>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 pr-2 text-xs text-white/70">
              Long break after
            </div>
            <input
              type="number"
              value={settings.longBreakInterval}
              onChange={(e) => handleIntervalChange(e.target.value)}
              className="w-16 px-2 py-1 bg-gray-800/50 text-white rounded border border-white/10 focus:outline-none focus:border-purple-400 text-sm"
              min="1"
            />
            <div className="pl-2 text-xs text-white/70">sessions</div>
          </div>
        </div>

        <div className="pb-3 border-b border-white/10">
          <h3 className="text-sm font-medium text-purple-300 mb-2">
            Automation
          </h3>
          {[
            { key: "autoStartBreaks", label: "Auto-start breaks" },
            { key: "autoStartPomodoros", label: "Auto-start pomodoros" },
            { key: "loopEnabled", label: "Loop enabled" },
            { key: "soundEnabled", label: "Sound alerts" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-2">
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
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleResetAll}
            className="px-3 py-1 bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-full text-xs"
          >
            Reset all
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSettings(false)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              className="px-4 py-1 bg-purple-600 text-white rounded-full text-xs hover:bg-purple-500"
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
      <div
        className="w-full h-full flex flex-col items-center justify-center relative"
        style={{
          backgroundImage: `url('/images/timer-bgs/${settings.background
            .toLowerCase()
            .replace(/\s+/g, "-")}.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#10041a",
        }}
      >
        <canvas
          id="shadowCanvas"
          className="absolute inset-0 z-0"
          style={{ opacity: 0.8 }}
        ></canvas>
        <div className="absolute inset-0 bg-black/75 z-10"></div>
        {showSettings ? (
          <div className="relative z-20 w-full max-w-md px-4">
            {renderSettings()}
          </div>
        ) : (
          <div className="relative z-20 w-full">{renderTimer()}</div>
        )}
      </div>
    </div>
  );
};

export default TimerModal;
