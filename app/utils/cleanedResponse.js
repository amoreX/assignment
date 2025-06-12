"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function CleanJson(text) {
  const genAI = new GoogleGenerativeAI(
    "AIzaSyDmJ4pfunqTpK5HGdonHODq6K73YmRcbUI"
  );
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Give me a cleaned version of the following text and return in proper JSON format only. Do not include any extra text or symbols. Extract key-value pairs from the content:\n\n${text}`;

  const result = await model.generateContent(prompt);
  let responseText = result.response.text();
  responseText = responseText.replace("```json", "");
  responseText = responseText.replace("```", "");
  console.log(responseText);
  try {
    const parse_result = JSON.parse(responseText);
    return parse_result;
  } catch (error) {
    console.error("JSON parsing failed:", error);
    return responseText;
  }
}
