import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, Bot, User, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface QuickAddChatProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: any) => void;
}

const QuickAddChat = ({ isOpen, onClose, onAddTransaction }: QuickAddChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your financial assistant. You can tell me about your transactions in natural language. For example: 'I spent $25 on lunch at McDonald's today' or 'I received $500 salary payment'",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const parseTransactionFromText = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Extract amount
    const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
    
    if (!amount) {
      return null;
    }

    // Determine transaction type
    const isIncome = lowerText.includes('received') || 
                    lowerText.includes('earned') || 
                    lowerText.includes('salary') ||
                    lowerText.includes('payment') ||
                    lowerText.includes('income');
    
    const type = isIncome ? 'income' : 'expense';
    
    // Extract description/vendor
    let description = "";
    const atMatch = text.match(/at\s+([^$\d]+?)(?:\s|$)/i);
    const forMatch = text.match(/for\s+([^$\d]+?)(?:\s|$)/i);
    const onMatch = text.match(/on\s+([^$\d]+?)(?:\s|$)/i);
    
    if (atMatch) description = atMatch[1].trim();
    else if (forMatch) description = forMatch[1].trim();
    else if (onMatch) description = onMatch[1].trim();
    else description = text.replace(/\$?\d+(?:\.\d{2})?/, '').trim();

    // Categorize based on keywords
    let category = "Other";
    if (isIncome) {
      if (lowerText.includes('salary') || lowerText.includes('work')) category = "Salary";
      else if (lowerText.includes('freelanc')) category = "Freelancing";
      else category = "Income";
    } else {
      if (lowerText.includes('food') || lowerText.includes('lunch') || lowerText.includes('dinner') || 
          lowerText.includes('restaurant') || lowerText.includes('coffee') || lowerText.includes('mcdonald')) {
        category = "Food & Dining";
      } else if (lowerText.includes('gas') || lowerText.includes('uber') || lowerText.includes('taxi') || 
                lowerText.includes('bus') || lowerText.includes('transport')) {
        category = "Transportation";
      } else if (lowerText.includes('movie') || lowerText.includes('netflix') || lowerText.includes('entertainment') ||
                lowerText.includes('game')) {
        category = "Entertainment";
      } else if (lowerText.includes('electric') || lowerText.includes('water') || lowerText.includes('internet') ||
                lowerText.includes('phone') || lowerText.includes('bill')) {
        category = "Bills & Utilities";
      } else if (lowerText.includes('shop') || lowerText.includes('amazon') || lowerText.includes('clothes')) {
        category = "Shopping";
      }
    }

    return {
      type,
      amount: type === 'expense' ? amount : amount,
      category,
      description: description || `${type === 'income' ? 'Income' : 'Expense'} transaction`,
      date: new Date().toISOString().split('T')[0]
    };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Try to parse transaction from user input
    const transaction = parseTransactionFromText(inputText);
    
    setTimeout(() => {
      let botResponse = "";
      
      if (transaction) {
        botResponse = `Great! I understood that as a ${transaction.type} of $${transaction.amount} for "${transaction.description}" in the ${transaction.category} category. Should I add this transaction for you?`;
        
        // Add the transaction
        onAddTransaction({
          ...transaction,
          id: Date.now()
        });
        
        // Save to localStorage
        const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const newTransaction = {
          ...transaction,
          id: Date.now()
        };
        existingTransactions.unshift(newTransaction);
        localStorage.setItem('transactions', JSON.stringify(existingTransactions));
        
        toast({
          title: "Transaction Added",
          description: `Added ${transaction.type} of $${transaction.amount}`,
        });
        
        botResponse += " ✅ Transaction has been added successfully!";
      } else {
        botResponse = "I couldn't parse that as a transaction. Please try something like: 'I spent $25 on lunch at McDonald's' or 'I received $500 from my job'. Make sure to include the amount and what it was for.";
      }

      const botMessage: Message = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsProcessing(false);
    }, 1000);

    setInputText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-96 shadow-lg z-50 animate-scale-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageCircle className="h-4 w-4" />
            Quick Add Assistant
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-full pb-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'bot' && (
                  <div className="bg-primary/10 p-1.5 rounded-full">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[240px] p-2 rounded-lg text-sm ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {message.text}
                </div>
                {message.sender === 'user' && (
                  <div className="bg-primary/10 p-1.5 rounded-full">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                )}
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-start gap-2">
                <div className="bg-primary/10 p-1.5 rounded-full">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
                <div className="bg-muted p-2 rounded-lg text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 mt-3">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your transaction..."
            className="flex-1 text-sm"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSendMessage}
            size="sm"
            disabled={!inputText.trim() || isProcessing}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAddChat;