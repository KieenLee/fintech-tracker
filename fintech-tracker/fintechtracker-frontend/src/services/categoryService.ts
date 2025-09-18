import axios from "axios";

const API_BASE_URL = "http://localhost:5013/api";

export interface Category {
  categoryId: number;
  categoryName: string;
  transactionType: "income" | "expense";
  categoryIcon?: string;
  categoryColor?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Category`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },
};
