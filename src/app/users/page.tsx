"use client";

import React, { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";
import { Eye } from "lucide-react";
import { Toaster } from "react-hot-toast";
import UserDetailModal from "../../components/userDetail";
import { apiService } from "../../service/service";
import { formatDate } from "../../lib/utils";

type User = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
  dob?: string;
  isActive?: boolean;
  activePass?: "core_pass" | "apex_pass" | null;
  referralCode?: string;
  referredBy?: string | null;
  referralEarnings?: number;
  wallet?: number;
  isVerified?: boolean;
  profilePicture?: string | null;
  purchasedCourses?: string[];
  enrolledCourses?: string[];
  bankDetails?: string[];
};

type Course = {
  id: string;
  title: string;
  description?: string;
  price: number;
  createdAt?: string;
};

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600 border-opacity-50"></div>
  </div>
);

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"max" | "min" | "none">("none");
  const [page, setPage] = useState(1);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const perPage = 10;

  const getPurchasedCount = (user: User) =>
    user.purchasedCourses?.length || user.enrolledCourses?.length || 0;

  const getAllUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      setError("");
      const res = await apiService.getUsers({ token });
      setUsers(res?.data || []);
    } catch (fetchError) {
      console.log("Error fetching users", fetchError);
      setError("Unable to fetch users right now.");
    } finally {
      setLoading(false);
    }
  };

  const getAllCourses = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await apiService.getCourses({ token });
      setCourses(
        (res?.courses || []).map(
          (course: {
            _id: string;
            title: string;
            description?: string;
            price: number;
            createdAt?: string;
          }) => ({
            id: course._id,
            title: course.title,
            description: course.description,
            price: course.price,
            createdAt: course.createdAt,
          }),
        ),
      );
    } catch (fetchError) {
      console.log("Error fetching courses", fetchError);
    }
  };

  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setPage(1);
        setSearch(value);
      }, 300),
    [],
  );

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.referralCode?.toLowerCase().includes(query)
    );
  });

  const sortedUsers = [...filteredUsers];
  if (sortOrder === "max") {
    sortedUsers.sort((a, b) => getPurchasedCount(b) - getPurchasedCount(a));
  } else if (sortOrder === "min") {
    sortedUsers.sort((a, b) => getPurchasedCount(a) - getPurchasedCount(b));
  }

  const totalPages = Math.max(Math.ceil(sortedUsers.length / perPage), 1);
  const paginatedUsers = sortedUsers.slice((page - 1) * perPage, page * perPage);

  const purchasedCoursesForDetailsUser = useMemo(() => {
    if (!detailsUser) return [];
    const purchasedIds = detailsUser.purchasedCourses || detailsUser.enrolledCourses || [];
    return courses.filter((course) => purchasedIds.includes(course.id));
  }, [detailsUser, courses]);

  useEffect(() => {
    void getAllUsers();
    void getAllCourses();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Users Management</h1>
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

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500">Total Users</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{users.length}</div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500">Active Users</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {users.filter((user) => user.isActive !== false).length}
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500">Users With Pass</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {users.filter((user) => Boolean(user.activePass)).length}
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500">Verified Users</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {users.filter((user) => user.isVerified).length}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Search by name, email, phone, or referral code..."
              onChange={(e) => handleSearch(e.target.value)}
              className="border px-4 py-2 rounded-lg w-full md:w-1/2"
            />

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "max" | "min" | "none")}
              className="block w-56 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              aria-label="Sort by purchased courses count"
            >
              <option value="none">Sort</option>
              <option value="max">Most Purchased Courses</option>
              <option value="min">Least Purchased Courses</option>
            </select>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl shadow-md">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 sticky top-0 z-10 text-gray-700 uppercase text-xs font-medium">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Pass</th>
                  <th className="px-6 py-4">Courses</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, index) => (
                    <tr key={user._id} className="hover:bg-blue-50">
                      <td className="px-6 py-4">{(page - 1) * perPage + index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{user.name || "Unnamed user"}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 capitalize">{user.role}</td>
                      <td className="px-6 py-4 capitalize">
                        {user.activePass ? user.activePass.replace("_", " ") : "No pass"}
                      </td>
                      <td className="px-6 py-4">{getPurchasedCount(user)}</td>
                      <td className="px-6 py-4">{formatDate(user.createdAt, "DD MMM YYYY")}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              {sortedUsers.length > 0
                ? `Showing ${(page - 1) * perPage + 1} - ${Math.min(
                    page * perPage,
                    sortedUsers.length,
                  )} of ${sortedUsers.length} users`
                : "No users to display"}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNum = index + 1;
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
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Page {Math.min(page, totalPages)} of {totalPages}
            </div>
          </div>

          {detailsUser ? (
            <UserDetailModal
              isOpen={true}
              onClose={() => setDetailsUser(null)}
              user={detailsUser}
              courses={purchasedCoursesForDetailsUser}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
