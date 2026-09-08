import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  title?: string;
};

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
};

/** Znak Kursu na LDEK. Kolor przez `currentColor`. */
export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <svg
      viewBox="370 170 680 1040"
      fill="currentColor"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d="M961.34,816.73c11.17-82.68,80.36-140.74,77.45-270.57-2.55-111.16-52.54-223.82-170.21-223.82-79.39,0-98.84,42.58-159.92,42.58s-80.53-42.58-159.92-42.58c-117.66,0-167.66,112.66-170.21,223.82-2.91,129.83,66.27,187.89,77.46,270.57,10.82,79.71-46.92,207.75,47.35,375.99,18.43,32.89,39.94,45.77,59.77,45.77,29.61,0,55.45-28.73,61.68-62.55,9.86-53.2,34.68-238.61,83.87-239.7,49.19,1.09,74.02,186.5,83.87,239.7,6.22,33.83,32.07,62.55,61.68,62.55,19.83,0,41.35-12.89,59.78-45.77,94.26-168.24,36.52-296.28,47.35-375.99ZM681.76,813.52l-31.19,40.91c-49.17,64.52-75.54,145.78-74.26,228.82v.47c.15,9.9.31,20.14-.13,30.38l-.55,58.62c-.08,8.66-6.95,15.45-15.64,15.45-6.03,0-11.4-3.4-14.02-8.87l-4.89-10.22c-6.49-13.6-10.99-27.85-13.38-42.36-7.18-43.68-7.15-86.23.06-126.46,11.89-66.17,39.35-128.92,79.4-181.48l31.17-40.89c27.45-36,42.61-81.38,42.68-127.79l-.82-12.28-59.99,31.29,88.44-209.36,88.45,209.39-59.93-31.31-.82,12.26c-.08,59.28-19.47,117.31-54.6,163.41ZM889.61,1126.73c-2.39,14.51-6.89,28.76-13.38,42.35l-4.89,10.23c-2.62,5.47-7.99,8.87-14.02,8.87-8.69,0-15.56-6.79-15.64-15.45l-.55-58.81c-.43-10.04-.28-20.27-.13-30.17v-.49c1.29-83.04-25.08-164.31-74.25-228.83l-31.19-40.91c-2.26-2.96-4.56-6.14-6.85-9.45l-.87-1.25,26.58-66.34,2.79,5.81c6.06,12.64,13.39,24.62,21.77,35.61l31.17,40.89c40.05,52.55,67.51,115.31,79.4,181.48,7.22,40.23,7.24,82.78.07,126.45Z" />
      <circle cx="708.66" cy="239.72" r="60.88" />
    </svg>
  );
}

/** Znak + wordmark: „Kurs na” białe, „LDEK” złote, DM Serif Display. */
export function BrandLogo({
  className,
  markClassName,
  wordmarkClassName,
  showWordmark = true,
}: BrandLogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className={cn("size-8 text-brand-gold", markClassName)} />
      {showWordmark ? (
        <span
          className={cn(
            "font-heading text-[1.05rem] leading-none tracking-[-0.02em] text-white",
            wordmarkClassName,
          )}
        >
          Kurs na <span className="text-brand-gold">LDEK</span>
        </span>
      ) : null}
    </span>
  );
}
