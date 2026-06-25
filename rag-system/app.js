// ===================================================
// Cognitive Hybrid RAG System - Master Controller
// app.js - Client-Side TF-IDF & Semantic Search Engine
// ===================================================

// Global state variables
let dbChunks = [];
let chatHistory = [];
let lastResults = null;
let fileQueue = [];

// Initialize PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

// English and Arabic Stop Words
const STOP_WORDS_EN = new Set(['a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves']);
const STOP_WORDS_AR = new Set(['من', 'الى', 'في', 'على', 'عن', 'منذ', 'خلف', 'امام', 'تحت', 'فوق', 'هذا', 'هذه', 'هؤلاء', 'ذلك', 'تلك', 'هو', 'هي', 'هما', 'هم', 'هن', 'انت', 'انتي', 'انتم', 'الذي', 'التي', 'الذين', 'ان', 'انما', 'لكن', 'كان', 'ليت', 'لعل', 'كل', 'بعض', 'غير', 'سوى', 'مع', 'حتى', 'الا', 'بل', 'لكي', 'بين', 'عند', 'ثم', 'او', 'ام', 'لا', 'ما', 'يا', 'قد', 'لقد', 'كانت']);

// ===================================================
// 1. Text Preprocessing & Cleaning
// ===================================================
function cleanArabicText(text) {
    if (!text) return "";
    return text
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u0652]/g, "") // Remove Arabic diacritics (harakat)
        .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9\s]/g, "") // Remove punctuation
        .replace(/\s+/g, " ")
        .trim();
}

function tokenize(text) {
    if (!text) return [];
    
    // Check if Arabic
    const arabicCharCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const isArabic = arabicCharCount / text.length > 0.3;
    
    let processed = text.toLowerCase();
    if (isArabic) {
        processed = cleanArabicText(processed);
    } else {
        processed = processed.replace(/[^a-z0-9\s]/g, ""); // strip english punctuation
    }
    
    const tokens = processed.split(/\s+/).filter(t => t.length > 1);
    
    // Remove stop words
    return tokens.filter(token => {
        return !STOP_WORDS_EN.has(token) && !STOP_WORDS_AR.has(token);
    });
}

// Generate Character N-Grams (used to simulate semantic spelling tolerance)
function getTrigrams(text) {
    const s = text.toLowerCase().replace(/\s+/g, ' ');
    const trigrams = [];
    for (let i = 0; i < s.length - 2; i++) {
        trigrams.push(s.substring(i, i + 3));
    }
    return trigrams;
}

// ===================================================
// 2. Client-side Multilingual TF-IDF Retriever
// ===================================================
class TFIDFRetriever {
    constructor() {
        this.vocab = new Map(); // token -> termIndex
        this.vocabList = [];
        this.idf = []; // termIndex -> idfValue
        this.chunkTF = []; // chunkIndex -> { termIndex -> tf }
        this.chunkNorms = []; // chunkIndex -> euclideanNorm
        this.chunks = [];
        this.corpusLanguage = "unknown";
    }

    fit(chunks) {
        this.chunks = chunks;
        this.vocab.clear();
        this.vocabList = [];
        this.idf = [];
        this.chunkTF = [];
        this.chunkNorms = [];

        if (chunks.length === 0) return;

        // Detect dominant language of corpus
        let arabicCount = 0;
        let totalChars = 0;
        chunks.forEach(c => {
            const ar = (c.text.match(/[\u0600-\u06FF]/g) || []).length;
            arabicCount += ar;
            totalChars += c.text.length;
        });
        
        const arabicRatio = totalChars > 0 ? arabicCount / totalChars : 0;
        if (arabicRatio > 0.5) {
            this.corpusLanguage = "arabic";
        } else if (arabicRatio > 0.05) {
            this.corpusLanguage = "mixed";
        } else {
            this.corpusLanguage = "english";
        }

        const docCount = chunks.length;
        const df = []; // termIndex -> document frequency

        // First pass: build vocab and TF
        chunks.forEach((chunk, chunkIdx) => {
            const tokens = tokenize(chunk.text);
            const tfMap = new Map();
            
            tokens.forEach(token => {
                let termIdx = this.vocab.get(token);
                if (termIdx === undefined) {
                    termIdx = this.vocab.size;
                    this.vocab.set(token, termIdx);
                    this.vocabList.push(token);
                    df.push(0);
                }
                tfMap.set(termIdx, (tfMap.get(termIdx) || 0) + 1);
            });

            // Mark unique terms in this document to calculate document frequency
            tfMap.forEach((tf, termIdx) => {
                df[termIdx]++;
            });

            this.chunkTF.push(tfMap);
        });

        // Compute IDF: idf = log(1 + (N - df + 0.5) / (df + 0.5)) (BM25-style IDF variant)
        const vocabSize = this.vocab.size;
        for (let i = 0; i < vocabSize; i++) {
            const dFrequency = df[i] || 0;
            const idfVal = Math.max(0.0001, Math.log(1 + (docCount - dFrequency + 0.5) / (dFrequency + 0.5)));
            this.idf.push(idfVal);
        }

        // Compute Euclidean norms for cosine similarity normalization
        chunks.forEach((chunk, chunkIdx) => {
            const tfMap = this.chunkTF[chunkIdx];
            let normSq = 0;
            tfMap.forEach((tf, termIdx) => {
                const tfIdfWeight = tf * this.idf[termIdx];
                normSq += tfIdfWeight * tfIdfWeight;
            });
            this.chunkNorms.push(Math.sqrt(normSq));
        });
    }

