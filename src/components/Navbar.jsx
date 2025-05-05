import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "../utils/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/router";
import TimerModal from "./TimerModal";
import AntGameModal from "./AntGameModal";

const AVATARS = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  "/avatars/avatar5.png",
  "/avatars/avatar6.png",
];

export default function Navbar({
  user,
  onUpdateUser,
  onOpenChallenge,
  onOpenInsights,
}) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isAntGameOpen, setIsAntGameOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const formatDisplayName = (name) => {
    if (!name) return "Hunter Adventurer";
    const nameWithoutPrefix = name.startsWith("Hunter ")
      ? name.substring(7)
      : name;
    const limitedName = nameWithoutPrefix.replace(/\s+/g, "").substring(0, 10);
    return `Hunter ${limitedName}`;
  };

  const [tempName, setTempName] = useState(
    user?.name ? formatDisplayName(user.name).substring(7) : "Adventurer"
  );

  const [selectedAvatar, setSelectedAvatar] = useState(
    user?.avatar || AVATARS[0]
  );

  const progressPercentage =
    user?.elixirs && user?.nextRankElixirs
      ? ((user.elixirs / user.nextRankElixirs) * 100).toFixed(2)
      : "0";

  const handleSaveName = () => {
    let sanitizedName = tempName.replace(/\s+/g, "").trim();
    if (!sanitizedName) sanitizedName = "Adventurer";
    if (onUpdateUser) {
      onUpdateUser({ ...user, name: `Hunter ${sanitizedName}` });
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
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    if (user?.name) {
      const formattedName = formatDisplayName(user.name);
      if (formattedName !== user.name && onUpdateUser) {
        onUpdateUser({ ...user, name: formattedName });
      }
    }
  }, [user]);

  const displayName = user?.name
    ? formatDisplayName(user.name)
    : "Hunter Adventurer";

  const handleNameChange = (e) => {
    const value = e.target.value.replace(/\s+/g, "").substring(0, 10);
    setTempName(value);
  };

  return (
    <>
      <div className="bg-gray-900 text-white p-2 md:p-4 flex flex-col md:flex-row items-center justify-between border-b border-yellow-600 shadow-md">
        {/* User Info and Avatar - Always visible */}
        <div className="flex items-center space-x-2 md:space-x-4 w-full md:w-auto justify-between md:justify-start mb-2 md:mb-0">
          <div className="relative">
            <img
              src={user?.avatar || "/avatars/default.png"}
              alt="User Avatar"
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-yellow-500 cursor-pointer hover:border-yellow-300 transition-all avatar-pulse"
              onClick={() => setIsAvatarModalOpen(true)}
            />
            <div className="absolute bottom-0 right-0 w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
          </div>
          <div className="text-left">
            <h2 className="text-sm md:text-base font-bold whitespace-nowrap overflow-visible">
              {displayName}
            </h2>
            <p className="text-xs text-gray-300">RANK: {user?.rank || "E"}</p>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="md:hidden p-1 rounded-lg hover:bg-gray-700 transition"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Progress Bar - Always visible but responsive */}
        <div className="w-full md:flex-1 md:max-w-md mx-0 md:mx-4 mb-2 md:mb-0">
          <div className="flex justify-between text-xs md:text-sm text-gray-300 mb-1 md:mb-2">
            <span>ELIXIRS: {user?.elixirs || 0}</span>
            <span>NEXT RANK: {user?.nextRankElixirs || 10000}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 md:h-2.5 overflow-hidden">
            <div
              style={{ width: `${progressPercentage}%` }}
              className="bg-yellow-500 h-full progress-bar-glow transition-all duration-300"
            ></div>
          </div>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center space-x-2 w-auto justify-start">
          <button
            onClick={onOpenInsights}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition anime-button flex items-center"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
            title="Insights"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>INSIGHTS</span>
          </button>

          <button
            onClick={onOpenChallenge}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition anime-button flex items-center"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
            title="Challenge"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>CHALLENGE</span>
          </button>

          <button
            onClick={() => setIsTimerOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition anime-button flex items-center"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
            title="Timer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>TIMER</span>
          </button>

          <button
            onClick={() => setIsAntGameOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition anime-button flex items-center"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
            title="Ant Game"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>ANT GAME</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-700 transition anime-button"
            aria-label="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu - Collapsible */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800 text-white p-3 flex flex-col space-y-2 border-b border-yellow-600 animate-fadeIn">
          <button
            onClick={onOpenInsights}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition flex items-center justify-center"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            INSIGHTS
          </button>

          <button
            onClick={onOpenChallenge}
            className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm transition flex items-center justify-center"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            CHALLENGE
          </button>

          <button
            onClick={() => setIsTimerOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm transition flex items-center justify-center"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            TIMER
          </button>

          <button
            onClick={() => setIsAntGameOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm transition flex items-center justify-center"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            ANT GAME
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition flex items-center justify-center"
            style={{ fontFamily: "'Press Start 2P', sans-serif" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            SETTINGS
          </button>
        </div>
      )}

      {/* Timer Modal */}
      {isTimerOpen && (
        <TimerModal
          user={user}
          onClose={() => setIsTimerOpen(false)}
          isOpen={isTimerOpen}
        />
      )}

      {/* Ant Game Modal */}
      {isAntGameOpen && (
        <AntGameModal user={user} onClose={() => setIsAntGameOpen(false)} />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-xl border-2 border-yellow-500 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2
                className="text-sm sm:text-lg md:text-xl font-bold"
                style={{ fontFamily: "'Press Start 2P', sans-serif" }}
              >
                USER SETTINGS
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label
                  className="block text-xs sm:text-sm font-medium mb-2"
                  style={{ fontFamily: "'Press Start 2P', sans-serif" }}
                >
                  CHANGE NAME
                </label>
                <div className="flex flex-col sm:flex-row sm:space-x-2 items-center space-y-2 sm:space-y-0">
                  <div className="text-gray-300 text-xs sm:text-sm">Hunter</div>
                  <input
                    type="text"
                    value={tempName}
                    onChange={handleNameChange}
                    className="flex-1 w-full bg-gray-700 text-white px-3 py-2 rounded text-xs sm:text-sm border border-gray-600 focus:ring-1 focus:ring-yellow-500"
                    maxLength={10}
                    placeholder="Name (max 10 chars)"
                  />
                  <button
                    onClick={handleSaveName}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 sm:px-4 py-2 rounded text-xs sm:text-sm transition anime-button w-full sm:w-auto"
                    style={{ fontFamily: "'Press Start 2P', sans-serif" }}
                  >
                    SAVE
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Name will be displayed as: Hunter {tempName}
                </p>
                <p className="text-xs text-gray-400">
                  No spaces allowed. Max 10 characters.
                </p>
              </div>

              <div>
                <label
                  className="block text-xs sm:text-sm font-medium mb-2"
                  style={{ fontFamily: "'Press Start 2P', sans-serif" }}
                >
                  AVATAR
                </label>
                <div className="flex items-center space-x-3">
                  <img
                    src={user?.avatar || "/avatars/default.png"}
                    alt="Current Avatar"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-yellow-500"
                  />
                  <button
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded text-xs sm:text-sm transition anime-button flex-1 text-center"
                    style={{ fontFamily: "'Press Start 2P', sans-serif" }}
                  >
                    CHANGE
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded text-xs sm:text-sm transition anime-button flex items-center justify-center space-x-2"
                  style={{ fontFamily: "'Press Start 2P', sans-serif" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
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
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-md border-2 border-yellow-500">
            <div className="flex justify-between items-center mb-4">
              <h2
                className="text-base sm:text-lg font-bold"
                style={{ fontFamily: "'Press Start 2P', sans-serif" }}
              >
                SELECT AVATAR
              </h2>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {AVATARS.map((avatar) => (
                <div
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`p-1 rounded-full cursor-pointer transition-all anime-button ${
                    selectedAvatar === avatar
                      ? "ring-2 ring-yellow-500 transform scale-110"
                      : "hover:ring-2 hover:ring-gray-500"
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

            <div className="flex space-x-2 sm:space-x-3">
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded text-xs sm:text-sm transition anime-button"
                style={{ fontFamily: "'Press Start 2P', sans-serif" }}
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveAvatar}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 sm:px-4 py-2 rounded text-xs sm:text-sm transition anime-button"
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
