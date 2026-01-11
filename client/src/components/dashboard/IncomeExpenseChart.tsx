import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type IncomeExpensePoint = {
  month: string;
  income: number;
  expenses: number;
};

interface IncomeExpenseChartProps {
  data: IncomeExpensePoint[];
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const formatCurrency = (value: number) => {
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  return (
    <div className="finance-card">
      <h3 className="text-lg font-semibold text-foreground mb-6">Income vs Expenses</h3>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                boxShadow: "var(--shadow-lg)",
              }}
              formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => (
                <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>{value}</span>
              )}
            />
            <Bar 
              dataKey="income" 
              name="Income"
              fill="hsl(var(--income))" 
              radius={[6, 6, 0, 0]}
            />
            <Bar 
              dataKey="expenses" 
              name="Expenses"
              fill="hsl(var(--expense))" 
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