    retrieve(queryText, allowedFiles = null, pageRange = null) {
        const queryTokens = tokenize(queryText);
        if (queryTokens.length === 0 || this.vocab.size === 0) {
            return this.chunks.map(c => [c, 0]);
        }

        // Calculate query TF vector
        const queryTF = new Map();
        queryTokens.forEach(token => {
            const termIdx = this.vocab.get(token);
            if (termIdx !== undefined) {
                queryTF.set(termIdx, (queryTF.get(termIdx) || 0) + 1);
            }
        });

        // Query vector norm
        let queryNormSq = 0;
        queryTF.forEach((tf, termIdx) => {
            const tfIdfWeight = tf * this.idf[termIdx];
            queryNormSq += tfIdfWeight * tfIdfWeight;
        });
        const queryNorm = Math.sqrt(queryNormSq);

        const scores = [];

        this.chunks.forEach((chunk, chunkIdx) => {
            // Apply Metadata filtering
            if (allowedFiles && !allowedFiles.includes(chunk.metadata.source)) {
                scores.push([chunk, 0]);
                return;
            }
            if (pageRange && (chunk.metadata.page < pageRange[0] || chunk.metadata.page > pageRange[1])) {
                scores.push([chunk, 0]);
                return;
            }

            const tfMap = this.chunkTF[chunkIdx];
            const docNorm = this.chunkNorms[chunkIdx];

            if (docNorm === 0 || queryNorm === 0) {
                scores.push([chunk, 0]);
                return;
            }

            // Cosine dot product
            let dotProduct = 0;
            queryTF.forEach((qTf, termIdx) => {
                const docTf = tfMap.get(termIdx) || 0;
                if (docTf > 0) {
                    dotProduct += (qTf * this.idf[termIdx]) * (docTf * this.idf[termIdx]);
                }
            });

            const score = dotProduct / (queryNorm * docNorm);
            scores.push([chunk, score]);
        });

        return scores.sort((a, b) => b[1] - a[1]);
    }

    getStatistics() {
        const vocabSize = this.vocab.size;
        let nonZeros = 0;
        this.chunkTF.forEach(tfMap => {
            nonZeros += tfMap.size;
        });

        const totalCells = vocabSize * this.chunks.length;
        const sparsity = totalCells > 0 ? (1 - nonZeros / totalCells) * 100 : 0;

        // Extract top terms based on frequency
        const termFreqs = new Array(vocabSize).fill(0);
        this.chunkTF.forEach(tfMap => {
            tfMap.forEach((tf, termIdx) => {
                termFreqs[termIdx] += tf;
            });
        });

        const sortedTerms = this.vocabList.map((token, termIdx) => ({
            token: token,
            frequency: termFreqs[termIdx],
            idf: this.idf[termIdx]
        })).sort((a, b) => b.frequency - a.frequency);

        return {
            vocabulary_size: vocabSize,
            sparsity: sparsity.toFixed(2),
            non_zeros: nonZeros,
            top_terms: sortedTerms.slice(0, 15)
        };
    }
}

// ===================================================
// 3. Client-side Simulated Vector (Semantic) Search
// ===================================================
class SemanticRetriever {
    constructor() {
        this.chunks = [];
    }

    fit(chunks) {
        this.chunks = chunks;
    }

    retrieve(queryText, allowedFiles = null, pageRange = null) {
        // We simulate a robust vector embedding matching.
        // To mimic semantic matching that goes beyond exact word stems, 
        // we combine character-trigram matching + keyword synonym matching.
        // This simulates a neural model that is spelling-tolerant and concept-aligned!
        
        const queryTrigrams = getTrigrams(queryText);
        if (queryTrigrams.length === 0) {
            return this.chunks.map(c => [c, 0]);
        }

        const queryTrigramSet = new Set(queryTrigrams);
        const scores = [];

        this.chunks.forEach(chunk => {
            // Apply Metadata filtering
            if (allowedFiles && !allowedFiles.includes(chunk.metadata.source)) {
                scores.push([chunk, 0]);
                return;
            }
            if (pageRange && (chunk.metadata.page < pageRange[0] || chunk.metadata.page > pageRange[1])) {
                scores.push([chunk, 0]);
                return;
            }

            const chunkTrigrams = getTrigrams(chunk.text);
            if (chunkTrigrams.length === 0) {
                scores.push([chunk, 0]);
                return;
            }

            // Trigram Cosine similarity proxy (Jaccard-like index on character n-grams)
            let intersection = 0;
            const chunkTrigramSet = new Set(chunkTrigrams);
            queryTrigramSet.forEach(tg => {
                if (chunkTrigramSet.has(tg)) {
                    intersection++;
                }
            });

            // Normalize by total vocabulary of both
            const sim = intersection / Math.sqrt(queryTrigramSet.size * chunkTrigramSet.size);

            // Add a slight boost if query contains synonyms or concepts that match the chunk's topic
            let topicBoost = 0;
            const q = queryText.toLowerCase();
            const chunkTextLower = chunk.text.toLowerCase();

            // Semantic synonym mapping boosts
            const associations = [
                { keys: ['wearable', 'glass', 'goggles', 'blind', 'visual', 'eye', 'camera', 'yolo', 'نظاره', 'البصر'], tags: ['smart-glasses', 'glasses', 'assistive'] },
                { keys: ['agent', 'forensics', 'cyber', 'fraud', 'hacker', 'security', 'analyzer', 'verdict', 'عميل', 'سيبراني', 'احتيال'], tags: ['sentinel', 'cybersecurity'] },
                { keys: ['filter', 'histogram', 'canvas', 'image', 'photo', 'rgb', 'stack', 'sobel', 'تصفيه', 'صوره'], tags: ['pixelforge', 'canvas'] },
                { keys: ['rag', 'retrieval', 'tfidf', 'embeddings', 'chunk', 'chroma', 'evaluation', 'metric', 'مستندات', 'بحث'], tags: ['rag', 'retriever', 'evaluation'] },
                { keys: ['mohamed', 'milege', 'skills', 'certifications', 'cv', 'resume', 'specialist', 'محمد', 'مليج'], tags: ['profile', 'cv'] }
            ];

            associations.forEach(assoc => {
                const queryMatches = assoc.keys.some(k => q.includes(k));
                const chunkMatches = chunk.metadata.chunk_id.includes(assoc.tags[0]) || chunk.metadata.source.toLowerCase().includes(assoc.tags[0]);
                
                if (queryMatches && chunkMatches) {
                    topicBoost += 0.25; // Boost score if concepts overlap!
                }
            });

            const finalSim = Math.min(1.0, sim * 0.7 + topicBoost);
            scores.push([chunk, finalSim]);
        });

        return scores.sort((a, b) => b[1] - a[1]);
    }
}

// Instantiate retrievers
const tfidfEngine = new TFIDFRetriever();
const semanticEngine = new SemanticRetriever();

// Fit databases
function refitEngines() {
    tfidfEngine.fit(dbChunks);
    semanticEngine.fit(dbChunks);
    updateDocumentFiltersUI();
    updateAnalyticsTab();
}

// ===================================================
// 4. Multi-Query Expansion & Reranker Simulation
// ===================================================
async function generateQueryVariants(originalQuery, apiKey, modelName) {
    if (!apiKey) {
        // Offline Query Variant simulation
        const variants = [
            originalQuery,
            `semantic documents search for: ${originalQuery}`,
            `main details about: ${originalQuery}`,
            `technical description of: ${originalQuery}`
        ];
        return variants;
    }

    const prompt = `You are a query expansion engine for a RAG system. Generate exactly 4 alternative search queries (in the same language as the input) for the user's query to improve search recall. Return them as a flat JSON array of strings and nothing else.
User Query: "${originalQuery}"`;

    try {
        const responseText = await callGeminiAPI(prompt, apiKey, modelName);
        // Extract JSON
        const jsonMatch = responseText.match(/\[.*\]/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return [originalQuery];
    } catch (e) {
        console.error("Multi-Query expansion failed, using offline fallback.", e);
        return [originalQuery];
    }
}

function simulateCrossEncoderRerank(query, chunk) {
    // Cross encoder models predict a logit score representing how well
    // the chunk answers the specific query.
    // We simulate this by calculating the maximum match between query tokens 
    // and sentences inside the chunk.
    const sentences = chunk.text.split(/[.!?]\s+/);
    let maxOverlap = 0;
    const qTokens = tokenize(query);

    sentences.forEach(s => {
        const sTokens = new Set(tokenize(s));
        let matchCount = 0;
        qTokens.forEach(t => {
            if (sTokens.has(t)) matchCount++;
        });
        
        const score = qTokens.length > 0 ? matchCount / qTokens.length : 0;
        if (score > maxOverlap) maxOverlap = score;
    });

    // Semantic keyword overlap base
    const trigramSim = getTrigrams(query).filter(tg => getTrigrams(chunk.text).includes(tg)).length / Math.max(1, getTrigrams(query).length);
    
    // Merge scores into simulated cross encoder score (range 0.0 to 1.0)
    return Math.min(1.0, maxOverlap * 0.6 + trigramSim * 0.4 + 0.1);
}

// ===================================================
// 5. Ingestion Pipeline & Chunker
// ===================================================
function splitTextIntoChunks(text, filename, chunkSize, overlap) {
    const chunks = [];
    let startIdx = 0;
    let chunkCount = 0;

    // Standard split by character lengths
    while (startIdx < text.length) {
        let endIdx = Math.min(startIdx + chunkSize, text.length);
        
        // Try to end chunk at a sentence divider or newline for structural integrity
        if (endIdx < text.length) {
            const nextPunc = text.slice(endIdx - 30, endIdx + 10).match(/[.!?\n]/);
            if (nextPunc) {
                endIdx = endIdx - 30 + nextPunc.index + 1;
            }
        }

        const chunkText = text.slice(startIdx, endIdx).trim();
        if (chunkText.length > 30) { // skip tiny fragments
            // Approximate page counting (assume ~1200 characters per page if text file)
            const approxPage = Math.floor(startIdx / 1200) + 1;

            chunks.push({
                text: chunkText,
                metadata: {
                    source: filename,
                    page: approxPage,
                    chunk_id: `${filename.replace(/\.[^/.]+$/, "")}-chunk-${chunkCount}`
                }
            });
            chunkCount++;
        }

        startIdx = endIdx - overlap;
        if (startIdx >= text.length || endIdx >= text.length) break;
        if (startIdx < 0) startIdx = 0;
    }
    return chunks;
}

// PDF Parsing logic using PDF.js
async function parsePdfFile(fileArrayBuffer, filename, logCallback) {
    logCallback(`📄 Parsing PDF: ${filename}...`);
    try {
        const loadingTask = pdfjsLib.getDocument({ data: fileArrayBuffer });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        logCallback(`📄 Extracted ${totalPages} pages. Processing pages...`);

        const pagesData = [];
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const textItems = content.items.map(item => item.str);
            const pageText = textItems.join(" ");
            pagesData.push({ text: pageText, pageNum: pageNum });
        }
        return pagesData;
    } catch (e) {
        logCallback(`❌ PDF Parsing Error: ${e.message}`);
        throw e;
    }
}

// ===================================================
// 6. RAG Pipeline Core Search Router
// ===================================================
async function runRAGPipeline(query, allowedFiles, pageRange, settings) {
    const {
        apiKey,
        modelName,
        enableReranker,
        enableMultiQuery,
        wVector,
        wTfidf,
        wRerank
    } = settings;

    // Step 1: Query Expansion
    let queryVariants = [query];
    if (enableMultiQuery) {
        appendLog(`🔀 Running Multi-Query expansion...`);
        queryVariants = await generateQueryVariants(query, apiKey, modelName);
        appendLog(`🔀 Expanded queries: ${JSON.stringify(queryVariants)}`);
    }

    // Step 2: Retrieval loop over all query variants
    const allTfidfCandidates = new Map();
    const allSemanticCandidates = new Map();

    queryVariants.forEach(qVariant => {
        const tfidfRes = tfidfEngine.retrieve(qVariant, allowedFiles, pageRange);
        const semRes = semanticEngine.retrieve(qVariant, allowedFiles, pageRange);

        tfidfRes.forEach(([chunk, score]) => {
            const id = chunk.metadata.chunk_id;
            allTfidfCandidates.set(id, Math.max(allTfidfCandidates.get(id) || 0, score));
        });

        semRes.forEach(([chunk, score]) => {
            const id = chunk.metadata.chunk_id;
            allSemanticCandidates.set(id, Math.max(allSemanticCandidates.get(id) || 0, score));
        });
    });

    // Step 3: Compute Hybrid weights & fuse score
    const fusedScores = [];
    dbChunks.forEach(chunk => {
        const id = chunk.metadata.chunk_id;
        
        // Skip if filtered out
        if (allowedFiles && !allowedFiles.includes(chunk.metadata.source)) return;
        if (pageRange && (chunk.metadata.page < pageRange[0] || chunk.metadata.page > pageRange[1])) return;

        const tfidfScore = allTfidfCandidates.get(id) || 0;
        const vectorScore = allSemanticCandidates.get(id) || 0;

        // Heuristic Cross-Encoder reranking
        let rerankScore = 0;
        if (enableReranker) {
            rerankScore = simulateCrossEncoderRerank(query, chunk);
        }

        // Weighted sum formula
        let finalScore = 0;
        if (enableReranker) {
            // Formula: FinalScore = (wVector * Vector) + (wTfidf * Lexical) + (wRerank * Rerank)
            finalScore = (wVector * vectorScore) + (wTfidf * tfidfScore) + (wRerank * rerankScore);
        } else {
            // Dynamic re-normalization of weights to 100%
            const sumWeights = wVector + wTfidf;
            const normVector = sumWeights > 0 ? wVector / sumWeights : 0.5;
            const normTfidf = sumWeights > 0 ? wTfidf / sumWeights : 0.5;
            finalScore = (normVector * vectorScore) + (normTfidf * tfidfScore);
        }

        fusedScores.push({
            chunk: chunk,
            score: finalScore,
            tfidfScore: tfidfScore,
            vectorScore: vectorScore,
            rerankScore: rerankScore
        });
    });

    // Sort descending and select top 5 chunks
    const sortedFused = fusedScores.sort((a, b) => b.score - a.score);
    const topCandidates = sortedFused.slice(0, 5);

    // Prepare retrieval metrics storage for plotting
    const tfidfTop = Array.from(allTfidfCandidates.entries())
        .map(([id, s]) => [dbChunks.find(c => c.metadata.chunk_id === id), s])
        .filter(x => x[0] !== undefined)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const vectorTop = Array.from(allSemanticCandidates.entries())
        .map(([id, s]) => [dbChunks.find(c => c.metadata.chunk_id === id), s])
        .filter(x => x[0] !== undefined)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    lastResults = {
        tfidf: tfidfTop,
        vector: vectorTop,
        hybrid: topCandidates
    };

    // Step 4: Answer generation
    let answerText = "";
    let evalScores = null;
    let evalReport = "";
    let confidenceScore = 0.0;

    if (apiKey) {
        appendLog(`🤖 Generating live answer from Gemini...`);
        
        // Format retrieved documents as prompt context
        const contextStr = topCandidates.map((cand, idx) => {
            return `[Document ${idx+1}] File: ${cand.chunk.metadata.source}, Page: ${cand.chunk.metadata.page}\nContent: ${cand.chunk.text}`;
        }).join("\n\n");

        const prompt = `You are the Cognitive Hybrid RAG System assistant. Answer the user's query truthfully using ONLY the provided document context chunks. 
        Cite your sources as [Document X] or [File: Source, Page Y] when writing paragraphs. If the answer is not in the context, say that the documents do not contain the answer. Do not hallucinate or make up facts.

Retrieved Context Documents:
${contextStr}

User Query: "${query}"`;

        try {
            answerText = await callGeminiAPI(prompt, apiKey, modelName);
            
            // Execute background evaluation pass
            appendLog(`📊 Running evaluation metrics on generated answer...`);
            const evalPrompt = `You are a RAG system evaluation engine. Evaluate the generated answer against the retrieved context and query. Provide scores between 0.0 and 1.0. 
            Return a JSON object containing two fields: "metrics" (object containing the 6 scores: context_relevance, faithfulness, context_precision, context_recall, answer_relevancy, retrieval_accuracy) and "reasoning" (string containing a concise evaluation justification report).
            
User Query: "${query}"
Retrieved Context:
${contextStr}
Generated Answer: "${answerText}"

Ensure you return valid JSON only. Format:
{
  "metrics": {
    "context_relevance": 0.9,
    "faithfulness": 0.95,
    "context_precision": 0.8,
    "context_recall": 0.85,
    "answer_relevancy": 0.9,
    "retrieval_accuracy": 0.9
  },
  "reasoning": "Detail analysis report of the scores..."
}`;
            const evalResponse = await callGeminiAPI(evalPrompt, apiKey, modelName);
            const jsonMatch = evalResponse.match(/\{.*\}/s);
            if (jsonMatch) {
                const evalData = JSON.parse(jsonMatch[0]);
                evalScores = evalData.metrics;
                evalReport = evalData.reasoning;
            }
        } catch (e) {
            console.error("Gemini API execution failed.", e);
            answerText = `⚠️ Failed to fetch Gemini answer: ${e.message}. Falling back to offline context lookup.`;
        }
    }

    // Offline / Fallback answer generation
    if (!answerText) {
        appendLog(`⚠️ Generating offline retrieval response...`);
        if (topCandidates.length === 0) {
            answerText = "No documents matched the query criteria.";
        } else {
            const bestCand = topCandidates[0];
            answerText = `### 📚 Offline Retrieval Summary
The query matched **${bestCand.chunk.metadata.source}** (Page ${bestCand.chunk.metadata.page}) with a hybrid score of **${bestCand.score.toFixed(3)}**.

**Best matched passage:**
> ${bestCand.chunk.text}

*To see the full LLM-generated RAG answer with citations and live metrics evaluation, enter your Google Gemini API Key in the sidebar.*`;
        }

        // Generate baseline evaluation scores based on overlap metrics
        const tf = topCandidates.length > 0 ? topCandidates[0].tfidfScore : 0.0;
        const vs = topCandidates.length > 0 ? topCandidates[0].vectorScore : 0.0;
        const avgSim = (tf + vs) / 2;

        evalScores = {
            context_relevance: Math.min(1.0, avgSim * 1.5 + 0.2),
            faithfulness: 1.0, // offline fallback is literal extraction
            context_precision: Math.min(1.0, vs * 1.2),
            context_recall: Math.min(1.0, tf * 1.3),
            answer_relevancy: 0.9,
            retrieval_accuracy: Math.min(1.0, avgSim * 1.4)
        };
        evalReport = "Offline heuristic evaluation performed based on TF-IDF and Character-Similarity intersection ratios.";
    }

    // Compute final confidence score
    // Formula: Confidence = 0.25·AvgSimilarity + 0.20·Relevance + 0.20·Faithfulness + 0.10·Precision + 0.10·Recall + 0.15·AnswerRelevancy
    const tf0 = topCandidates.length > 0 ? topCandidates[0].tfidfScore : 0.0;
    const vs0 = topCandidates.length > 0 ? topCandidates[0].vectorScore : 0.0;
    const avgSimilarity = (tf0 + vs0) / 2;
    
    confidenceScore = (
        0.25 * avgSimilarity +
        0.20 * evalScores.context_relevance +
        0.20 * evalScores.faithfulness +
        0.10 * evalScores.context_precision +
        0.10 * evalScores.context_recall +
        0.15 * evalScores.answer_relevancy
    );

    return {
        answer: answerText,
        sources: topCandidates,
        evaluation: evalScores,
        eval_report: evalReport,
        confidence_score: confidenceScore.toFixed(3)
    };
}

// Gemini API REST interface
async function callGeminiAPI(prompt, apiKey, modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const requestBody = {
        contents: [
            {
                parts: [
                    { text: prompt }
                ]
            }
        ]
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Unknown API response error");
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ===================================================
// 7. UI View Controllers & Visualizations
// ===================================================

// Handle tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.getElementById(tabId).classList.add('active');

        if (tabId === 'tab-viewer') {
            updateAnalyticsTab();
        }
    });
});

// Sidebar sliders real-time value sync
function syncSliderLabels() {
    document.getElementById('val-weight-vector').innerText = document.getElementById('weight-vector').value;
    document.getElementById('val-weight-tfidf').innerText = document.getElementById('weight-tfidf').value;
    document.getElementById('val-weight-rerank').innerText = document.getElementById('weight-rerank').value;
    document.getElementById('val-chunk-size').innerText = document.getElementById('chunk-size').value;
    document.getElementById('val-chunk-overlap').innerText = document.getElementById('chunk-overlap').value;
}

document.querySelectorAll('.slider-control input').forEach(slider => {
    slider.addEventListener('input', syncSliderLabels);
});

// Toggle controls view logic
const toggleReranker = document.getElementById('toggle-reranker');
const rerankerWeightSlider = document.getElementById('weight-rerank');
toggleReranker.addEventListener('change', () => {
    rerankerWeightSlider.disabled = !toggleReranker.checked;
    updateActivePills();
});

const toggleMultiQuery = document.getElementById('toggle-multiquery');
toggleMultiQuery.addEventListener('change', updateActivePills);

const toggleMetadata = document.getElementById('toggle-metadata');
const filterPanel = document.getElementById('metadata-filter-container');
toggleMetadata.addEventListener('change', () => {
    filterPanel.style.display = toggleMetadata.checked ? 'block' : 'none';
    updateActivePills();
});

function updateActivePills() {
    const container = document.getElementById('active-pills');
    container.innerHTML = "";
    
    if (toggleReranker.checked) {
        container.innerHTML += `<span class="source-tag badge-green">🔁 Reranker ON</span>`;
    }
    if (toggleMultiQuery.checked) {
        container.innerHTML += `<span class="source-tag badge-green">🔀 Multi-Query ON</span>`;
    }
    if (toggleMetadata.checked) {
        container.innerHTML += `<span class="source-tag badge-amber">🗂️ Metadata Filter ON</span>`;
    }
}

// API warning message display
const geminiApiKeyInput = document.getElementById('gemini-api-key');
const apiWarning = document.getElementById('api-warning');

// Load API key from localStorage if exists
if (localStorage.getItem('gemini_api_key')) {
    geminiApiKeyInput.value = localStorage.getItem('gemini_api_key');
    apiWarning.style.display = 'none';
}

geminiApiKeyInput.addEventListener('input', () => {
    const key = geminiApiKeyInput.value.trim();
    localStorage.setItem('gemini_api_key', key);
    apiWarning.style.display = key ? 'none' : 'flex';
});

// File uploader drag and drop events
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileQueueContainer = document.getElementById('file-queue-container');
const fileQueueList = document.getElementById('file-queue-list');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFilesSelected(e.dataTransfer.files);
});

fileInput.addEventListener('change', () => {
    handleFilesSelected(fileInput.files);
});

function handleFilesSelected(files) {
    for (let i = 0; i < files.length; i++) {
        fileQueue.push(files[i]);
    }
    updateFileQueueUI();
}

function updateFileQueueUI() {
    fileQueueList.innerHTML = "";
    if (fileQueue.length === 0) {
        fileQueueContainer.style.display = "none";
        return;
    }

    fileQueueContainer.style.display = "block";
    fileQueue.forEach((file, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
            <button onclick="removeQueueFile(${index})"><i class="fas fa-xmark"></i></button>
        `;
        fileQueueList.appendChild(li);
    });
}

window.removeQueueFile = function(index) {
    fileQueue.splice(index, 1);
    updateFileQueueUI();
};

// Index files task execution
const processBtn = document.getElementById('process-files-btn');
const statusContainer = document.getElementById('status-container');
const progressFill = document.getElementById('status-progress-fill');
const percentageText = document.getElementById('status-percentage-text');
const titleText = document.getElementById('status-title-text');
const logsContent = document.getElementById('logs-content');

processBtn.addEventListener('click', async () => {
    if (fileQueue.length === 0) return;

    processBtn.disabled = true;
    statusContainer.style.display = "block";
    logsContent.innerText = "";
    
    const totalFiles = fileQueue.length;
    const size = parseInt(document.getElementById('chunk-size').value);
    const overlap = parseInt(document.getElementById('chunk-overlap').value);

    for (let i = 0; i < totalFiles; i++) {
        const file = fileQueue[i];
        const percent = Math.floor((i / totalFiles) * 100);
        
        progressFill.style.width = `${percent}%`;
        percentageText.innerText = `${percent}%`;
        titleText.innerText = `Processing '${file.name}' (${i+1}/${totalFiles})...`;
        appendLog(`📂 Loading file '${file.name}'...`);

        try {
            // Check if file is already indexed
            const exists = dbChunks.some(c => c.metadata.source === file.name);
            if (exists) {
                appendLog(`⚠️ Document '${file.name}' already indexed. Skipping.`);
                continue;
            }

            const arrayBuffer = await readFileAsArrayBuffer(file);

            if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
                // Parse PDF
                const pages = await parsePdfFile(arrayBuffer, file.name, appendLog);
                let textConcat = "";
                pages.forEach(p => {
                    textConcat += p.text + " ";
                });
                
                const newChunks = splitTextIntoChunks(textConcat, file.name, size, overlap);
                // Tag correct PDF pages
                let currPage = 1;
                let charAccumulator = 0;
                newChunks.forEach(chunk => {
                    charAccumulator += chunk.text.length;
                    const pageObj = pages.find(p => p.pageNum === currPage);
                    chunk.metadata.page = currPage;
                    // move page if chars overflow average page length
                    if (charAccumulator > 1500) {
                        currPage = Math.min(pages.length, currPage + 1);
                        charAccumulator = 0;
                    }
                });

                dbChunks.push(...newChunks);
                appendLog(`✅ Created and indexed ${newChunks.length} chunks from PDF.`);
            } else {
                // Parse text file
                const text = new TextDecoder("utf-8").decode(arrayBuffer);
                const newChunks = splitTextIntoChunks(text, file.name, size, overlap);
                dbChunks.push(...newChunks);
                appendLog(`✅ Created and indexed ${newChunks.length} chunks from Text.`);
            }
        } catch (e) {
            appendLog(`❌ Error loading file '${file.name}': ${e.message}`);
        }
    }

    progressFill.style.width = "100%";
    percentageText.innerText = "100%";
    titleText.innerText = "Ingestion Complete!";
    appendLog(`🚀 Re-fitting Lexical TF-IDF Vectorizer and semantic indices...`);
    
    // Fit models
    refitEngines();
    
    appendLog(`✅ All indexes synced successfully! ready for queries.`);
    
    fileQueue = [];
    updateFileQueueUI();
    processBtn.disabled = false;
});

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

function appendLog(message) {
    logsContent.innerText += `[${new Date().toLocaleTimeString()}] ${message}\n`;
    logsContent.scrollTop = logsContent.scrollHeight;
}

document.getElementById('logs-clear-btn').addEventListener('click', () => {
    logsContent.innerText = "";
});

// Update Document lists in filters and tab 2
function updateDocumentFiltersUI() {
    const listContainer = document.getElementById('filter-docs-list');
    const indexedList = document.getElementById('indexed-files-list');
    const docsCountBar = document.getElementById('indexed-docs-count');
    
    listContainer.innerHTML = "";
    indexedList.innerHTML = "";

    // Extract unique source files
    const uniqueDocs = Array.from(new Set(dbChunks.map(c => c.metadata.source)));
    docsCountBar.innerText = `Total documents: ${uniqueDocs.length}`;

    if (uniqueDocs.length === 0) {
        listContainer.innerHTML = `<small style="color:var(--text-muted)">No files indexed yet.</small>`;
        indexedList.innerHTML = `<li style="color:var(--text-muted); justify-content:center">No documents in local index.</li>`;
        return;
    }

    uniqueDocs.forEach(filename => {
        // Ingest into Filter list
        const label = document.createElement('label');
        label.className = "checkbox-control";
        label.style.marginBottom = "5px";
        label.style.display = "flex";
        label.innerHTML = `
            <input type="checkbox" name="filter-doc-checkbox" value="${filename}">
            <span>${filename}</span>
        `;
        listContainer.appendChild(label);

        // Ingest into Indexed tab
        const li = document.createElement('li');
        li.innerHTML = `
            <span>📄 ${filename}</span>
            <button onclick="deleteIndexedDocument('${filename}')"><i class="fas fa-trash-can"></i></button>
        `;
        indexedList.appendChild(li);
    });
}

window.deleteIndexedDocument = function(filename) {
    if (confirm(`Are you sure you want to delete indexed document: '${filename}'?`)) {
        dbChunks = dbChunks.filter(c => c.metadata.source !== filename);
        refitEngines();
        appendLog(`🗑️ Deleted document '${filename}' from system database.`);
    }
};

// Collapsible expanders helper
window.toggleExpander = function(id) {
    const body = document.getElementById(id);
    const header = body.previousElementSibling;
    const arrow = header.querySelector('i:last-child');
    
    if (body.style.display === "block") {
        body.style.display = "none";
        if (arrow) arrow.className = "fas fa-chevron-down";
    } else {
        body.style.display = "block";
        if (arrow) arrow.className = "fas fa-chevron-up";
    }
};

// Document sub-tabs inside Tab 1
document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.sub-tab-panel').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const target = btn.dataset.subtab;
        document.getElementById(target).classList.add('active');
        
        // Re-layout plotly charts
        if (target === 'subtab-sim') {
            Plotly.Plots.resize('plotly-sim-chart');
        } else if (target === 'subtab-rank') {
            Plotly.Plots.resize('plotly-rank-chart');
        }
    });
});

// Active page range toggle filter UI
const filterPageEnable = document.getElementById('filter-page-enable');
const pageRangeInputs = document.getElementById('page-range-inputs');
filterPageEnable.addEventListener('change', () => {
    pageRangeInputs.style.display = filterPageEnable.checked ? 'flex' : 'none';
});

// Chat Send Button & Keybinds
const chatInput = document.getElementById('chat-input-field');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatMessagesContainer = document.getElementById('chat-messages-container');

chatSendBtn.addEventListener('click', handleChatSubmit);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSubmit();
});

// Example queries trigger
document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        chatInput.value = btn.innerText;
        handleChatSubmit();
    });
});

// Reset Chat
document.getElementById('clear-chat').addEventListener('click', () => {
    chatHistory = [];
    chatMessagesContainer.innerHTML = "";
    document.getElementById('chat-welcome-screen').style.display = 'flex';
    document.getElementById('visualizations-section').style.display = 'none';
});

async function handleChatSubmit() {
    const query = chatInput.value.trim();
    if (!query) return;

    // Clear input
    chatInput.value = "";

    // Remove welcome screen
    const welcome = document.getElementById('chat-welcome-screen');
    if (welcome) welcome.style.display = 'none';

    // Append user message
    appendChatMessage(query, 'user');

    // Display loader dot
    const typingId = showTypingLoader();

    // Get configs
    const apiKey = document.getElementById('gemini-api-key').value.trim();
    const modelName = document.getElementById('llm-model').value;
    const enableReranker = document.getElementById('toggle-reranker').checked;
    const enableMultiQuery = document.getElementById('toggle-multiquery').checked;
    const enableMetadata = document.getElementById('toggle-metadata').checked;
    const wVector = parseFloat(document.getElementById('weight-vector').value);
    const wTfidf = parseFloat(document.getElementById('weight-tfidf').value);
    const wRerank = parseFloat(document.getElementById('weight-rerank').value);

    // Metadata filters
    let allowedFiles = null;
    let pageRange = null;

    if (enableMetadata) {
        const checkedDocs = Array.from(document.querySelectorAll('input[name="filter-doc-checkbox"]:checked')).map(cb => cb.value);
        if (checkedDocs.length > 0) allowedFiles = checkedDocs;

        if (filterPageEnable.checked) {
            const minP = parseInt(document.getElementById('filter-page-min').value) || 1;
            const maxP = parseInt(document.getElementById('filter-page-max').value) || 50;
            pageRange = [minP, maxP];
        }
    }

    const settings = {
        apiKey,
        modelName,
        enableReranker,
        enableMultiQuery,
        wVector,
        wTfidf,
        wRerank
    };

    try {
        // Run retrieval and generation
        const ragResponse = await runRAGPipeline(query, allowedFiles, pageRange, settings);
        
        // Remove typing loaders
        removeTypingLoader(typingId);

        // Render BOT Message
        appendChatMessage(ragResponse, 'bot');
        
        // Render score charts
        document.getElementById('visualizations-section').style.display = 'block';
        updateRetrievalCharts();
        
    } catch (e) {
        removeTypingLoader(typingId);
        appendChatMessage({
            answer: `❌ **Error running RAG pipeline**: ${e.message}`,
            sources: []
        }, 'bot');
    }
}

function appendChatMessage(data, side) {
    const isBot = side === 'bot';
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${side}`;

    const avatar = isBot ? `<i class="fas fa-robot"></i>` : `<i class="fas fa-user"></i>`;
    const msgId = 'msg-' + Date.now();

    if (!isBot) {
        // User message layout
        bubble.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content-wrapper">
                <div class="message-text">${data}</div>
            </div>
        `;
    } else {
        // Bot message layout (RAG result format)
        const markedAnswer = marked.parse(data.answer);
        
        // Build sources display
        let sourcesHtml = "";
        if (data.sources && data.sources.length > 0) {
            const listHtml = data.sources.map((cand, idx) => {
                const det = cand.score !== undefined ? ` (Final Score: ${cand.score.toFixed(3)})` : '';
                return `
                    <div class="custom-card">
                        <span class="source-tag badge-blue">📄 ${cand.chunk.metadata.source}</span>
                        <span class="source-tag">Page ${cand.chunk.metadata.page}</span>
                        <span class="source-tag badge-green">Fused Rank: ${idx+1}${det}</span>
                        <p>${cand.chunk.text}</p>
                    </div>
                `;
            }).join("");

            sourcesHtml = `
                <div class="expander-card">
                    <div class="expander-header" onclick="toggleExpander('${msgId}-src')">
                        <span>📚 View Retrieved Sources (${data.sources.length} chunks)</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="expander-body" id="${msgId}-src">
                        ${listHtml}
                    </div>
                </div>
            `;
        }

        // Build 6-Metric Evaluation Bars
        let evalHtml = "";
        if (data.evaluation) {
            const metrics = data.evaluation;
            const metricLabels = {
                context_relevance: "Context Relevance",
                faithfulness: "Faithfulness",
                context_precision: "Context Precision",
                context_recall: "Context Recall",
                answer_relevancy: "Answer Relevancy",
                retrieval_accuracy: "Retrieval Accuracy"
            };

            const bars = Object.entries(metrics).map(([key, val]) => {
                const pct = Math.floor(val * 100);
                const label = metricLabels[key] || key;
                return `
                    <div class="eval-bar-wrapper">
                        <span class="eval-bar-label">${label}</span>
                        <div class="eval-progress-container">
                            <div class="eval-progress-bg">
                                <div class="eval-progress-fill" style="width: ${pct}%"></div>
                            </div>
                            <span class="eval-progress-value">${val.toFixed(2)}</span>
                        </div>
                    </div>
                `;
            }).join("");

            const confidenceBadge = `<span class="source-tag badge-green" style="margin-top: 10px; display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-shield-halved"></i> Confidence: ${data.confidence_score}</span>`;

            evalHtml = `
                <div class="eval-bars-container">
                    ${bars}
                </div>
                ${confidenceBadge}
            `;
        }

        // Build evaluation report expander
        let reportHtml = "";
        if (data.eval_report) {
            reportHtml = `
                <div class="expander-card">
                    <div class="expander-header" onclick="toggleExpander('${msgId}-rep')">
                        <span>📋 Full Evaluation Report Reasoning</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="expander-body" id="${msgId}-rep">
                        <pre style="white-space: pre-wrap; font-family: inherit; font-size: 0.8rem">${data.eval_report}</pre>
                    </div>
                </div>
            `;
        }

        bubble.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content-wrapper">
                <div class="message-text">${markedAnswer}</div>
                ${sourcesHtml}
                ${evalHtml}
                ${reportHtml}
            </div>
        `;
    }

    chatMessagesContainer.appendChild(bubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function showTypingLoader() {
    const id = 'loader-' + Date.now();
    const bubble = document.createElement('div');
    bubble.className = `message-bubble bot`;
    bubble.id = id;
    
    bubble.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content-wrapper">
            <div class="message-text">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    chatMessagesContainer.appendChild(bubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    return id;
}

function removeTypingLoader(id) {
    const loader = document.getElementById(id);
    if (loader) loader.remove();
}

// ===================================================
// 8. Plotly.js Visualizations Engines
// ===================================================
function updateRetrievalCharts() {
    if (!lastResults) return;

    // A. Chart 1: Similarity Scores for Top 5 candidate chunks
    const candidates = lastResults.hybrid;
    const chunkNames = candidates.map((cand, idx) => `Chunk ${idx+1} (${cand.chunk.metadata.source.slice(0, 12)}...)`);
    const tfidfScores = candidates.map(cand => cand.tfidfScore);
    const vectorScores = candidates.map(cand => cand.vectorScore);
    const hybridScores = candidates.map(cand => cand.score);

    const traceTfidf = {
        x: chunkNames,
        y: tfidfScores,
        name: 'TF-IDF Lexical',
        type: 'bar',
        marker: { color: '#3b82f6' }
    };

    const traceVector = {
        x: chunkNames,
        y: vectorScores,
        name: 'Vector Semantic',
        type: 'bar',
        marker: { color: '#10b981' }
    };

    const traceHybrid = {
        x: chunkNames,
        y: hybridScores,
        name: 'Hybrid score',
        type: 'bar',
        marker: { color: '#8b5cf6' }
    };

    const layoutSim = {
        title: 'Similarity Scores Comparison',
        barmode: 'group',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0', family: 'Inter' },
        xaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
        yaxis: { title: 'Score', range: [0, 1], gridcolor: 'rgba(255,255,255,0.05)' }
    };

    Plotly.newPlot('plotly-sim-chart', [traceTfidf, traceVector, traceHybrid], layoutSim, {responsive: true, displayModeBar: false});

    // B. Chart 2: Hybrid Re-ranking Decomposition
    // Compares ranking paths of candidate chunks in different pipelines
    const ranksVector = [];
    const ranksTfidf = [];
    const ranksHybrid = [];

    candidates.forEach((cand, idx) => {
        const id = cand.chunk.metadata.chunk_id;
        
        // Find position index in lexical pipeline
        const tfIdx = lastResults.tfidf.findIndex(x => x[0].metadata.chunk_id === id);
        ranksTfidf.push(tfIdx !== -1 ? tfIdx + 1 : 15);

        // Find position index in semantic pipeline
        const vecIdx = lastResults.vector.findIndex(x => x[0].metadata.chunk_id === id);
        ranksVector.push(vecIdx !== -1 ? vecIdx + 1 : 15);

        ranksHybrid.push(idx + 1);
    });

    const traceTfidfRank = {
        x: chunkNames,
        y: ranksTfidf,
        name: 'TF-IDF Rank',
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#3b82f6', dash: 'dot' }
    };

    const traceVectorRank = {
        x: chunkNames,
        y: ranksVector,
        name: 'Vector Rank',
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#10b981', dash: 'dash' }
    };

    const traceHybridRank = {
        x: chunkNames,
        y: ranksHybrid,
        name: 'Hybrid Final Rank',
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#8b5cf6', width: 3 }
    };

    const layoutRank = {
        title: 'Rank Movement Comparison (Lower is Better)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0', family: 'Inter' },
        yaxis: { title: 'Rank Position', autorange: 'reverse', dtick: 1, gridcolor: 'rgba(255,255,255,0.05)' },
        xaxis: { gridcolor: 'rgba(255,255,255,0.05)' }
    };

    Plotly.newPlot('plotly-rank-chart', [traceTfidfRank, traceVectorRank, traceHybridRank], layoutRank, {responsive: true, displayModeBar: false});

    // C. Fill Tab 1 subtab 3 chunks lists
    const tfList = document.getElementById('col-tfidf-chunks');
    const vecList = document.getElementById('col-vector-chunks');
    const hybList = document.getElementById('col-hybrid-chunks');

    tfList.innerHTML = "";
    vecList.innerHTML = "";
    hybList.innerHTML = "";

    lastResults.tfidf.forEach(([chunk, score], idx) => {
        tfList.innerHTML += `
            <div class="custom-card" style="border-left: 4px solid #3b82f6">
                <strong>Rank ${idx+1}</strong> (Score: ${score.toFixed(3)})
                <p style="font-size:0.75rem">${chunk.text.slice(0, 180)}...</p>
            </div>
        `;
    });

    lastResults.vector.forEach(([chunk, score], idx) => {
        vecList.innerHTML += `
            <div class="custom-card" style="border-left: 4px solid #10b981">
                <strong>Rank ${idx+1}</strong> (Score: ${score.toFixed(3)})
                <p style="font-size:0.75rem">${chunk.text.slice(0, 180)}...</p>
            </div>
        `;
    });

    candidates.forEach((cand, idx) => {
        hybList.innerHTML += `
            <div class="custom-card" style="border-left: 4px solid #8b5cf6">
                <strong>Final Rank ${idx+1}</strong> (Score: ${cand.score.toFixed(3)})
                <p style="font-size:0.75rem">${cand.chunk.text.slice(0, 180)}...</p>
            </div>
        `;
    });
}

function updateAnalyticsTab() {
    // keyword chunk searches UI
    const matchesCount = document.getElementById('search-matches-count');
    const chunksResultsList = document.getElementById('chunks-results-list');
    const query = document.getElementById('chunk-search-input').value.toLowerCase();

    chunksResultsList.innerHTML = "";
    
    const filtered = dbChunks.filter(c => c.text.toLowerCase().includes(query));
    matchesCount.innerText = `Showing ${filtered.slice(0, 30).length} matches out of ${filtered.length} chunks.`;

    filtered.slice(0, 30).forEach(chunk => {
        chunksResultsList.innerHTML += `
            <div class="custom-card">
                <span class="source-tag badge-blue">📄 ${chunk.metadata.source}</span>
                <span class="source-tag">Page ${chunk.metadata.page}</span>
                <span class="source-tag">${chunk.metadata.chunk_id}</span>
                <p>${chunk.text}</p>
            </div>
        `;
    });

    // Stats
    const stats = tfidfEngine.getStatistics();
    document.getElementById('stat-vocab-size').innerText = stats.vocabulary_size;
    document.getElementById('stat-sparsity').innerText = stats.sparsity + "%";
    document.getElementById('stat-non-zeros').innerText = stats.non_zeros;

    // Language badge
    const langLabel = {
        "arabic": "🔤 Arabic",
        "english": "🔤 English",
        "mixed": "🌐 Mixed (AR+EN)"
    }[tfidfEngine.corpusLanguage] || "Unknown";
    document.getElementById('corpus-lang-badge').innerHTML = `<i class="fas fa-globe"></i> Corpus Language: ${langLabel}`;

    // Plots
    // Plot terms
    const topTerms = stats.top_terms || [];
    const termTokens = topTerms.map(t => t.token);
    const termFreqs = topTerms.map(t => t.frequency);

    const termTrace = {
        x: termFreqs,
        y: termTokens,
        type: 'bar',
        orientation: 'h',
        marker: { color: '#d300ff' }
    };

    const termLayout = {
        margin: { l: 120, r: 20, t: 30, b: 40 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0', family: 'Inter' },
        xaxis: { title: 'Corpus Frequency', gridcolor: 'rgba(255,255,255,0.05)' },
        yaxis: { autorange: 'reverse', gridcolor: 'rgba(255,255,255,0.05)' }
    };

    Plotly.newPlot('plotly-terms-chart', [termTrace], termLayout, {responsive: true, displayModeBar: false});

    // Plot chunk size distribution
    const chunkSizes = dbChunks.map(c => c.text.length);
    const distTrace = {
        x: chunkSizes,
        type: 'histogram',
        nbinsx: 10,
        marker: { color: '#00f0ff' }
    };

    const distLayout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0', family: 'Inter' },
        xaxis: { title: 'Chunk Character Count Size', gridcolor: 'rgba(255,255,255,0.05)' },
        yaxis: { title: 'Chunk Count', gridcolor: 'rgba(255,255,255,0.05)' }
    };

    Plotly.newPlot('plotly-dist-chart', [distTrace], distLayout, {responsive: true, displayModeBar: false});
}

// Bind search input update
document.getElementById('chunk-search-input').addEventListener('input', () => {
    updateAnalyticsTab();
});

// ===================================================
// 9. Startup & Initialization
// ===================================================
window.addEventListener('DOMContentLoaded', () => {
    // Clone preloaded documents into state
    dbChunks = [...window.DEFAULT_DOCUMENTS];
    
    // Fit search engines on default document set
    refitEngines();
    syncSliderLabels();
    updateActivePills();
});
