import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const imagePath = process.env.IMAGE_PATH || "uploaded_media.png";

if (!apiKey) {
  console.error("Please set GEMINI_API_KEY in .env file");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Helper function to convert local file to GoogleGenerativeAI.Part object
function fileToGenerativePart(path: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType,
    },
  };
}

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Extract the school schedule data from the provided images (Calendar of SMK Negeri 6 Malang 2025/2026).
      The images contain two semesters (Ganjil and Genap).
      
      Please extract all months from July 2025 to June 2026.
      For each month, provide:
      1. Month name and Year.
      2. "Hari Efektif (HE)" value.
      3. List of "Kegiatan" (Activities) from the table below the calendar, including the range of dates and the description.
      4. If possible, identify specific holiday dates or special events highlighted in the calendar grid (e.g., dates with red background are usually holidays).

      Return the data strictly in JSON format with the following structure:
      {
        "nama_sekolah": "SMK Negeri 6 Malang",
        "tahun_pelajaran": "2025/2026",
        "semester": [
          {
            "nama": "Ganjil",
            "bulan": [
              {
                "nama": "Juli 2025",
                "hari_efektif": 14,
                "kegiatan": [
                  { "tanggal": "01 s.d 11", "keterangan": "Libur Semester Genap 24/25" },
                  ...
                ]
              },
              ...
            ]
          },
          ...
        ]
      }
      
      Make sure to capture all 12 months.
    `;

    const imagePart = fileToGenerativePart(imagePath, "image/png");

    console.log("Processing image... please wait.");
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Clean up response if it contains markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    const jsonString = (jsonMatch ? jsonMatch[1] : text) || "";

    try {
      const jsonData = JSON.parse(jsonString);
      const dataDir = path.join(process.cwd(), "data");
      
      // Create data directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const outputPath = path.join(dataDir, "schedule.json");
      fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
      console.log(`Success! Data saved to ${outputPath}`);
    } catch (parseError) {
      console.error("Failed to parse JSON response from AI.");
      console.log("Raw Response:", text);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
