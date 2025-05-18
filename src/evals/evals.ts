//evals.ts

import { EvalConfig } from 'mcp-evals';
import { openai } from "@ai-sdk/openai";
import { grade, EvalFunction } from "mcp-evals";

const octagonSecAgentEval: EvalFunction = {
    name: "octagon-sec-agent Tool Evaluation",
    description: "Evaluates the SEC filings analysis capabilities of the octagon-sec-agent",
    run: async () => {
        const result = await grade(openai("gpt-4"), "What was Apple's R&D expense as a percentage of revenue in their latest fiscal year?");
        return JSON.parse(result);
    }
};

const octagonTranscriptsAgentEval: EvalFunction = {
    name: "octagon-transcripts-agent Evaluation",
    description: "Evaluates the accuracy and completeness of the octagon-transcripts-agent for analyzing earnings call transcripts",
    run: async () => {
        const result = await grade(openai("gpt-4"), "What did Amazon's CEO say about AWS growth expectations in the latest earnings call?");
        return JSON.parse(result);
    }
};

const octagonFinancialsAgentEval: EvalFunction = {
    name: "octagon-financials-agent Evaluation",
    description: "Evaluates the financial analysis and ratio calculation capabilities of the octagon-financials-agent",
    run: async () => {
        const result = await grade(openai("gpt-4"), "Compare the gross margins, operating margins, and net margins of Apple, Microsoft, and Google over the last 3 years and provide insights on which company shows the strongest profitability trends.");
        return JSON.parse(result);
    }
};

const octagonStockDataAgentEval: EvalFunction = {
    name: "Octagon Stock Data Agent Evaluation",
    description: "Evaluates the performance of the Octagon Stock Data Agent for stock market data and valuation analysis",
    run: async () => {
        const result = await grade(openai("gpt-4"), "Compare Apple's stock performance to the S&P 500 over the last 6 months, including any significant events or catalysts that influenced price movements.");
        return JSON.parse(result);
    }
};

const octagonCompaniesAgentEval: EvalFunction = {
    name: 'octagon-companies-agent Evaluation',
    description: 'Evaluates the specialized private market intelligence tool for company info lookups and financials',
    run: async () => {
        const result = await grade(openai("gpt-4"), "List the top 5 companies in the AI sector by revenue growth");
        return JSON.parse(result);
    }
};

const config: EvalConfig = {
    model: openai("gpt-4"),
    evals: [octagonSecAgentEval, octagonTranscriptsAgentEval, octagonFinancialsAgentEval, octagonStockDataAgentEval, octagonCompaniesAgentEval]
};
  
export default config;
  
export const evals = [octagonSecAgentEval, octagonTranscriptsAgentEval, octagonFinancialsAgentEval, octagonStockDataAgentEval, octagonCompaniesAgentEval];