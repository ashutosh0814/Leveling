import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { auth, updateUserData, unlockTimerItem , ensureUserDocument } from "../utils/firebase";

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentTimerWallpaper, setCurrentTimerWallpaper] = useState("shadow");
  const [wallpapers] = useState([
    { id: 1, name: "Shadow", cost: 0, type: "timer" },
    { id: 2, name: "WOW", cost: 2000, type: "timer" },
    { id: 3, name: "Space", cost: 2000, type: "timer" },
    { id: 4, name: "Rainy Paris", cost: 2000, type: "timer" },
    { id: 5, name: "Forest", cost: 20, type: "timer" },
    { id: 6, name: "City", cost: 2000, type: "timer" },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const userData = await ensureUserDocument(auth.currentUser);
          setUser(userData.user);
          setCurrentTimerWallpaper(
            userData.timerSettings?.background?.toLowerCase().replace(/\s+/g, "-") || "shadow"
          );
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    wallpapers.forEach((wallpaper) => {
      new Image().src = `/images/timer-bgs/${wallpaper.name.toLowerCase().replace(/\s+/g, "-")}.jpg`;
    });
  }, [wallpapers]);

  const handlePurchase = async (wallpaper) => {
    if (loading || !auth.currentUser) return;
    setLoading(true);

    try {
      const wallpaperKey = wallpaper.name.toLowerCase().replace(/\s+/g, "-");
      const isUnlocked = wallpaper.cost === 0 || user.unlockedBackgrounds?.some((bg) => bg.toLowerCase() === wallpaper.name.toLowerCase());
      if (!isUnlocked && user.elixirs < wallpaper.cost) {
        alert("Not enough elixirs!");
        return;
      }

      const updatedUser = await unlockTimerItem(auth.currentUser, "background", wallpaper.name, wallpaper.cost);
      const updates = {
        user: { ...updatedUser },
        timerSettings: { background: wallpaperKey },
      };

      await updateUserData(auth.currentUser, updates);
      setUser((prev) => ({ ...prev, ...updatedUser }));
      setCurrentTimerWallpaper(wallpaperKey);
      alert(`${wallpaper.name} has been ${isUnlocked ? "applied" : "purchased and applied"}!`);
    } catch (error) {
      console.error("Failed to process wallpaper:", error);
      alert(`Failed to ${isUnlocked ? "apply" : "purchase"} wallpaper. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-white">Loading...</div>;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black text-white min-h-screen p-6">
      <h1 className="text-4xl font-bold text-yellow-500 mb-8" style={{ fontFamily: "'Press Start 2P', sans-serif" }}>
        SHOP
      </h1>

      <div className="mb-8 p-4 bg-gray-800 rounded-lg border-2 border-yellow-500 shadow-lg">
        <div className="flex justify-between items-center">
          <span className="text-yellow-300 text-2xl font-bold" style={{ fontFamily: "'Press Start 2P', sans-serif" }}>
            YOUR ELIXIRS
          </span>
          <span className="text-white text-3xl font-bold" style={{ fontFamily: "'Press Start 2P', sans-serif" }}>
            {user.elixirs}
          </span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-yellow-400 mb-6" style={{ fontFamily: "'Press Start 2P', sans-serif" }}>
        TIMER WALLPAPERS
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallpapers.map((wallpaper) => {
          const wallpaperKey = wallpaper.name.toLowerCase().replace(/\s+/g, "-");
          const isUnlocked = wallpaper.cost === 0 || user.unlockedBackgrounds?.some((bg) => bg.toLowerCase() === wallpaper.name.toLowerCase());
          const isCurrent = currentTimerWallpaper === wallpaperKey;

          return (
            <div
              key={wallpaper.id}
              className={`p-4 rounded-lg bg-gray-800 border-2 ${isCurrent ? "border-yellow-400" : "border-gray-700"} hover:bg-gray-700 transition-all shadow-md`}
            >
              <h3 className="text-lg font-bold mb-2 text-center" style={{ fontFamily: "'Press Start 2P', sans-serif" }}>
                {wallpaper.name}
              </h3>
              <div className="mb-4 h-40 bg-black rounded-lg overflow-hidden">
                <img
                  src={`/images/timer-bgs/${wallpaperKey}.jpg`}
                  alt={wallpaper.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-yellow-300">{wallpaper.cost} Elixirs</span>
                <button
                  onClick={() => handlePurchase(wallpaper)}
                  disabled={(!isUnlocked && user.elixirs < wallpaper.cost) || loading}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${loading ? "bg-gray-600 cursor-not-allowed" : ""} ${
                    isCurrent
                      ? "bg-green-600 text-white cursor-default"
                      : isUnlocked
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                      : user.elixirs >= wallpaper.cost
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                  style={{ fontFamily: "'Press Start 2P', sans-serif" }}
                >
                  {loading
                    ? "Processing..."
                    : isCurrent
                    ? "Current"
                    : isUnlocked
                    ? "Apply"
                    : "Purchase"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}