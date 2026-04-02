"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import SearchableSelect from "../../../components/searchableDropdown";
import ProgressBar from "../../../components/ProgressBar";
import { apiService } from "../../../service/service";

type OptionEntity = {
  _id: string;
  name: string;
};

type EditableCourse = {
  _id: string;
  title: string;
  description: string;
  price: number;
  status: "active" | "inactive" | "archived";
  thumbnailUrl?: string;
  category: string | { _id: string; name?: string };
  instructor: string | { _id: string; name?: string };
};

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600 border-opacity-50"></div>
  </div>
);

const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

export default function EditCourse() {
  const [course, setCourse] = useState<EditableCourse | null>(null);
  const [categories, setCategories] = useState<OptionEntity[]>([]);
  const [instructors, setInstructors] = useState<OptionEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setInitialLoading(true);
      try {
        const token = localStorage.getItem("token");
        const [courseRes, categoriesRes, instructorsRes] = await Promise.all([
          apiService.getCourseById({ courseId: id, token }),
          apiService.getCategories(),
          apiService.getInstructors(),
        ]);

        setCourse(courseRes.course);
        setThumbnailPreview(courseRes.course?.thumbnailUrl || "");
        setCategories(categoriesRes?.categories || []);
        setInstructors(instructorsRes?.instructor || []);
      } catch (error) {
        console.error("Error fetching course details", error);
        setSubmitError("Unable to load course details.");
      } finally {
        setInitialLoading(false);
      }
    };

    void fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!course) return;

    const categoryId =
      typeof course.category === "string" ? course.category : course.category?._id;
    const instructorId =
      typeof course.instructor === "string"
        ? course.instructor
        : course.instructor?._id;

    if (!course.title.trim() || !course.description.trim()) {
      setSubmitError("Title and description are required.");
      return;
    }

    if (!categoryId || !instructorId) {
      setSubmitError("Category and instructor are required.");
      return;
    }

    setLoading(true);
    setSubmitError("");
    setUploadProgress(0);
    setUploadedBytes(0);
    setTotalBytes(0);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("title", course.title.trim());
      formData.append("description", course.description.trim());
      formData.append("price", String(course.price || 0));
      formData.append("categoryId", categoryId);
      formData.append("instructorId", instructorId);
      formData.append("status", course.status);

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      } else if (course.thumbnailUrl) {
        formData.append("thumbnailUrl", course.thumbnailUrl);
      }

      await apiService.updateCourse({
        courseId: id,
        token,
        formData,
        onUploadProgress: (event: ProgressEvent) => {
          const total = event.total || 0;
          const loaded = event.loaded;
          const percent = Math.round((loaded * 100) / (total || 1));

          setUploadProgress(percent);
          setUploadedBytes(loaded);
          setTotalBytes(total);
        },
      });

      toast.success("Course updated successfully");
      router.push("/courses");
    } catch (error) {
      console.error("Error updating course", error);
      setSubmitError("Failed to update course. Please try again.");
      toast.error("Failed to update course");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <Spinner />;
  }

  if (!course) {
    return <div className="p-6">Course not found.</div>;
  }

  const selectedCategoryId =
    typeof course.category === "string" ? course.category : course.category?._id || "";
  const selectedInstructorId =
    typeof course.instructor === "string"
      ? course.instructor
      : course.instructor?._id || "";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Course</h1>
      <Toaster position="top-right" />

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
        {submitError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        <div>
          <label className="block font-medium">Title</label>
          <input
            type="text"
            value={course.title}
            onChange={(e) => setCourse({ ...course, title: e.target.value })}
            className="w-full border px-4 py-2 rounded-lg"
          />
        </div>

        <div>
          <label className="block font-medium">Description</label>
          <textarea
            value={course.description}
            onChange={(e) => setCourse({ ...course, description: e.target.value })}
            className="w-full border px-4 py-2 rounded-lg min-h-32"
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
              setThumbnailPreview(file ? URL.createObjectURL(file) : course.thumbnailUrl || "");
            }}
            className="w-full border px-4 py-2 rounded-lg"
          />
          {thumbnailPreview ? (
            <div className="mt-4">
              <Image
                src={thumbnailPreview}
                alt="Course thumbnail preview"
                width={240}
                height={140}
                className="rounded-lg object-cover border"
                unoptimized
              />
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">No thumbnail selected.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchableSelect
            label="Category"
            options={categories.map((item) => ({ label: item.name, value: item._id }))}
            value={selectedCategoryId}
            onChange={(value) =>
              setCourse({
                ...course,
                category: value,
              })
            }
          />
          <SearchableSelect
            label="Instructor"
            options={instructors.map((item) => ({ label: item.name, value: item._id }))}
            value={selectedInstructorId}
            onChange={(value) =>
              setCourse({
                ...course,
                instructor: value,
              })
            }
          />
          <div>
            <label className="block font-medium">Price</label>
            <input
              type="number"
              value={course.price}
              onChange={(e) =>
                setCourse({ ...course, price: Number(e.target.value) })
              }
              className="w-full border px-4 py-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-medium">Status</label>
            <select
              value={course.status}
              onChange={(e) =>
                setCourse({
                  ...course,
                  status: e.target.value as EditableCourse["status"],
                })
              }
              className="w-full border px-4 py-2 rounded-lg bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
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

        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Large video uploads are now allowed up to 5GB per file on the backend. Thumbnail replacement here updates the course cover only.
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-70"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Course"}
        </button>
      </form>
    </div>
  );
}
