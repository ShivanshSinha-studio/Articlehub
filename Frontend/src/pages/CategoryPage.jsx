import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { ArrowLeft, ArrowRight, Atom, Binary, Dna, FlaskConical, Globe2, Loader2, Orbit, Sigma, Telescope } from "lucide-react";
import { motion } from "motion/react";
import ArticleCard from "../components/ArticleComponent";
import { CATEGORY_DETAILS, CATEGORIES } from "../constants";
import { getAllArticles } from "../utility/api";
import { readingTime } from "../lib/utils";
import { setDocumentMeta } from "../utility/seo";

const MotionDiv = motion.div;

const categoryIcons = {
  physics: Atom,
  astronomy: Telescope,
  technology: Binary,
  biology: Dna,
  earth: Globe2,
  chemistry: FlaskConical,
  mathematics: Sigma,
};

export default function CategoryPage() {
  const { category } = useParams();
  const details = CATEGORY_DETAILS[category];
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const Icon = categoryIcons[category] || Orbit;

  useEffect(() => {
    if (!details) return;
    setDocumentMeta({
      title: `${details.title} Articles | Article Hub`,
      description: details.short,
      canonical: window.location.href,
    });
  }, [details]);

  useEffect(() => {
    if (!details) return undefined;
    let active = true;

    const fetchCategory = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAllArticles({ category, limit: 18 });
        if (active) setArticles(data.articles || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Could not load this category.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCategory();
    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      active = false;
    };
  }, [category, details]);

  const featuredArticle = articles[0];
  const totalReadTime = useMemo(
    () => articles.reduce((sum, article) => sum + readingTime(article.content), 0),
    [articles]
  );

  if (!details) return <Navigate to="/" replace />;

  return (
    <div className={`category-page category-${details.theme}`}>
      <section className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="category-hero mx-auto max-w-[1440px] overflow-hidden">
          <div className="category-visual-layer" aria-hidden="true">
            <CategoryAnimation theme={details.theme} />
          </div>

          <div className="relative z-10 grid min-h-[560px] gap-8 p-5 sm:p-8 lg:grid-cols-[0.92fr_1.08fr] lg:p-12">
            <div className="flex flex-col justify-between">
              <div>
                <Link to="/#categories" className="category-back-link">
                  <ArrowLeft size={16} />
                  All categories
                </Link>

                <MotionDiv
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55 }}
                  className="mt-8"
                >
                  <div className="category-kicker">
                    <Icon size={18} />
                    {details.metric}
                  </div>
                  <h1 className="mt-6 text-6xl font-black leading-none text-white sm:text-7xl lg:text-8xl">
                    {details.title}
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-200">
                    {details.short}
                  </p>
                </MotionDiv>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                <CategoryStat label="Articles" value={articles.length} />
                <CategoryStat label="Read time" value={`${totalReadTime || 0}m`} />
                <CategoryStat label="Mode" value="Focus" />
              </div>
            </div>

            <div className="category-feature-panel">
              {loading ? (
                <div className="grid h-full min-h-96 place-items-center">
                  <Loader2 className="animate-spin text-teal-200" size={34} />
                </div>
              ) : featuredArticle ? (
                <MotionDiv
                  initial={{ opacity: 0, y: 24, rotate: -2 }}
                  animate={{ opacity: 1, y: 0, rotate: -1.5 }}
                  transition={{ duration: 0.65 }}
                  className="category-feature-card"
                >
                  <ArticleCard article={featuredArticle} featured />
                </MotionDiv>
              ) : (
                <div className="category-empty-feature">
                  <Icon size={42} />
                  <h2>No {details.title} articles yet</h2>
                  <p>Once articles are published in this field, they will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="category-field-strip mx-auto max-w-[1440px]">
          {CATEGORIES.filter((item) => item.value).map((item) => (
            <Link
              key={item.value}
              to={`/category/${item.value}`}
              className={`category-field-tab ${item.value === category ? "is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="category-feed-header mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="subtle-label">Reader Feed</p>
              <h2 className="theme-text mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                Latest in {details.title}
              </h2>
              <p className="theme-muted mt-3 max-w-xl text-sm font-semibold leading-6">
                Freshly published stories, sorted for focused reading inside this field.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((item) => item.value).map((item) => (
                <Link
                  key={item.value}
                  to={`/category/${item.value}`}
                  className={`category-mini-link ${item.value === category ? "is-active" : ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {error && <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="theme-surface p-4">
                  <div className="shimmer aspect-[16/10]" />
                  <div className="shimmer mt-5 h-5 w-2/3" />
                  <div className="shimmer mt-3 h-4 w-full" />
                  <div className="shimmer mt-2 h-4 w-4/5" />
                </div>
              ))}
            </div>
          ) : articles.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {articles.map((article, index) => (
                <ArticleCard key={article._id} article={article} index={index} />
              ))}
            </div>
          ) : (
            <div className="theme-surface px-6 py-20 text-center">
              <h3 className="theme-text text-3xl font-black">No articles found</h3>
              <p className="theme-muted mt-2">This category is ready. Publish an article and it will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CategoryStat({ label, value }) {
  return (
    <div className="category-stat">
      <div>{value}</div>
      <span>{label}</span>
    </div>
  );
}

function CategoryAnimation({ theme }) {
  if (theme === "physics") {
    return (
      <div className="field-animation physics-animation">
        <span className="nucleus" />
        <span className="orbit one" />
        <span className="orbit two" />
        <span className="orbit three" />
      </div>
    );
  }

  if (theme === "astronomy") {
    return (
      <div className="field-animation astronomy-animation">
        {Array.from({ length: 18 }).map((_, index) => <span key={index} />)}
      </div>
    );
  }

  if (theme === "technology") {
    return (
      <div className="field-animation technology-animation">
        {Array.from({ length: 8 }).map((_, index) => <span key={index} />)}
      </div>
    );
  }

  if (theme === "biology") {
    return (
      <div className="field-animation biology-animation">
        {Array.from({ length: 9 }).map((_, index) => <span key={index} />)}
      </div>
    );
  }

  if (theme === "earth") {
    return (
      <div className="field-animation earth-animation">
        <span />
        <span />
        <span />
      </div>
    );
  }

  if (theme === "chemistry") {
    return (
      <div className="field-animation chemistry-animation">
        {Array.from({ length: 7 }).map((_, index) => <span key={index} />)}
      </div>
    );
  }

  return (
    <div className="field-animation mathematics-animation">
      {Array.from({ length: 24 }).map((_, index) => <span key={index}>{index % 3 === 0 ? "∑" : index % 3 === 1 ? "π" : "∞"}</span>)}
    </div>
  );
}
