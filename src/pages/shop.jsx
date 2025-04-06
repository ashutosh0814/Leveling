
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { auth, ensureUserDocument } from "../utils/firebase";

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentWallpaper, setCurrentWallpaper] = useState("");
  const [wallpapers, setWallpapers] = useState([
    { id: 1, name: "E Rank Wallpaper", cost: 0, rank: "E", unlocked: true },
    { id: 2, name: "D Rank Wallpaper", cost: 500, rank: "D", unlocked: false },
    { id: 3, name: "C Rank Wallpaper", cost: 1000, rank: "C", unlocked: false },
    { id: 4, name: "B Rank Wallpaper", cost: 2000, rank: "B", unlocked: false },
    { id: 5, name: "A Rank Wallpaper", cost: 5000, rank: "A", unlocked: false },
    { id: 6, name: "S Rank Wallpaper", cost: 10000, rank: "S", unlocked: false },
  ]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const userData = await ensureUserDocument(auth.currentUser);
          
          setUser(userData.user);
          setCurrentWallpaper(userData.currentWallpaper || "E Rank Wallpaper");
          
          // Update unlocked status
          setWallpapers(prev => prev.map(wp => ({
            ...wp,
            unlocked: wp.rank === userData.user.rank || 
                      (wp.rank === "E" && userData.user.rank) ||
                      wp.cost === 0
          })));
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      }
    };
    fetchUserData();
  }, []);

  const handlePurchase = async (wallpaper) => {
    if (!user || !user.rank || !user.elixirs) {
      alert("User data is missing.");
      return;
    }

    if (user.elixirs < wallpaper.cost) {
      alert("Not enough elixirs to purchase this wallpaper.");
      return;
    }

    if (!wallpaper.unlocked && user.rank !== wallpaper.rank) {
      alert(`You need to reach rank ${wallpaper.rank} to unlock this wallpaper.`);
      return;
    }

    try {
      const updatedUser = {
        ...user,
        elixirs: user.elixirs - wallpaper.cost
      };
      
      setUser(updatedUser);
      setCurrentWallpaper(wallpaper.name);
      setWallpapers(prev => prev.map(wp => 
        wp.id === wallpaper.id ? { ...wp, unlocked: true } : wp
      ));

      // Update in Firestore
      await ensureUserDocument({
        ...auth.currentUser,
        ...updatedUser
      });
      
      alert(`${wallpaper.name} has been applied!`);
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("Failed to complete purchase. Please try again.");
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-8">
      <h1
        className="text-2xl font-bold text-yellow-500 mb-6"
        style={{ fontFamily: "'Press Start 2P', sans-serif" }}
      >
        Shop
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {wallpapers.map((wallpaper) => (
          <div
            key={wallpaper.id}
            className={`p-4 rounded-lg shadow-md ${
              wallpaper.unlocked ? "bg-gray-800" : "bg-gray-700"
            }`}
          >
            <h3
              className="text-lg font-bold mb-2"
              style={{ fontFamily: "'Press Start 2P', sans-serif" }}
            >
              {wallpaper.name}
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Cost: {wallpaper.cost} Elixirs
            </p>
            <button
              onClick={() => handlePurchase(wallpaper)}
              disabled={!wallpaper.unlocked && user?.rank !== wallpaper.rank}
              className={`px-4 py-2 rounded-lg transition ${
                wallpaper.unlocked
                  ? currentWallpaper === wallpaper.name
                    ? "bg-green-500 text-white cursor-default"
                    : "bg-yellow-500 hover:bg-yellow-600 text-white"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
              style={{ fontFamily: "'Press Start 2P', sans-serif" }}
            >
              {currentWallpaper === wallpaper.name
                ? "Current"
                : wallpaper.unlocked
                ? "Apply"
                : `Unlock at ${wallpaper.rank}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}