import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth } from '../utils/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/router';
import TimerModal from './TimerModal';

const AVATARS = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
  '/avatars/avatar4.png',
  '/avatars/avatar5.png',
  '/avatars/avatar6.png',
];

export default function Navbar({ user, onUpdateUser, onOpenChallenge, onOpenInsights }) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  
  // Format the name to include "Hunter" prefix and limit character length
  const formatDisplayName = (name) => {
    if (!name) return 'Hunter Adventurer';
    
    // Extract the name without "Hunter" prefix if it exists
    const nameWithoutPrefix = name.startsWith('Hunter ') ? name.substring(7) : name;
    
    // Limit to 10 characters
    const limitedName = nameWithoutPrefix.length > 10 ? 
      nameWithoutPrefix.substring(0, 10) : 
      nameWithoutPrefix;
      
    return `Hunter ${limitedName}`;
  };
  
  const [tempName, setTempName] = useState(
    user?.name ? formatDisplayName(user.name).substring(7) : 'Adventurer'
  );
  
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || AVATARS[0]);

  const progressPercentage = user?.elixirs && user?.nextRankElixirs 
    ? ((user.elixirs / user.nextRankElixirs) * 100).toFixed(2)
    : '0';

  const handleSaveName = () => {
    const trimmedName = tempName.trim();
    if (trimmedName && onUpdateUser) {
      // Save with Hunter prefix
      onUpdateUser({ ...user, name: `Hunter ${trimmedName}` });
      setIsSettingsOpen(false);
    }
  };

  const handleSaveAvatar = () => {
    if (selectedAvatar && onUpdateUser) {
      onUpdateUser({ ...user, avatar: selectedAvatar });
      setIsAvatarModalOpen(false);
      setIsSettingsOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Make sure displayed name always has the Hunter prefix
  useEffect(() => {
    if (user?.name && !user.name.startsWith('Hunter ') && onUpdateUser) {
      onUpdateUser({ ...user, name: `Hunter ${user.name}` });
    }
  }, [user]);

  const displayName = user?.name ? formatDisplayName(user.name) : 'Hunter Adventurer';

  return (
    <>
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between border-b border-yellow-600 shadow-md">
        {/* User Info */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={user?.avatar || '/avatars/default.png'}
              alt="User Avatar"
              className="w-12 h-12 rounded-full border-2 border-yellow-500 cursor-pointer hover:border-yellow-300 transition-all avatar-pulse"
              onClick={() => setIsAvatarModalOpen(true)}
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
          </div>
          <div>
            <h2 className="text-lg font-bold">{displayName}</h2>
            <p className="text-sm text-gray-300">RANK: {user?.rank || 'E'}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>ELIXIRS: {user?.elixirs || 0}</span>
            <span>NEXT RANK: {user?.nextRankElixirs || 10000}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              style={{ width: `${progressPercentage}%` }}
              className="bg-yellow-500 h-full progress-bar-glow transition-all duration-300"
            ></div>
          </div>
        </div>

        {/* Right Side Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenInsights}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition anime-button"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
          >
            INSIGHTS
          </button>

          <button
            onClick={onOpenChallenge}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition anime-button"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
          >
            CHALLENGE
          </button>

          <button
            onClick={() => setIsTimerOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition anime-button"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
          >
            TIMER
          </button>

          <Link href="/shop" legacyBehavior>
            <a className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition anime-button flex items-center" style={{ fontFamily: "'Press Start 2P', sans-serif" }}>
              <span>SHOP</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </a>
          </Link>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-700 transition anime-button"
            aria-label="Settings"
          >
            {/* Settings gear icon changed to wheel */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Timer Modal */}
      {isTimerOpen && (
        <TimerModal 
          user={user}
          onClose={() => setIsTimerOpen(false)}
          onUpdateUser={onUpdateUser}
        />
      )}

      {/* Settings Modal - Made Larger */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border-2 border-yellow-500">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ fontFamily: "'Press Start 2P', sans-serif" }}>USER SETTINGS</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "'Press Start 2P', sans-serif" }}>CHANGE NAME</label>
                <div className="flex space-x-2 items-center">
                  <div className="text-gray-300 text-sm">Hunter</div>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value.substring(0, 10))}
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm border border-gray-600 focus:ring-1 focus:ring-yellow-500"
                    maxLength={10}
                    placeholder="Name (max 10 chars)"
                  />
                  <button 
                    onClick={handleSaveName}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm transition anime-button"
                    style={{ fontFamily: "'Press Start 2P', sans-serif" }}
                  >
                    SAVE
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Name will be displayed as: Hunter {tempName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "'Press Start 2P', sans-serif" }}>AVATAR</label>
                <div className="flex items-center space-x-3">
                  <img 
                    src={user?.avatar || '/avatars/default.png'} 
                    alt="Current Avatar" 
                    className="w-12 h-12 rounded-full border border-yellow-500"
                  />
                  <button 
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition anime-button flex-1 text-center"
                    style={{ fontFamily: "'Press Start 2P', sans-serif" }}
                  >
                    CHANGE
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <button 
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded text-sm transition anime-button flex items-center justify-center space-x-2"
                  style={{ fontFamily: "'Press Start 2P', sans-serif" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>LOGOUT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Selection Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border-2 border-yellow-500">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold" style={{ fontFamily: "'Press Start 2P', sans-serif" }}>SELECT AVATAR</h2>
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {AVATARS.map((avatar) => (
                <div 
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`p-1 rounded-full cursor-pointer transition-all anime-button ${
                    selectedAvatar === avatar 
                      ? 'ring-3 ring-yellow-500 transform scale-110' 
                      : 'hover:ring-2 hover:ring-gray-500'
                  }`}
                >
                  <img 
                    src={avatar} 
                    alt="Avatar option" 
                    className="w-full h-auto rounded-full aspect-square object-cover"
                  />
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition anime-button"
                style={{ fontFamily: "'Press Start 2P', sans-serif" }}
              >
                CANCEL
              </button>
              <button 
                onClick={handleSaveAvatar}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm transition anime-button"
                style={{ fontFamily: "'Press Start 2P', sans-serif" }}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}