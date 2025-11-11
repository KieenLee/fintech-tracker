import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Bot, User, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { quickAddService } from "@/services/quickAddService";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const QuickAdd = () => {
  const { t, i18n } = useTranslation();
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

  const handleQuickQuestion = async (question: string) => {
    await processUserMessage(question);
  };

  const processUserMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    setShowQuickQuestions(false);

    try {
      const response = await quickAddService.processMessage({
        message: text,
        language: i18n.language,
      });

      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.response,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Nếu là transaction, show toast
      if (response.type === "transaction" && response.transaction) {
        toast({
          title: t("transactions.add_transaction"),
          description: t("quick_add.transaction_added_toast", {
            type: response.transaction.transactionType,
            amount: response.transaction.amount,
          }),
        });
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: t("quick_add.error_occurred"),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    await processUserMessage(inputText);
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
