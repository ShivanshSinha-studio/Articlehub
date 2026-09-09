import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router";
import { BarChart3, Check, Clock3, Eye, FileText, Filter, Loader2, MailCheck, MoreVertical, PenLine, Plus, Search, ShieldAlert, Sparkles, Trash2, UsersRound, X } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../authContext";
import { deleteArticle, deleteAuthor, getAdminArticles, getAllArticles, getArticleReviews, getAuthorRequests, getAuthors, getMyArticles, requestAuthorAccess, resendVerification, reviewArticle, reviewAuthorRequest, submitArticleForReview } from "../utility/api";
import { formatDate, getImageUrl, readingTime } from "../lib/utils";

const MotionArticle = motion.article;

export default function Dashboard() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [articleReviews, setArticleReviews] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [adminArticles, setAdminArticles] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [requestingAuthor, setRequestingAuthor] = useState(false);
  const [verificationLink, setVerificationLink] = useState("");
  const [authorNotes, setAuthorNotes] = useState({});
  const [adminSearch, setAdminSearch] = useState("");
  const [adminStatus, setAdminStatus] = useState("all");
  const [error, setError] = useState("");
  const canCreate = ["author", "admin"].includes(user?.role);
  const isAdmin = user?.role === "admin";
  const workspaceMessage = canCreate
    ? "Manage your articles, publish directly, and keep your writing desk moving."
    : user?.authorRequestStatus === "pending"
      ? "Your author request is pending admin approval."
      : user?.authorRequestStatus === "rejected"
        ? `Your author request was rejected.${user?.authorRequestAdminNote ? ` Note: ${user.authorRequestAdminNote}` : ""}`
        : "Your account is active. Request author access if you need publishing tools.";

  useEffect(() => {
    let active = true;

    const fetchArticles = async () => {
      setLoading(true);
      setError("");
      try {
        const list = canCreate ? await getMyArticles() : (await getAllArticles({ limit: 6 })).articles || [];
        if (active) setArticles(list);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Could not load dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchArticles();
    return () => {
      active = false;
    };
  }, [canCreate]);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    const fetchRequests = async () => {
      setRequestsLoading(true);
      try {
        const data = await getAuthorRequests();
        if (active) setRequests(data.requests || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Could not load author requests.");
      } finally {
        if (active) setRequestsLoading(false);
      }
    };

    fetchRequests();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    const fetchAdminData = async () => {
      setAdminDataLoading(true);
      try {
        const [authorList, articleData] = await Promise.all([
          getAuthors(),
          getAdminArticles({ limit: 50 }),
        ]);
        if (!active) return;
        setAuthors(authorList);
        setAdminArticles(articleData.articles || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Could not load admin management data.");
      } finally {
        if (active) setAdminDataLoading(false);
      }
    };

    fetchAdminData();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    const fetchArticleReviews = async () => {
      try {
        const data = await getArticleReviews();
        if (active) setArticleReviews(data.articles || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Could not load article reviews.");
      }
    };

    fetchArticleReviews();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const handleRequestAuthor = async () => {
    setRequestingAuthor(true);
    setError("");
    try {
      await requestAuthorAccess({ authorRequestMessage: "I want to publish articles on ArticleHub." });
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit author request.");
    } finally {
      setRequestingAuthor(false);
    }
  };

  const handleResendVerification = async () => {
    setError("");
    setVerificationLink("");
    try {
      const data = await resendVerification();
      setVerificationLink(data.verificationUrl);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate verification link.");
    }
  };

  const handleReview = async (id, status) => {
    try {
      await reviewAuthorRequest(id, status, authorNotes[id] || "");
      setRequests((current) => current.filter((request) => request._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not review request.");
    }
  };

  const handleSubmitArticle = async (id) => {
    try {
      const updated = await submitArticleForReview(id);
      setArticles((current) => current.map((article) => article._id === id ? updated : article));
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit article.");
    }
  };

  const handleDeleteArticle = async (id) => {
    const confirmed = window.confirm("Delete this article permanently?");
    if (!confirmed) return;

    try {
      await deleteArticle(id);
      setAdminArticles((current) => current.filter((article) => article._id !== id));
      setArticleReviews((current) => current.filter((article) => article._id !== id));
      setArticles((current) => current.filter((article) => article._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete article.");
    }
  };

  const handleDeleteAuthor = async (authorId) => {
    const author = authors.find((a) => a._id === authorId);
    const confirmed = window.confirm(`Remove author "${author?.name}" and all their articles? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteAuthor(authorId);
      setAuthors((current) => current.filter((author) => author._id !== authorId));
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove author.");
    }
  };

  const handleToggleArticleFlag = async (article, key) => {
    try {
      const updated = await reviewArticle(article._id, {
        status: "published",
        reviewNote: article.reviewNote || "",
        isFeatured: key === "isFeatured" ? !article.isFeatured : !!article.isFeatured,
        isBreaking: key === "isBreaking" ? !article.isBreaking : !!article.isBreaking,
      });
      setAdminArticles((current) => current.map((item) => item._id === updated._id ? updated : item));
      setArticleReviews((current) => current.filter((item) => item._id !== updated._id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not update article placement.");
    }
  };

  const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
  const adminStats = useMemo(() => {
    const published = adminArticles.filter((article) => article.status === "published").length;
    const drafts = adminArticles.filter((article) => article.status === "draft").length;
    const pending = adminArticles.filter((article) => article.status === "pending_review").length + articleReviews.length;
    const platformViews = adminArticles.reduce((sum, article) => sum + (article.views || 0), 0);

    return { published, drafts, pending, platformViews };
  }, [adminArticles, articleReviews.length]);

  const filteredAdminArticles = useMemo(() => {
    const normalizedSearch = adminSearch.trim().toLowerCase();

    return adminArticles.filter((article) => {
      const statusMatches = adminStatus === "all" || article.status === adminStatus;
      const searchMatches = !normalizedSearch
        || article.title?.toLowerCase().includes(normalizedSearch)
        || article.category?.toLowerCase().includes(normalizedSearch)
        || article.author?.name?.toLowerCase().includes(normalizedSearch)
        || article.author?.email?.toLowerCase().includes(normalizedSearch);

      return statusMatches && searchMatches;
    });
  }, [adminArticles, adminSearch, adminStatus]);

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="dark-panel grid gap-6 overflow-hidden p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-200">Workspace</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Welcome back, {user?.name || "reader"}.
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-stone-200">{workspaceMessage}</p>
        </div>
        {canCreate ? (
          <Link to="/editor" className="premium-button bg-white text-stone-950 hover:bg-teal-500 hover:text-white">
            <Plus size={18} />
            New article
          </Link>
        ) : !user?.emailVerified ? (
          <button
            onClick={handleResendVerification}
            className="ghost-button bg-white text-teal-800"
          >
            <MailCheck size={18} />
            Generate verification link
          </button>
        ) : (
          <button
            onClick={handleRequestAuthor}
            disabled={requestingAuthor || user?.authorRequestStatus === "pending"}
            className="ghost-button bg-white text-amber-800 disabled:opacity-60"
          >
            {requestingAuthor ? <Loader2 className="animate-spin" size={18} /> : <ShieldAlert size={18} />}
            {user?.authorRequestStatus === "pending" ? "Author request pending" : "Request author access"}
          </button>
        )}
      </section>

      {verificationLink && (
        <div className="premium-card px-4 py-3 text-sm font-semibold text-teal-800">
          Dev verification link: <a className="font-black underline" href={verificationLink}>{verificationLink}</a>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Stat icon={FileText} label={canCreate ? "Your articles" : "Recent articles"} value={articles.length} />
        <Stat icon={Eye} label="Total views" value={totalViews} />
        <Stat icon={BarChart3} label={user?.emailVerified ? "Role" : "Email"} value={user?.emailVerified ? user?.role || "user" : "unverified"} />
      </section>

      {isAdmin && (
        <section className="admin-workspace space-y-5">
          <div className="admin-metric-grid">
            <AdminMetric icon={FileText} label="Published" value={adminStats.published} tone="teal" />
            <AdminMetric icon={Clock3} label="Needs review" value={adminStats.pending} tone="amber" />
            <AdminMetric icon={UsersRound} label="Authors" value={authors.length} tone="stone" />
            <AdminMetric icon={Eye} label="Platform views" value={adminStats.platformViews} tone="rose" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
            <aside className="space-y-5">
              <div className="admin-side-panel p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="subtle-label">Command Center</p>
                    <h2 className="mt-2 text-xl font-black tracking-tight">Admin overview</h2>
                  </div>
                  <Sparkles className="text-teal-700" size={22} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <MiniMetric label="Drafts" value={adminStats.drafts} />
                  <MiniMetric label="Requests" value={requests.length} />
                  <MiniMetric label="Loaded" value={adminArticles.length} />
                  <MiniMetric label="Filtered" value={filteredAdminArticles.length} />
                </div>
              </div>

              <div className="admin-side-panel p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="subtle-label">Authors</p>
                    <h2 className="mt-2 text-xl font-black tracking-tight">Author roster</h2>
                  </div>
                  <UsersRound className="text-teal-700" size={22} />
                </div>

                {adminDataLoading ? (
                  <div className="grid min-h-40 place-items-center">
                    <Loader2 className="animate-spin text-teal-700" size={28} />
                  </div>
                ) : authors.length ? (
                  <div className="mt-5 max-h-[430px] space-y-3 overflow-auto pr-1">
                    {authors.map((author) => (
                      <div key={author._id} className="admin-author-row group">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="admin-avatar">
                            {author.name?.charAt(0)?.toUpperCase() || "A"}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-black text-stone-950">{author.name}</div>
                            <div className="truncate text-sm font-semibold text-stone-500">{author.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={author.emailVerified ? "verified" : "unverified"} />
                          <button
                            type="button"
                            onClick={() => handleDeleteAuthor(author._id)}
                            className="rounded p-1 text-stone-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                            title="Remove author"
                            aria-label="Remove author"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty-box mt-5">No authors yet.</div>
                )}
              </div>
            </aside>

            <div className="admin-control-panel overflow-hidden">
              <div className="admin-control-header p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="subtle-label">All Articles</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight">Platform article control</h2>
                    <p className="mt-2 max-w-xl text-sm font-semibold theme-muted">
                      Review published, draft, and pending content without the broken table scroll.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[minmax(220px,360px)_180px]">
                    <label className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
                      <input
                        value={adminSearch}
                        onChange={(event) => setAdminSearch(event.target.value)}
                        placeholder="Search title, author, category"
                        className="admin-filter-field h-12 pl-10 text-sm"
                      />
                    </label>
                    <label className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
                      <select value={adminStatus} onChange={(event) => setAdminStatus(event.target.value)} className="admin-filter-field h-12 appearance-none pl-10 pr-8 text-sm">
                        <option value="all">All status</option>
                        <option value="published">Published</option>
                        <option value="pending_review">Pending review</option>
                        <option value="draft">Draft</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>

              {adminDataLoading ? (
                <div className="grid min-h-72 place-items-center">
                  <Loader2 className="animate-spin text-teal-700" size={28} />
                </div>
              ) : filteredAdminArticles.length ? (
                <div className="admin-article-list">
                  <div className="admin-article-head">
                    <span>Article</span>
                    <span>Author</span>
                    <span>Status</span>
                    <span>Views</span>
                    <span>Updated</span>
                    <span className="text-right">Actions</span>
                  </div>
                  {filteredAdminArticles.map((article) => (
                    <article key={article._id} className="admin-article-row">
                      <div className="admin-article-main">
                        <div className="admin-article-thumb">
                          <img src={getImageUrl(article, 0)} alt={article.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-base font-black leading-tight theme-text">{article.title}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-teal-700">
                            <span>{article.category}</span>
                            {article.isFeatured && <span className="admin-mini-pill">Featured</span>}
                            {article.isBreaking && <span className="admin-mini-pill danger">Breaking</span>}
                          </div>
                        </div>
                      </div>

                      <div className="admin-row-cell">
                        <span className="admin-mobile-label">Author</span>
                        <div className="font-black theme-text">{article.author?.name || "Unknown"}</div>
                        <div className="mt-1 truncate text-xs font-semibold theme-muted">{article.author?.email || "No email"}</div>
                      </div>

                      <div className="admin-row-cell">
                        <span className="admin-mobile-label">Status</span>
                        <StatusBadge status={article.status?.replace("_", " ") || "published"} />
                      </div>

                      <div className="admin-row-cell">
                        <span className="admin-mobile-label">Views</span>
                        <span className="text-lg font-black theme-text">{article.views || 0}</span>
                      </div>

                      <div className="admin-row-cell">
                        <span className="admin-mobile-label">Updated</span>
                        <span className="text-sm font-bold theme-muted">{formatDate(article.updatedAt || article.createdAt)}</span>
                      </div>

                      <div className="admin-row-actions">
                        {article.status === "published" && (
                          <Link to={`/article/${article.slug}`} className="admin-action-button">
                            <Eye size={15} />
                            View
                          </Link>
                        )}
                        {article.status === "published" && (
                          <ArticleMenu article={article} onToggleFeature={() => handleToggleArticleFlag(article, "isFeatured")} onToggleBreaking={() => handleToggleArticleFlag(article, "isBreaking")} />
                        )}
                        <button type="button" onClick={() => handleDeleteArticle(article._id)} className="admin-action-button danger">
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-sm font-semibold text-stone-500">No articles match the current filters.</div>
              )}
            </div>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Author approval queue</h2>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">{requests.length} pending</span>
          </div>

          {requestsLoading ? (
            <div className="premium-card grid min-h-40 place-items-center">
              <Loader2 className="animate-spin text-teal-700" size={28} />
            </div>
          ) : requests.length ? (
            <div className="grid gap-4">
              {requests.map((request) => (
                <article key={request._id} className="premium-card grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-black tracking-tight">{request.name}</h3>
                      <span className="text-sm font-semibold text-stone-500">{request.email}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {request.authorRequestMessage || "No author note provided."}
                    </p>
                    <textarea
                      value={authorNotes[request._id] || ""}
                      onChange={(event) => setAuthorNotes({ ...authorNotes, [request._id]: event.target.value })}
                      rows={2}
                      maxLength={500}
                      className="field mt-3"
                      placeholder="Admin note or rejection reason"
                    />
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
                      Requested {formatDate(request.updatedAt || request.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(request._id, "approved")}
                      className="premium-button bg-teal-700 text-xs uppercase tracking-[0.16em]"
                    >
                      <Check size={15} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(request._id, "rejected")}
                      className="ghost-button text-xs uppercase tracking-[0.16em] hover:border-red-300 hover:text-red-700"
                    >
                      <X size={15} />
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="premium-card px-6 py-10 text-center text-sm font-semibold text-stone-500">
              No pending author requests.
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">{canCreate ? "Your articles" : "Latest reads"}</h2>
        </div>

        {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        {loading ? (
          <div className="premium-card grid min-h-56 place-items-center">
            <Loader2 className="animate-spin text-teal-700" size={32} />
          </div>
        ) : articles.length ? (
          <div className="grid gap-4">
            {articles.map((article, index) => (
              <MotionArticle
                key={article._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="premium-card grid gap-4 p-4 md:grid-cols-[168px_1fr_auto] md:items-center"
              >
                <Link to={`/article/${article.slug}`} className="aspect-[16/10] overflow-hidden bg-stone-100">
                  <img src={getImageUrl(article, index)} alt={article.title} className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-stone-500">
                    <span className="uppercase tracking-[0.16em] text-teal-700">{article.category}</span>
                    <span className="uppercase tracking-[0.16em]">{article.status?.replace("_", " ") || "published"}</span>
                    <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                    <span>{readingTime(article.content)} min read</span>
                  </div>
                  {article.status === "published" ? (
                    <Link to={`/article/${article.slug}`}>
                      <h3 className="mt-2 truncate text-xl font-black tracking-tight transition hover:text-teal-700">{article.title}</h3>
                    </Link>
                  ) : (
                    <h3 className="mt-2 truncate text-xl font-black tracking-tight">{article.title}</h3>
                  )}
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-600">{article.excerpt}</p>
                  {article.reviewNote && (
                    <p className="mt-2 text-sm font-semibold text-red-700">Review note: {article.reviewNote}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {article.status === "published" && (
                    <Link to={`/article/${article.slug}`} className="ghost-button text-xs uppercase tracking-[0.18em]">
                      <PenLine size={15} />
                      View
                    </Link>
                  )}
                  {["draft", "rejected"].includes(article.status) && (
                    <button
                      onClick={() => handleSubmitArticle(article._id)}
                      className="premium-button text-xs uppercase tracking-[0.18em]"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </MotionArticle>
            ))}
          </div>
        ) : (
          <div className="premium-card px-6 py-16 text-center">
            <FileText className="mx-auto text-stone-300" size={42} />
            <h3 className="mt-4 text-2xl font-black">No articles yet</h3>
            {canCreate && (
              <Link to="/editor" className="premium-button mt-6">
                Create first article
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  const IconComponent = Icon;

  return (
    <div className="premium-card p-5">
      <div className="flex items-center gap-3 text-stone-500">
        <IconComponent size={19} />
        <span className="text-xs font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="mt-5 text-3xl font-black tracking-tight capitalize">{value}</div>
    </div>
  );
}

function AdminMetric({ icon: Icon, label, value, tone = "stone" }) {
  const IconComponent = Icon;

  return (
    <div className={`admin-stat-card tone-${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="admin-stat-icon">
          <IconComponent size={20} />
        </span>
        <span className="admin-live-chip">Live</span>
      </div>
      <div className="mt-5 text-3xl font-black tracking-tight theme-text">{value}</div>
      <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] theme-muted">{label}</div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="admin-mini-metric">
      <div className="text-2xl font-black theme-text">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] theme-muted">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = status || "unknown";
  const colorClass = normalized.includes("published") || normalized === "verified"
    ? "border-teal-100 bg-teal-50 text-teal-700"
    : normalized.includes("pending")
      ? "border-amber-100 bg-amber-50 text-amber-700"
      : normalized.includes("reject") || normalized === "unverified"
        ? "border-red-100 bg-red-50 text-red-700"
        : "border-stone-200 bg-stone-50 text-stone-600";

  return (
    <span className={`inline-flex border px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${colorClass}`}>
      {normalized}
    </span>
  );
}

function ArticleMenu({ article, onToggleFeature, onToggleBreaking }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="admin-action-button"
        aria-label="More options"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded border border-stone-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={() => {
              onToggleFeature();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm font-bold text-stone-700 hover:bg-stone-50"
          >
            <Sparkles size={14} />
            {article.isFeatured ? "Remove featured" : "Mark featured"}
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleBreaking();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm font-bold text-stone-700 hover:bg-stone-50"
          >
            <ShieldAlert size={14} />
            {article.isBreaking ? "Remove breaking" : "Mark breaking"}
          </button>
        </div>
      )}
    </div>
  );
}
