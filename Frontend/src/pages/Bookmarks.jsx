import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Bookmark, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import ArticleCard from "../components/ArticleComponent";
import { getBookmarkedArticles } from "../utility/api";
import { setDocumentMeta } from "../utility/seo";

const MotionDiv = motion.div;

function getErrorMessage(err, fallback) {
  const data = err.response?.data;
  if (typeof data === "string") return data.replace(/^Error:\s*/i, "");
  return data?.message || fallback;
}

export default function Bookmarks() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setDocumentMeta({
      title: "Bookmarks | Article Hub",
      description: "Read your saved Article Hub stories.",
      canonical: window.location.href,
    });

    let active = true;

    const loadBookmarks = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getBookmarkedArticles({ limit: 36 });
        if (active) setArticles(data.articles || []);
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Could not load bookmarks."));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBookmarks();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <section className="search-hero mx-auto max-w-[1440px] p-6 sm:p-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="subtle-label inline-flex items-center gap-2">
              <Bookmark size={15} />
              Saved Reading
            </p>
            <h1 className="theme-text mt-3 text-4xl font-black tracking-tight sm:text-6xl">
              Your Bookmarks
            </h1>
            <p className="theme-muted mt-4 max-w-2xl leading-7">
              All the articles you saved are collected here for quick reading.
            </p>
          </div>
          <Link to="/" className="ghost-button w-fit">
            Browse archive <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-[1440px]">
        {error && <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        {loading ? (
          <div className="theme-surface grid min-h-80 place-items-center">
            <Loader2 className="animate-spin text-teal-700" size={34} />
          </div>
        ) : articles.length ? (
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {articles.map((article, index) => (
              <ArticleCard key={article._id} article={article} index={index} />
            ))}
          </MotionDiv>
        ) : (
          <div className="theme-surface px-6 py-20 text-center">
            <Bookmark className="mx-auto text-teal-700" size={38} />
            <h2 className="theme-text mt-4 text-3xl font-black">No bookmarks yet</h2>
            <p className="theme-muted mx-auto mt-3 max-w-xl">
              Save articles from the reader page and they will appear here.
            </p>
            <Link to="/" className="premium-button mt-7">
              Find articles <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
