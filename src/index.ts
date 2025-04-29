import { YoutubeTranscript } from 'youtube-transcript';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from 'dotenv';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { QdrantVectorStore } from "@langchain/qdrant";



dotenv.config();

console.log("Environment Variables: ", process.env.GOOGLE_API_KEY);
console.log("Environment Variables: ", process.env.QDRANT_URL);
console.log("Environment Variables: ", process.env.QDRANT_API_KEY);

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
        // console.log("Embedding Results: ", embeddingResults);

        const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
            url: process.env.QDRANT_URL,
            collectionName: "chatbot",
        });

        const retriever = vectorStore.asRetriever(
            { searchType: "similarity", k: 4 }
        );

        const response1 = await retriever.invoke('What is deepmind');
        console.log("Response for 'What is deepmind':", response1);

        const response2 = await retriever.invoke('What is the future of AI?');
        console.log("Response for 'What is the future of AI?':", response2);
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
