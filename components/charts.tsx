"use client"

import { Bar, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement)

export function BarChart({ data }: { data: any[] }) {
  const chartData = {
    labels: data.map((item) => item.name || item.label),
    datasets: [
      {
        label: "Count",
        data: data.map((item) => item.count || item.value),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  }

  return <Bar data={chartData} options={options} />
}

export function LineChart({ data }: { data: any[] }) {
  const chartData = {
    labels: data.map((item) => {
      const date = new Date(item.date)
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }),
    datasets: [
      {
        label: "Views",
        data: data.map((item) => item.total_views),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.3,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return <Line data={chartData} options={options} />
}
