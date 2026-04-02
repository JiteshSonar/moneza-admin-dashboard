"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { debounce } from "lodash";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { apiService } from "../../service/service";
import { formatDate } from "../../lib/utils";

type Bundle = {
  _id: string;
  title: string;
  bundleType?: "core_pass" | "apex_pass";
  price: number;
  discountPrice: number;
  status: "active" | "inactive" | "archived";
  courses: Array<{ _id: string; title: string }>;
  createdAt: string;
};

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600 border-opacity-50"></div>
  </div>
);

const formatBundleType = (bundleType?: string) => {
  if (!bundleType) return "Unspecified";
  return bundleType.replace("_", " ");
};

export default function BundlesPage() {
  const router = useRouter();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const perPage = 10;

  useEffect(() => {
    const fetchBundles = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        const res = await apiService.getBundles({ token });
        setBundles(res?.bundles || []);
      } catch (fetchError) {
        console.error("Error fetching bundles", fetchError);
        setError("Unable to fetch bundles right now.");
      } finally {
        setLoading(false);
      }
    };

    void fetchBundles();
  }, [router]);

  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setPage(1);
        setSearch(value);
      }, 300),
    [],
  );

  const filteredBundles = bundles.filter((bundle) =>
    bundle.title.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(Math.ceil(filteredBundles.length / perPage), 1);
  const paginatedBundles = filteredBundles.slice((page - 1) * perPage, page * perPage);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bundle?")) return;

    try {
      const token = localStorage.getItem("token");
      await apiService.deleteBundle({ bundleId: id, token });
      setBundles((current) => current.filter((bundle) => bundle._id !== id));
      toast.success("Bundle deleted successfully");
    } catch (deleteError) {
      console.error("Error deleting bundle", deleteError);
      toast.error("Failed to delete bundle");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Bundle Management</h1>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Search bundles..."
          onChange={(e) => handleSearch(e.target.value)}
          className="border px-4 py-2 rounded-lg w-1/2"
        />
        <button
          onClick={() => router.push("/bundles/create")}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl cursor-pointer"
        >
          Add New Bundle
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-medium">
            <tr>
              <th className="px-6 py-4">No</th>
              <th className="px-6 py-4">Bundle</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Courses</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedBundles.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No bundles found.
                </td>
              </tr>
            ) : (
              paginatedBundles.map((bundle, index) => (
                <tr key={bundle._id} className="hover:bg-blue-50">
                  <td className="px-6 py-4">{(page - 1) * perPage + index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{bundle.title}</td>
                  <td className="px-6 py-4 capitalize">{formatBundleType(bundle.bundleType)}</td>
                  <td className="px-6 py-4">
                    ₹{bundle.discountPrice > 0 ? bundle.discountPrice : bundle.price}
                  </td>
                  <td className="px-6 py-4">{bundle.courses?.length || 0}</td>
                  <td className="px-6 py-4 capitalize">{bundle.status}</td>
                  <td className="px-6 py-4">{formatDate(bundle.createdAt, "DD MMM YYYY")}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => router.push(`/bundles/${bundle._id}`)}
                        className="bg-gray-100 p-2 rounded-full hover:bg-blue-100"
                        title="View Bundle"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => router.push(`/bundles/edit/${bundle._id}`)}
                        className="bg-gray-100 p-2 rounded-full hover:bg-yellow-100"
                        title="Edit Bundle"
                      >
                        <Pencil className="h-4 w-4 text-yellow-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(bundle._id)}
                        className="bg-gray-100 p-2 rounded-full hover:bg-red-100"
                        title="Delete Bundle"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          {filteredBundles.length > 0
            ? `Showing ${(page - 1) * perPage + 1} - ${Math.min(
                page * perPage,
                filteredBundles.length,
              )} of ${filteredBundles.length} bundles`
            : "No bundles to display"}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
