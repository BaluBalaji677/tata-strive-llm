import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Card from "../components/common/Card";

const COLORS = ["#34d399", "#fb7185"];

function AttendanceChart({ presentCount = 0, absentCount = 0 }) {
  const data = [
    { name: "Present", value: Number(presentCount) || 0 },
    { name: "Absent", value: Number(absentCount) || 0 },
  ];

  return (
    <Card title="Attendance Overview">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
              {data.map((entry, index) => (
                <Cell key={`att-cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default AttendanceChart;

