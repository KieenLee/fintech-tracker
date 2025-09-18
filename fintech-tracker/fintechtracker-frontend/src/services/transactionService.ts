import axios from "axios";

const API_BASE_URL = "http://localhost:5013/api";

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
  searchTerm?: string;
  category?: string;
  account?: string;
  fromDate?: string;
  toDate?: string;
  transactionType?: string;
  page?: number;
  pageSize?: number;
}

export interface TransactionResponse {
  transactions: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const transactionService = {
  getTransactions: async (
    filter: TransactionFilter = {}
  ): Promise<TransactionResponse> => {
    const params = new URLSearchParams();

    if (filter.searchTerm) params.append("searchTerm", filter.searchTerm);
    if (filter.category && filter.category !== "all")
      params.append("category", filter.category);
    if (filter.account && filter.account !== "all")
      params.append("account", filter.account);
    if (filter.fromDate) params.append("fromDate", filter.fromDate);
    if (filter.toDate) params.append("toDate", filter.toDate);
    if (filter.transactionType && filter.transactionType !== "all")
      params.append("transactionType", filter.transactionType);
    if (filter.page) params.append("page", filter.page.toString());
    if (filter.pageSize) params.append("pageSize", filter.pageSize.toString());

    const response = await axios.get(
      `${API_BASE_URL}/Transaction?${params.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  getTransaction: async (id: number): Promise<Transaction> => {
    const response = await axios.get(`${API_BASE_URL}/Transaction/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  createTransaction: async (
    data: CreateTransactionRequest
  ): Promise<Transaction> => {
    const response = await axios.post(`${API_BASE_URL}/Transaction`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  updateTransaction: async (
    id: number,
    data: CreateTransactionRequest
  ): Promise<Transaction> => {
    const response = await axios.put(
      `${API_BASE_URL}/Transaction/${id}`,
      data,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  deleteTransaction: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/Transaction/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
