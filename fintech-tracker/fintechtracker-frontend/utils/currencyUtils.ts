interface CurrencyConfig {
  code: string;
  symbol: string;
  position: "before" | "after";
  locale: string;
  decimals: number;
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    position: "before",
    locale: "en-US",
    decimals: 2,
  },
  VND: {
    code: "VND",
    symbol: "đ",
    position: "after",
    locale: "vi-VN",
    decimals: 0,
  },
  CNY: {
    code: "CNY",
    symbol: "¥",
    position: "before",
    locale: "zh-CN",
    decimals: 2,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    position: "after",
    locale: "de-DE",
    decimals: 2,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    position: "before",
    locale: "en-GB",
    decimals: 2,
  },
};

export const formatCurrencyAmount = (
  amount: number,
  currencyCode: string = "USD"
): string => {
  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS["USD"];

  const formattedNumber = amount.toLocaleString(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });

  if (config.position === "before") {
    return `${config.symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber}${config.symbol}`;
  }
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_CONFIGS[currencyCode]?.symbol || "$";
};
