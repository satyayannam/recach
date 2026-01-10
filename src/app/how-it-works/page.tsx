export default function HowItWorksPage() {
  return (
    <section className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">How it Works</h1>
      <p className="text-white/70 text-sm">
        recach^ tracks two scores: Achievement score (green) summarizes verified
        education and work, and Recommendation score (purple) reflects approved
        recommendations.
      </p>
      <p className="text-white/70 text-sm">
        Recommendation Request lets you ask another user to vouch for you. They
        can approve or reject, and approved recommendations appear in the feed.
      </p>
      <p className="text-white/70 text-sm">
        Verification is triggered when you add education or work. Admins review
        verification requests, and approved items update your Achievement score.
      </p>
      <p className="text-white/70 text-sm">
        Leaderboards rank users by total Achievement or Recommendation points.
        Higher verified experience and trusted recommendations move you up.
      </p>
    </section>
  );
}
