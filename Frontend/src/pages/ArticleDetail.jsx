import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, ArrowUpRight, Bookmark, BookOpen, CalendarDays,
  Check, ChevronLeft, ChevronRight, Clock3, Eye,
  Heart, Loader2, Share2, Tag, User, MessageCircle, Send, Trash2, AlertCircle,
} from "lucide-react";
import { motion, useScroll, useSpring } from "motion/react";
import { CATEGORY_ACCENTS, CATEGORY_DETAILS } from "../constants";
import { getAllArticles, getArticle, toggleLike, toggleBookmark, checkUserAction, addComment, getComments, deleteComment } from "../utility/api";
import { cn, formatDate, getAuthorName, getImageUrl, readingTime } from "../lib/utils";
import { setDocumentMeta } from "../utility/seo";

const MotionDiv = motion.div;

/* ─── helpers ─────────────────────────────────────────────────── */

function extractHeadings(content = "") {
  const lines = content.split("\n").filter((l) => /^#{1,3}\s/.test(l));
  return lines.slice(0, 8).map((l) => {
    const level = l.match(/^(#{1,3})\s/)[1].length;
    const text = l.replace(/^#{1,3}\s/, "").trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return { level, text, id };
  });
}

function getAllImages(article) {
  const raw = article?.featuredImage || article?.image || article?.imageUrl;
  const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const urls = arr
    .map((_, i) => getImageUrl(article, i))
    .filter(Boolean);
  return [...new Set(urls.length ? urls : [getImageUrl(article, 0)])]; // deduplicate — fixes duplicate key warning
}

function getErrorMessage(err, fallback) {
  const data = err.response?.data;
  if (typeof data === "string") return data.replace(/^Error:\s*/i, "");
  return data?.message || fallback;
}

function formatArticleContent(content = "") {
  const trimmed = content.trim();
  if (!trimmed) return "";

  const alreadyStructured = /(^|\n)(#{1,6}\s|[-*]\s|\d+\.\s|>\s|```)/.test(trimmed) || /\n\s*\n/.test(trimmed);
  if (alreadyStructured) return trimmed;

  let formatted = trimmed.replace(/\s+(step\s*\d+\s*:)/gi, "\n\n$1");
  formatted = formatted.replace(/^(step\s*\d+\s*:)/gim, (match) => `**${match.replace(/\s+/g, " ").trim()}**`);

  if (formatted !== trimmed) return formatted;

  return trimmed
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .join("\n\n");
}

/* ─── sub-components ──────────────────────────────────────────── */

function ImageGallery({ images, title }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  useEffect(() => {
    setIdx(0);
  }, [images.length]);

  useEffect(() => {
    if (paused || images.length <= 1) return undefined;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion) return undefined;

    const timer = window.setInterval(() => {
      setIdx((i) => (i + 1) % images.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [images.length, paused]);

  return (
    <div
      className="article-hero-media relative h-full w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={i === 0 ? title : `${title} — image ${i + 1}`}
          loading={i === 0 ? "eager" : "lazy"}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition duration-700",
            i === idx ? "opacity-100" : "opacity-0"
          )}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent lg:bg-gradient-to-r lg:from-black/20 lg:via-black/0 lg:to-black/20" />

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label="Previous image"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label="Next image"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={`dot-${i}`}
                onClick={() => setIdx(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === idx ? "w-6 bg-white" : "w-1.5 bg-white/50"
                )}
                aria-label={`Image ${i + 1}`}
                aria-pressed={i === idx}
              />
            ))}
          </div>

          <div className="article-image-thumbs" aria-label="Article images">
            {images.map((src, i) => (
              <button
                key={`thumb-${src}-${i}`}
                type="button"
                onClick={() => setIdx(i)}
                className={cn("article-image-thumb", i === idx && "is-active")}
                aria-label={`Show image ${i + 1}`}
                aria-pressed={i === idx}
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TableOfContents({ headings, activeId }) {
  if (!headings.length) return null;
  return (
    <nav aria-label="Table of contents">
      <p className="subtle-label mb-4 flex items-center gap-2">
        <BookOpen size={13} /> In this article
      </p>
      <ol className="space-y-1">
        {headings.map(({ id, text, level }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={cn(
                "block border-l-2 py-1 text-sm font-semibold leading-snug transition-all",
                level === 1 ? "pl-3" : level === 2 ? "pl-5" : "pl-7",
                activeId === id
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent theme-muted hover:border-teal-500/30 hover:text-teal-700"
              )}
            >
              {text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ActionBar({ liked, bookmarked, likeCount, bookmarkCount, onLike, onBookmark, onShare, loading, title, className }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, url: window.location.href }); return; } catch { }
    }
    await navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("article-action-bar mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-3 px-3 py-3 sm:gap-4 sm:px-4", className)}>
      <button
        onClick={onLike}
        disabled={loading}
        className={cn(
          "article-action-button flex items-center gap-2 px-4 py-2 font-black transition-all",
          liked
            ? "is-liked text-red-600"
            : "theme-muted hover:text-red-600"
        )}
        aria-pressed={liked}
      >
        <Heart size={18} fill={liked ? "currentColor" : "none"} />
        <span>{likeCount}</span>
      </button>

      <button
        onClick={onBookmark}
        disabled={loading}
        className={cn(
          "article-action-button flex items-center gap-2 px-4 py-2 font-black transition-all",
          bookmarked
            ? "is-bookmarked text-teal-600"
            : "theme-muted hover:text-teal-700"
        )}
        aria-pressed={bookmarked}
      >
        <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
        <span>{bookmarkCount}</span>
      </button>

      <button
        onClick={handleShare}
        className={cn(
          "article-action-button flex items-center gap-2 px-4 py-2 font-black transition-all",
          copied
            ? "is-bookmarked text-teal-600"
            : "theme-muted hover:text-teal-700"
        )}
      >
        {copied ? <Check size={18} /> : <Share2 size={18} />}
        <span>{copied ? "Copied!" : "Share"}</span>
      </button>
    </div>
  );
}

function RelatedCard({ article }) {
  const accent = CATEGORY_ACCENTS[article.category] || "bg-stone-50 text-stone-700 border-stone-100";
  return (
    <Link
      to={`/article/${article.slug}`}
      className="article-related-card group flex gap-4 overflow-hidden p-3 transition hover:border-teal-300/40 sm:p-4"
    >
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded">
        <img
          src={getImageUrl(article, 0)}
          alt={article.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="min-w-0">
        <span className={cn("border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]", accent)}>
          {article.category}
        </span>
        <p className="theme-text mt-1.5 line-clamp-2 text-sm font-bold leading-snug group-hover:text-teal-700">
          {article.title}
        </p>
        <span className="theme-muted mt-1 flex items-center gap-1 text-xs">
          <Clock3 size={11} /> {readingTime(article.content)} min
        </span>
      </div>
    </Link>
  );
}

/* Comments Section */
function CommentsSection({ articleId, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadComments();
  }, [articleId]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await getComments(articleId, { page: 1, limit: 20 });
      setComments(data.comments || []);
    } catch (error) {
      console.error("Failed to load comments", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    setErrorMsg("");
    try {
      const result = await addComment(articleId, newComment);
      setComments([result.comment, ...comments]);
      setNewComment("");
      onCommentAdded?.();
    } catch (error) {
      setErrorMsg(getErrorMessage(error, "Failed to add comment"));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (error) {
      setErrorMsg(getErrorMessage(error, "Failed to delete comment"));
    }
  };

  return (
    <div className="article-reader-panel mt-8 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-teal-700" />
          <h3 className="theme-text text-sm font-black uppercase tracking-widest">Comments ({comments.length})</h3>
        </div>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="mb-6">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            maxLength={1000}
            rows={3}
            className="article-comment-field w-full resize-none px-4 py-3 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="theme-muted text-xs">{newComment.length}/1000</span>
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition",
                submittingComment || !newComment.trim()
                  ? "cursor-not-allowed border border-black/10 bg-white/40 text-stone-400"
                  : "bg-teal-600 text-white hover:bg-teal-700"
              )}
            >
              {submittingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {submittingComment ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
        {errorMsg && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}
      </form>

      {/* Comments List */}
      {loadingComments ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-teal-700" size={24} />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center">
          <MessageCircle size={32} className="mx-auto mb-2 text-teal-500/50" />
          <p className="theme-muted text-sm">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="article-comment-card p-4 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-teal-50 text-teal-700 font-bold text-sm shrink-0">
                    {comment.author?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="theme-text text-sm font-bold">{comment.author?.name || "User"}</h4>
                    <p className="theme-muted mt-1 text-xs">{formatDate(comment.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteComment(comment._id)}
                  className="ml-2 p-1 text-stone-400 hover:text-red-600 transition"
                  aria-label="Delete comment"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="theme-muted mt-3 break-words text-sm leading-relaxed">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── inject heading ids into markdown ───────────────────────── */

function HeadingWithId({ level, children, ...props }) {
  const text = typeof children === "string" ? children : Array.isArray(children) ? children.join("") : "";
  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const Tag = `h${level}`;
  return <Tag id={id} {...props}>{children}</Tag>;
}

const markdownComponents = {
  h1: (p) => <HeadingWithId level={1} {...p} />,
  h2: (p) => <HeadingWithId level={2} {...p} />,
  h3: (p) => <HeadingWithId level={3} {...p} />,
};

/* ─── main page ───────────────────────────────────────────────── */

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState("");
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [commentError, setCommentError] = useState("");
  const contentRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  /* fetch article */
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setArticle(null);
    setRelated([]);

    getArticle(slug)
      .then((result) => {
        if (!active) return;
        setArticle(result);
        setLikeCount(result.likes?.length || 0);
        setBookmarkCount(result.bookmarks?.length || 0);
        getAllArticles({ category: result.category, limit: 4 })
          .then(({ articles }) => {
            if (active) setRelated((articles || []).filter((a) => a.slug !== slug).slice(0, 3));
          })
          .catch(() => { });
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || "Article not found."); })
      .finally(() => { if (active) setLoading(false); });

    window.scrollTo({ top: 0, behavior: "smooth" });
    return () => { active = false; };
  }, [slug]);

  /* Check user actions (like, bookmark) */
  useEffect(() => {
    if (!article) return;
    const checkUserActions = async () => {
      try {
        const data = await checkUserAction(article._id);
        setLiked(data.liked);
        setBookmarked(data.bookmarked);
        setLikeCount(data.likes);
        setBookmarkCount(data.bookmarks);
      } catch (error) {
        console.error("Failed to check user actions", error);
      }
    };
    checkUserActions();
  }, [article]);

  /* seo */
  useEffect(() => {
    if (!article) return;
    setDocumentMeta({
      title: article.title,
      description: article.excerpt || `Read ${article.title} on Article Hub.`,
      canonical: window.location.href,
    });
  }, [article]);

  /* active heading via intersection observer */
  useEffect(() => {
    if (!contentRef.current) return;
    const headingEls = contentRef.current.querySelectorAll("h1[id], h2[id], h3[id]");
    if (!headingEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [article]);

  const handleLike = async () => {
    if (!article) return;
    setActionLoading(true);
    setCommentError("");
    try {
      const result = await toggleLike(article._id);
      setLiked(result.liked);
      setLikeCount(result.likes);
    } catch (error) {
      console.error("Failed to toggle like", error);
      setCommentError(getErrorMessage(error, "Failed to process like action"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!article) return;
    setActionLoading(true);
    setCommentError("");
    try {
      const result = await toggleBookmark(article._id);
      setBookmarked(result.bookmarked);
      setBookmarkCount(result.bookmarks);
    } catch (error) {
      console.error("Failed to toggle bookmark", error);
      setCommentError(getErrorMessage(error, "Failed to process bookmark action"));
    } finally {
      setActionLoading(false);
    }
  };

  const headings = useMemo(() => extractHeadings(article?.content), [article]);
  const images = useMemo(() => (article ? getAllImages(article) : []), [article]);
  const formattedContent = useMemo(() => formatArticleContent(article?.content), [article?.content]);
  const accent = article ? (CATEGORY_ACCENTS[article.category] || "bg-stone-50 text-stone-700 border-stone-100") : "";
  const authorName = article ? getAuthorName(article.author) : "";
  const authorInitial = authorName.charAt(0).toUpperCase();

  /* ── loading ── */
  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-teal-700" size={36} />
          <p className="text-sm font-bold text-stone-400">Loading article…</p>
        </div>
      </div>
    );
  }

  /* ── error ── */
  if (error || !article) {
    return (
      <div className="mx-auto mt-16 max-w-xl px-4">
        <div className="premium-card px-8 py-16 text-center">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-500">
            <Eye size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Article not found</h1>
          <p className="mt-3 text-sm text-stone-500">{error || "This article could not be loaded."}</p>
          <Link to="/" className="premium-button mt-8 inline-flex">
            <ArrowLeft size={16} /> Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div className="reading-progress" style={{ scaleX }} />

      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="article-detail-page px-4 pb-16 pt-6 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-[1440px]">

          {/* back link */}
          <Link to="/" className="ghost-button mb-5 inline-flex">
            <ArrowLeft size={16} /> Back to archive
          </Link>

          {/* ── HERO ── */}
          <header className="article-hero overflow-hidden">
            <div className="grid min-h-[520px] lg:grid-cols-[minmax(0,0.96fr)_minmax(420px,1.04fr)]">
              <div className="relative z-10 flex flex-col justify-center p-6 sm:p-10 lg:p-14 xl:p-16">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]", accent)}>
                    {article.category}
                  </span>
                  {article.isFeatured && (
                    <span className="bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-stone-950">
                      Featured
                    </span>
                  )}
                  {article.isBreaking && (
                    <span className="animate-pulse bg-red-600 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                      Breaking
                    </span>
                  )}
                </div>

                <h1 className="editorial-title mt-6 max-w-4xl break-words text-4xl font-black text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                  {article.title}
                </h1>

                {article.excerpt && (
                  <p className="mt-5 max-w-xl text-base leading-8 text-stone-300">{article.excerpt}</p>
                )}

                <div className="mt-8 grid gap-2 text-sm font-bold text-stone-300 sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
                  <span className="flex items-center gap-2">
                    <User size={14} className="text-stone-500" />
                    {authorName}
                  </span>
                  <span className="flex items-center gap-2">
                    <CalendarDays size={14} />
                    {formatDate(article.publishedAt || article.createdAt)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 size={14} />
                    {readingTime(article.content)} min read
                  </span>
                  <span className="flex items-center gap-2">
                    <Eye size={14} />
                    {(article.views || 0).toLocaleString()} views
                  </span>
                </div>

                <ActionBar
                  liked={liked}
                  bookmarked={bookmarked}
                  likeCount={likeCount}
                  bookmarkCount={bookmarkCount}
                  onLike={handleLike}
                  onBookmark={handleBookmark}
                  onShare={() => { }}
                  loading={actionLoading}
                  title={article.title}
                  className="article-hero-actions"
                />
                {commentError && (
                  <p className="mt-3 text-sm font-bold text-red-200">
                    {commentError}
                  </p>
                )}
              </div>

              <figure className="relative min-h-[280px] lg:min-h-full">
                <ImageGallery images={images} title={article.title} />
              </figure>
            </div>
          </header>

          {/* ── BODY ── */}
          <div className="article-reading-grid mt-8 grid gap-6 lg:gap-8 xl:grid-cols-[230px_minmax(0,820px)_300px]">

            {/* left: TOC */}
            <aside className="hidden h-fit xl:sticky xl:top-28 xl:block">
              {headings.length > 0 && (
                <div className="article-side-panel p-5">
                  <TableOfContents headings={headings} activeId={activeId} />
                </div>
              )}
            </aside>

            {/* center: content */}
            <div className="min-w-0">
              <div
                ref={contentRef}
                id="article-content"
                className="markdown-body article-prose article-reader-panel min-h-48 break-words p-6 sm:p-10 lg:p-12"
              >
                <ReactMarkdown components={markdownComponents}>{formattedContent}</ReactMarkdown>
              </div>

              {/* tags */}
              {article.tags?.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Tag size={14} className="theme-muted" />
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/search?q=${encodeURIComponent(tag)}`}
                      className="article-tag px-3 py-1 text-xs font-bold transition hover:border-teal-400 hover:text-teal-700"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Comments Section */}
              <CommentsSection articleId={article._id} />

              {/* related */}
              {related.length > 0 && (
                <section className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="theme-muted text-xs font-black uppercase tracking-[0.2em]">
                      More in {CATEGORY_DETAILS[article.category]?.title || article.category}
                    </h2>
                    <Link
                      to={`/?category=${article.category}`}
                      className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.14em] text-teal-700 hover:text-teal-900"
                    >
                      See all <ArrowUpRight size={13} />
                    </Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {related.map((a) => <RelatedCard key={a._id} article={a} />)}
                  </div>
                </section>
              )}
            </div>

            {/* right sidebar */}
            <aside className="h-fit space-y-4 xl:sticky xl:top-28">

              {/* author */}
              <div className="article-side-panel p-5">
                <p className="subtle-label mb-4">Author</p>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-teal-700 to-teal-900 text-lg font-black text-white shadow">
                    {authorInitial}
                  </div>
                  <div>
                    <div className="theme-text font-black">{authorName}</div>
                    <div className="theme-muted mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em]">
                      {article.author?.role || "Contributor"}
                    </div>
                  </div>
                </div>
              </div>

              {/* article info */}
              <div className="article-side-panel divide-y divide-black/5 overflow-hidden p-0">
                {[
                  { label: "Category", value: article.category, isAccent: true },
                  { label: "Published", value: formatDate(article.publishedAt || article.createdAt) },
                  { label: "Reading time", value: `${readingTime(article.content)} min` },
                  { label: "Views", value: (article.views || 0).toLocaleString() },
                ].map(({ label, value, isAccent }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="theme-muted text-xs font-bold">{label}</span>
                    <span className={cn("text-xs font-black", isAccent ? "capitalize text-teal-700" : "text-stone-700")}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

            </aside>
          </div>
        </div>
      </MotionDiv>
    </>
  );
}
