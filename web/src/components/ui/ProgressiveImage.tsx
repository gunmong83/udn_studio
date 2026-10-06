"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * Request a tiny, low-quality Next image first, then fetch the full image.
 * This keeps image-heavy pages visually responsive without changing layout.
 */
export default function ProgressiveImage({ className, src, sizes, onLoad, ...props }: ImageProps) {
  return (
    <ProgressiveImageLayer
      key={typeof src === "string" ? src : String(src)}
      className={className}
      src={src}
      sizes={sizes}
      onLoad={onLoad}
      {...props}
    />
  );
}

function ProgressiveImageLayer({ className, src, sizes, onLoad, ...props }: ImageProps) {
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);
  const externallyHidden = className?.split(/\s+/).includes("opacity-0") ?? false;

  const previewClassName = [
    className,
    "scale-[1.02] blur-sm transition-opacity duration-300",
    !externallyHidden && previewLoaded ? "opacity-100" : "opacity-0",
  ].filter(Boolean).join(" ");
  const fullClassName = [
    className,
    "transition-opacity duration-300",
    !externallyHidden && fullLoaded ? "opacity-100" : "opacity-0",
  ].filter(Boolean).join(" ");

  return (
    <>
      <Image
        {...props}
        src={src}
        sizes={props.fill ? "32px" : "32px"}
        quality={20}
        alt=""
        aria-hidden="true"
        className={previewClassName}
        onLoad={() => setPreviewLoaded(true)}
      />
      {previewLoaded && (
        <Image
          {...props}
          src={src}
          sizes={sizes}
          alt={props.alt}
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
