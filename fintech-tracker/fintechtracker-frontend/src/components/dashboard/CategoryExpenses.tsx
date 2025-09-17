import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryExpense } from "@/types/dashboard";

interface CategoryExpensesProps {
  categories: CategoryExpense[];
}

const CategoryExpenses = ({ categories }: CategoryExpensesProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getColorByIndex = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top Expense Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No expense data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={category.categoryId} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{category.categoryName}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold">{formatCurrency(category.totalAmount)}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {category.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getColorByIndex(index)}`}
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryExpenses;