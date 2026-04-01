import apiCall from "./api";

export const apiService = {
  // ===================== User APIs =====================
  registerUser: (data) =>
    apiCall("/api/user/register", { method: "POST", data }),

  loginUser: (data) => apiCall("/api/user/login", { method: "POST", data }),

  changePassword: (data) =>
    apiCall("/api/user/changepassword", { method: "POST", data }),

  getLoggedUser: ({ token }) =>
    apiCall("/api/user/loggeduser", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),

  getUsers: ({ token }) =>
    apiCall("/api/user/get-all-users", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteUser: ({ token, userId }) =>
    apiCall(`/api/user/delete-account/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ===================== Course APIs =====================
  getCourses: ({ token }) =>
    apiCall("/api/course/courses", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),

  getLessonById: ({ token, refCourse }) =>
    apiCall(`/api/course/getlesson/${refCourse}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAllUserCountsPerCourse: ({ courseId, token }) =>
    apiCall(`/api/course/${courseId}/user-count`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),

  createCourse: ({ token, formData, onUploadProgress }) =>
    apiCall("/api/course/create-course", {
      method: "POST",
      data: formData,
      headers: {
        // Let axios set the multipart boundary for FormData
        "Content-Type": "multipart/form-data",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // Make sure this specific request can handle large bodies too
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      onUploadProgress,
    }),

  updateCourse: ({ courseId, token, formData, onUploadProgress }) =>
    apiCall(`/api/course/course/${courseId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: formData,
      onUploadProgress,
    }),

  deleteCourse: ({ courseId, token }) =>
    apiCall(`/api/course/course/${courseId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  // ===================== Category & Instructor APIs =====================
  getCategories: () => apiCall("/api/course/categories", { method: "GET" }),

  getInstructors: () => apiCall("/api/course/instructors", { method: "GET" }),

  // ===================== Payment APIs =====================
  createOrder: ({ token, courseId }) =>
    apiCall("/api/payment/create-order", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: { courseId },
    }),

  getCourseById: ({ courseId, token }) =>
    apiCall(`/api/course/course/${courseId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  createLesson: ({ token, formData }) =>
    apiCall("/api/course/lessons", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: formData,
    }),

  getAdminDashboardOverview: ({ token }) =>
    apiCall("/api/admin/dashboard/overview", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 20000,
    }),
};
