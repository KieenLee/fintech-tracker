import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, Bot, User, ArrowLeft, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const QuickAdd = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: t("quick_add.intro_message"),
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const quickQuestions = [
    t("quick_add.todays_spending"),
    t("quick_add.weeks_spending"),
    t("quick_add.months_spending"),
    t("quick_add.months_income"),
    t("quick_add.current_balance"),
    t("quick_add.category_most"),
    t("quick_add.food_spending"),
    t("quick_add.remaining_budget"),
    t("quick_add.evaluate_month"),
  ];

  const handleQuickQuestion = (question: string) => {
    const userMessage: Message = {
      id: Date.now(),
      text: question,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    setShowQuickQuestions(false);

    // Simulate bot response for analysis questions
    setTimeout(() => {
      const botResponse = t("quick_add.analyzing", {
        question: question.toLowerCase(),
      });

      const botMessage: Message = {
        id: Date.now() + 1,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsProcessing(false);
    }, 1000);
  };

  const parseTransactionFromText = (text: string) => {
    const lowerText = text.toLowerCase();

    // Extract amount
    const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

    if (!amount) {
      return null;
    }

    // Determine transaction type
    const isIncome =
      lowerText.includes("received") ||
      lowerText.includes("earned") ||
      lowerText.includes("salary") ||
      lowerText.includes("payment") ||
      lowerText.includes("income");

    const type = isIncome ? "income" : "expense";

    // Extract description/vendor
    let description = "";
    const atMatch = text.match(/at\s+([^$\d]+?)(?:\s|$)/i);
    const forMatch = text.match(/for\s+([^$\d]+?)(?:\s|$)/i);
    const onMatch = text.match(/on\s+([^$\d]+?)(?:\s|$)/i);

    if (atMatch) description = atMatch[1].trim();
    else if (forMatch) description = forMatch[1].trim();
    else if (onMatch) description = onMatch[1].trim();
    else description = text.replace(/\$?\d+(?:\.\d{2})?/, "").trim();

    // Categorize based on keywords
    let category = "Other";
    if (isIncome) {
      if (lowerText.includes("salary") || lowerText.includes("work"))
        category = "Salary";
      else if (lowerText.includes("freelanc")) category = "Freelancing";
      else category = "Income";
    } else {
      if (
        lowerText.includes("food") ||
        lowerText.includes("lunch") ||
        lowerText.includes("dinner") ||
        lowerText.includes("restaurant") ||
        lowerText.includes("coffee") ||
        lowerText.includes("mcdonald")
      ) {
        category = "Food & Dining";
      } else if (
        lowerText.includes("gas") ||
        lowerText.includes("uber") ||
        lowerText.includes("taxi") ||
        lowerText.includes("bus") ||
        lowerText.includes("transport")
      ) {
        category = "Transportation";
      } else if (
        lowerText.includes("movie") ||
        lowerText.includes("netflix") ||
        lowerText.includes("entertainment") ||
        lowerText.includes("game")
      ) {
        category = "Entertainment";
      } else if (
        lowerText.includes("electric") ||
        lowerText.includes("water") ||
        lowerText.includes("internet") ||
        lowerText.includes("phone") ||
        lowerText.includes("bill")
      ) {
        category = "Bills & Utilities";
      } else if (
        lowerText.includes("shop") ||
        lowerText.includes("amazon") ||
        lowerText.includes("clothes")
      ) {
        category = "Shopping";
      }
    }

    return {
      type,
      amount: type === "expense" ? amount : amount,
      category,
      description:
        description ||
        `${type === "income" ? "Income" : "Expense"} transaction`,
      date: new Date().toISOString().split("T")[0],
    };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    setShowQuickQuestions(false);

    // Try to parse transaction from user input
    const transaction = parseTransactionFromText(inputText);

    setTimeout(() => {
      let botResponse = "";

      if (transaction) {
        botResponse = t("quick_add.understood_transaction", {
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          category: transaction.category,
        });

        // Save to localStorage
        const existingTransactions = JSON.parse(
          localStorage.getItem("transactions") || "[]"
        );
        const newTransaction = {
          ...transaction,
          id: Date.now(),
        };
        existingTransactions.unshift(newTransaction);
        localStorage.setItem(
          "transactions",
          JSON.stringify(existingTransactions)
        );

        toast({
          title: t("transactions.add_transaction"),
          description: t("quick_add.transaction_added_toast", {
            type: transaction.type,
            amount: transaction.amount,
          }),
        });

        botResponse += " " + t("quick_add.transaction_added");
      } else {
        botResponse = t("quick_add.parse_failed");
      }

      const botMessage: Message = {
        id: Date.now() + 1,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsProcessing(false);
    }, 1000);

    setInputText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold pl-[24px] pt-[24px]">
          {t("quick_add.title")}
        </h1>
        <p className="text-muted-foreground pl-[24px]">
          {t("quick_add.subtitle")}
        </p>
      </div>

      <div className="px-6 flex-1 flex flex-col min-h-0">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-primary" />
              {t("quick_add.ai_assistant")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("quick_add.describe_transactions")}
            </p>
          </CardHeader>

          <CardContent className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 pr-4 mb-4">
              <div className="space-y-4">
                {showQuickQuestions && (
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Zap className="h-4 w-4 text-primary" />
                      {t("quick_add.quick_questions")}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {quickQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="justify-start text-left h-auto py-2 px-3 hover:bg-primary/5 transition-colors text-xs"
                          onClick={() => handleQuickQuestion(question)}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                    <div className="border-b border-border"></div>
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.sender === "bot" && (
                      <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] p-3 rounded-lg text-sm ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {message.text}
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    {message.sender === "user" && (
                      <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                        <div
                          className="w-2 h-2 bg-current rounded-full animate-pulse"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-current rounded-full animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-3 border-t pt-4">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t("quick_add.type_transaction")}
                className="flex-1"
                disabled={isProcessing}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isProcessing}
                className="px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickAdd;
