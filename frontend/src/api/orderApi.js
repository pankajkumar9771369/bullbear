const BASE_URL = "http://localhost:3002/api/orders";

const headers = {
  "Content-Type": "application/json",
};

const fetchApi = async (url , method,data ) => {
  try {
    const response = await fetch(`${BASE_URL}/${url}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch holdings");
    }

    return result;
  } catch (error) {
    console.error("Error fetching holdings:", error);
    throw error;
  }
};
export const createOrders=(data)=>fetchApi("/", "post",data);
export const getAllOrders=(data)=>fetchApi("/", "get",data);
