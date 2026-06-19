from app.schemas import RedRobSignalsModel

def calculate_platform_signals(signals: RedRobSignalsModel) -> float:
    # 1. Technical Activity Metric (0 to 50 Points Max)
    raw_github = max(0.0, float(signals.github_activity_score))
    
    # Check if GitHub score is on a 100-point scale or 10-point scale, and scale to 50 points max
    if raw_github > 10.0:
        github_part = (raw_github / 100.0) * 50.0
    else:
        github_part = raw_github * 5.0 
        
    # Cap to ensure bad metadata cannot break the 50 ceiling
    github_part = min(github_part, 50.0)
    
    # Handle Skill Assessment Scores safely
    assessments = signals.skill_assessment_scores.values() if signals.skill_assessment_scores else []
    
    if assessments:
        # Average the scores (assumed out of 100) and scale to a 50-point max ceiling
        raw_avg = sum(assessments) / len(assessments)
        assessment_part = (raw_avg / 100.0) * 50.0 if raw_avg > 10.0 else raw_avg * 5.0
    else:
        assessment_part = 25.0  # Fair mid-point default if zero track tests exist

    assessment_part = min(assessment_part, 50.0)
    
    # Combine (50% GitHub, 50% Assessments) -> Max 50 points total
    tech_score = (github_part * 0.5) + (assessment_part * 0.5)

    # 2. Hiring Feasibility Metric (0 to 50 Points Max)
    if signals.notice_period_days <= 30:
        availability_points = 50.0
    elif signals.notice_period_days <= 60:
        availability_points = 40.0
    else:
        availability_points = 20.0 

    if not signals.open_to_work_flag:
        availability_points *= 0.8

    # Ensure it stays bounded within 50
    availability_points = min(max(availability_points, 0.0), 50.0)

    # 3. Aggregate (50 Points Tech Max + 50 Points Availability Max = 100 Points Overall Max)
    final_stage_3_score = tech_score + availability_points
    
    # Absolute structural guardrail to prevent platform_score from exceeding 100
    return float(min(max(round(final_stage_3_score, 2), 0.0), 100.0))