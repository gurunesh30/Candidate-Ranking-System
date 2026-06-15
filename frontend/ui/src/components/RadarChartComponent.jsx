// RadarChartComponent - Displays candidate score breakdown using Recharts
import React from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Legend
} from 'recharts';

const RadarChartComponent = ({ data, multipleData = [], colors = ['#6366f1', '#8b5cf6'] }) => {
  // Format data for radar chart
  const chartData = multipleData.length > 0 ? multipleData : [{
    subject: 'Semantic Match',
    A: data.semanticMatch,
    fullMark: 100,
  }, {
    subject: 'Skill Match',
    A: data.skillMatch,
    fullMark: 100,
  }, {
    subject: 'Behavioral Match',
    A: data.behavioralMatch,
    fullMark: 100,
  }, {
    subject: 'Career Progression',
    A: data.careerProgression,
    fullMark: 100,
  }, {
    subject: 'Domain Experience',
    A: data.domainExperience,
    fullMark: 100,
  }];

  return (
    <div className="radar-chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
          />
          
          {multipleData.length > 0 ? (
            // Multiple datasets for comparison
            multipleData.map((dataset, index) => (
              <Radar
                key={index}
                name={dataset.name}
                dataKey={dataKey => dataset[dataKey] || dataset.A}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.3}
              />
            ))
          ) : (
            // Single dataset
            <Radar
              name="Score Breakdown"
              dataKey="A"
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.5}
            />
          )}
          
          <Legend wrapperStyle={{ color: '#fff' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartComponent;
