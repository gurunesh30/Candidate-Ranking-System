#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <vector>
#include <cmath>
#include <string>
#include <algorithm>

namespace py = pybind11;

// High-speed bare-metal Cosine Similarity calculator
float calculate_cosine(const std::vector<float>& vec_a, const std::vector<float>& vec_b) {
    float dot_product = 0.0f;
    float norm_a = 0.0f;
    float norm_b = 0.0f;
    
    for (size_t i = 0; i < vec_a.size(); ++i) {
        dot_product += vec_a[i] * vec_b[i];
        norm_a += vec_a[i] * vec_a[i];
        norm_b += vec_b[i] * vec_b[i];
    }
    
    if (norm_a == 0.0f || norm_b == 0.0f) return 0.0f;
    return dot_product / (std::sqrt(norm_a) * std::sqrt(norm_b));
}

// Processing loops optimized to crunch thousands of candidate arrays
float calculate_fast_stage_1(
    const std::vector<float>& jd_vector, 
    const std::vector<std::tuple<std::vector<float>, std::string, int>>& candidate_skills
) {
    std::vector<float> skill_scores;
    skill_scores.reserve(candidate_skills.size());

    for (const auto& skill : candidate_skills) {
        const auto& skill_vector = std::get<0>(skill);
        const std::string& proficiency = std::get<1>(skill);
        int duration_months = std::get<2>(skill);

        float base_similarity = calculate_cosine(jd_vector, skill_vector);

        float p_multiplier = 1.0f;
        if (proficiency == "expert") p_multiplier = 1.2f;
        else if (proficiency == "advanced") p_multiplier = 1.1f;
        else if (proficiency == "intermediate") p_multiplier = 1.0f;
        else if (proficiency == "beginner") p_multiplier = 0.7f;

        float calculated_d = static_cast<float>(duration_months) / 24.0f;
        float d_multiplier = std::max(0.5f, std::min(1.5f, calculated_d));

        skill_scores.push_back(base_similarity * p_multiplier * d_multiplier);
    }

    // High-speed native Intro-sort descending
    std::sort(skill_scores.begin(), skill_scores.end(), std::greater<float>());

    float sum = 0.0f;
    size_t take_count = std::min(static_cast<size_t>(5), skill_scores.size());
    for (size_t i = 0; i < take_count; ++i) {
        sum += skill_scores[i];
    }

    float avg_score = (take_count > 0) ? (sum / static_cast<float>(take_count)) : 0.0f;
    return std::min(100.0f, std::max(0.0f, avg_score * 100.0f));
}

// Bind the logic to a native python import module named "cpp_ranker"
PYBIND11_MODULE(cpp_ranker, m) {
    m.def("calculate_fast_stage_1", &calculate_fast_stage_1, "High-volume math execution module");
}