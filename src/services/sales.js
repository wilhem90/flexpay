const fetchSales = async (url, token) => {
  console.log("Fetching sales from URL:", url);
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch sales:", error);
    throw error;
  }
};

const fetchSalesBalance = async (url, token) => {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || `Balance request failed (${response.status})`);
    }
    return data.data ?? null;
  } catch (error) {
    console.error("Failed to fetch sales balance:", error);
    throw error;
  }
};

export default fetchSales;
export { fetchSalesBalance };

