import Groq from "groq-sdk";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey });

async function main() {
  const imageBase64 = fs.readFileSync("assets/image.png").toString("base64");
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is in this image?" },
            { type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}` } }
          ]
        }
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
    });
    console.log(response.choices[0].message.content);
  } catch (e) {
    console.error(e);
  }
}

main();
