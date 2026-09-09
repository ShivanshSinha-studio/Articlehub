const DEFAULT_DESCRIPTION =
  "Article Hub is a premium publishing ecosystem for research stories, editorial discovery, and author workflows.";

export function setDocumentMeta({
  title = "Article Hub",
  description = DEFAULT_DESCRIPTION,
  canonical,
} = {}) {
  if (typeof document === "undefined") return;

  document.title = title.includes("Article Hub") ? title : `${title} | Article Hub`;

  upsertMeta("description", description);
  upsertMeta("og:title", document.title, "property");
  upsertMeta("og:description", description, "property");
  upsertMeta("twitter:card", "summary_large_image");

  if (canonical) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
  }
}

function upsertMeta(name, content, attribute = "name") {
  let meta = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}
