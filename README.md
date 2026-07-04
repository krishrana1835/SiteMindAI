# SiteMind AI Web Chat

A web chat application that leverages AI to answer questions based on the content of indexed websites. This application supports indexing multiple websites within a single session, allowing users to query information across a custom knowledge base.

## Features

*   **Multi-Site Indexing**: Add multiple websites to the AI's knowledge base within a single session.
*   **Site Management**: Easily view and remove indexed websites.
*   **AI-Powered Chat**: Ask questions and get answers grounded in the content of the indexed sites.
*   **Real-time Indexing Progress**: Monitor the indexing status of websites.
*   **Source Attribution**: AI responses include links to the source content.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: v18.x or higher (LTS recommended)
*   **npm** or **yarn**: A package manager for Node.js.
*   **Playwright Browsers**: The backend uses Playwright for web crawling. You'll need to install the necessary browsers.

## Setup Instructions

Follow these steps to get the project up and running on your local machine.

### 1. Clone the repository

```bash
git clone https://github.com/krishrana1835/SiteMindAI.git
cd SiteMindAI
```

### 2. Install Playwright Browsers

Navigate to the `backend` directory and install Playwright browsers.

```bash
cd backend
npx playwright install --with-deps
cd ..
```

### 3. Install Dependencies

Install the required dependencies for both the backend and frontend.

#### Backend

```bash
cd backend
npm install # or yarn install
cd ..
```

#### Frontend

```bash
cd frontend
npm install # or yarn install
cd ..
```

### 4. Environment Variables

Create a `.env` file in the `backend` directory based on the `.env.example` provided (if any, otherwise assume none are needed for basic setup).
The project might require an API key for the AI model (e.g., Groq API key).

```env
# backend/.env
GROQ_API_KEY=your_groq_api_key_here
VITE_API_BASE_URL=http://localhost:5000 # For frontend, if not set in frontend/.env
```

### 5. Start the Backend Server

Navigate to the `backend` directory and start the server.

```bash
cd backend
npm start # or yarn start
```

The backend server should start on `http://localhost:5000` (or the port specified in its configuration).

### 6. Start the Frontend Development Server

Navigate to the `frontend` directory and start the development server.

```bash
cd frontend
npm run dev # or yarn dev
```

The frontend application will typically open in your browser at `http://localhost:5173` (or another port if 5173 is in use).

## Usage

1.  **Add Websites**: In the frontend application, enter a URL into the input field and click "Add Index". The application will crawl and index the website's content. You can add multiple sites.
2.  **Chat with AI**: Once sites are indexed, you can type your questions into the chat input. The AI will provide answers based on the content of all currently indexed websites.
3.  **Remove Websites**: To remove a website from the indexed knowledge base, click the "Trash" icon next to its entry in the "Indexed Sites" list.
4.  **New Chat**: Click the "New Chat" button to clear the current conversation and start fresh.

## Technical Details

### Crawling Strategy

The application employs `Playwright` to perform web crawling. When a user provides a URL for indexing, Playwright launches a headless browser, navigates to the specified URL, and extracts the page's HTML content. This ensures that the content seen by the crawler is what a typical browser would render, including dynamically loaded content. The `Readability.js` library is then used to parse the main content of the page, stripping away boilerplate such as navigation, ads, and footers, to focus on the core textual information.

### Chunking and Retrieval Approach

1.  **Text Extraction and Chunking**: After extracting the clean text from a webpage, the content is divided into manageable "chunks." These chunks are created by splitting the text into sentences and then grouping sentences together, ensuring that individual chunks do not exceed a predefined maximum character limit (e.g., 1000 characters). This method helps in maintaining semantic coherence within each chunk.

2.  **Embedding Generation**: Each text chunk is then converted into a numerical vector (an embedding) using an AI model (e.g., via `embedding.service.js` and an external embedding provider). These embeddings capture the semantic meaning of the text.

3.  **Vector Storage**: The generated embeddings, along with their original text and metadata (including the `siteId` and `originalUrl`), are stored in an in-memory `vectorStore`. This store is designed to group chunks by their originating website, allowing for targeted retrieval.

4.  **Retrieval on Query**: When a user poses a question, an embedding is generated for the query. This query embedding is then compared against all stored chunk embeddings using cosine similarity to find the most semantically relevant chunks. The top 5 (or a configurable number) most similar chunks are retrieved to serve as context.

### Keeping Answers Grounded

To ensure that the AI's responses are accurate and directly relevant to the indexed content, a Retrieval-Augmented Generation (RAG) approach is used:

1.  **Contextual Prompting**: The retrieved top chunks are dynamically inserted into a prompt that is sent to a Large Language Model (LLM). This prompt explicitly instructs the LLM to answer the user's question *only* using the provided context.
2.  **Strict Adherence**: The prompt includes directives such as "Answer the user's question strictly using the provided context below," and "If the context does not contain the answer, say 'I cannot find the answer on the provided websites.'" This minimizes the LLM's tendency to hallucinate or generate information not present in the source material.
3.  **Source Attribution**: For full transparency and user verification, the AI's responses include links to the `originalUrl` of the source chunks. This allows users to easily refer back to the exact content from which the answer was derived.
4.  **Multi-Site Context**: When multiple sites are indexed, the system intelligently searches across all relevant sites. The prompt dynamically lists all relevant indexed websites, further constraining the LLM to the user's defined knowledge base.
