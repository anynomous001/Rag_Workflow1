"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const youtube_transcript_1 = require("youtube-transcript");
const textsplitters_1 = require("@langchain/textsplitters");
const dotenv_1 = __importDefault(require("dotenv"));
const google_genai_1 = require("@langchain/google-genai");
const generative_ai_1 = require("@google/generative-ai");
const qdrant_1 = require("@langchain/qdrant");
dotenv_1.default.config();
console.log("Environment Variables: ", process.env.GOOGLE_API_KEY);
console.log("Environment Variables: ", process.env.QDRANT_URL);
console.log("Environment Variables: ", process.env.QDRANT_API_KEY);
function fetchTranscript(videoId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // This fetches the transcript (auto-picks best language if available)
            const transcriptList = yield youtube_transcript_1.YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
            // Flatten it to plain text
            const transcript = transcriptList.map(chunk => chunk.text).join(' ');
            const textSplitter = new textsplitters_1.RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 0,
            });
            const texts = yield textSplitter.splitText(transcript);
            // console.log("Splitted Texts: ", texts);
            // console.log("Number of chunks: ", texts.length);
            // console.log("First chunk: ", texts[0]);
            // console.log("Last chunk: ", texts[texts.length - 1]);
            // console.log("Transcript processing completed.");
            const embeddings = new google_genai_1.GoogleGenerativeAIEmbeddings({
                model: "text-embedding-004", // 768 dimensions
                apiKey: process.env.GOOGLE_API_KEY,
                taskType: generative_ai_1.TaskType.RETRIEVAL_DOCUMENT,
                title: "Document title",
            });
            const embeddingResults = yield embeddings.embedDocuments(texts);
            // console.log("Embedding Results: ", embeddingResults);
            const vectorStore = yield qdrant_1.QdrantVectorStore.fromExistingCollection(embeddings, {
                url: process.env.QDRANT_URL,
                collectionName: "chatbot",
            });
            const retriever = vectorStore.asRetriever({ searchType: "similarity", k: 4 });
            const response1 = yield retriever.invoke('What is deepmind');
            console.log("Response for 'What is deepmind':", response1);
            const response2 = yield retriever.invoke('What is the future of AI?');
            console.log("Response for 'What is the future of AI?':", response2);
        }
        catch (error) {
            console.error("No captions available for this video or another error occurred.", error);
        }
    });
}
const videoId = "Gfr50f6ZBvo";
// Call the function with the video ID  
fetchTranscript(videoId).then(() => {
    console.log("Transcript processing completed.");
}).catch(error => {
    console.error("Error during transcript processing:", error);
});
