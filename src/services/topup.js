const request = async (token, url, options = {}) => {
  try {
    if (!url) {
      throw new Error("URL da requisição não informada.");
    }

    const response = await fetch(url, {
      method: "GET",
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        data?.Error ||
        `Erro HTTP ${response.status}`;

      const error = new Error(message);

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  } catch (error) {
    console.error("[TopUp] Request error:", {
      url,
      message: error?.message,
      status: error?.status,
    });

    throw error;
  }
};

// Serviço de TopUp (Recarga Internacional)
const topupService = {
  // Busca países disponíveis para recarga.
  getCountries: async (token, url) => {
    try {
      const data = await request(token, url);

      return Array.isArray(data) ? data : data?.Items || data || [];
    } catch (error) {
      console.error("[TopUp] Error fetching countries:", error);

      return [];
    }
  },

  // Busca as operadoras disponíveis para um número.
  getOperators: async (token, url) => {
    try {
      const response = await request(token, url);
      return {
        success: response?.success ?? true,
        Items: Array.isArray(response?.Items) ? response.Items : [],
        ...response.data,
      };
    } catch (error) {
      console.error("[TopUp] Error fetching operators:", error);

      return {
        success: false,
        Items: [],
        error: error?.message || "Não foi possível buscar as operadoras.",
      };
    }
  },

  // Busca os produtos/valores disponíveis para uma operadora.
  getProducts: async (token, url) => {
    try {
      const data = await request(token, url);

      return {
        success: data?.success ?? true,
        Items: Array.isArray(data?.Items) ? data.Items : [],
        ...data,
      };
    } catch (error) {
      console.error("[TopUp] Error fetching products:", error);

      return {
        success: false,
        Items: [],
        error: error?.message || "Não foi possível buscar os valores.",
      };
    }
  },
  // Envia a recarga.
  sendTopUp: async (token, url, payload) => {
    try {
      return await request(token, url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("[TopUp] Error sending top-up:", error);
      return {
        success: false,
        error: error?.message || "Não foi possível enviar a recarga.",
      };
    }
  },

  // Busca recarga by id
  getTopupById: async (token, url) => {
    try {
      return await request(token, url);
    } catch (error) {
      console.error("[TopUp] Error fetching top-up by id:", error);
      return {
        success: false,
        error: error?.message || "Não foi possível buscar a recarga.",
      };
    }
  },
};

export default topupService;
