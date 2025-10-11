import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: 'Inter',
            size: 11
          },
          color: '#424242',
          padding: 15,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: '#424242',
        titleFont: {
          family: 'Inter',
          size: 12
        },
        bodyFont: {
          family: 'Inter',
          size: 11
        },
        padding: 10,
        cornerRadius: 4
      }
    },
    cutout: '60%',
  };

  return (
    <div className="doughnut-chart-container">
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default DoughnutChart;