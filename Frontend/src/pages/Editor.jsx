import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Eye, FileImage, ImagePlus, Loader2, Pencil, Save, UploadCloud, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CATEGORIES } from "../constants";
import { createArticle } from "../utility/api";
import { slugify } from "../lib/utils";
import { useAuth } from "../authContext";

const initialForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "physics",
  tags: "",
  status: "published",
  featuredImage: [],
};

export default function Editor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("write");

  const previewUrls = useMemo(() => {
    if (!form.featuredImage?.length) return [];
    return form.featuredImage.map((file) => URL.createObjectURL(file));
  }, [form.featuredImage]);

  useEffect(() => () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "title" && !current.slug ? { slug: slugify(value) } : {}),
    }));
  };

  const addImages = (files) => {
    const incoming = Array.from(files || []);
    if (!incoming.length) return;
    setForm((current) => ({
      ...current,
      featuredImage: [...current.featuredImage, ...incoming].slice(0, 8),
    }));
  };

  const removeImage = (index) => {
    setForm((current) => ({
      ...current,
      featuredImage: current.featuredImage.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPublishing(true);
    setError("");

    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.title),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      };
      delete payload.isFeatured;
      delete payload.isBreaking;

      await createArticle(payload);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Publish failed. Check your role and article fields.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-[1440px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="dark-panel flex flex-col gap-4 overflow-hidden p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Link to="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-stone-300 hover:text-teal-200">
            <ArrowLeft size={17} />
            Back to dashboard
          </Link>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-200">Editorial Studio</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">Submit a new article</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-200">
            Authors submit articles for admin review. Admins can publish directly.
          </p>
        </div>
        <button
          disabled={publishing}
          className="premium-button bg-white text-stone-950 hover:bg-teal-500 hover:text-white disabled:opacity-60"
        >
          {publishing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Submit
        </button>
      </header>

      {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <Field label="Title">
            <textarea
              required
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              rows={2}
              maxLength={200}
              placeholder="Write a clear, magnetic headline"
              className="field text-3xl font-black leading-tight tracking-tight sm:text-5xl"
            />
          </Field>

          <Field label="Slug">
            <input
              required
              value={form.slug}
              onChange={(event) => updateField("slug", slugify(event.target.value))}
              placeholder="article-url-slug"
              className="field"
            />
          </Field>

          <Field label="Excerpt">
            <textarea
              required
              value={form.excerpt}
              onChange={(event) => updateField("excerpt", event.target.value)}
              rows={4}
              maxLength={300}
              placeholder="A concise summary shown across the site"
              className="field text-lg leading-8"
            />
          </Field>

          <div className="premium-card overflow-hidden">
            <div className="flex items-center gap-1 border-b border-black/10 bg-white/60 px-4 py-2">
              <button
                type="button"
                onClick={() => setTab("write")}
                className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] transition ${tab === "write" ? "bg-stone-950 text-white" : "text-stone-500 hover:text-stone-800"
                  }`}
              >
                <Pencil size={13} /> Write
              </button>
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] transition ${tab === "preview" ? "bg-teal-700 text-white" : "text-stone-500 hover:text-stone-800"
                  }`}
              >
                <Eye size={13} /> Preview
              </button>
            </div>
            {tab === "write" ? (
              <div className="p-4">
                <span className="mb-3 block text-xs font-black uppercase tracking-[0.2em] text-stone-500">Content</span>
                <textarea
                  required
                  value={form.content}
                  onChange={(event) => updateField("content", event.target.value)}
                  rows={18}
                  placeholder="Write in Markdown..."
                  className="field font-mono leading-7"
                />
              </div>
            ) : (
              <div className="p-4">
                <span className="mb-3 block text-xs font-black uppercase tracking-[0.2em] text-teal-700">Live Preview</span>
                <div className="markdown-body min-h-[28rem] rounded border border-teal-100 bg-white/80 p-5">
                  <ReactMarkdown>{form.content || "*Start writing to see your article preview here.*"}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="premium-card p-5">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Publishing details</h2>
            <div className="mt-5 space-y-5">
              <Field label="Category" compact>
                <select value={form.category} onChange={(event) => updateField("category", event.target.value)} className="field">
                  {CATEGORIES.filter((item) => item.value).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Tags" compact>
                <input value={form.tags} onChange={(event) => updateField("tags", event.target.value)} placeholder="research, space, ai" className="field" />
              </Field>

              <Field label="Status" compact>
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)} className="field">
                  <option value="published">Publish now</option>
                  <option value="draft">Save as draft</option>
                  {user?.role === "admin" && <option value="pending_review">Send to review queue</option>}
                </select>
              </Field>

              <p className="rounded border border-teal-200 bg-teal-50/70 px-3 py-3 text-sm font-bold leading-6 text-teal-800">
                Featured and breaking placement is assigned by admins during editorial review.
              </p>
            </div>
          </section>

          <section className="premium-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Featured images</h2>
              <span className="text-xs font-bold text-stone-500">{form.featuredImage.length}/8</span>
            </div>
            {previewUrls.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-2">
                {previewUrls.map((url, index) => (
                  <div key={url} className="group relative aspect-video overflow-hidden rounded border border-stone-200 bg-stone-100">
                    <img src={url} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
                    <span className="absolute left-2 top-2 bg-white/90 px-1.5 py-0.5 text-[10px] font-black text-stone-700">{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-stone-700 opacity-0 shadow transition hover:bg-red-500 hover:text-white group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {form.featuredImage.length < 8 && (
                  <label className="grid aspect-video cursor-pointer place-items-center rounded border border-dashed border-teal-300 bg-teal-50/80 text-teal-800 transition hover:bg-teal-100">
                    <span className="flex flex-col items-center gap-1 text-xs font-black uppercase tracking-[0.14em]">
                      <UploadCloud size={22} />
                      Add more
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(event) => { addImages(event.target.files); event.target.value = ""; }}
                    />
                  </label>
                )}
              </div>
            ) : (
              <label className="mt-5 flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded border border-dashed border-stone-300 bg-white/60 px-6 text-sm font-bold text-stone-500 transition hover:border-teal-600">
                <span className="grid h-14 w-14 place-items-center bg-stone-950 text-white">
                  <ImagePlus size={28} />
                </span>
                Upload up to 8 JPG, PNG, WEBP, or GIF images
                <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-teal-700">
                  <FileImage size={15} />
                  Choose images
                </span>
                <input
                  required
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => { addImages(event.target.files); event.target.value = ""; }}
                />
              </label>
            )}
            {form.featuredImage.length > 0 && (
              <button type="button" onClick={() => updateField("featuredImage", [])} className="ghost-button mt-3 w-full">
                <X size={16} />
                Clear all
              </button>
            )}
          </section>


        </aside>
      </div>
    </form>
  );
}

function Field({ label, children, compact = false }) {
  return (
    <label className="premium-card block p-4">
      <span className="mb-3 block text-xs font-black uppercase tracking-[0.2em] text-stone-500">{label}</span>
      <div className={compact ? "" : "min-w-0"}>{children}</div>
    </label>
  );
}
