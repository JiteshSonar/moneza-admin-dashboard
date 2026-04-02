"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import BundleForm from "../../../components/bundleForm";
import { apiService } from "../../../service/service";

type CourseOption = {
  _id: string;
  title: string;
};

const initialValues = {
  title: "",
  description: "",
  bundleType: "core_pass" as const,
  price: 0,
  discountPrice: 0,
  status: "active" as const,
  courseIds: [],
  thumbnailUrl: "",
};

export default function CreateBundlePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await apiService.getCourses({ token });
        setCourses(response?.courses || []);
      } catch (error) {
        console.error("Error loading courses for bundle form", error);
        setPageError("Unable to load courses.");
      }
    };

    void fetchCourses();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Create Bundle</h1>
      <BundleForm
        mode="create"
        initialValues={initialValues}
        courses={courses}
        loading={loading}
        uploadProgress={uploadProgress}
        uploadedBytes={uploadedBytes}
        totalBytes={totalBytes}
        error={pageError}
        submitLabel="Create Bundle"
        onSubmit={async ({ values, thumbnailFile }) => {
          if (!values.title.trim() || !values.description.trim()) {
            setPageError("Title and description are required.");
            return;
          }

          if (!values.courseIds.length) {
            setPageError("Select at least one course for the bundle.");
            return;
          }

          try {
            setLoading(true);
            setPageError("");
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("title", values.title.trim());
            formData.append("description", values.description.trim());
            formData.append("bundleType", values.bundleType);
            formData.append("price", String(values.price || 0));
            formData.append("discountPrice", String(values.discountPrice || 0));
            formData.append("status", values.status);
            formData.append("courses", JSON.stringify(values.courseIds));

            if (thumbnailFile) {
              formData.append("thumbnail", thumbnailFile);
            }

            await apiService.createBundle({
              token,
              formData,
              onUploadProgress: (event: ProgressEvent) => {
                const total = event.total || 0;
                const loaded = event.loaded;
                setUploadProgress(Math.round((loaded * 100) / (total || 1)));
                setUploadedBytes(loaded);
                setTotalBytes(total);
              },
            });

            toast.success("Bundle created successfully");
            router.push("/bundles");
          } catch (error) {
            console.error("Error creating bundle", error);
            setPageError("Failed to create bundle. Please try again.");
            toast.error("Failed to create bundle");
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
}
