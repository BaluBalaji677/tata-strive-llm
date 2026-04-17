function ProfileCard({ profile, stats = [] }) {
  if (!profile) return null;

  return (
    <div className="glass flex flex-col items-center justify-between gap-6 rounded-2xl p-6 transition hover:bg-white/5 sm:flex-row shadow-lg">
      <div className="flex items-center gap-5">
        <img
          src={
            profile.profileImageUrl
              ? `http://localhost:8080${profile.profileImageUrl}`
              : `https://ui-avatars.com/api/?name=${profile.fullName || "User"}&background=0D8ABC&color=fff`
          }
          alt="Profile"
          className="h-20 w-20 rounded-full border-4 border-sky-500/50 object-cover shadow-lg transition-transform hover:scale-105"
        />
        <div>
          <h2 className="text-2xl font-bold text-white">{profile.fullName || "User Name"}</h2>
          <span className="mt-2 inline-block rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-400 border border-sky-500/30 shadow-inner">
            {profile.role || "USER"}
          </span>
        </div>
      </div>

      <div className="flex w-full flex-wrap justify-around gap-4 sm:w-auto sm:justify-end sm:gap-8 bg-black/20 p-4 rounded-xl border border-white/5">
        {stats.map((stat, idx) => (
          <div key={idx} className="text-center">
            <p className="text-xs tracking-wider text-slate-400 uppercase">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProfileCard;
