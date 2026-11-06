export async function createEmployee(employee, url, access_token) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify(employee),
  });

  // Tenta ler JSON mesmo em erro (APIs costumam mandar { message })
  let data = null;
  try {
    data = await response.json();
  } catch {
    // resposta sem corpo / não-JSON
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Falha ao criar funcionário (HTTP ${response.status})`;
    throw new Error(message);
  }

  return data;
}

export async function updateEmployee(url, access_token, employee) {
  console.log("Updating employee...", { url, employee });
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify(employee),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    console.log("Failed to parse JSON response");
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Falha ao atualizar funcionário (HTTP ${response.status})`;
    throw new Error(message);
  }

  return data;
}

export async function listEmployees(url, access_token) {
  console.log("Listing employees...", { url });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // resposta sem corpo / não-JSON
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Falha ao listar funcionários (HTTP ${response.status})`;
    throw new Error(message);
  }

  return data;
}
