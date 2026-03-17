import dotenv from "dotenv";
import OpenAI, { ClientOptions as OpenAIClientOptions } from "openai";

// Load environment variables
dotenv.config();

type ClientOptions = Omit<OpenAIClientOptions, "apiKey" | "baseURL">;

// Check for required environment variables
const OCTAGON_API_KEY = process.env.OCTAGON_API_KEY;
const OCTAGON_API_BASE_URL =
  process.env.OCTAGON_API_BASE_URL || "https://api.octagonagents.com/v1";

if (!OCTAGON_API_KEY) {
  console.error(
    "Error: OCTAGON_API_KEY is not set in the environment variables",
  );
  throw new Error("OCTAGON_API_KEY is not set in the environment variables");
}

// Initialize OpenAI client with Octagon API
const createClient = (options: ClientOptions) => {
  return new OpenAI({
    apiKey: OCTAGON_API_KEY,
    baseURL: OCTAGON_API_BASE_URL,
    ...options,
  });
};

export default createClient;
