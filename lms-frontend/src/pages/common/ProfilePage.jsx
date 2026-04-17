import { useState, useEffect, useRef } from "react";
import { getProfile, updateProfile, uploadProfileImage } from "../../services/profileService";

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    role: "",
    profileImageUrl: "",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setProfile({
        fullName: data.fullName || "",
        email: data.email || "",
        role: data.role || "",
        profileImageUrl: data.profileImageUrl || "",
      });
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const updated = await updateProfile({
        fullName: profile.fullName,
        email: profile.email,
      });
      setProfile({ ...profile, ...updated });
      setEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const updated = await uploadProfileImage(file);
      setProfile({ ...profile, profileImageUrl: updated.profileImageUrl });
    } catch (error) {
      console.error("Failed to upload image", error);
    }
  };

  if (loading) {
    return <div className="p-4 text-white">Loading profile...</div>;
  }

  const avatarUrl = profile.profileImageUrl
    ? `http://localhost:8080${profile.profileImageUrl}`
    : "https://ui-avatars.com/api/?name=" + (profile.fullName || "User") + "&background=0D8ABC&color=fff";

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="glass rounded-2xl p-8 text-white relative">
        <h2 className="mb-6 text-3xl font-bold">User Profile</h2>
        
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative">
            <img
              src={avatarUrl}
              alt="Profile"
              className="h-32 w-32 rounded-full border-4 border-sky-500/50 object-cover shadow-lg"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-0 right-0 rounded-full bg-sky-500 p-2 text-white shadow hover:bg-sky-400 transition"
              title="Upload new photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Role</label>
              <div className="mt-1 text-lg font-semibold text-sky-400">
                {profile.role}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Name</label>
              {editing ? (
                <input
                  type="text"
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border-white/20 bg-black/20 p-2 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              ) : (
                <div className="mt-1 text-lg">{profile.fullName || <span className="text-gray-500 italic">Not provided</span>}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border-white/20 bg-black/20 p-2 text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              ) : (
                <div className="mt-1 text-lg">{profile.email || <span className="text-gray-500 italic">Not provided</span>}</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          {editing ? (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  fetchProfile(); // Reset fields
                }}
                className="rounded-lg bg-gray-500/20 px-4 py-2 hover:bg-gray-500/40 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-sky-500 px-6 py-2 shadow-lg shadow-sky-500/30 hover:bg-sky-400 transition"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg bg-sky-500 px-6 py-2 shadow-lg shadow-sky-500/30 hover:bg-sky-400 transition"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
