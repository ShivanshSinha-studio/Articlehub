import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowRight,
  Atom,
  Binary,
  Bookmark,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Dna,
  FlaskConical,
  Globe2,
  Layers3,
  Orbit,
  PenLine,
  Search,
  Sigma,
  Sparkles,
  Telescope,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ArticleCard from "../components/ArticleComponent";
import { CATEGORIES, CATEGORY_DETAILS } from "../constants";
import {
  getAllArticles,
  getBreakingArticles,
  getFeaturedArticles,
} from "../utility/api";
import { cn, getAuthorName, getImageUrl, readingTime } from "../lib/utils";
import { setDocumentMeta } from "../utility/seo";

const MotionDiv = motion.div;

const platformStats = [
  { label: "Research categories", value: "7" },
  { label: "Reader controls", value: "Live" },
  { label: "Author workflow", value: "Review" },
  { label: "Responsive views", value: "All" },
];

const featureCards = [
  {
    title: "Reader Immersion",
    copy: "Cinematic story previews, fast discovery, and calm editorial layouts built for long-form attention.",
    icon: BookOpenText,
  },
  {
    title: "Author Studio",
    copy: "Publishing flows, image-rich submissions, and creator-first surfaces that make writing feel premium.",
    icon: PenLine,
  },
  {
    title: "Editorial Control",
    copy: "Curated feeds, category systems, author signals, and platform dashboards for confident operations.",
    icon: Layers3,
  },
];

