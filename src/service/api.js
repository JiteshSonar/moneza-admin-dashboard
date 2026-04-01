import axios from "axios";

// const BASE_URL = "http://172.20.10.5:8000"; // mobile
const BASE_URL = "http://10.195.90.119:8000";
// const BASE_URL =
//   process.env.NEXT_PUBLIC_API_BASE_URL || "https://moneza-backend.onrender.com";


const apiCall = async (endpoint, options = {}) => {
  const {
    method = "GET",
    data = null,
    params = {},
    headers = {},
    token = null,
    onUploadProgress = () => {},
    timeout,
    ...restOptions
  } = options;

  const apiHeaders = {
    Accept: "application/json",
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!(data instanceof FormData) && method !== 'DELETE') {
    apiHeaders["Content-Type"] = "application/json";
  }

  try {
    const requestTimeout =
      timeout ?? (data instanceof FormData ? 300000 : 10000);
    const response = await axios({
      url: `${BASE_URL}${endpoint}`,
      method,
      data,
      params,
      timeout: requestTimeout,
      headers: apiHeaders,
      onUploadProgress,
      ...restOptions,
    });
    return response.data;
  } catch (error) {
    console.error("API Call Error:", error.message);

    if (error.response) {
      console.error("Response Data:", error.response.data);
      console.error("Status Code:", error.response.status);
      console.error("Headers:", error.response.headers);
      const responseData = error.response.data;
      const normalizedError =
        responseData instanceof Error
          ? responseData
          : new Error(
              responseData?.message ||
                responseData?.error ||
                "Request failed",
            );
      normalizedError.status = error.response.status;
      normalizedError.payload = responseData;
      throw normalizedError;
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("No response received from the server.");
    } else {
      console.error("Error Message:", error.message);
      throw new Error("Error in setting up the request.");
    }
  }
};

export default apiCall;
