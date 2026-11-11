const lookupClientOrRemitter = async (url, token) => {
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

const createTransfer = async (url, token, payload) => {
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
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

const getTransferDetails = async (url, token) => {
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

const getTransfers = async (url, token) => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

const updateTransferStatus = async (url, token, payload) => {
  const options = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  };

  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

export {
  createTransfer,
  getTransferDetails,
  getTransfers,
  lookupClientOrRemitter,
  updateTransferStatus
};

// https://server-33000437068.europe-west1.run.app/api/transfers/get-transfers?limit=10&startDate=10-10-2026&endDate=30-10-2026

// https://server-33000437068.europe-west1.run.app/api/transfers/get-transfers?limit=10&startDate=30-10-2026&endDate=05-11-2026
