/** Placeholder artwork: a phone-case silhouette in the product's colour. */
export default function CaseArt({ color, title }: { color: string; title: string }) {
  const light = color.toUpperCase() === "#FFFFFD";
  return (
    <svg viewBox="0 0 120 200" role="img" aria-label={title} className="case-art">
      <rect
        x="10"
        y="6"
        width="100"
        height="188"
        rx="22"
        fill={color}
        stroke={light ? "#8C9E6E" : "none"}
        strokeWidth="3"
      />
      <rect x="22" y="20" width="44" height="44" rx="12" fill={light ? "#8C9E6E" : "#FFFFFD"} opacity="0.85" />
      <circle cx="34" cy="32" r="6" fill={light ? "#FFFFFD" : "#323416"} />
      <circle cx="54" cy="32" r="6" fill={light ? "#FFFFFD" : "#323416"} />
      <circle cx="34" cy="52" r="6" fill={light ? "#FFFFFD" : "#323416"} />
      <polygon points="60,120 44,150 76,150" fill={light ? "#323416" : "#FFFFFD"} opacity="0.7" />
    </svg>
  );
}
