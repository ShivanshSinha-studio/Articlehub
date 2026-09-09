import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_ORIGIN, FALLBACK_IMAGES } from "../constants";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateString) => {
  if (!dateString) return "Draft";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const readingTime = (content = "") => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
};

export const getAuthorName = (author) => {
  if (!author) return "ArticleHub Desk";
  return author.name || author.username || author.email || "ArticleHub Desk";
};

export const getImageUrl = (article, index = 0) => {
  const rawImage = article?.featuredImage || article?.image || article?.imageUrl;
  const image = Array.isArray(rawImage) ? rawImage[index] || rawImage[0] : rawImage;

  if (!image) return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  if (typeof image !== "string") return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  if (image.startsWith("http")) return image;
  if (image.startsWith("/")) return `${API_ORIGIN}${image}`;
  
  // If image doesn't start with http//, it's from Cloudinary (already a full URL)
  // or is a fallback - just return as is
  return image;
};

export const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
