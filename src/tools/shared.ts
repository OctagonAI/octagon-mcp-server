import OpenAI from "openai";

export async function processStreamingResponse(
  stream: AsyncIterable<any>,
): Promise<string> {
  let fullResponse = "";

  try {
    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices[0]?.delta?.content) {
        fullResponse += chunk.choices[0].delta.content;
      }

      if (chunk.type === "response.output_text.delta") {
        fullResponse += chunk.text?.delta || "";
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
