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
const google_genai_2 = require("@langchain/google-genai");
const prompts_1 = require("@langchain/core/prompts");
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
                chunkOverlap: 150,
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
            // const embeddingResults = await embeddings.embedDocuments(texts);
            // console.log("Embedding Results: ", embeddingResults);
            const vectorStore = yield qdrant_1.QdrantVectorStore.fromExistingCollection(embeddings, {
                url: process.env.QDRANT_URL,
                collectionName: "chatbot",
            });
            const documents = texts.map((text, index) => ({
                pageContent: text,
                metadata: {
                    id: index.toString(), // Use index as a string for the ID
                    videoId: videoId,
                    chunkIndex: index,
                },
            }));
            yield vectorStore.addDocuments(documents);
            console.log("Documents added to Qdrant Vector Store.");
            const retriever = vectorStore.asRetriever({ searchType: "similarity", k: 4 });
            const llm = new google_genai_2.ChatGoogleGenerativeAI({
                model: "gemini-1.5-pro",
                temperature: 0.2,
                maxRetries: 2,
                // other params...
            });
            const prompt = prompts_1.ChatPromptTemplate.fromMessages([
                ["system", `You are a helpful assistant.
    Answer ONLY from the provided transcript context.
    If the context is insufficient, just say you don't know.`],
                prompts_1.HumanMessagePromptTemplate.fromTemplate(`Context: {context}\n\nQuestion: {question}`)
            ]);
            const question = "Is the topic of kafka discussed in this video? If yes, what was discussed?";
            const retrievedDocs = yield retriever.invoke(question);
            // console.log("Retrieved Documents:", retrievedDocs);
            const context = retrievedDocs.map(doc => doc.pageContent).join("\n\n");
            const formattedPrompt = yield prompt.format({
                context: context,
                question: question
            });
            const llmResponse = yield llm.invoke(formattedPrompt);
            console.log("Final Answer:", llmResponse.content);
        }
        catch (error) {
            console.error("No captions available for this video or another error occurred.", error);
        }
    });
}
const videoId = "06iRM1Ghr1k";
// Call the function with the video ID  
fetchTranscript(videoId).then(() => {
    console.log("Transcript processing completed.");
}).catch(error => {
    console.error("Error during transcript processing:", error);
});
