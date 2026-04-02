"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import ProgressBar from "./ProgressBar";

type CourseOption = {
  _id: string;
  title: string;
};

type BundleFormValues = {
  title: string;
  description: string;
  bundleType: "core_pass" | "apex_pass";
  price: number;
  discountPrice: number;
  status: "active" | "inactive" | "archived";
  courseIds: string[];
  thumbnailUrl?: string;
};

type Props = {
  mode: "create" | "edit";
  initialValues: BundleFormValues;
  courses: CourseOption[];
  loading: boolean;
  uploadProgress: number;
  uploadedBytes: number;
  totalBytes: number;
  error: string;
  submitLabel: string;
  onSubmit: (payload: { values: BundleFormValues; thumbnailFile: File | null }) => Promise<void>;
};

const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

export default function BundleForm({
  mode,
  initialValues,
  courses,
  loading,
  uploadProgress,
  uploadedBytes,
  totalBytes,
  error,
  submitLabel,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<BundleFormValues>(initialValues);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(initialValues.thumbnailUrl || "");
  const [search, setSearch] = useState("");

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((course) => course.title.toLowerCase().includes(query));
  }, [courses, search]);

  const toggleCourse = (courseId: string) => {
    setValues((current) => ({
      ...current,
      courseIds: current.courseIds.includes(courseId)
        ? current.courseIds.filter((id) => id !== courseId)
        : [...current.courseIds, courseId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit({ values, thumbnailFile });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <label className="block font-medium">Bundle Title</label>
        <input
          value={values.title}
          onChange={(e) => setValues((current) => ({ ...current, title: e.target.value }))}
          className="w-full border px-4 py-2 rounded-lg"
        />
      </div>

      <div>
        <label className="block font-medium">Description</label>
        <textarea
          value={values.description}
          onChange={(e) =>
            setValues((current) => ({ ...current, description: e.target.value }))
          }
          className="w-full min-h-32 border px-4 py-2 rounded-lg"
        />
      </div>

      <div>
        <label className="block font-medium mb-2">Thumbnail</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setThumbnailFile(file);
            setThumbnailPreview(file ? URL.createObjectURL(file) : values.thumbnailUrl || "");
          }}
          className="w-full border px-4 py-2 rounded-lg"
        />
        {thumbnailPreview ? (
          <div className="mt-4">
            <Image
              src={thumbnailPreview}
              alt="Bundle thumbnail preview"
              width={240}
              height={140}
              className="rounded-lg object-cover border"
              unoptimized
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            {mode === "create" ? "No thumbnail selected." : "No thumbnail uploaded yet."}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Bundle Type</label>
          <select
            value={values.bundleType}
            onChange={(e) =>
              setValues((current) => ({
                ...current,
                bundleType: e.target.value as BundleFormValues["bundleType"],
              }))
            }
            className="w-full border px-4 py-2 rounded-lg bg-white"
          >
            <option value="core_pass">Core Pass</option>
            <option value="apex_pass">Apex Pass</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Status</label>
          <select
            value={values.status}
            onChange={(e) =>
              setValues((current) => ({
                ...current,
                status: e.target.value as BundleFormValues["status"],
              }))
            }
            className="w-full border px-4 py-2 rounded-lg bg-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Price</label>
          <input
            type="number"
            value={values.price}
            onChange={(e) =>
              setValues((current) => ({ ...current, price: Number(e.target.value) }))
            }
            className="w-full border px-4 py-2 rounded-lg"
          />
        </div>

        <div>
          <label className="block font-medium">Discount Price</label>
          <input
            type="number"
            value={values.discountPrice}
            onChange={(e) =>
              setValues((current) => ({
                ...current,
                discountPrice: Number(e.target.value),
              }))
            }
            className="w-full border px-4 py-2 rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="block font-medium">Included Courses</label>
          <div className="text-sm text-gray-500">{values.courseIds.length} selected</div>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="w-full border px-4 py-2 rounded-lg"
        />
        <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
          {filteredCourses.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500">No courses found.</div>
          ) : (
            filteredCourses.map((course) => (
              <label
                key={course._id}
                className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={values.courseIds.includes(course._id)}
                  onChange={() => toggleCourse(course._id)}
                />
                <span className="text-sm text-gray-800">{course.title}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt-4">
          <ProgressBar percent={uploadProgress} />
          <p className="text-sm text-gray-600 mt-1">
            {totalBytes > 0
              ? `${formatMB(uploadedBytes)} MB / ${formatMB(totalBytes)} MB uploaded (${uploadProgress}%)`
              : "Preparing upload..."}
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-70"
        disabled={loading}
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
