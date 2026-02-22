import Groq from "groq-sdk";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey });

async function main() {
  const models = await groq.models.list();
  console.log(models.data.map(m => m.id));
}

main();
