import { useEffect, useState } from "react";

export function SafeLocalImage({
  src,
  alt = "",
  className,
  decorative = true
}: {
  src: string | null;
  alt?: string;
  className?: string;
  decorative?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  useEffect(() => {
    setFailedSource(null);
  }, [src]);

  if (!src || src === failedSource) {
    return null;
  }

  return (
    <img
      src={src}
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? "true" : undefined}
      className={className}
      data-safe-local-image="candidate"
      onError={() => setFailedSource(src)}
    />
  );
}
