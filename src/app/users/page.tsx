"use client";

import React, { useState, useMemo, useEffect } from "react";
import { debounce } from "lodash";
import { Toaster } from "react-hot-toast";
import { Eye } from "lucide-react";
import UserDetailModal from "../../components/userDetail";
import { apiService } from "../../service/service";

type User = {
  _id: string;
  profilePic: string;
  name: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  dob?: string;
  gender?: string;
  status?: string;
  membershipTier?: string;
  socialLinks?: { linkedin?: string; twitter?: string; facebook?: string };
  lastLogin?: string;
  totalSpent?: number;
  referralCode?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  bio?: string;
  purchasedCourseIds: string[];
};

type Course = {
  id: string;
  title: string;
  purchaseDate: string;
  price: number;
  status: "active" | "completed" | "expired";
  progress?: number;
  certificateUrl?: string;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"max" | "min" | "none">("none");
  const [page, setPage] = useState(1);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const perPage = 10;

  const getAllUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await apiService.getUsers({ token }); // ✅ Ensure getUsers() exists in your service
      setUsers(res?.data || []);
      console.log("users", res);
    } catch (error) {
      console.log("Error fetching users", error);
    } finally {
      setLoading(false);
    }
  };

  const getAllCourses = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await apiService.getCourses({ token });
      setCourses(
        (res?.courses || []).map((course: { _id: string } & Course) => ({
          ...course,
          id: course._id,
        }))
      );
    } catch (error) {
      console.log("Error fetching courses", error);
    }
  };

  const handleSearch = debounce((value: string) => {
    setPage(1);
    setSearch(value);
  }, 300);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const sortedUsers = [...filteredUsers];
  if (sortOrder === "max") {
    sortedUsers.sort(
      (a, b) =>
        (b.purchasedCourseIds?.length || 0) -
        (a.purchasedCourseIds?.length || 0)
    );
  } else if (sortOrder === "min") {
    sortedUsers.sort(
      (a, b) =>
        (a.purchasedCourseIds?.length || 0) -
        (b.purchasedCourseIds?.length || 0)
    );
  }

  const totalPages = Math.ceil(sortedUsers.length / perPage);
  const paginatedUsers = sortedUsers.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const purchasedCoursesForDetailsUser = useMemo(() => {
    if (!detailsUser) return [];
    return courses.filter((course) =>
      detailsUser.purchasedCourseIds?.includes(course.id)
    );
  }, [detailsUser, courses]);

  useEffect(() => {
    getAllUsers();
    getAllCourses();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Users Management</h1>

      <Toaster position="top-right" />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600 border-opacity-50"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          onChange={(e) => handleSearch(e.target.value)}
          className="border px-4 py-2 rounded-lg w-1/3"
        />

        <select
          value={sortOrder}
          onChange={(e) =>
            setSortOrder(e.target.value as "max" | "min" | "none")
          }
          className="block w-48 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm
             focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
          aria-label="Sort by purchased courses count"
        >
          <option value="none">Sort</option>
          <option value="max">Max Purchased</option>
          <option value="min">Min Purchased</option>
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 sticky top-0 z-10 text-gray-700 uppercase text-xs font-medium">
            <tr>
              <th className="px-6 py-4">No</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Purchased Courses</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No users found.
                </td>
              </tr>
            )}

            {paginatedUsers.map((user, index) => (
              <tr key={user._id} className="hover:bg-blue-50">
                <td className="px-6 py-4">
                  {(page - 1) * perPage + index + 1}
                </td>
                <td className="px-6 py-4 font-medium text-gray-800">
                  {user.name}
                </td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  {user.purchasedCourseIds?.length || 0}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => setDetailsUser(user)}
                    className="bg-gray-100 p-2 rounded-full hover:bg-blue-100"
                    title="View User Details"
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          {sortedUsers.length > 0
            ? `Showing ${(page - 1) * perPage + 1} - ${Math.min(
                page * perPage,
                sortedUsers.length
              )} of ${sortedUsers.length} users`
            : "No users to display"}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1 rounded ${
                  page === pageNum ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Page {Math.min(page, Math.max(totalPages, 1))} of {Math.max(totalPages, 1)}
        </div>
      </div>

      {detailsUser && (
        <UserDetailModal
          isOpen={true}
          onClose={() => setDetailsUser(null)}
          user={detailsUser}
          courses={purchasedCoursesForDetailsUser}
        />
      )}
    </>
  )}
</div>
);
}
