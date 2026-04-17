import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Card from "../components/common/Card";

const COLORS = {
  ACTIVE: "#22c55e",
  WARNING: "#f59e0b",
  REJECTED: "#ef4444",
};

function StudentStatusChart({ students = [] }) {
  const counts = students.reduce(
    (acc, student) => {
      const status = student?.status;
      if (status === "ACTIVE") acc.ACTIVE += 1;
      else if (status === "WARNING") acc.WARNING += 1;
      else if (status === "REJECTED") acc.REJECTED += 1;
      return acc;
    },
    { ACTIVE: 0, WARNING: 0, REJECTED: 0 }
  );

  const data = [
    { name: "ACTIVE", value: counts.ACTIVE },
    { name: "WARNING", value: counts.WARNING },
    { name: "REJECTED", value: counts.REJECTED },
  ];

  return (
    <Card title="Student Status Distribution">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
              {data.map((entry) => (
                <Cell key={`status-${entry.name}`} fill={COLORS[entry.name]} />
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

export default StudentStatusChart;

