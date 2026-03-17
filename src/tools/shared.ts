import OpenAI from "openai";

export async function processStreamingResponse(
  stream: AsyncIterable<any>,
): Promise<string> {
  let fullResponse = "";

  try {
    for await (const chunk of stream) {
      if (chunk.type === "response.output_text.delta") {
        // Responses API streaming text token.
        if (typeof chunk.delta === "string") {
          fullResponse += chunk.delta;
        } else if (typeof chunk.text?.delta === "string") {
          fullResponse += chunk.text.delta;
        }
        continue;
      }
    }

    return fullResponse;
  } catch (error) {
    console.error("Error processing streaming response:", error);
    throw error;
  }
}

export async function createResponse(
  client: OpenAI,
  model: string,
  prompt: string,
): Promise<string> {
  const response = await client.responses.create({
    model,
    input: prompt,
    stream: true,
    metadata: { tool: "mcp" },
  });

  // Process the streaming response and return the full response as a string
  return await processStreamingResponse(response);
}
