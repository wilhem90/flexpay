const request = async (url, token, method = "GET", body) => {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { success: false };
  }
};

const getNotifications = async (baseUrl, token, signal) => {
  if (!baseUrl || !token)
    throw new Error("Missing notification API configuration or session");
  const response = await fetch(`${baseUrl}/notifys/me`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!response.ok)
    throw new Error(`Notification request failed (${response.status})`);
  const result = await response.json();
  if (!result?.success || !Array.isArray(result.data)) {
    throw new Error("Invalid notification response");
  }
  return result.data;
};

const markNotificationAsRead = (baseUrl, token, notificationId) =>
  request(`${baseUrl}/notifications/${notificationId}/read`, token, "PUT");

export { getNotifications, markNotificationAsRead };

