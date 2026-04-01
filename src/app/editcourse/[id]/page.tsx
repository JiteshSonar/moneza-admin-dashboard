"use client";

import { useState, useEffect } from "react";
import { apiService } from "../../../service/service";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

type EditableCourse = {
  _id: string;
  title: string;
  description: string;
  price: number;
  status: "active" | "inactive" | "archived";
  category: string | { _id: string; name?: string };
  instructor: string | { _id: string; name?: string };
};

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600 border-opacity-50"></div>
  </div>
);

export default function EditCourse() {
  const [course, setCourse] = useState<EditableCourse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    const fetchCourse = async () => {
      if (id) {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await apiService.getCourseById({ courseId: id, token });
          setCourse(res.course);
        } catch (error) {
          console.error("Error fetching course details", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchCourse();
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
      setSubmitError("Course category or instructor is missing. Please reselect them.");
      return;
    }

    setLoading(true);
    setSubmitError("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", course.title.trim());
      formData.append("description", course.description.trim());
      formData.append("price", String(course.price || 0));
      formData.append("categoryId", categoryId);
      formData.append("instructorId", instructorId);
      formData.append("status", course.status);

      await apiService.updateCourse({ courseId: id, token, formData, onUploadProgress: () => {} });
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

  if (loading) {
    return <Spinner />;
  }

  if (!course) {
    return <div className="p-6">Course not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Edit Course</h1>
      <Toaster position="top-right" />
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        {submitError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}
        <div className="mb-4">
          <label className="block text-gray-700">Title</label>
          <input
            type="text"
            value={course.title}
            onChange={(e) => setCourse({ ...course, title: e.target.value })}
            className="w-full border px-4 py-2 rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Description</label>
          <textarea
            value={course.description}
            onChange={(e) =>
              setCourse({ ...course, description: e.target.value })
            }
            className="w-full border px-4 py-2 rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Price</label>
          <input
            type="number"
            value={course.price}
            onChange={(e) =>
              setCourse({ ...course, price: Number(e.target.value) })
            }
            className="w-full border px-4 py-2 rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl cursor-pointer"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Course"}
        </button>
      </form>
    </div>
  );
}
