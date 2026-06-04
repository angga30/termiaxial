pub struct FuzzyMatch {
    pub score: i32,
    pub matched_indices: Vec<usize>,
}

pub fn fuzzy_match(pattern: &str, text: &str) -> Option<FuzzyMatch> {
    let pattern = pattern.to_lowercase();
    let text_lower = text.to_lowercase();

    if pattern.is_empty() {
        return Some(FuzzyMatch {
            score: 0,
            matched_indices: Vec::new(),
        });
    }

    let pattern_chars: Vec<char> = pattern.chars().collect();
    let text_chars: Vec<char> = text_lower.chars().collect();

    if pattern_chars.len() > text_chars.len() {
        return None;
    }

    let mut matched_indices = Vec::new();
    let mut pattern_idx = 0;
    let mut score = 0i32;
    let mut prev_match_idx = None;

    for (i, &tc) in text_chars.iter().enumerate() {
        if pattern_idx >= pattern_chars.len() {
            break;
        }

        if tc == pattern_chars[pattern_idx] {
            matched_indices.push(i);

            if let Some(prev) = prev_match_idx {
                if i == prev + 1 {
                    score += 10;
                }
            }

            if i == 0
                || text_chars[i - 1] == ' '
                || text_chars[i - 1] == '_'
                || text_chars[i - 1] == '-'
            {
                score += 5;
            }

            score -= (i as i32) / 4;

            prev_match_idx = Some(i);
            pattern_idx += 1;
        }
    }

    if pattern_idx == pattern_chars.len() {
        score += 100;
        Some(FuzzyMatch {
            score,
            matched_indices,
        })
    } else {
        None
    }
}

pub fn fuzzy_search_snippets<'a>(
    query: &str,
    snippets: &'a [crate::domain::models::Snippet],
) -> Vec<(i32, &'a crate::domain::models::Snippet)> {
    let mut results: Vec<(i32, &'a crate::domain::models::Snippet)> = Vec::new();

    for snippet in snippets {
        let mut best_score = None;

        if let Some(m) = fuzzy_match(query, &snippet.name) {
            best_score = Some(best_score.map_or(m.score, |s: i32| s.max(m.score + 20)));
        }

        if let Some(m) = fuzzy_match(query, &snippet.command) {
            best_score = Some(best_score.map_or(m.score, |s: i32| s.max(m.score)));
        }

        for tag in &snippet.tags {
            if let Some(m) = fuzzy_match(query, tag) {
                best_score = Some(best_score.map_or(m.score, |s: i32| s.max(m.score + 10)));
            }
        }

        if let Some(score) = best_score {
            results.push((score, snippet));
        }
    }

    results.sort_by(|a, b| b.0.cmp(&a.0));
    results
}
