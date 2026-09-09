import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { motion } from "motion/react";
import ArticleCard from "../components/ArticleComponent";
import { CATEGORIES } from "../constants";
import { getAllArticles } from "../utility/api";
import { setDocumentMeta } from "../utility/seo";

const MotionDiv = motion.div;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  const [search, setSearch] = useState(initialQuery);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const query = searchParams.get("q") || "";

  useEffect(() => {
    setSearch(query);
    setDocumentMeta({
      title: query ? `Search: ${query} | Article Hub` : "Search | Article Hub",
      description: "Search Article Hub stories by title, topic, category, tag, or article content.",
      canonical: window.location.href,
    });
  }, [query]);

  useEffect(() => {
    let active = true;

    const runSearch = async () => {
      if (!query.trim()) {
        setArticles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await getAllArticles({ search: query.trim(), limit: 24 });
        if (active) setArticles(data.articles || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Search failed.");
      } finally {
        if (active) setLoading(false);
      }
    };

    runSearch();
    return () => {
      active = false;
    };
  }, [query]);

  const matchedCategory = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return CATEGORIES.find((item) => item.value && (item.value.includes(normalized) || item.label.toLowerCase().includes(normalized)));
  }, [query]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextQuery = search.trim();
    if (!nextQuery) {
      navigate("/");
      return;
    }
    setSearchParams({ q: nextQuery });
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <section className="search-hero mx-auto max-w-[1440px] p-6 sm:p-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="subtle-label">Reader Search</p>
            <h1 className="theme-text mt-3 text-4xl font-black tracking-tight sm:text-6xl">
              {query ? `Results for "${query}"` : "Search Article Hub"}
            </h1>
            <p className="theme-muted mt-4 max-w-2xl leading-7">
              Search titles, categories, tags, excerpts, and article body content.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="search-page-form">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
              aria-label="Search articles"
              placeholder="Try physics, AI, space, chemistry..."
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
            <button type="submit">
              Search <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {matchedCategory && (
          <Link to={`/category/${matchedCategory.value}`} className="search-category-suggestion">
            Open {matchedCategory.label} category page <ArrowRight size={15} />
          </Link>
        )}
      </section>

      <section className="mx-auto mt-8 max-w-[1440px]">
        {error && <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        {loading ? (
          <div className="theme-surface grid min-h-80 place-items-center">
            <Loader2 className="animate-spin text-teal-700" size={34} />
          </div>
        ) : query && articles.length ? (
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {articles.map((article, index) => (
              <ArticleCard key={article._id} article={article} index={index} />
            ))}
          </MotionDiv>
        ) : query ? (
          <div className="theme-surface px-6 py-20 text-center">
            <h2 className="theme-text text-3xl font-black">No results found</h2>
            <p className="theme-muted mx-auto mt-3 max-w-xl">
              Try a category like Physics, Astronomy, Technology, Biology, Earth, Chemistry, or Mathematics.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {CATEGORIES.filter((item) => item.value).map((item) => (
              <Link key={item.value} to={`/category/${item.value}`} className="theme-surface p-5">
                <span className="subtle-label">{item.label}</span>
                <p className="theme-muted mt-3 text-sm font-semibold">Browse all {item.label.toLowerCase()} articles.</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