const categoryIcons = {
  physics: Atom,
  astronomy: Telescope,
  technology: Binary,
  biology: Dna,
  earth: Globe2,
  chemistry: FlaskConical,
  mathematics: Sigma,
};

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [breaking, setBreaking] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [category, setCategory] = useState(
    () => searchParams.get("category") || "",
  );
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [query, setQuery] = useState(() => searchParams.get("search") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const activeCategoryLabel =
    CATEGORIES.find((item) => item.value === category)?.label || "All";

  useEffect(() => {
    const nextCategory = searchParams.get("category") || "";
    const nextSearch = searchParams.get("search") || "";
    setCategory(nextCategory);
    setSearch(nextSearch);
    setQuery(nextSearch);
  }, [searchParams]);

  useEffect(() => {
    setDocumentMeta({
      title: category
        ? `${activeCategoryLabel} Articles | Article Hub`
        : "Article Hub",
      description:
        "Discover polished research stories across physics, astronomy, technology, biology, earth science, chemistry, and mathematics.",
      canonical: window.location.href,
    });
  }, [activeCategoryLabel, category]);

  useEffect(() => {
    let active = true;

    const fetchPage = async () => {
      setLoading(true);
      setError("");
      try {
        const [feed, featuredFeed, breakingFeed] = await Promise.all([
          getAllArticles({ category, search: query, limit: 12 }),
          getFeaturedArticles().catch(() => []),
          getBreakingArticles().catch(() => []),
        ]);

        if (!active) return;
        setArticles(feed.articles || []);
        setFeatured(featuredFeed);
        setBreaking(breakingFeed);
      } catch (err) {
        if (active)
          setError(err.response?.data?.message || "Could not load articles.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPage();
    return () => {
      active = false;
    };
  }, [category, query]);

  const heroArticles = useMemo(() => {
    // Priority: Featured first, then Breaking, limit to 5
    const featured_articles = featured.filter(
      (article, index, list) =>
        article &&
        list.findIndex((item) => item?._id === article._id) === index,
    );
    const breaking_articles = breaking.filter(
      (article, index, list) =>
        article &&
        list.findIndex((item) => item?._id === article._id) === index &&
        !featured_articles.find((f) => f._id === article._id),
    );

    const merged = [...featured_articles, ...breaking_articles];
    return merged.slice(0, 5);
  }, [featured, breaking]);
  const heroArticle = heroArticles[heroIndex] || heroArticles[0] || articles[0];
  const trendingArticles = useMemo(() => {
    const merged = [...featured, ...breaking, ...articles];
    return merged
      .filter(
        (article, index, list) =>
          article &&
          list.findIndex((item) => item?._id === article._id) === index,
      )
      .slice(0, 6);
  }, [articles, breaking, featured]);
  const discoverArticles = articles;

  const handleSearch = (event) => {
    event.preventDefault();
    const nextQuery = search.trim();
    const params = {};
    if (category) params.category = category;
    if (nextQuery) params.search = nextQuery;
    setQuery(nextQuery);
    setSearchParams(params);
  };

  const showPreviousHero = () => {
    if (!heroArticles.length) return;
    setHeroIndex(
      (current) => (current - 1 + heroArticles.length) % heroArticles.length,
    );
  };

  const showNextHero = () => {
    if (!heroArticles.length) return;
    setHeroIndex((current) => (current + 1) % heroArticles.length);
  };

  useEffect(() => {
    if (heroIndex >= heroArticles.length) {
      setHeroIndex(0);
    }
  }, [heroArticles.length, heroIndex]);

  useEffect(() => {
    if (heroArticles.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroArticles.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [heroArticles.length]);

  const handleCategorySelect = (value) => {
    setCategory(value);
    const params = {};
    if (value) params.category = value;
    if (query) params.search = query;
    setSearchParams(params);
    if (!value) {
      setSearch("");
      setQuery("");
      setSearchParams({});
    }
  };

  return (
    <div className="overflow-hidden">
      <section className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="cinematic-hero grid min-h-[72vh] gap-10 p-8 sm:p-10 lg:min-h-[78vh] lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:p-12 xl:gap-16 xl:p-14">
            <MotionDiv
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="relative z-10 flex flex-col justify-center"
            >
              <div className="max-w-2xl space-y-8">
                <MotionDiv
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-200 backdrop-blur-sm"
                >
                  <Sparkles size={11} />
                  Editorial Platform
                </MotionDiv>

                <div className="space-y-5">
                  <h1 className="editorial-title text-[clamp(3.5rem,8vw,7rem)] font-black leading-[0.95] tracking-tight text-white"> Article Hub </h1>
                  <p className="max-w-lg text-lg leading-relaxed text-stone-300/90 sm:text-xl sm:leading-relaxed">
                    A focused publishing space for science, technology, and
                    research stories with a reading experience that feels calm,
                    credible, and premium.
                  </p>
                </div>

                <MotionDiv
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-wrap items-center gap-4"
                >
                  <a
                    href="#categories"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-stone-950 shadow-2xl shadow-white/20 transition-all hover:bg-teal-500 hover:text-white hover:shadow-teal-500/30"
                  >
                    Start reading <ArrowRight size={15} strokeWidth={2.5} />
                  </a>
                  <Link
                    to="/editor"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-transparent px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
                  >
                    <PenLine size={15} strokeWidth={2.5} />
                    Write
                  </Link>
                </MotionDiv>

                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="text-xs font-medium tracking-wide text-stone-500"
                >
                  Trusted by researchers, writers, and readers worldwide
                </MotionDiv>
              </div>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="relative flex items-center min-h-[420px] sm:min-h-[520px] lg:min-h-[580px]"
            >
              <HeroImageStack
                heroArticles={heroArticles}
                heroArticle={heroArticle}
                heroIndex={heroIndex}
                setHeroIndex={setHeroIndex}
                showPreviousHero={showPreviousHero}
                showNextHero={showNextHero}
              />
            </MotionDiv>
          </div>
        </div>
      </section>

      {breaking.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="theme-surface mx-auto grid max-w-[1440px] gap-3 px-4 py-4 md:grid-cols-[auto_1fr] md:items-center">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-red-500">
              <TrendingUp size={16} />
              Breaking
            </div>
            <div className="flex gap-3 overflow-x-auto">
              {breaking.map((article) => (
                <Link
                  key={article._id}
                  to={`/article/${article.slug}`}
                  className="breaking-card min-w-80 border px-4 py-3 text-sm font-bold backdrop-blur transition hover:border-red-200 hover:text-red-700"
                >
                  {article.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <SectionShell
        eyebrow="Reader Paths"
        title="Pick a field and start reading"
      >
        <div id="categories" className="category-entry-grid scroll-mt-28">
          {CATEGORIES.filter((item) => item.value).map((item, index) => {
            const details = CATEGORY_DETAILS[item.value];
            const CategoryIcon = categoryIcons[item.value] || Orbit;
            return (
              <MotionDiv
                key={item.value}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: index * 0.04 }}
              >
                <Link
                  to={`/category/${item.value}`}
                  className={`category-entry-card category-entry-${item.value}`}
                >
                  <span className="category-entry-icon">
                    <CategoryIcon size={22} />
                  </span>
                  <span className="category-entry-motion" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="relative z-10">
                    <span className="block text-2xl font-black theme-text">
                      {item.label}
                    </span>
                    <span className="mt-3 block min-h-16 text-sm font-semibold leading-6 theme-muted">
                      {details.short}
                    </span>
                    <span className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-teal-700">
                      Open field <ArrowRight size={14} />
                    </span>
                  </span>
                </Link>
              </MotionDiv>
            );
          })}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Platform Design"
        title="Built for every side of the story"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {featureCards.map(({ title, copy, icon }, index) => {
            const FeatureIcon = icon;
            return (
              <MotionDiv
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.06 }}
                className="theme-surface group p-6 transition hover:-translate-y-1"
              >
                <div className="mb-10 flex h-12 w-12 items-center justify-center bg-stone-950 text-white transition group-hover:bg-teal-700">
                  <FeatureIcon size={21} />
                </div>
                <h3 className="home-card-title text-2xl font-black tracking-tight">
                  {title}
                </h3>
                <p className="home-card-copy mt-3 leading-7">{copy}</p>
              </MotionDiv>
            );
          })}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Trending Articles"
        title="What readers are opening now"
      >
        {loading ? (
          <ArticleSkeletonGrid />
        ) : trendingArticles.length ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <ArticleCard article={trendingArticles[0]} featured />
            <div className="grid gap-6 sm:grid-cols-2">
              {trendingArticles.slice(1, 5).map((article, index) => (
                <TrendingMiniCard
                  key={article._id}
                  article={article}
                  index={index + 1}
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No trending stories yet"
            copy="Publish a few articles and this section will come alive."
          />
        )}
      </SectionShell>

      <SectionShell eyebrow="Discover" title="Explore by category">
        <div className="theme-surface-strong p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
                Currently viewing
              </p>
              <h3 className="theme-text mt-1 text-2xl font-black">
                {activeCategoryLabel}
              </h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => handleCategorySelect(item.value)}
                  aria-pressed={category === item.value}
                  className={cn(
                    "category-chip whitespace-nowrap border px-5 py-3 text-xs font-black uppercase tracking-[0.14em] transition",
                    category === item.value &&
                      "is-active shadow-lg shadow-teal-700/20",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-7">
          {loading ? (
            <ArticleSkeletonGrid />
          ) : (
            <AnimatePresence mode="wait">
              {discoverArticles.length > 0 ? (
                <MotionDiv
                  key={`${category}-${query}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
                >
                  {discoverArticles.map((article, index) => (
                    <ArticleCard
                      key={article._id}
                      article={article}
                      index={index + 1}
                    />
                  ))}
                </MotionDiv>
              ) : (
                <EmptyState
                  title="No articles found"
                  copy="Try another category or search phrase."
                />
              )}
            </AnimatePresence>
          )}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Trusted Momentum"
        title="A reading platform with signal"
      >
        <div className="grid gap-4 md:grid-cols-4">
          {platformStats.map((stat, index) => (
            <MotionDiv
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="theme-surface p-6"
            >
              <div className="text-4xl font-black tracking-tight theme-text">
                {stat.value}
              </div>
              <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] theme-muted">
                {stat.label}
              </div>
            </MotionDiv>
          ))}
        </div>
      </SectionShell>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="cinematic-hero mx-auto max-w-[1440px] p-6 sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-200">
                Start exploring
              </p>
              <h2 className="editorial-title mt-4 max-w-4xl text-4xl font-black text-white sm:text-6xl">
                Your next obsession is probably one story away.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-200">
                Follow the ideas, publish your perspective, and turn ARTICLE HUB
                into your daily reading ritual.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="premium-button bg-white text-stone-950 hover:bg-teal-500 hover:text-white"
              >
                Join Article Hub <ArrowRight size={16} />
              </Link>
              <Link
                to="/"
                className="ghost-button border-white/15 bg-white/8 text-white hover:bg-white hover:text-stone-950"
              >
                Browse archive
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroImageStack({
  heroArticles,
  heroArticle,
  heroIndex,
  setHeroIndex,
  showPreviousHero,
  showNextHero,
}) {
  const stackArticles = useMemo(() => {
    if (!heroArticles.length && heroArticle) return [heroArticle];
    if (!heroArticles.length) return [];

    return Array.from(
      { length: Math.min(heroArticles.length, 3) },
      (_, offset) => {
        const index = (heroIndex + offset) % heroArticles.length;
        return heroArticles[index];
      },
    ).filter(Boolean);
  }, [heroArticle, heroArticles, heroIndex]);

  if (!heroArticle) {
    return (
      <div className="hero-stack-shell grid place-items-center border border-white/12 bg-white/5 text-center text-white">
        <div>
          <BookOpenText className="mx-auto text-teal-200" size={40} />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-stone-300">
            Stories will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-stack-shell">
      <div className="absolute inset-0 border border-white/10 bg-white/5" />
      <div className="hero-stack-stage">
        {stackArticles.map((article, offset) => (
          <MotionDiv
            key={`${article._id || article.slug}-${offset}-${heroIndex}`}
            initial={{ opacity: 0, y: 24, rotate: offset === 0 ? -3 : 4 }}
            animate={{
              opacity: offset === 0 ? 1 : 0.72 - offset * 0.14,
              y: offset * 28,
              x: offset * 34,
              scale: 1 - offset * 0.06,
              rotate: offset === 0 ? -2.5 : offset === 1 ? 3.5 : -5,
            }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "hero-stack-card",
              offset === 0 ? "z-30" : offset === 1 ? "z-20" : "z-10",
            )}
          >
            <img
              src={getImageUrl(article, offset)}
              alt={article.title || "Featured article"}
              className="h-full w-full object-cover"
              loading={offset === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/18 to-transparent" />
          </MotionDiv>
        ))}
      </div>

      <div className="hero-image-controls">
        <AnimatePresence mode="wait">
          <MotionDiv
            key={heroArticle._id || heroArticle.slug || heroIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="min-w-0"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-200">
              <span className="rounded-full bg-white px-3.5 py-1.5 text-stone-950">
                {heroArticle.isBreaking ? "Breaking" : "Featured"}
              </span>
              <span className="text-stone-400">{heroArticle.category}</span>
              <span className="text-stone-500">
                {readingTime(heroArticle.content)} min read
              </span>
            </div>
            <h2 className="line-clamp-2 max-w-2xl text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl">
              {heroArticle.title}
            </h2>
          </MotionDiv>
        </AnimatePresence>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            {heroArticles.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousHero}
                  className="hero-control-button"
                  aria-label="Previous featured article"
                >
                  <ChevronLeft size={18} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={showNextHero}
                  className="hero-control-button"
                  aria-label="Next featured article"
                >
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
                <div className="ml-3 flex items-center gap-2.5">
                  {heroArticles.map((article, index) => (
                    <button
                      type="button"
                      key={article._id || article.slug || index}
                      onClick={() => setHeroIndex(index)}
                      className={cn(
                        "hero-dot",
                        index === heroIndex && "is-active",
                      )}
                      aria-label={`Show featured article ${index + 1}`}
                      aria-pressed={index === heroIndex}
                    />
                  ))}
                </div>
              </>
            )}

            <Link
              to={`/article/${heroArticle.slug}`}
              className="hero-read-link ml-2"
            >
              Open story <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          {heroArticles.length > 1 && (
            <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-white/8">
              <MotionDiv
                key={heroIndex}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 5, ease: "linear" }}
                className="h-full origin-left rounded-full bg-gradient-to-r from-teal-400 to-teal-300"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionShell({ eyebrow, title, children }) {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="subtle-label">{eyebrow}</p>
            <h2 className="theme-text mt-2 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              {title}
            </h2>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function TrendingMiniCard({ article, index }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="theme-surface group overflow-hidden"
    >
      <Link to={`/article/${article.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={getImageUrl(article, index)}
            alt={article.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <span
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center bg-white/90 text-stone-950 backdrop-blur"
            title="Bookmark"
          >
            <Bookmark size={16} />
          </span>
        </div>
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-teal-700">
            <TrendingUp size={14} />
            {article.category}
          </div>
          <h3 className="home-card-title line-clamp-2 text-xl font-black leading-tight">
            {article.title}
          </h3>
          <div className="mt-5 flex items-center gap-3 border-t theme-line pt-4 text-xs font-bold theme-muted">
            <span>{getAuthorName(article.author)}</span>
            <span className="ml-auto">{readingTime(article.content)} min</span>
          </div>
        </div>
      </Link>
    </MotionDiv>
  );
}

function ArticleSkeletonGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="theme-surface p-4">
          <div className="shimmer aspect-[16/10]" />
          <div className="shimmer mt-5 h-5 w-2/3" />
          <div className="shimmer mt-3 h-4 w-full" />
          <div className="shimmer mt-2 h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, copy }) {
  return (
    <div className="theme-surface px-6 py-20 text-center">
      <h3 className="theme-text text-3xl font-black">{title}</h3>
      <p className="theme-muted mt-2">{copy}</p>
    </div>
  );
}
