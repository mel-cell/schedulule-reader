import Groq from "groq-sdk";
import * as fs from "fs";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
const imagePath = process.env.IMAGE_PATH || "assets/image.png";

if (!apiKey) {
  console.error("Please set GROQ_API_KEY in .env file");
  process.exit(1);
}

const groq = new Groq({ apiKey });

async function run() {
  try {
    // Read the image file and convert to base64
    const imageBase64 = fs.readFileSync(imagePath).toString("base64");
    const mimeType = "image/png"; // Default to png as requested

    console.log("Processing image with Groq... please wait.");

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
                Extract the school schedule data from the provided image (Calendar of SMK Negeri 6 Malang 2025/2026).
                The image contains two semesters (Ganjil and Genap).
                
                Please extract all months from July 2025 to June 2026.
                For each month, provide:
                1. Month name and Year.
                2. "Hari Efektif (HE)" value (found at the bottom of each calendar table).
                3. List of "Kegiatan" (Activities) from the "Keterangan" table below the calendar, including the range of dates and the description.

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
                            { "tanggal": "01 s.d 11", "keterangan": "Libur Semester Genap 24/25" }
                          ]
                        }
                      ]
                    }
                  ]
                }
                
                Return ONLY the JSON block.
              `,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.1,
      max_tokens: 8192,
      top_p: 1,
      stream: false,
      response_format: { type: "json_object" },
      stop: null,
    });

    const text = chatCompletion.choices[0]?.message?.content || "";
    
    try {
      const jsonData = JSON.parse(text);
      const dataDir = path.join(process.cwd(), "data");
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Generate filename based on current date and time
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); 
      const fileName = `schedule-${timestamp}.json`;
      
      const outputPath = path.join(dataDir, fileName);
      fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
      console.log(`Success! Data saved to ${outputPath}`);
    } catch (parseError) {
      console.error("Failed to parse JSON response from Groq.");
      console.log("Raw Response:", text);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
