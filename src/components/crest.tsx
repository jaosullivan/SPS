import Image from "next/image";

type CrestProps = {
  size?: number;
  priority?: boolean;
  className?: string;
  alt?: string;
};

export function Crest({
  size = 160,
  priority = false,
  className,
  alt = "St. Patrick's Society Hong Kong crest",
}: CrestProps) {
  return (
    <Image
      src="/crest.webp"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
