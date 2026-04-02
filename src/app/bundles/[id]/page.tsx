"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiService } from "../../../service/service";

type Bundle = {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  bundleType?: "core_pass" | "apex_pass";
  price: number;
  discountPrice: number;
  status: string;
  courses: Array<{
    _id: string;
    title: string;
    description: string;
  }>;
};

export default function BundleDetailsPage() {
  const params = useParams();
  const { id } = params;
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBundle = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await apiService.getBundleById({ bundleId: id, token });
        setBundle(res.bundle);
      } catch (error) {
        console.error("Error fetching bundle", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchBundle();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600 border-opacity-50"></div>
      </div>
    );
  }

  if (!bundle) return <div className="p-6">Bundle not found.</div>;

  const bundleTypeLabel = bundle.bundleType
    ? bundle.bundleType.replace("_", " ")
    : "Unspecified";

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{bundle.title}</h1>
      <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
        {bundle.thumbnailUrl ? (
          <Image
            src={bundle.thumbnailUrl}
            alt={bundle.title}
            width={320}
            height={180}
            className="rounded-lg object-cover"
            unoptimized
          />
        ) : null}
        <p>{bundle.description}</p>
        <p>
          <strong>Bundle Type:</strong> {bundleTypeLabel}
        </p>
        <p>
          <strong>Price:</strong> ₹{bundle.price}
        </p>
        <p>
          <strong>Discount Price:</strong> ₹{bundle.discountPrice}
        </p>
        <p>
          <strong>Status:</strong> {bundle.status}
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Included Courses</h2>
        <div className="space-y-3">
          {bundle.courses?.length ? (
            bundle.courses.map((course) => (
              <div key={course._id} className="rounded-lg border px-4 py-3">
                <div className="font-medium">{course.title}</div>
                <div className="text-sm text-gray-500">{course.description}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No courses assigned.</div>
          )}
        </div>
      </div>
    </div>
  );
}
