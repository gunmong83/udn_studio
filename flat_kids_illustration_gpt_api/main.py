import argparse
import base64
import mimetypes
import os
from pathlib import Path
from typing import List, Tuple
import urllib.request
import math

from openai import OpenAI
from PIL import Image


def read_prompt_from_markdown(markdown_path: str) -> str:
    path = Path(markdown_path)
    if not path.is_file():
        raise FileNotFoundError(f"Prompt markdown not found: {path}")
    text = path.read_text(encoding="utf-8")
    return text.strip()


def list_image_files(directory: str) -> List[Path]:
    dir_path = Path(directory)
    if not dir_path.exists() or not dir_path.is_dir():
        raise FileNotFoundError(f"Directory not found: {dir_path}")
    exts = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
    return [p for p in sorted(dir_path.iterdir()) if p.suffix.lower() in exts and p.is_file()]


def encode_image_to_data_url(path: Path) -> str:
    mime, _ = mimetypes.guess_type(str(path))
    if not mime:
        # Default to png if unknown
        mime = "image/png"
    b64 = base64.b64encode(path.read_bytes()).decode("utf-8")
    return f"data:{mime};base64,{b64}"


def choose_allowed_size(orig_w: int, orig_h: int) -> Tuple[int, int]:
    """Pick an API-supported size closest to the image aspect.

    Supported sizes: 1024x1024 (square), 1024x1536 (portrait), 1536x1024 (landscape).
    """
    if orig_w <= 0 or orig_h <= 0:
        return (1024, 1024)
    aspect = orig_w / orig_h
    if 0.95 <= aspect <= 1.05:
        return (1024, 1024)
    if aspect > 1.05:
        return (1536, 1024)
    return (1024, 1536)


def prepare_padded_input(
    original_path: Path,
    allowed_w: int,
    allowed_h: int,
) -> Tuple[Path, Tuple[int, int, int, int], Tuple[int, int]]:
    """Pad original to match the aspect of (allowed_w, allowed_h) WITHOUT scaling the content.

    Steps:
    - Compute target aspect and original aspect.
    - Create a canvas whose aspect matches (allowed_w:allowed_h) but sized to the original's largest dimension,
      so content is not scaled, only padded.
    - Center original on this canvas with padding.
    - Save this padded image to a temp file and return its path, the content box, and the original size.
    """
    with Image.open(str(original_path)) as im:
        im = im.convert("RGB")
        orig_w, orig_h = im.size

        # Aspect of allowed size and original
        tgt_aspect = allowed_w / max(1, allowed_h)
        orig_aspect = orig_w / max(1, orig_h)

        # Build a canvas that matches the target aspect but uses original dimensions as much as possible.
        # We keep the original content size; we only add padding.
        if orig_aspect > tgt_aspect:
            # Original is wider than target aspect: match width, extend height with padding
            pad_w = orig_w
            pad_h = int(round(orig_w / tgt_aspect))
        else:
            # Original is taller/narrower: match height, extend width with padding
            pad_h = orig_h
            pad_w = int(round(orig_h * tgt_aspect))

        # Center the original on the padded canvas
        canvas = Image.new("RGB", (pad_w, pad_h), color=(0, 0, 0))
        left = (pad_w - orig_w) // 2
        top = (pad_h - orig_h) // 2
        canvas.paste(im, (left, top))

        tmp_dir = Path.cwd() / ".tmp_images"
        tmp_dir.mkdir(parents=True, exist_ok=True)
        temp_path = tmp_dir / f"{original_path.stem}_padded.png"
        canvas.save(str(temp_path), format="PNG")

    content_box = (left, top, left + orig_w, top + orig_h)
    return temp_path, content_box, (orig_w, orig_h)


def derive_style_description(
    api_key: str,
    sample_image_paths: List[Path],
    vision_model: str = "gpt-4o-mini",
    max_images: int = 6,
    max_tokens: int = 500,
) -> str:
    if not sample_image_paths:
        raise ValueError("No sample images provided to derive style description.")

    client = OpenAI(api_key=api_key)

    selected = sample_image_paths[:max_images]
    content_parts = [
        {"type": "text", "text": (
            "You are an art director. Analyze the reference images and produce a single, concise "
            "paragraph (<=120 words) describing the VISUAL STYLE only: color palette, lighting, "
            "contrast, texture, composition, lens/DOF, tone, and post-processing cues. "
            "Do not list items; return one paragraph with no bullet points."
        )}
    ]
    for p in selected:
        content_parts.append({
            "type": "image_url",
            "image_url": {"url": encode_image_to_data_url(p)},
        })

    chat = client.chat.completions.create(
        model=vision_model,
        messages=[
            {"role": "user", "content": content_parts},
        ],
        temperature=0.3,
        max_tokens=max_tokens,
    )

    style_text = chat.choices[0].message.content.strip()
    return style_text


