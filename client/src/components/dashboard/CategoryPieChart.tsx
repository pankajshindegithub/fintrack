import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type CategoryExpensePoint = {
  name: string;
  value: number;
  color: string;
};

interface CategoryPieChartProps {
  data: CategoryExpensePoint[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            ₹{data.value.toLocaleString("en-IN")} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="finance-card">
      <h3 className="text-lg font-semibold text-foreground mb-6">Expenses by Category</h3>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value, entry: any) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Total in center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none hidden md:block" style={{ marginTop: "20px" }}>
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="text-lg font-bold text-foreground">₹{total.toLocaleString("en-IN")}</p>
      </div>
    </div>
  );
}
