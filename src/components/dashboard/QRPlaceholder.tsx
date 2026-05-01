// Lightweight, dependency-free QR-ish visual.
// We render a deterministic 25x25 grid derived from the input string.
// It's not a scannable QR (we'd need react-qr-code for that) — but it
// reads as a credible "QR" placeholder and stays installable-free.

interface Props {
  value: string;
  size?: number;
  className?: string;
}

export const QRPlaceholder = ({ value, size = 220, className }: Props) => {
  const N = 25;
  // Hash-ish deterministic bits
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed = (seed * 131 + value.charCodeAt(i)) >>> 0;
  const rand = (i: number) => {
    let x = (seed + i * 2654435761) >>> 0;
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    return (x % 1000) / 1000;
  };

  const cells: boolean[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const inFinder =
        (x < 7 && y < 7) ||
        (x >= N - 7 && y < 7) ||
        (x < 7 && y >= N - 7);
      if (inFinder) {
        const lx = x >= N - 7 ? x - (N - 7) : x;
        const ly = y >= N - 7 ? y - (N - 7) : y;
        const onEdge = lx === 0 || lx === 6 || ly === 0 || ly === 6;
        const inCore = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
        cells.push(onEdge || inCore);
      } else {
        cells.push(rand(y * N + x) > 0.52);
      }
    }
  }

  const cell = size / N;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <rect width={size} height={size} fill="hsl(var(--background))" />
      {cells.map((on, i) => {
        if (!on) return null;
        const x = (i % N) * cell;
        const y = Math.floor(i / N) * cell;
        return <rect key={i} x={x} y={y} width={cell} height={cell} fill="hsl(var(--foreground))" />;
      })}
    </svg>
  );
};
