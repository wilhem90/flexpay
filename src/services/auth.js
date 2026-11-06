const parseResponse = async (response) => {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // corpo vazio ou não-JSON (ex.: página HTML de erro)
  }

  if (data && typeof data === "object") {
    if (!response.ok && data.success !== false) {
      return { ...data, success: false };
    }
    return data;
  }

  return {
    success: response.ok,
    error: response.ok ? undefined : `HTTP ${response.status}`,
  };
};

const signUpUser = async (username, fullname, email, phone, password, url) => {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: String(username).trim(),
      fullname: String(fullname).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      password: String(password),
    }),
  };

  try {
    return await parseResponse(await fetch(url, options));
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
};

const signInUser = async (username, password, url) => {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  };

  try {
    const response = await fetch(url, options);

    return await response.json();
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
};

export { signInUser, signUpUser };

