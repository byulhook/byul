import dotenv from "dotenv";
import OpenAI from "openai";
import { ANSI_COLORS } from "./index.js";
dotenv.config();
export async function isValidOpenAIKey(apiKey) {
    try {
        const openai = new OpenAI({
            apiKey: apiKey,
        });
        const response = await openai.models.list();
        return !!response;
    }
    catch (error) {
        console.log();
        console.warn(`${ANSI_COLORS.red} Please check if the OPENAI_API_KEY environment variable is correctly set in the .env file ${ANSI_COLORS.reset}`);
        console.log(`${ANSI_COLORS.red} If you want to commit without AI, set "AI": false in the byul.config.json file.${ANSI_COLORS.reset}`);
        throw new Error(`Failed to validate OpenAI API key: ${error}`);
    }
}
