import axiosClient from "./axiosClient";

export const getAllArticles = async ({ page = 1, limit = 12, category = "", search = "" } = {}) => {
  const { data } = await axiosClient.get("/api/getAll", {
    params: {
      page,
      limit,
      ...(category ? { category } : {}),
      ...(search ? { search } : {}),
    },
  });

  return data;
};

export const getArticle = async (slug) => {
  const { data } = await axiosClient.get(`/api/article/${slug}`);
  return data.article;
};

export const getFeaturedArticles = async () => {
  const { data } = await axiosClient.get("/api/articles/featured");
  return data.articles || [];
};

export const getBreakingArticles = async () => {
  const { data } = await axiosClient.get("/api/articles/breaking");
  return data.articles || [];
};

export const getMyArticles = async () => {
  const { data } = await axiosClient.get("/api/articles/myArticle");
  return data.articles || [];
};

export const getBookmarkedArticles = async ({ page = 1, limit = 24 } = {}) => {
  const { data } = await axiosClient.get("/api/articles/bookmarks", {
    params: { page, limit },
  });
  return data;
};

export const login = async (credentials) => {
  const { data } = await axiosClient.post("/api/Auth/login", credentials);
  return data.user;
};

export const googleAuth = async (payload) => {
  const { data } = await axiosClient.post("/api/Auth/google", payload);
  return data.user;
};

export const register = async (payload) => {
  const { data } = await axiosClient.post("/api/Auth/register", payload);
  return data;
};

export const verifyEmail = async (token) => {
  const { data } = await axiosClient.get(`/api/Auth/verify-email/${token}`);
  return data;
};

export const resendVerification = async () => {
  const { data } = await axiosClient.post("/api/Auth/resend-verification");
  return data;
};

export const resendVerificationByEmail = async (email) => {
  const { data } = await axiosClient.post("/api/Auth/resend-verification-email", { email });
  return data;
};

export const requestAuthorAccess = async (payload) => {
  const { data } = await axiosClient.post("/api/Auth/request-author", payload);
  return data.user;
};

export const getAuthorRequests = async () => {
  const { data } = await axiosClient.get("/api/Auth/author-requests");
  return data;
};

export const getAuthors = async () => {
  const { data } = await axiosClient.get("/api/Auth/authors");
  return data.authors || [];
};

export const deleteAuthor = async (id) => {
  const { data } = await axiosClient.delete(`/api/Auth/authors/${id}`);
  return data;
};

export const reviewAuthorRequest = async (id, status, adminNote = "") => {
  const { data } = await axiosClient.patch(`/api/Auth/author-requests/${id}`, { status, adminNote });
  return data.user;
};

export const getArticleReviews = async ({ page = 1, limit = 10 } = {}) => {
  const { data } = await axiosClient.get("/api/articles/review", { params: { page, limit } });
  return data;
};

export const getAdminArticles = async ({ page = 1, limit = 50, search = "" } = {}) => {
  const { data } = await axiosClient.get("/api/articles/admin/all", { params: { page, limit, ...(search ? { search } : {}) } });
  return data;
};

export const reviewArticle = async (id, payload) => {
  const { data } = await axiosClient.patch(`/api/articles/review/${id}`, payload);
  return data.article;
};

export const submitArticleForReview = async (id) => {
  const { data } = await axiosClient.patch(`/api/articles/${id}/submit`);
  return data.article;
};

export const deleteArticle = async (id) => {
  const { data } = await axiosClient.delete(`/api/articles/${id}`);
  return data;
};

// Article Actions (Like, Bookmark, Check Status)
export const toggleLike = async (articleId) => {
  const { data } = await axiosClient.post(`/api/like/${articleId}`);
  return data;
};

export const toggleBookmark = async (articleId) => {
  const { data } = await axiosClient.post(`/api/bookmark/${articleId}`);
  return data;
};

export const checkUserAction = async (articleId) => {
  const { data } = await axiosClient.get(`/api/check/${articleId}`);
  return data;
};

// Comment Actions
export const addComment = async (articleId, content) => {
  const { data } = await axiosClient.post(`/api/comments/${articleId}`, { content });
  return data;
};

export const getComments = async (articleId, { page = 1, limit = 10 } = {}) => {
  const { data } = await axiosClient.get(`/api/comments/${articleId}`, {
    params: { page, limit }
  });
  return data;
};

export const deleteComment = async (commentId) => {
  const { data } = await axiosClient.delete(`/api/comments/${commentId}`);
  return data;
};

export const toggleCommentLike = async (commentId) => {
  const { data } = await axiosClient.post(`/api/comments/${commentId}/like`);
  return data;
};

export const updateComment = async (commentId, content) => {
  const { data } = await axiosClient.patch(`/api/comments/${commentId}`, { content });
  return data;
};

export const getPrivateArticle = async (id) => {
  const { data } = await axiosClient.get(`/api/articles/private/${id}`);
  return data.article;
};

export const updateArticle = async (id, payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    const apiKey = key === "featuredImage" ? "featuredImages" : key;
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(apiKey, item));
      return;
    }
    formData.append(apiKey, value);
  });

  const { data } = await axiosClient.put(`/api/articles/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data.article;
};

export const getAuditLogs = async ({ page = 1, limit = 10 } = {}) => {
  const { data } = await axiosClient.get("/api/articles/audit-logs", { params: { page, limit } });
  return data;
};

export const logout = async () => {
  await axiosClient.post("/api/Auth/logout");
};

export const checkAuth = async () => {
  const { data } = await axiosClient.get("/api/Auth/check");
  return data.user;
};

export const createArticle = async (payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    const apiKey = key === "featuredImage" ? "featuredImages" : key;
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(apiKey, item));
      return;
    }
    formData.append(apiKey, value);
  });

  const { data } = await axiosClient.post("/api/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data.article;
};
