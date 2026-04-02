"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import BundleForm from "../../../../components/bundleForm";
import { apiService } from "../../../../service/service";

type CourseOption = {
  _id: string;
  title: string;
};

type BundleDetails = {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  bundleType: "core_pass" | "apex_pass";
  price: number;
  discountPrice: number;
  status: "active" | "inactive" | "archived";
  courses: Array<{ _id: string; title: string }>;
};

export default function EditBundlePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [bundle, setBundle] = useState<BundleDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setInitialLoading(true);
        const token = localStorage.getItem("token");
        const [coursesRes, bundleRes] = await Promise.all([
          apiService.getCourses({ token }),
          apiService.getBundleById({ bundleId: id, token }),
        ]);

        setCourses(coursesRes?.courses || []);
        setBundle(bundleRes?.bundle || null);
      } catch (error) {
        console.error("Error loading bundle details", error);
        setPageError("Unable to load bundle details.");
      } finally {
        setInitialLoading(false);
      }
    };

    void fetchData();
  }, [id]);

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600 border-opacity-50"></div>
      </div>
    );
  }

  if (!bundle) {
    return <div className="p-6">Bundle not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Bundle</h1>
      <BundleForm
        mode="edit"
        initialValues={{
          title: bundle.title,
          description: bundle.description,
          bundleType: bundle.bundleType,
          price: bundle.price || 0,
          discountPrice: bundle.discountPrice || 0,
          status: bundle.status,
          courseIds: bundle.courses?.map((course) => course._id) || [],
          thumbnailUrl: bundle.thumbnailUrl || "",
        }}
        courses={courses}
        loading={loading}
        uploadProgress={uploadProgress}
        uploadedBytes={uploadedBytes}
        totalBytes={totalBytes}
        error={pageError}
        submitLabel="Update Bundle"
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
            } else if (values.thumbnailUrl) {
              formData.append("thumbnailUrl", values.thumbnailUrl);
            }

            await apiService.updateBundle({
              bundleId: id,
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

            toast.success("Bundle updated successfully");
            router.push("/bundles");
          } catch (error) {
            console.error("Error updating bundle", error);
            setPageError("Failed to update bundle. Please try again.");
            toast.error("Failed to update bundle");
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
}
