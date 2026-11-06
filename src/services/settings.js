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
    return await response.json();
  } catch (error) {
    console.error(error);
    return { success: false };
  }
};

const getPricing = (baseUrl, token) =>
  request(`${baseUrl}/companies/pricing`, token);

// https://server-33000437068.europe-west1.run.app/api/companies/register-pricing
const savePricing = (baseUrl, token, payload) =>
  request(`${baseUrl}/companies/register-pricing`, token, "POST", payload);

const updateProfile = (baseUrl, token, fields) =>
  request(`${baseUrl}/profiles/update-profile/${fields.id}`, token, "PUT", {
    ...fields,
  });

export { getPricing, savePricing, updateProfile };

