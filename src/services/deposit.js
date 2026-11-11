const createDeposit = async (url, token, payload) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      return { ...data, success: false, error: data?.error || `HTTP ${response.status}` };
    }
    return data;
  } catch (error) {
    console.error(error);
    return { success: false };
  }
};

export { createDeposit };
