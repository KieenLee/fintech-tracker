import axios from "axios";

const API_BASE_URL = "http://localhost:5013/api";

export interface Account {
  accountId: number;
  accountName: string;
  accountType: "cash" | "bank_account" | "e_wallet" | "credit_card";
  currentBalance: number;
  currencyCode: string;
  accountColor?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const accountService = {
  getAccounts: async (): Promise<Account[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Account`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching accounts:", error);
      throw error;
    }
  },

  getAccount: async (id: number): Promise<Account> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Account/${id}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching account:", error);
      throw error;
    }
  },
};
