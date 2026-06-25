// ===================================================
// Cognitive Hybrid RAG System - Preloaded Database
// default_documents.js
// ===================================================

const DEFAULT_DOCUMENTS = [
  // ── DOCUMENT 1: Smart Glasses AI ─────────────────
  {
    text: "Smart Glasses AI is an innovative AI-Powered Wearable device designed specifically for the visually impaired. It integrates real-time computer vision, OCR text reading, Face Recognition, Obstacle detection, currency recognition, Emergency SOS, and Arabic/English Voice control into a single Python-powered assistive technology framework. The main hardware components include high-definition cameras, directional audio headphones, and voice microphones connected to a processing hub.",
    metadata: { source: "Smart_Glasses_AI_Overview.pdf", page: 1, chunk_id: "smart-glasses-0" }
  },
  {
    text: "The Object Detection subsystem in Smart Glasses AI is powered by YOLOv8 (You Only Look Once version 8). YOLOv8 runs real-time object detection on frame streams from the glasses' camera, measuring spatial dimensions and class probabilities. The system converts visual bounding boxes into directional audio feedback, announcing objects to the user as being on their left, right, or straight ahead. Proximity values trigger specific warnings when obstacles get dangerously close.",
    metadata: { source: "Smart_Glasses_AI_Overview.pdf", page: 1, chunk_id: "smart-glasses-1" }
  },
  {
    text: "For text reading and reading signs, the Smart Glasses AI uses OCR (Optical Character Recognition) supported by the Gemini API. The system captures document snapshots, processes the image using OpenCV to optimize contrast and lighting, and passes it to the Gemini API to extract raw text, labels, or currency values. The extracted text is then read aloud in a natural voice using gTTS (Google Text-to-Speech) or an offline pyttsx3 speech synthesizer.",
    metadata: { source: "Smart_Glasses_AI_Overview.pdf", page: 2, chunk_id: "smart-glasses-2" }
  },
  {
    text: "The Face Recognition system allows the visually impaired user to learn and remember people around them. Using a facial recognition model with a 25-frame training loop, the camera records features of known family members or friends. When a person steps in front of the camera, the system matches their facial signature against the local folder database and announces the person's name. If the signature is not recognized, it announces 'Unknown person detected'.",
    metadata: { source: "Smart_Glasses_AI_Overview.pdf", page: 2, chunk_id: "smart-glasses-3" }
  },
  {
    text: "Emergency SOS is a critical safety feature integrated into the Smart Glasses. The user can activate it using a specific voice command or a physical panic button. Upon activation, the device fetches the user's current GPS location coordinates via a Geolocation API. It immediately sends an automated SOS email and SMS containing Google Maps coordinates to registered emergency contacts, informing them of the user's location and distress status.",
    metadata: { source: "Smart_Glasses_AI_Overview.pdf", page: 3, chunk_id: "smart-glasses-4" }
  },
  {
    text: "The entire system is controlled using a full Voice Command system optimized for the Arabic language. It utilizes the SpeechRecognition library in Python to capture voice inputs and parse commands like 'اقرأ النص' (Read text), 'من هذا؟' (Who is this?), or 'شغل منبه الأمان' (Turn on safety alarm). A power saver engine runs in the background, monitoring system CPU and temperature, and disables heavy YOLO object detection when the battery level drops below 20%.",
    metadata: { source: "Smart_Glasses_AI_Overview.pdf", page: 3, chunk_id: "smart-glasses-5" }
  },

  // ── DOCUMENT 2: Sentinel-AI ──────────────────────
  {
    text: "Sentinel-AI is a multi-agent cybersecurity and financial fraud detection hub. The system is designed to analyze transactions, detect cyber threats, and perform behavioral forensics in real-time. It operates as a cooperative network of three specialized AI agents working together: the Analyzer Agent, the Forensics Agent, and the Decision Agent. The visual interface is built with Streamlit, and the backend is implemented in Python.",
    metadata: { source: "Sentinel_AI_System_Specs.pdf", page: 1, chunk_id: "sentinel-0" }
  },
  {
    text: "The Sentinel-AI Analyzer Agent is the first line of defense. It reads transaction data streams (such as transfer amounts, locations, IP addresses, and device IDs) and measures anomaly scores. It uses a combination of statistical thresholds and isolation forest machine learning models to label transactions with a preliminary risk index between 0.0 and 1.0. This agent handles millions of records with sub-second latency.",
    metadata: { source: "Sentinel_AI_System_Specs.pdf", page: 1, chunk_id: "sentinel-1" }
  },
  {
    text: "The Sentinel-AI Forensics Agent traces the technical path of anomalous transactions. It inspects digital footprints, networks, DNS headers, and execution flags to look for indicators of compromise (IoC) or botnets. It creates a graphical path mapping the transfer route. If an attacker uses a VPN or tor exit node, the Forensics Agent flags this as an active obfuscation attempt, adding key forensic weight to the threat pool.",
    metadata: { source: "Sentinel_AI_System_Specs.pdf", page: 2, chunk_id: "sentinel-2" }
  },
  {
    text: "The Sentinel-AI Decision Agent acts as the final judge. It gathers outputs, anomaly scores, and threat parameters from the Analyzer and Forensics agents. Using Gemini LLM, it evaluates the evidence and issues a final security verdict: SAFE, SUSPICIOUS, or FRAUD. Along with the verdict, the Decision Agent calculates a confidence score and generates an interactive, detailed security report outlining the justification for the decision.",
    metadata: { source: "Sentinel_AI_System_Specs.pdf", page: 2, chunk_id: "sentinel-3" }
  },
  {
    text: "Sentinel-AI is built using a modern AI tech stack. The core system logic is written in Python, coordinating agents via LangChain. The LLM capability is powered by Google Gemini. Streamlit provides the dashboard UI, displaying real-time transactions, active alerts, risk distribution charts, and forensic logs. Data streams are processed in memory and logged into a secure sqlite database for compliance audits.",
    metadata: { source: "Sentinel_AI_System_Specs.pdf", page: 3, chunk_id: "sentinel-4" }
  },

  // ── DOCUMENT 3: PixelForge ───────────────────────
  {
    text: "PixelForge is a professional real-time image filtering and processing studio that runs completely in the web browser. The app is written with pure HTML5, CSS3, and Vanilla JavaScript, utilizing the Canvas API for pixel-level manipulations. It has zero external dependencies or server requirements, processing all operations on the client-side for maximum performance and user privacy.",
    metadata: { source: "PixelForge_Documentation.pdf", page: 1, chunk_id: "pixelforge-0" }
  },
  {
    text: "PixelForge supports 20+ image filters and 8 presets. The filters include traditional effects like Grayscale, Sepia, Invert, Blur, and Vintage, along with advanced convolution matrix filters like Sobel Edge Detection, Emboss, Sharpen, and artistic filters like Oil Paint and Cartoon. The application processes images by extracting the canvas ImageData array, iterating over raw RGBA pixel buffers, and applying pixel transformations.",
    metadata: { source: "PixelForge_Documentation.pdf", page: 1, chunk_id: "pixelforge-1" }
  },
  {
    text: "One of the standout features of PixelForge is the Stack Filter mode. When enabled, users can select multiple filters at once, stacking them to create unique composite styles. For example, a user can stack Sobel edge detection on top of a saturated vintage filter. In contrast, in standard mode, selecting a filter replaces the current canvas image state.",
    metadata: { source: "PixelForge_Documentation.pdf", page: 2, chunk_id: "pixelforge-2" }
  },
  {
    text: "PixelForge includes an interactive Split Slider view mode. This splits the canvas screen in two, showing the original image on the left and the filtered/edited version on the right. A slider controller lets users drag a divider back and forth to inspect pixel edits in real-time. The application also renders a live RGB histogram showing color channel frequencies during filter edits.",
    metadata: { source: "PixelForge_Documentation.pdf", page: 2, chunk_id: "pixelforge-3" }
  },

  // ── DOCUMENT 4: RAG System ───────────────────────
  {
    text: "The Cognitive Hybrid RAG System (Retrieval-Augmented Generation) v2.0 is a production-ready system that processes documents, indexes them, and answers questions. It utilizes a central configuration file config.py containing retrieval parameters. The parameters include ENABLE_RERANKER (enables Cross-Encoder reranking), ENABLE_MULTI_QUERY (enables Gemini expansion), and weights for hybrid ranking calculation: VECTOR_WEIGHT (default 0.55), TFIDF_WEIGHT (default 0.25), and RERANK_WEIGHT (default 0.20).",
    metadata: { source: "RAG_System_Technical_Doc.pdf", page: 1, chunk_id: "rag-0" }
  },
  {
    text: "The Hybrid Scoring Formula in the RAG System merges semantic vector scores and lexical TF-IDF scores. The final score is calculated as: FinalScore = (0.55 * VectorScore) + (0.25 * TFIDFScore) + (0.20 * NormalizedRerankerScore). All weights are normalized to sum to 1.0. If the Cross-Encoder Reranker is toggled off, the Vector and TF-IDF weights are dynamically re-weighted to represent 100% of the retrieval score.",
    metadata: { source: "RAG_System_Technical_Doc.pdf", page: 1, chunk_id: "rag-1" }
  },
  {
    text: "Multi-Query Expansion uses the Gemini API to formulate 4 alternative versions of the user's original query. The RAG system runs vector search and TF-IDF search for the original query and all generated query variants. The retrieved candidate chunks from all retrieval runs are then merged and deduplicated by their chunk ID, forming a unified candidate pool of top documents to pass to the reranking stage.",
    metadata: { source: "RAG_System_Technical_Doc.pdf", page: 2, chunk_id: "rag-2" }
  },
  {
    text: "The Cross-Encoder Reranker is powered by the cross-encoder/ms-marco-MiniLM-L-6-v2 model. It scores candidate query-chunk pairs, producing raw logit scores that indicate semantic match. These scores are min-max normalized to a 0.0 to 1.0 range. Chunks with higher reranker scores are pushed to the top of the context window. The top 5 final chunks (TOP_K_FINAL) are injected into the final Gemini LLM answer generation prompt.",
    metadata: { source: "RAG_System_Technical_Doc.pdf", page: 2, chunk_id: "rag-3" }
  },
  {
    text: "To evaluate RAG responses, the system implements a 6-Metric Evaluator. The metrics measured by the Gemini API are: 1) Context Relevance (relevance of retrieved context to query), 2) Faithfulness (grounding of answer in retrieved context), 3) Context Precision (usefulness of retrieved docs), 4) Context Recall (completeness of context), 5) Answer Relevancy (directness of answer), and 6) Retrieval Accuracy. The final confidence score fuses all metrics.",
    metadata: { source: "RAG_System_Technical_Doc.pdf", page: 3, chunk_id: "rag-4" }
  },
  {
    text: "The Ingestion Pipeline in the RAG System processes PDF documents page-by-page. A recursive text chunker splits text into chunks of 500 to 800 characters with an overlap of 100 characters. Chunks are passed to all-MiniLM-L6-v2 to generate dense embeddings, which are stored in ChromaDB. Simultaneously, a multilingual TF-IDF vectorizer fits on the document corpus, ensuring Arabic and English text normalization.",
    metadata: { source: "RAG_System_Technical_Doc.pdf", page: 3, chunk_id: "rag-5" }
  },

  // ── DOCUMENT 5: Mohamed Milege ───────────────────
  {
    text: "Mohamed Milege (known professionally as M.Milege.AI) is an Artificial Intelligence student at Aqaba University of Technology (AUT) and a certified AI Specialist and Data Analyst. He holds advanced certifications in Python programming, machine learning, and international AI standards including ISO 21001 compliance. He works on building production-ready AI tools, cybersecurity systems, and interactive web applications.",
    metadata: { source: "Mohamed_Milege_Profile.pdf", page: 1, chunk_id: "profile-0" }
  },
  {
    text: "Education & Institution: Mohamed Milege is studying for a Bachelor of Science in Artificial Intelligence at Aqaba University of Technology (AUT) in Aqaba, Jordan. His academic focus spans deep learning, natural language processing, computer vision, and database management. He serves as an active member and leader of the AUT IT and AI Student Club.",
    metadata: { source: "Mohamed_Milege_Profile.pdf", page: 1, chunk_id: "profile-1" }
  },
  {
    text: "Core Technical Skills: Mohamed has robust expertise in Python Programming, Machine Learning, Deep Learning (YOLOv8, SentenceTransformers), Natural Language Processing (Gemini, LangChain, RAG architectures), Data Handling and Processing (SQL, SQLite, Pandas, NumPy), and AI Standards & Compliance (ISO 21001). His soft skills include analytical thinking, active leadership, resilience, and complex problem-solving.",
    metadata: { source: "Mohamed_Milege_Profile.pdf", page: 2, chunk_id: "profile-2" }
  },
  {
    text: "Professional Certifications: 1) Python & AI Course (36 hours, Black Horse Courses, Grade: Excellent), 2) Applications of Artificial Intelligence (15 hours, The British University in Egypt), 3) ISO Artificial Intelligence Training (MediX International Accredited Institution), 4) Artificial Intelligence Industry Training (Telecom Egypt WE).",
    metadata: { source: "Mohamed_Milege_Profile.pdf", page: 2, chunk_id: "profile-3" }
  }
];

// Export to global scope
window.DEFAULT_DOCUMENTS = DEFAULT_DOCUMENTS;
