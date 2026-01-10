import type { FeedItem } from "@/lib/types";

const COLORS = [
  "text-blue-400",
  "text-green-400",
  "text-purple-400",
  "text-amber-400",
  "text-teal-400"
];

export default function FeedItem({
  item,
  index
}: {
  item: FeedItem;
  index: number;
}) {
  const colorClass = COLORS[index % COLORS.length];
  const timestamp = item.timestamp
    ? new Date(item.timestamp).toLocaleString()
    : null;

  return (
    <div className="py-3 border-b border-white/10">
      <p className={`${colorClass} text-sm md:text-base`}>{item.message}</p>
      {timestamp ? (
        <p className="text-white/50 text-xs mt-1">{timestamp}</p>
      ) : null}
    </div>
  );
}
