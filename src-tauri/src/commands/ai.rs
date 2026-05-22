use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct AiRequest {
    pub provider: String,
    pub model: String,
    pub api_key: Option<String>,
    pub custom_endpoint: Option<String>,
    pub context: String,
}

#[derive(Deserialize, Debug)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

#[derive(Deserialize, Debug)]
struct OpenAIChoice {
    message: OpenAIMessage,
}

#[derive(Deserialize, Debug, Serialize)]
struct OpenAIMessage {
    role: String,
    content: String,
}

#[derive(Serialize, Debug)]
struct OpenAIRequestBody {
    model: String,
    messages: Vec<OpenAIMessage>,
}

#[tauri::command]
pub async fn ai_analyze(request: AiRequest) -> Result<String, String> {
    println!(
        "[AI DEBUG] Starting analysis with provider: {} and model: {}",
        request.provider, request.model
    );
    let client = Client::new();

    let prompt = format!(
        "Explain this terminal output and suggest next commands:\n\n{}",
        request.context
    );

    match request.provider.as_str() {
        "openai" | "openai-compatible" => {
            let mut endpoint = request
                .custom_endpoint
                .clone()
                .unwrap_or_else(|| "https://api.openai.com/v1/chat/completions".to_string());

            // Auto-append standard path if using a custom endpoint and it's missing
            if request.provider == "openai-compatible" && !endpoint.ends_with("/chat/completions") {
                println!("[AI DEBUG] Suffix /chat/completions missing, appending automatically");
                if !endpoint.ends_with('/') {
                    endpoint.push('/');
                }
                endpoint.push_str("chat/completions");
            }

            println!(
                "[AI DEBUG] Sending request to OpenAI-compatible endpoint: {}",
                endpoint
            );

            let body = OpenAIRequestBody {
                model: request.model,
                messages: vec![OpenAIMessage {
                    role: "user".to_string(),
                    content: prompt,
                }],
            };

            let mut req = client.post(endpoint).json(&body);

            if let Some(key) = request.api_key {
                println!(
                    "[AI DEBUG] Using provided API key (starts with: {})",
                    &key[..std::cmp::min(key.len(), 5)]
                );
                req = req.header("Authorization", format!("Bearer {}", key));
            } else {
                println!("[AI DEBUG] Warning: No API key provided for OpenAI-compatible provider");
            }

            let resp = req.send().await.map_err(|e| {
                let err = format!("Request failed: {}", e);
                println!("[AI DEBUG] {}", err);
                err
            })?;

            println!(
                "[AI DEBUG] Received response with status: {}",
                resp.status()
            );

            if !resp.status().is_success() {
                let err_text = resp.text().await.unwrap_or_default();
                println!("[AI DEBUG] API Error details: {}", err_text);
                return Err(format!("API Error: {}", err_text));
            }

            let data: OpenAIResponse = resp.json().await.map_err(|e| {
                let err = format!("Failed to parse response: {}", e);
                println!("[AI DEBUG] {}", err);
                err
            })?;

            println!("[AI DEBUG] Analysis successful");
            Ok(data
                .choices
                .get(0)
                .map(|c| c.message.content.clone())
                .unwrap_or_default())
        }
        "ollama" => {
            let endpoint = request
                .custom_endpoint
                .clone()
                .unwrap_or_else(|| "http://localhost:11434/api/generate".to_string());
            println!(
                "[AI DEBUG] Sending request to Ollama endpoint: {}",
                endpoint
            );

            #[derive(Serialize)]
            struct OllamaRequest {
                model: String,
                prompt: String,
                stream: bool,
            }

            #[derive(Deserialize)]
            struct OllamaResponse {
                response: String,
            }

            let body = OllamaRequest {
                model: request.model,
                prompt,
                stream: false,
            };

            let resp = client
                .post(endpoint)
                .json(&body)
                .send()
                .await
                .map_err(|e| {
                    let err = format!("Ollama request failed: {}", e);
                    println!("[AI DEBUG] {}", err);
                    err
                })?;

            println!(
                "[AI DEBUG] Received Ollama response with status: {}",
                resp.status()
            );

            let data: OllamaResponse = resp.json().await.map_err(|e| {
                let err = format!("Failed to parse Ollama response: {}", e);
                println!("[AI DEBUG] {}", err);
                err
            })?;

            println!("[AI DEBUG] Ollama analysis successful");
            Ok(data.response)
        }
        _ => {
            println!(
                "[AI DEBUG] Error: Unsupported provider: {}",
                request.provider
            );
            Err("Unsupported provider".to_string())
        }
    }
}
