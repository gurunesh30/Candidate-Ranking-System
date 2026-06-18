from app.schemas import RedRobSignalsModel

def calculate_platform_signals(signals: RedRobSignalsModel) -> float:
    # 1. Technical Activity Metric (0 to 50 Points)
    github_part = max(0.0, signals.github_activity_score) * 5.0 # Scales 0-10 score to 50 Max
    
    assessments = signals.skill_assessment_scores.values()
    assessment_part = sum(assessments) / len(assessments) if assessments else 50.0
    tech_score = (github_part * 0.5) + (assessment_part * 0.5)

    # 2. Hiring Feasibility Metric (0 to 50 Points)
    # Fast availability = higher points
    if signals.notice_period_days <= 30:
        availability_points = 50.0
    elif signals.notice_period_days <= 60:
        availability_points = 40.0
    else:
        availability_points = 20.0 # Heavy penalty for 150 days notice

    if not signals.open_to_work_flag:
        availability_points *= 0.8

    # 3. Aggregate 
    final_stage_3_score = (tech_score * 0.5) + (availability_points * 0.5)
    return round(final_stage_3_score, 2)