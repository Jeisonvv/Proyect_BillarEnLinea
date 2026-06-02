export const siteConfig = {
  name: "Billar en Linea",
  shortName: "Billar en Linea",
  description:
    "Torneos, eventos, sorteos, noticias y tienda especializada para la comunidad del billar en un solo lugar.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://billarenlinea.com").replace(/\/$/, ""),
  locale: "es_CO",
  socialImage: "/hero_portada.png",
  keywords: [
    "billar en linea",
    "torneos de billar",
    "eventos de billar",
    "sorteos de billar",
    "noticias de billar",
    "tienda de billar",
    "billar nacional",
    "billar internacional",
  ],
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

const SOCIAL_IMAGE_WIDTH = 1200;
const SOCIAL_IMAGE_HEIGHT = 630;
const CLOUDINARY_SOCIAL_TRANSFORMATION = [
  "f_auto",
  "q_auto",
  `w_${SOCIAL_IMAGE_WIDTH}`,
  `h_${SOCIAL_IMAGE_HEIGHT}`,
  "c_pad",
  "b_rgb:081917",
].join(",");

function toAbsoluteImageUrl(path: string) {
  return path.startsWith("http://") || path.startsWith("https://") ? path : absoluteUrl(path);
}

function isCloudinaryUploadUrl(value: URL) {
  return value.hostname.endsWith("res.cloudinary.com") && value.pathname.includes("/image/upload/");
}

function injectCloudinaryTransformation(url: URL) {
  const uploadMarker = "/image/upload/";
  const markerIndex = url.pathname.indexOf(uploadMarker);

  if (markerIndex === -1) {
    return url.toString();
  }

  const prefix = url.pathname.slice(0, markerIndex + uploadMarker.length);
  const suffix = url.pathname.slice(markerIndex + uploadMarker.length);
  const normalizedSuffix = suffix.startsWith("v") && /v\d+\//.test(suffix) ? suffix : suffix;
  url.pathname = `${prefix}${CLOUDINARY_SOCIAL_TRANSFORMATION}/${normalizedSuffix}`;
  return url.toString();
}

export function getSocialShareImageUrl(imagePath?: string | null) {
  const source = imagePath?.trim() || siteConfig.socialImage;
  const absoluteImage = toAbsoluteImageUrl(source);

  try {
    const parsedUrl = new URL(absoluteImage);
    if (isCloudinaryUploadUrl(parsedUrl)) {
      return injectCloudinaryTransformation(parsedUrl);
    }
    return parsedUrl.toString();
  } catch {
    return absoluteUrl(siteConfig.socialImage);
  }
}

export const socialImageDimensions = {
  width: SOCIAL_IMAGE_WIDTH,
  height: SOCIAL_IMAGE_HEIGHT,
} as const;