import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuickAddChat from "@/components/QuickAddChat";

const FloatingChatButton = () => {
  const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);

  const handleQuickAddTransaction = (transaction: any) => {
    // Save to localStorage
    const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const newTransaction = {
      ...transaction,
      id: Date.now()
    };
    existingTransactions.unshift(newTransaction);
    localStorage.setItem('transactions', JSON.stringify(existingTransactions));
  };

  return (
    <>
      <Button
        onClick={() => setIsQuickChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 z-40 animate-scale-in"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <QuickAddChat
        isOpen={isQuickChatOpen}
        onClose={() => setIsQuickChatOpen(false)}
        onAddTransaction={handleQuickAddTransaction}
      />
    </>
  );
};

export default FloatingChatButton;