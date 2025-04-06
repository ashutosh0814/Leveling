import { useState, useEffect, useRef } from 'react';
import { auth, updateUserData } from '../utils/firebase';
import { Press_Start_2P } from 'next/font/google';

const pixelFont = Press_Start_2P({ subsets: ['latin'], weight: '400' });

const TimerModal = ({ user, onClose, onUpdateUser }) => {
  // Timer states
  const [mode, setMode] = useState('focus');
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(user?.timerSettings?.focusTime || 25 * 60);
  
  // Settings states
  const [settings, setSettings] = useState({
    focusTime: user?.timerSettings?.focusTime || 25 * 60,
    breakTime: user?.timerSettings?.breakTime || 5 * 60,
    autoStartBreak: user?.timerSettings?.autoStartBreak ?? true,
    background: user?.timerSettings?.background || 'default'
  });
  
  // Ensure current background is a valid one that's either default or unlocked
  const [currentBackground, setCurrentBackground] = useState('default');
  const [showSettings, setShowSettings] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [activeTab, setActiveTab] = useState('general');
  
  // Refs
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Calculate progress for circular bar
  const totalTime = mode === 'focus' ? settings.focusTime : settings.breakTime;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Initialize background correctly when component mounts
  useEffect(() => {
    // Start with default background
    let bgToUse = 'default';
    
    // If user has settings and a saved background
    if (user?.timerSettings?.background) {
      const savedBackground = user.timerSettings.background;
      const unlockedBackgrounds = user?.unlockedBackgrounds || [];
      
      // Only use saved background if it's default or has been unlocked
      if (savedBackground === 'default' || unlockedBackgrounds.includes(savedBackground)) {
        bgToUse = savedBackground;
      }
    }
    
    // Set the background
    setCurrentBackground(bgToUse);
  }, [user]);

  // Get window size
  useEffect(() => {
    // Set initial size
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Update size on resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Timer logic
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            playAlarm();
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  // Update time when mode changes
  useEffect(() => {
    const newTime = mode === 'focus' ? settings.focusTime : settings.breakTime;
    setTimeLeft(newTime);
  }, [mode, settings]);

  const playAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current = new Audio('/sounds/alarm.mp3');
    audioRef.current.play().catch(e => console.log("Audio play failed:", e));
  };

  const handleTimerComplete = () => {
    setIsActive(false);
    
    if (mode === 'focus') {
      setMode('break');
      if (settings.autoStartBreak) setIsActive(true);
    } else {
      setMode('focus');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveSettings = async () => {
    try {
      // Check if selected background is valid (default or unlocked)
      const isBackgroundValid = 
        settings.background === 'default' || 
        (user?.unlockedBackgrounds || []).includes(settings.background);
      
      // Use the selected background if valid, otherwise use default
      const backgroundToSave = isBackgroundValid ? settings.background : 'default';
      
      const updatedSettings = {
        ...settings,
        background: backgroundToSave
      };
      
      await updateUserData(auth.currentUser, {
        timerSettings: updatedSettings
      });
      
      // Apply the background immediately
      setCurrentBackground(backgroundToSave);
      setShowSettings(false);
      
      // Update timer if not active
      if (!isActive) {
        setTimeLeft(mode === 'focus' ? settings.focusTime : settings.breakTime);
      }
    } catch (error) {
      console.error('Failed to save timer settings:', error);
    }
  };

  const handleTimeChange = (type, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;
    
    let clampedValue = numValue;
    if (type === 'focus') {
      clampedValue = Math.min(Math.max(numValue, 1), 180);
    } else {
      clampedValue = Math.min(Math.max(numValue, 1), 120);
    }
    
    setSettings(prev => ({
      ...prev,
      [`${type}Time`]: clampedValue * 60
    }));
  };

  const purchaseItem = async (item) => {
    if (user.elixirs < item.cost) {
      alert('Not enough elixirs!');
      return;
    }

    try {
      const updatedUser = {
        ...user,
        elixirs: user.elixirs - item.cost,
        unlockedBackgrounds: [
          ...(user.unlockedBackgrounds || []),
          item.id
        ]
      };

      await updateUserData(auth.currentUser, {
        elixirs: updatedUser.elixirs,
        unlockedBackgrounds: updatedUser.unlockedBackgrounds
      });

      onUpdateUser(updatedUser);
      alert(`${item.name} unlocked!`);
      
      // When a background is purchased, automatically select and apply it
      setSettings(prev => ({
        ...prev,
        background: item.id
      }));
      
      // Apply the background immediately
      setCurrentBackground(item.id);
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const handleModeChange = (newMode) => {
    const wasActive = isActive;
    setIsActive(false);
    setMode(newMode);
    
    if (wasActive && newMode === 'break' && settings.autoStartBreak) {
      setIsActive(true);
    }
  };

  const backgrounds = [
    { id: 'default', name: 'Default', cost: 0, unlocked: true },
    { id: 'forest', name: 'Forest', cost: 200, unlocked: user?.unlockedBackgrounds?.includes('forest') || false },
    { id: 'city', name: 'City', cost: 300, unlocked: user?.unlockedBackgrounds?.includes('city') || false },
    { id: 'space', name: 'Space', cost: 500, unlocked: user?.unlockedBackgrounds?.includes('space') || false },
    { id: 'rainy-paris', name: 'Rainy Paris', cost: 400, unlocked: user?.unlockedBackgrounds?.includes('rainy-paris') || false },
  ];

  // Main timer component (when settings not shown)
  const renderTimer = () => (
    <div className="flex flex-col items-center justify-center h-full relative z-10 py-8">
      {/* Mode selection */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => handleModeChange('focus')}
          className={`px-6 py-3 rounded-full ${pixelFont.className} text-sm transform active:scale-95 transition-transform
            ${mode === 'focus' 
              ? 'bg-white text-black border-2 border-white' 
              : 'bg-transparent text-white border border-white hover:bg-white hover:bg-opacity-20'
            }`}
        >
          pomodoro
        </button>
        <button
          onClick={() => handleModeChange('break')}
          className={`px-6 py-3 rounded-full ${pixelFont.className} text-sm transform active:scale-95 transition-transform
            ${mode === 'break' 
              ? 'bg-white text-black border-2 border-white' 
              : 'bg-transparent text-white border border-white hover:bg-white hover:bg-opacity-20'
            }`}
        >
          {mode === 'break' ? 'short break' : 'break'}
        </button>
      </div>

      {/* Timer display */}
      <div className="flex items-center justify-center my-4 md:my-8">
        <div className={`text-6xl md:text-8xl ${pixelFont.className} text-white`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-12 md:px-16 py-4 rounded-full ${pixelFont.className} text-xl transform active:scale-95 transition-transform shadow-lg
            ${isActive 
              ? 'bg-red-500 hover:bg-red-600 text-white active:bg-red-700' 
              : 'bg-white hover:bg-gray-100 text-black active:bg-gray-200'}`}
        >
          {isActive ? 'pause' : 'start'}
        </button>
      </div>

      {/* Settings button */}
      <button 
        onClick={() => setShowSettings(true)}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transform active:scale-95 transition-transform rounded-full p-2 hover:bg-white hover:bg-opacity-10"
        aria-label="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );

  // Settings component with fixed height and improved responsiveness
  const renderSettings = () => (
    <div className={`bg-black bg-opacity-90 rounded-lg text-white p-4 max-w-sm md:max-w-2xl w-full mx-auto ${pixelFont.className} max-h-full`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl text-white">Settings</h2>
        <button 
          onClick={() => setShowSettings(false)} 
          className="text-gray-400 hover:text-white transform active:scale-95 transition-transform rounded-full p-1 hover:bg-white hover:bg-opacity-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Settings tabs */}
      <div className="flex mb-4 border-b border-gray-700 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('general')}
          className={`py-2 px-4 mr-2 text-xs transform active:scale-95 transition-transform ${activeTab === 'general' ? 'border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
        >
          General
        </button>
        <button 
          onClick={() => setActiveTab('timers')}
          className={`py-2 px-4 mr-2 text-xs transform active:scale-95 transition-transform ${activeTab === 'timers' ? 'border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
        >
          Timers
        </button>
        <button 
          onClick={() => setActiveTab('backgrounds')}
          className={`py-2 px-4 text-xs transform active:scale-95 transition-transform ${activeTab === 'backgrounds' ? 'border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
        >
          Backgrounds
        </button>
      </div>
      
      {/* Content container with fixed height */}
      <div className="h-64 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {/* General settings */}
        {activeTab === 'general' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs">Auto-start breaks</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoStartBreak}
                  onChange={() => setSettings(prev => ({...prev, autoStartBreak: !prev.autoStartBreak}))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        )}
        
        {/* Timer settings */}
        {activeTab === 'timers' && (
          <div className="mb-4">
            <div className="mb-4">
              <label className="block text-xs mb-2">Focus time (minutes)</label>
              <input
                type="number"
                min="1"
                max="180"
                value={settings.focusTime / 60}
                onChange={(e) => handleTimeChange('focus', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded text-xs border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs mb-2">Break time (minutes)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={settings.breakTime / 60}
                onChange={(e) => handleTimeChange('break', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded text-xs border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        )}
        
        {/* Background settings - switched to 2 columns for smaller screens, 3 for larger */}
        {activeTab === 'backgrounds' && (
          <div className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {backgrounds.map(bg => (
                <div key={bg.id} className="flex flex-col">
                  <div className="relative aspect-video mb-1 overflow-hidden rounded-lg h-16">
                    {/* Using the main background image but with specific sizing for thumbnail */}
                    <div 
                      className="w-full h-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url('/timer-bgs/${bg.id}.jpg')`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover'
                      }}
                    ></div>
                    {!bg.unlocked && (
                      <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                        <span className="text-xs">LOCKED</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs mb-1">{bg.name}</span>
                    {bg.unlocked ? (
                      <button
                        onClick={() => setSettings(prev => ({...prev, background: bg.id}))}
                        className={`px-2 py-1 text-xs rounded w-full transform active:scale-95 transition-transform ${
                          settings.background === bg.id ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                      >
                        {settings.background === bg.id ? 'SELECTED' : 'SELECT'}
                      </button>
                    ) : (
                      <button
                        onClick={() => purchaseItem(bg)}
                        className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded w-full transform active:scale-95 transition-transform"
                      >
                        {bg.cost}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-between pt-4 border-t border-gray-700">
        <button
          onClick={() => setShowSettings(false)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white rounded-lg text-xs transform active:scale-95 transition-transform"
        >
          Close
        </button>
        <button
          onClick={saveSettings}
          className="px-4 py-2 bg-white hover:bg-gray-100 active:bg-gray-200 text-black rounded-lg text-xs transform active:scale-95 transition-transform"
        >
          Save changes
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-0 md:p-2">
      <div 
        className="relative w-full h-full flex flex-col"
        style={{
          backgroundImage: `url('/timer-bgs/${currentBackground}.jpg'), url('/timer-bgs/default.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Mobile app-like status bar for phones */}
        <div className="relative z-20 h-6 md:hidden bg-black bg-opacity-30 flex items-center px-4">
          <div className="text-white text-xs">12:30</div>
          <div className="ml-auto flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </div>
        </div>
        
        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-8 md:top-4 left-4 text-white hover:text-gray-300 z-20 transform active:scale-95 transition-transform p-2 rounded-full hover:bg-white hover:bg-opacity-10"
          aria-label="Close timer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Content container */}
        <div className="relative z-10 flex-1 flex items-center justify-center pt-6 md:pt-0">
          {showSettings ? renderSettings() : renderTimer()}
        </div>
        
        {/* Mobile app-like navigation bar for phones */}
        <div className="relative z-20 h-16 md:hidden bg-black bg-opacity-40 flex items-center justify-around px-4">
          <button className="text-white flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="text-white flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1">Timer</span>
          </button>
          <button className="text-white flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimerModal;