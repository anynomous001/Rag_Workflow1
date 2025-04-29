import { YoutubeTranscript } from 'youtube-transcript';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from 'dotenv';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";




dotenv.config();


async function fetchTranscript(videoId: string) {
    try {
        // This fetches the transcript (auto-picks best language if available)
        const transcriptList = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });

        // Flatten it to plain text
        const transcript = transcriptList.map(chunk => chunk.text).join(' ');


        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 150,
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

        // const embeddingResults = await embeddings.embedDocuments(texts);
        // console.log("Embedding Results: ", embeddingResults);

        const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
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

        await vectorStore.addDocuments(documents);
        console.log("Documents added to Qdrant Vector Store.");



        const retriever = vectorStore.asRetriever(
            { searchType: "similarity", k: 4 }
        );



        const llm = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-pro",
            temperature: 0.2,
            maxRetries: 2,
            // other params...
        });


        const prompt = ChatPromptTemplate.fromMessages([
            ["system", `You are a helpful assistant.
    Answer ONLY from the provided transcript context.
    If the context is insufficient, just say you don't know.`],
            HumanMessagePromptTemplate.fromTemplate(`Context: {context}\n\nQuestion: {question}`)
        ]);

        const question = "Is the topic of kafka discussed in this video? If yes, what was discussed?";
        const retrievedDocs = await retriever.invoke(question);


        // console.log("Retrieved Documents:", retrievedDocs);
        const context = retrievedDocs.map(doc => doc.pageContent).join("\n\n");

        const formattedPrompt = await prompt.format({
            context: context,
            question: question
        });

        const llmResponse = await llm.invoke(formattedPrompt);
        console.log("Final Answer:", llmResponse.content);

    } catch (error) {
        console.error("No captions available for this video or another error occurred.", error);
    }
}

const videoId = "06iRM1Ghr1k";

// Call the function with the video ID  
fetchTranscript(videoId).then(() => {
    console.log("Transcript processing completed.");
}).catch(error => {
    console.error("Error during transcript processing:", error);
});
