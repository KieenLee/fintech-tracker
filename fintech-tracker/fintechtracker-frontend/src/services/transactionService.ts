import axios from "axios";

const API_BASE_URL = "http://localhost:5013/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface Transaction {
  transactionId: number;
  userId: number;
  accountId: number;
  accountName: string;
  categoryId?: number;
  categoryName?: string;
  amount: number;
  transactionType: "income" | "expense";
  description?: string;
  transactionDate: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionRequest {
  accountId: number;
  categoryId?: number;
  amount: number;
  transactionType: "income" | "expense";
  description?: string;
  transactionDate: string;
  location?: string;
}

export interface TransactionFilter {
  categoryId?: number;
  accountId?: number;
  fromDate?: string;
  toDate?: string;
  transactionType?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

// NEW: Separate interface for search functionality
export interface TransactionSearchFilter extends TransactionFilter {
  searchTerm?: string; // ✅ Add search term for search endpoint
}

export interface TransactionResponse {
  transactions: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const transactionService = {
  async getTransactions(filter: TransactionFilter = {}) {
    try {
      // Build query string with correct property names
      const params = new URLSearchParams();

      if (filter.categoryId)
        params.append("categoryId", filter.categoryId.toString());
      if (filter.accountId)
        params.append("accountId", filter.accountId.toString());
      if (filter.fromDate) params.append("fromDate", filter.fromDate);
      if (filter.toDate) params.append("toDate", filter.toDate);
      if (filter.transactionType && filter.transactionType !== "all") {
        params.append("transactionType", filter.transactionType);
      }
      if (filter.minAmount)
        params.append("minAmount", filter.minAmount.toString());
      if (filter.maxAmount)
        params.append("maxAmount", filter.maxAmount.toString());

      params.append("page", (filter.page || 1).toString());
      params.append("pageSize", (filter.pageSize || 10).toString());
      params.append("sortBy", filter.sortBy || "TransactionDate");
      params.append("sortOrder", filter.sortOrder || "desc");

      console.log("🔍 Transaction API call with params:", params.toString());

      const response = await apiClient.get(`/transaction?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching transactions:", error);
      throw error;
    }
  },

  // NEW: Separate method for search functionality
  async searchTransactions(searchFilter: TransactionSearchFilter = {}) {
    try {
      // For search, use the main filter and add search term
      const { searchTerm, ...filter } = searchFilter;

      if (!searchTerm) {
        // If no search term, use regular getTransactions
        return await this.getTransactions(filter);
      }

      const params = new URLSearchParams();

      // Add search term
      params.append("searchTerm", searchTerm);

      // Add other filters
      if (filter.categoryId)
        params.append("categoryId", filter.categoryId.toString());
      if (filter.accountId)
        params.append("accountId", filter.accountId.toString());
      if (filter.fromDate) params.append("fromDate", filter.fromDate);
      if (filter.toDate) params.append("toDate", filter.toDate);
      if (filter.transactionType && filter.transactionType !== "all") {
        params.append("transactionType", filter.transactionType);
      }
      if (filter.minAmount)
        params.append("minAmount", filter.minAmount.toString());
      if (filter.maxAmount)
        params.append("maxAmount", filter.maxAmount.toString());

      params.append("page", (filter.page || 1).toString());
      params.append("pageSize", (filter.pageSize || 10).toString());

      const response = await apiClient.get(
        `/transaction/search?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("❌ Error searching transactions:", error);
      throw error;
    }
  },

  async getTransaction(id: number): Promise<Transaction> {
    const response = await apiClient.get(`/transaction/${id}`);
    return response.data;
  },

  async createTransaction(transaction: any) {
    const response = await apiClient.post("/transaction", transaction);
    return response.data;
  },

  async updateTransaction(id: number, transaction: any) {
    const response = await apiClient.put(`/transaction/${id}`, transaction);
    return response.data;
  },

  async deleteTransaction(id: number) {
    const response = await apiClient.delete(`/transaction/${id}`);
    return response.data;
  },
};
