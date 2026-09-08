/** The brief's logo: a #323416 triangle with a #FFFFFD "T" on black. */
export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Tri Case logo" className="logo">
      <rect width="100" height="100" fill="#000" />
      <polygon points="50,3 98,97 2,97" fill="#323416" />
      <rect x="29" y="48" width="42" height="9" fill="#FFFFFD" />
      <rect x="45.5" y="48" width="9" height="46" fill="#FFFFFD" />
    </svg>
  );
}
