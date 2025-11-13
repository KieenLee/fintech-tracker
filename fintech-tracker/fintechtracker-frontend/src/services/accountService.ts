import api from "./api"; 

export interface Account {
  accountId: number;
  accountName: string;
  accountType: "cash" | "bank_account" | "e_wallet" | "credit_card";
  currentBalance: number;
  currencyCode: string;
  accountColor?: string;
}

export const accountService = {
  getAccounts: async (): Promise<Account[]> => {
    try {
      const response = await api.get("/Account"); 
      return response.data;
    } catch (error) {
      console.error("Error fetching accounts:", error);
      throw error;
    }
  },

  getAccount: async (id: number): Promise<Account> => {
    try {
      const response = await api.get(`/Account/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching account:", error);
      throw error;
    }
  },
};