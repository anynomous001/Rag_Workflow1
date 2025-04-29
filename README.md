# YouTube Transcript Analysis Tool

This project allows you to fetch, process, and analyze YouTube video transcripts using Google's Generative AI and vector database technology. It extracts transcripts from YouTube videos, splits them into manageable chunks, embeds them using Google's text embedding model, stores them in a Qdrant vector database, and allows for semantic search and AI-powered question answering.

## Features

- YouTube transcript extraction
- Text chunking for better processing
- Vector embeddings with Google's text-embedding-004 model
- Vector storage with Qdrant
- Semantic search and retrieval
- AI-powered question answering with Google's Gemini 1.5 Pro

## Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- A Google API key with access to Generative AI API
- A Qdrant vector database (local or cloud)

## Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd youtube-transcript-analysis
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   QDRANT_URL=your_qdrant_url_here
   ```

## Required Dependencies

Install the following packages:
```bash
npm install youtube-transcript @langchain/textsplitters dotenv @langchain/google-genai @google/generative-ai @langchain/qdrant @langchain/core typescript ts-node
```

## Usage

1. Modify the `videoId` variable in the script to the YouTube video ID you want to analyze:
   ```typescript
   const videoId = "06iRM1Ghr1k"; // Replace with your YouTube video ID
   ```

2. Run the script:
   ```bash
   npx ts-node index.ts
   ```

3. The script will:
   - Fetch the transcript from the YouTube video
   - Split it into manageable chunks
   - Create embeddings for each chunk
   - Store them in your Qdrant vector database
   - Run a sample query against the transcript

## Customizing Queries

To ask different questions about the video content, modify the `question` variable:

```typescript
const question = "Is the topic of kafka discussed in this video? If yes, what was discussed?";
```

## Setting Up Qdrant

### Local Installation
1. Install Docker
2. Run Qdrant locally:
   ```bash
   docker pull qdrant/qdrant
   docker run -p 6333:6333 -p 6334:6334 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
   ```
   In this case, set `QDRANT_URL=http://localhost:6333` in your `.env` file

### Cloud Service
1. Create an account at [Qdrant Cloud](https://cloud.qdrant.io/)
2. Create a cluster and get your API key
3. Set `QDRANT_URL=https://your-cluster-url.qdrant.io` in your `.env` file

## Troubleshooting

- **No captions available error**: The video might not have captions or they might be disabled.
- **GOOGLE_API_KEY error**: Make sure your API key has access to the Generative AI API.
- **Qdrant connection issues**: Check your Qdrant URL and make sure the service is running.

## Project Structure

```
.
├── .env                  # Environment variables
├── index.ts              # Main application file
├── package.json          # Project dependencies
├── README.md             # This file
└── tsconfig.json         # TypeScript configuration
```

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.