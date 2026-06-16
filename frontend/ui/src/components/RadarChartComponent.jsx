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
  let chartData = [];
  let keys = [];

  if (multipleData && multipleData.length > 0) {
    const c1 = multipleData[0];
    const c2 = multipleData[1];
    keys = [c1.name, c2.name];

    const getScores = (c) => {
      const breakdown = c.breakdown || c.scoreBreakdown || {};
      return {
        semantic: breakdown.stage_1_skills_semantic !== undefined ? breakdown.stage_1_skills_semantic : (breakdown.semanticMatch || 0),
        skill: breakdown.stage_2_behavioral_star !== undefined ? breakdown.stage_2_behavioral_star : (breakdown.skillMatch || 0),
        behavioral: breakdown.stage_3_platform_signals !== undefined ? breakdown.stage_3_platform_signals : (breakdown.behavioralMatch || 0),
        career: c.scoreBreakdown?.careerProgression || c.careerProgression || 80,
        domain: c.scoreBreakdown?.domainExperience || c.domainExperience || 80
      };
    };

    const s1 = getScores(c1);
    const s2 = getScores(c2);

    chartData = [
      { subject: 'Semantic Match', [c1.name]: s1.semantic, [c2.name]: s2.semantic, fullMark: 100 },
      { subject: 'Skill Match', [c1.name]: s1.skill, [c2.name]: s2.skill, fullMark: 100 },
      { subject: 'Behavioral Match', [c1.name]: s1.behavioral, [c2.name]: s2.behavioral, fullMark: 100 },
      { subject: 'Career Progression', [c1.name]: s1.career, [c2.name]: s2.career, fullMark: 100 },
      { subject: 'Domain Experience', [c1.name]: s1.domain, [c2.name]: s2.domain, fullMark: 100 }
    ];
  } else if (data) {
    keys = ['Score'];
    const breakdown = data.breakdown || data || {};
    const semantic = breakdown.stage_1_skills_semantic !== undefined ? breakdown.stage_1_skills_semantic : (breakdown.semanticMatch || 0);
    const skill = breakdown.stage_2_behavioral_star !== undefined ? breakdown.stage_2_behavioral_star : (breakdown.skillMatch || 0);
    const behavioral = breakdown.stage_3_platform_signals !== undefined ? breakdown.stage_3_platform_signals : (breakdown.behavioralMatch || 0);
    const career = data.scoreBreakdown?.careerProgression || data.careerProgression || 80;
    const domain = data.scoreBreakdown?.domainExperience || data.domainExperience || 80;

    chartData = [
      { subject: 'Semantic Match', Score: semantic, fullMark: 100 },
      { subject: 'Skill Match', Score: skill, fullMark: 100 },
      { subject: 'Behavioral Match', Score: behavioral, fullMark: 100 },
      { subject: 'Career Progression', Score: career, fullMark: 100 },
      { subject: 'Domain Experience', Score: domain, fullMark: 100 }
    ];
  }

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
          
          {keys.map((key, index) => (
            <Radar
              key={key}
              name={key}
              dataKey={key}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={keys.length > 1 ? 0.3 : 0.5}
            />
          ))}
          
          <Legend wrapperStyle={{ color: '#fff' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartComponent;

