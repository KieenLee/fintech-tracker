import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { formatCurrencyAmount } from "../../Utils/currencyUtils";

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({
  children,
}) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    // Lấy từ localStorage hoặc default USD
    return localStorage.getItem("userCurrency") || "USD";
  });

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("userCurrency", newCurrency);
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyAmount(amount, currency);
  };

  // Sync với profile currency từ API khi app load
  useEffect(() => {
    const syncCurrencyFromProfile = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const response = await fetch("/api/settings/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const profile = await response.json();
          if (profile.currency && profile.currency !== currency) {
            setCurrency(profile.currency);
          }
        }
      } catch (error) {
        console.error("Failed to sync currency from profile:", error);
      }
    };

    syncCurrencyFromProfile();
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
