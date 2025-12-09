"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useEffect, useState } from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import SearchableSelect from "../../components/searchableDropdown";
import ProgressBar from "../../components/ProgressBar";
import { apiService } from "../../service/service";

const courseSchema = yup.object().shape({
  title: yup.string().required("Title is required"),
  description: yup.string().required("Description is required"),
  categoryId: yup.string().required("Category is required"),
  instructorId: yup.string().required("Instructor is required"),
  price: yup
    .number()
    .typeError("Price must be a number")
    .required("Price is required"),
  thumbnail: yup.mixed().nullable(), // optional
  lessons: yup
    .array()
    .of(
      yup.object().shape({
        title: yup.string().required("Lesson title is required"),
        content: yup.string().required("Lesson content is required"),
        duration: yup.string().required("Duration is required"),
        videoFile: yup.mixed().nullable(),
        videoLink: yup.string().nullable(),
      }).test("either_video", "Either video file or video link is required", function(value) {
        const hasFile = value.videoFile && (value.videoFile instanceof FileList) && value.videoFile.length > 0;
        const hasLink = Boolean(value.videoLink && value.videoLink.trim().length > 0);
        if (! (hasFile || hasLink)) {
          return this.createError({ message: "Either video file or video link is required" });
        }
        return true;
      })
    )
    .min(1, "At least one lesson is required"),
});

interface Category {
  _id: string;
  name: string;
}

interface Instructor {
  _id: string;
  name: string;
}

export default function CreateCoursePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [message, setMessage] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    (async () => {
      try {
        const categoriesRes = await apiService.getCategories();
        setCategories(categoriesRes?.categories || []);

        const instructorsRes = await apiService.getInstructors();
        setInstructors(instructorsRes?.instructor || []);
      } catch (err) {
        console.error("❌ Failed to fetch data:", err);
      }
    })();
  }, [token]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      instructorId: "",
      price: 0,
      thumbnail: undefined,
      lessons: [{ title: "", content: "", duration: "", videoFile: undefined, videoLink: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lessons",
  });

  const onSubmit = async (data: yup.InferType<typeof courseSchema>) => {
    try {
      setIsSubmitting(true);
      setMessage("");
      setUploadProgress(0);
      setUploadedBytes(0);
      setTotalBytes(0);

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("categoryId", data.categoryId);
      formData.append("instructorId", data.instructorId);
      formData.append("price", String(data.price));

      // optional thumbnail
      if (data.thumbnail && (data.thumbnail as FileList).length > 0) {
        formData.append("thumbnail", (data.thumbnail as FileList)[0]);
      }

      // lessons metadata + videos
      if (data.lessons) {
        const lessonsMeta = data.lessons.map((lesson, index) => ({
          title: lesson.title,
          content: lesson.content,
          duration: lesson.duration,
          videoLink: lesson.videoLink || "",
          index: index, // to match with video
        }));
        formData.append("lessons", JSON.stringify(lessonsMeta));

        data.lessons.forEach((lesson) => {
          if (lesson.videoFile && (lesson.videoFile as FileList).length > 0) {
            formData.append("videos", (lesson.videoFile as FileList)[0]);
          }
        });
      }

      await apiService.createCourse({
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

      setMessage("✅ Course created successfully!");
      setUploadProgress(0);
      setUploadedBytes(0);
      setTotalBytes(0);
      setThumbnailPreview(null);
    } catch (error) {
      console.error("❌ Failed to create course:", error);
      setMessage("❌ Failed to create course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2); // MB with 2 decimals

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Create Course</h2>

      {message && (
        <div className="mb-4 px-4 py-2 bg-blue-100 text-blue-800 rounded">
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white p-6 rounded shadow"
      >
        {/* Title */}
        <div>
          <label className="block font-medium">Title</label>
          <input {...register("title")} className="input" />
          <p className="error">{errors.title?.message}</p>
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium">Description</label>
          <textarea {...register("description")} className="input" />
          <p className="error">{errors.description?.message}</p>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block font-medium mb-1">Thumbnail (optional)</label>
          <input
            type="file"
            accept="image/*"
            {...register("thumbnail")}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setThumbnailPreview(URL.createObjectURL(file));
                setValue("thumbnail", [file], { shouldValidate: true });
              }
            }}
          />
          {thumbnailPreview && (
            <img src={thumbnailPreview} className="w-24 h-24 mt-2 rounded" />
          )}
        </div>

        {/* Category, Instructor, Price */}
        <div className="grid grid-cols-2 gap-4">
          <SearchableSelect
            label="Category"
            options={categories.map((c) => ({ label: c.name, value: c._id }))}
            value={watch("categoryId")}
            onChange={(val) => setValue("categoryId", val)}
          />
          <SearchableSelect
            label="Instructor"
            options={instructors.map((i) => ({ label: i.name, value: i._id }))}
            value={watch("instructorId")}
            onChange={(val) => setValue("instructorId", val)}
          />
          <div>
            <label className="block font-medium">Price</label>
            <input type="number" {...register("price")} className="input" />
            <p className="error">{errors.price?.message}</p>
          </div>
        </div>

        {/* Lessons */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold">Lessons</h3>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border p-4 rounded my-4 bg-gray-50 space-y-3"
            >
              <input
                {...register(`lessons.${index}.title`)}
                placeholder="Lesson Title"
                className="input"
              />
              <p className="error">
                {errors?.lessons?.[index]?.title?.message}
              </p>

              <textarea
                {...register(`lessons.${index}.content`)}
                placeholder="Lesson Content"
                className="input"
              />
              <p className="error">
                {errors?.lessons?.[index]?.content?.message}
              </p>

              <input
                {...register(`lessons.${index}.duration`)}
                placeholder="Duration"
                className="input"
              />
              <p className="error">
                {errors?.lessons?.[index]?.duration?.message}
              </p>

              <label className="block font-medium">Video File (optional)</label>
              <input
                type="file"
                accept="video/*"
                {...register(`lessons.${index}.videoFile`)}
              />

              <label className="block font-medium">Video Link (optional)</label>
              <input
                type="url"
                {...register(`lessons.${index}.videoLink`)}
                placeholder="e.g. https://example.com/video"
                className="input"
              />

              <p className="error">
                {(() => {
                  const lessonError = errors.lessons?.[index];
                  return lessonError && typeof lessonError === 'object' && 'message' in lessonError ? (lessonError as { message: string }).message : null;
                })()}
              </p>

              <button
                type="button"
                onClick={() => remove(index)}
                className="text-red-500 text-sm"
              >
                Remove Lesson
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              append({ title: "", content: "", duration: "", videoFile: undefined, videoLink: "" })
            }
            className="mt-2 text-blue-600 underline"
          >
            + Add Lesson
          </button>
        </div>

        {/* Upload Progress */}
        {isSubmitting && (
          <div className="mt-4">
            <ProgressBar percent={uploadProgress} />
            <p className="text-sm text-gray-600 mt-1">
              {totalBytes > 0 ? (
                <>
                  {formatMB(uploadedBytes)} MB / {formatMB(totalBytes)} MB
                  uploaded ({uploadProgress}%)
                </>
              ) : (
                "Preparing upload..."
              )}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          {isSubmitting ? "Submitting..." : "Create Course"}
        </button>
      </form>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #ccc;
          padding: 0.5rem;
          border-radius: 0.25rem;
        }
        .error {
          color: #dc2626;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
