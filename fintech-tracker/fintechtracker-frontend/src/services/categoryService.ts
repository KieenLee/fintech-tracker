import api from "./api";

export interface Category {
  categoryId: number;
  categoryName: string;
  transactionType: "income" | "expense";
  categoryIcon?: string;
  categoryColor?: string;
}

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get("/Category");
    return response.data;
  },
};