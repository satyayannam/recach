export default function AboutPage() {
  return (
    <section className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">About</h1>
        <p className="text-white/70 text-sm">
          recach^ is a minimal network for approvals and recommendations.
          Send recommendations to help your people stand out and move up the rankings.
        </p>
      </div>

      <div className="border border-white/10 p-4 space-y-3">
        <h2 className="text-lg font-semibold">Contact Us</h2>
        <p className="text-white/60 text-sm">
          Want to talk? Share ideas, join the team, or help make this a better place.
        </p>
        <form
          className="space-y-3"
          action="mailto:info.recach@gmail.com"
          method="post"
          encType="text/plain"
        >
          <div className="space-y-2">
            <label className="text-sm text-white/70">Reason</label>
            <select
              name="reason"
              className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
              required
            >
              <option value="">Select a reason</option>
              <option value="Suggestions to the team">Suggestions to the team</option>
              <option value="Join the team">Join the team</option>
              <option value="Make this a better place">Make this a better place</option>
              <option value="Partnerships">Partnerships</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Your email</label>
            <input
              type="email"
              name="email"
              className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Description</label>
            <textarea
              name="description"
              className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
              rows={5}
              placeholder="Tell us more..."
              required
            />
          </div>
          <button
            type="submit"
            className="border border-white/20 px-4 py-2 text-sm hover:text-white/80"
          >
            Send message
          </button>
        </form>
        <div className="text-sm text-white/60">
          Email:{" "}
          <a href="mailto:info.recach@gmail.com" className="text-white/80 hover:text-white">
            info.recach@gmail.com
          </a>
          {"  "}
          | Phone:{" "}
          <a href="tel:+15613969789" className="text-white/80 hover:text-white">
            (561) 396-9789
          </a>
        </div>
      </div>
    </section>
  );
}