def generate_image_edit(
    api_key: str,
    input_image_path: str,
    prompt_text: str,
    output_image_path: str,
    model: str = "gpt-image-1",
    size: str = "1024x1024",
) -> str:
    """Generate an edited image from a base image and a prompt.

    Returns the path to the saved output image.
    """
    client = OpenAI(api_key=api_key)

    input_path = Path(input_image_path)
    if not input_path.is_file():
        raise FileNotFoundError(f"Input image not found: {input_path}")

    with input_path.open("rb") as image_file:
        result = client.images.edit(
            model=model,
            image=image_file,
            prompt=prompt_text,
            size=size,
        )
    if not result.data:
        raise RuntimeError("No image returned by the API.")

    data0 = result.data[0]
    b64_field = getattr(data0, "b64_json", None)
    if not b64_field and isinstance(data0, dict):
        b64_field = data0.get("b64_json")

    if b64_field:
        image_bytes = base64.b64decode(b64_field)
    else:
        # Fallback: some SDK versions may return a URL instead of base64
        url_field = getattr(data0, "url", None)
        if not url_field and isinstance(data0, dict):
            url_field = data0.get("url")
        if not url_field:
            raise RuntimeError("Image response contained neither b64_json nor url.")
        with urllib.request.urlopen(url_field) as resp:
            image_bytes = resp.read()

    output_path = Path(output_image_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("wb") as f:
        f.write(image_bytes)

    return str(output_path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Style transfer: derive style from images in --sample-dir using a vision model, "
            "read a text prompt from --prompt-md, and apply the style to all images in --target-dir "
            "using the Images API."
        ),
    )
    parser.add_argument(
        "--prompt-md",
        required=True,
        help="Path to a Markdown file containing the base prompt",
    )
    parser.add_argument(
        "--sample-dir",
        required=True,
        help="Directory containing reference images to derive style",
    )
    parser.add_argument(
        "--target-dir",
        required=True,
        help="Directory containing target images whose style will be changed",
    )
    parser.add_argument(
        "--output-dir",
        required=True,
        help="Directory to save styled images",
    )
    parser.add_argument(
        "--size",
        default="1024x1024",
        choices=["256x256", "512x512", "1024x1024"],
        help="Output image size",
    )
    parser.add_argument(
        "--image-model",
        default="gpt-image-1",
        help="Image generation model (default: gpt-image-1)",
    )
    parser.add_argument(
        "--vision-model",
        default="gpt-4o-mini",
        help="Vision model to summarize style (default: gpt-4o-mini)",
    )
    parser.add_argument(
        "--sample-max",
        type=int,
        default=6,
        help="Max number of sample images to consider",
    )
    parser.add_argument(
        "--api-key",
        dest="api_key",
        default=os.getenv("OPENAI_API_KEY"),
        help="OpenAI API key (defaults to $OPENAI_API_KEY)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    api_key = args.api_key
    if not api_key:
        raise ValueError(
            "OpenAI API key not provided. Set --api-key or the OPENAI_API_KEY environment variable."
        )

    # 1) Read user prompt from Markdown
    base_prompt = read_prompt_from_markdown(args.prompt_md)

    # 2) Derive style description from sample images
    sample_paths = list_image_files(args.sample_dir)
    style_desc = derive_style_description(
        api_key=api_key,
        sample_image_paths=sample_paths,
        vision_model=args.vision_model,
        max_images=args.sample_max,
    )

    print("Derived style description:\n" + style_desc + "\n")

    # 3) Apply style to each target image
    target_paths = list_image_files(args.target_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    saved_files: List[str] = []
    for target in target_paths:
        combined_prompt = (
            f"{base_prompt}\n\nApply the following visual style to the image while preserving subject identity "
            f"and composition unless otherwise specified. Style description: {style_desc}"
        )
        # Prepare a padded temp input to match nearest supported size
        with Image.open(str(target)) as _im:
            orig_w, orig_h = _im.size
        allowed_w, allowed_h = choose_allowed_size(orig_w, orig_h)
        padded_path, content_box, (orig_w, orig_h) = prepare_padded_input(target, allowed_w, allowed_h)

        # Resize padded canvas to the exact allowed size for the API
        with Image.open(str(padded_path)) as pad_im:
            pad_w, pad_h = pad_im.size
            if (pad_w, pad_h) != (allowed_w, allowed_h):
                scale_x = allowed_w / max(1, pad_w)
                scale_y = allowed_h / max(1, pad_h)
                # Scale content_box accordingly for later cropping
                l, t, r, b = content_box
                content_box = (
                    int(round(l * scale_x)),
                    int(round(t * scale_y)),
                    int(round(r * scale_x)),
                    int(round(b * scale_y)),
                )
                resized_pad = pad_im.resize((allowed_w, allowed_h), Image.LANCZOS)
                resized_pad.save(str(padded_path), format="PNG")

        output_name = target.stem + "_styled.png"
        output_path = output_dir / output_name
        if output_path.exists():
            continue
        try:
            saved = generate_image_edit(
                api_key=api_key,
                input_image_path=str(padded_path),
                prompt_text=combined_prompt,
                output_image_path=str(output_path),
                model=args.image_model,
                size=f"{allowed_w}x{allowed_h}",
            )
        finally:
            # Clean temporary file
            try:
                if padded_path.exists():
                    # padded_path.unlink()
                    pass
            except Exception:
                pass

        # Crop out padding and restore original dimensions
        try:
            with Image.open(saved) as gen_im:
                cropped = gen_im.crop(content_box)
                if cropped.size != (orig_w, orig_h):
                    cropped = cropped.resize((orig_w, orig_h), Image.LANCZOS)
                cropped.save(saved, format="PNG")
        except Exception:
            pass
        saved_files.append(saved)

    print("Saved: \n" + "\n".join(saved_files))


if __name__ == "__main__":
    main()


