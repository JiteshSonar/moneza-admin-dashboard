"use client";

import { useState, useEffect } from "react";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { debounce } from "lodash";
import { apiService } from "../../service/service";
import { formatDate } from "../../lib/utils";
import { useRouter } from "next/navigation";

// Spinner component
const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600 border-opacity-50"></div>
  </div>
);

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  category: string;
  instructor: string;
  price: number;
  isPaid: boolean;
  lessons: string[];
  status: "active" | "inactive" | "archived";
  createdAt: string;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [userCounts, setUserCounts] = useState<{ [courseId: string]: number }>(
    {}
  );
  const [, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const router = useRouter();

  const perPage = 10;
  const userRole = "admin";

  const getLoggedUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await apiService.getLoggedUser({ token });
      setUser(res.user);
      await getCourses(token);
    } catch (error) {
      console.log("User fetch error:", error);
      setError("Unable to load logged user details.");
      router.push("/login");
    }
  };

  const getCourses = async (token: string) => {
    try {
      const res = await apiService.getCourses({ token });
      setCourses(res.courses);
      await fetchAllUserCounts(res.courses || [], token);
    } catch (error) {
      console.error("Error fetching courses", error);
      setError("Unable to fetch courses right now.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUserCounts = async (items: Course[], token: string) => {
    try {
      const counts = await Promise.all(
        items.map(async (course) => {
          const res = await apiService.getAllUserCountsPerCourse({
            courseId: course._id,
            token,
          });

          return [course._id, res.userCount || 0] as const;
        })
      );

      setUserCounts(Object.fromEntries(counts));
    } catch (error) {
      console.error("Error fetching user counts", error);
      setUserCounts({});
    }
  };

  const handleSearch = debounce((value: string) => {
    setPage(1);
    setSearch(value);
  }, 300);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCourses.length / perPage);
  const paginatedCourses = filteredCourses.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      try {
        const token = localStorage.getItem("token");
        await apiService.deleteCourse({ courseId: id, token });
        setCourses(courses.filter((c) => c._id !== id));
        toast.success("Course deleted successfully");
      } catch (error) {
        console.error("Error deleting course", error);
        toast.error("Failed to delete course");
      }
    }
  };

  const handleView = (id: string) => {
    router.push(`/courses/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/editcourse/${id}`);
  };

  const handleAddLecture = (id: string) => {
    router.push(`/addlecture/${id}`);
  };

  useEffect(() => {
    getLoggedUser();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Course Management</h1>
      <Toaster position="top-right" />

      {loading ? (
        <Spinner />
      ) : (
        <>
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-between items-center">
            <input
              type="text"
              placeholder="Search courses..."
              onChange={(e) => handleSearch(e.target.value)}
              className="border px-4 py-2 rounded-lg w-1/2"
            />
            {userRole === "admin" && (
              <button
                onClick={() => router.push("/createcourse")}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl cursor-pointer"
              >
                Add New Course
              </button>
            )}
          </div>

          <div className="overflow-x-auto bg-white rounded-xl shadow-md">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 sticky top-0 z-10 text-gray-700 uppercase text-xs font-medium">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Course Name</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Users</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedCourses.map((course, index) => (
                  <tr key={course._id} className="hover:bg-blue-50">
                    <td className="px-6 py-4">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {course.title}
                    </td>
                    <td className="px-6 py-4">₹{course.price}</td>
                    <td className="px-6 py-4">
                      {formatDate(course.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {userCounts[course._id] !== undefined
                        ? userCounts[course._id]
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleView(course._id)}
                          className="bg-gray-100 p-2 rounded-full hover:bg-blue-100"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </button>
                        {userRole === "admin" && (
                          <>
                            <button
                              onClick={() => handleEdit(course._id)}
                              className="bg-gray-100 p-2 rounded-full hover:bg-yellow-100"
                              title="Edit Course"
                            >
                              <Pencil className="h-4 w-4 text-yellow-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(course._id)}
                              className="bg-gray-100 p-2 rounded-full hover:bg-red-100"
                              title="Delete Course"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                            <button
                              onClick={() => handleAddLecture(course._id)}
                              className="bg-gray-100 p-2 rounded-full hover:bg-green-100"
                              title="Add Lecture"
                            >
                              <Plus className="h-4 w-4 text-green-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedCourses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No courses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              {filteredCourses.length > 0
                ? `Showing ${(page - 1) * perPage + 1} - ${Math.min(
                    page * perPage,
                    filteredCourses.length
                  )} of ${filteredCourses.length} courses`
                : "No courses to display"}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded ${
                    page === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
