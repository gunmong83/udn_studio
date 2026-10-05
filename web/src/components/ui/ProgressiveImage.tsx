"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

/**
 * Request a tiny, low-quality Next image first, then fetch the full image.
 * This keeps image-heavy pages visually responsive without changing layout.
 */
export default function ProgressiveImage({ className, src, sizes, onLoad, ...props }: ImageProps) {
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);

  useEffect(() => {
    setPreviewLoaded(false);
    setFullLoaded(false);
  }, [src]);

  const previewClassName = [
    className,
    "scale-[1.02] blur-sm transition-opacity duration-300",
    previewLoaded ? "opacity-100" : "opacity-0",
  ].filter(Boolean).join(" ");
  const fullClassName = [
    className,
    "transition-opacity duration-300",
    fullLoaded ? "opacity-100" : "opacity-0",
  ].filter(Boolean).join(" ");

  return (
    <>
      <Image
        {...props}
        src={src}
        sizes={props.fill ? "32px" : "32px"}
        quality={20}
        aria-hidden="true"
        className={previewClassName}
        onLoad={() => setPreviewLoaded(true)}
      />
      {previewLoaded && (
        <Image
          {...props}
          src={src}
          sizes={sizes}
          className={fullClassName}
          onLoad={(event) => {
            setFullLoaded(true);
            onLoad?.(event);
          }}
        />
      )}
    </>
  );
}
