const formatCurrency = (value = "0.00", currency = "BRL") => {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency,
  });
};

export default formatCurrency;
