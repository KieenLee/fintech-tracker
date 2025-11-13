import api from "./api";

export interface QuickAddRequest {
  message: string;
  language: string;
}
export interface TransactionParsed {
  accountId: number;
  categoryId?: number;
  amount: number;
  transactionType: string;
  description?: string;
  transactionDate: string;
}
export interface QuickAddResponse {
  response: string;
  type: string;
  transaction?: TransactionParsed;
}

export const quickAddService = {
  processMessage: async (
    request: QuickAddRequest
  ): Promise<QuickAddResponse> => {
    const response = await api.post("/quickadd/process", request);
    return response.data;
  },
};