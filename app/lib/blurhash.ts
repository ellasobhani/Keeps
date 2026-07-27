import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import { decode as decodeJpeg } from "jpeg-js";
import { encode as encodeBlurhash } from "blurhash";

// blurhash only needs a handful of pixels to represent a usable placeholder
// (that's the whole point of it being ~20-30 bytes) — downsizing first keeps
// the pure-JS decode/encode below fast even for a full-resolution photo.
const SAMPLE_SIZE = 32;

// Computed on-device at upload time, best-effort: a failure here (corrupt
// image, decode edge case) should never block the photo itself from
// uploading, it just means that tile falls back to the plain gray
// placeholder instead of a blurred preview until re-uploaded.
export async function computeBlurhash(localUri: string): Promise<string | null> {
  try {
    const resized = await manipulateAsync(localUri, [{ resize: { width: SAMPLE_SIZE } }], {
      compress: 0.5,
      format: SaveFormat.JPEG,
    });
    const bytes = await new File(resized.uri).bytes();
    const { width, height, data } = decodeJpeg(bytes, { useTArray: true });
    return encodeBlurhash(new Uint8ClampedArray(data), width, height, 4, 3);
  } catch (e) {
    console.warn("[blurhash] failed to compute placeholder:", e);
    return null;
  }
}
