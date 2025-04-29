import { YoutubeTranscript } from 'youtube-transcript';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { configDotenv } from 'dotenv';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";




configDotenv(); // Load environment variables from .env file
async function fetchTranscript(videoId: string) {
    try {
        // This fetches the transcript (auto-picks best language if available)
        const transcriptList = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });

        // Flatten it to plain text
        const transcript = transcriptList.map(chunk => chunk.text).join(' ');


        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 0,
        });
        const texts = await textSplitter.splitText(transcript);

        // console.log("Splitted Texts: ", texts);
        // console.log("Number of chunks: ", texts.length);
        // console.log("First chunk: ", texts[0]);
        // console.log("Last chunk: ", texts[texts.length - 1]);
        // console.log("Transcript processing completed.");


        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "text-embedding-004", // 768 dimensions
            apiKey: process.env.GOOGLE_API_KEY,
            taskType: TaskType.RETRIEVAL_DOCUMENT,
            title: "Document title",
        });

        const embeddingResults = await embeddings.embedDocuments(texts);
        console.log("Embedding Results: ", embeddingResults);

    } catch (error) {
        console.error("No captions available for this video or another error occurred.", error);
    }
}

const videoId = "Gfr50f6ZBvo";

// Call the function with the video ID  
fetchTranscript(videoId).then(() => {
    console.log("Transcript processing completed.");
}).catch(error => {
    console.error("Error during transcript processing:", error);
});
