import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, PiggyBank, Wallet } from "lucide-react";
import { AccountSummary } from "@/types/dashboard";

interface AccountsOverviewProps {
  accounts: AccountSummary[];
}

const AccountsOverview = ({ accounts }: AccountsOverviewProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getAccountIcon = (accountType: string) => {
    switch (accountType.toLowerCase()) {
      case 'checking':
        return <Wallet className="w-5 h-5 text-blue-600" />;
      case 'savings':
        return <PiggyBank className="w-5 h-5 text-green-600" />;
      case 'credit':
        return <CreditCard className="w-5 h-5 text-red-600" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBalanceColor = (balance: number, accountType: string) => {
    if (accountType.toLowerCase() === 'credit') {
      return balance < 0 ? 'text-red-600' : 'text-green-600';
    }
    return balance >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Your Accounts</CardTitle>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No accounts found</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div 
                key={account.accountId} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getAccountIcon(account.accountType)}
                  <div>
                    <h4 className="font-medium">{account.accountName}</h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {account.accountType.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getBalanceColor(account.currentBalance, account.accountType)}`}>
                    {formatCurrency(account.currentBalance)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountsOverview;