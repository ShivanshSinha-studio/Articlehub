import { Link } from "react-router";
import { ArrowUpRight, Clock3, Eye, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { CATEGORY_ACCENTS } from "../constants";
import { cn, formatDate, getAuthorName, getImageUrl, readingTime } from "../lib/utils";

const MotionArticle = motion.article;

export default function ArticleCard({ article, index = 0, featured = false }) {
  const accent = CATEGORY_ACCENTS[article.category] || "bg-stone-50 text-stone-700 border-stone-100";

  return (
    <MotionArticle
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.24) }}
      className={cn("article-card premium-card group overflow-hidden", featured ? "is-featured grid min-h-full grid-cols-1 md:grid-cols-[1.1fr_0.9fr]" : "flex flex-col")}
    >
      <Link to={`/article/${article.slug}`} className={cn("article-card-media relative block overflow-hidden", featured ? "min-h-80" : "aspect-[16/10]")}>
        <img
          src={getImageUrl(article, index)}
          alt={article.title}
          loading={featured ? "eager" : "lazy"}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
        {article.isBreaking && (
          <span className="article-status-badge is-breaking absolute left-4 top-4">
            Breaking
          </span>
        )}
        {article.isFeatured && (
          <span className="article-status-badge is-featured absolute right-4 top-4 inline-flex items-center gap-1">
            <Sparkles size={12} />
            Featured
          </span>
        )}
      </Link>

      <div className={cn("article-card-body flex flex-1 flex-col p-5", featured ? "md:p-8" : "")}>
        <div className="article-card-meta mb-4 flex flex-wrap items-center gap-2">
          <span className={cn("border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]", accent)}>
            {article.category}
          </span>
          <span className="text-xs font-semibold theme-muted">{formatDate(article.publishedAt || article.createdAt)}</span>
        </div>

        <Link to={`/article/${article.slug}`} className="block">
          <h3 className={cn("home-card-title font-black leading-tight tracking-tight transition group-hover:text-teal-700", featured ? "text-3xl md:text-4xl" : "text-2xl")}>
            {article.title}
          </h3>
        </Link>

        <p className={cn("home-card-copy mt-4 leading-7", featured ? "text-base" : "line-clamp-3 text-sm")}>
          {article.excerpt}
        </p>

        <div className="article-card-footer theme-line theme-muted mt-auto flex items-center gap-4 border-t pt-5 text-xs font-semibold">
          <span>{getAuthorName(article.author)}</span>
          <span className="ml-auto inline-flex items-center gap-1">
            <Clock3 size={14} />
            {readingTime(article.content)} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={14} />
            {article.views || 0}
          </span>
        </div>

        <Link
          to={`/article/${article.slug}`}
          className="article-card-link mt-5 inline-flex w-fit items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-teal-700"
        >
          Read article <ArrowUpRight size={15} />
        </Link>
      </div>
    </MotionArticle>
  );
}
