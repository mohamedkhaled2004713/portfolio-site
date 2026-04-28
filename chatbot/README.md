# 🎓 AUT Smart Chatbot — جامعة العقبة للتكنولوجيا

A bilingual (Arabic/English) AI-powered chatbot for Aqaba University of Technology, built with Gemini API.

## 📁 Project Structure

```
ChatBot/
├── index.html          # Main chat interface
├── style.css           # AUT-branded stylesheet
├── app.js              # Core chatbot logic (NLP pipeline)
├── config.js           # API key configuration
├── knowledge_base.json # University data (courses, instructors, etc.)
├── logo.png            # AUT logo (place here)
└── README.md
```

## 🚀 How to Run

### Option 1: Direct (Recommended)
1. Place `logo.png` (AUT logo) in the `ChatBot/` folder
2. Open `index.html` in any modern browser
3. Enter your **Gemini API Key** in the top banner
4. Start chatting!

### Option 2: Local Server (for fetch to work cleanly)
```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```
Then open: `http://localhost:8080`

## 🔑 API Key Setup

The key is stored securely in your browser's `localStorage`.  
It is **never** sent anywhere except directly to Google's Gemini API.

```
Key: YOUR_GEMINI_API_KEY_HERE
```
*(Enter this in the golden banner at the top of the app)*

## 🧠 NLP Pipeline

```
User Input
    │
    ▼
1. Language Detection (Arabic / English)
    │
    ▼
2. Text Normalization (diacritics, spelling variants)
    │
    ▼
3. Intent Classification
   (admission | registration | course_recommendation |
    instructor | course_info | schedule | location | facilities)
    │
    ▼
4. Entity Extraction
   (year: 1-4 | major | course_code | instructor_name)
    │
    ▼
5. Local Knowledge Retrieval (knowledge_base.json)
    │
    ▼
6. Gemini API (context-enriched prompt)
    │
    ▼
7. Markdown-rendered Response
```

## 💬 Example Queries

| Arabic | English |
|--------|---------|
| ازاي اقدم في الجامعة؟ | What are the admission requirements? |
| ازاي اسجل مواد؟ | How do I register for courses? |
| أنا في سنة تانية علوم حاسوب | I'm in 2nd year CS, what should I take? |
| مين دكتور مادة AI؟ | Who teaches the AI course? |
| فين الجامعة؟ | Where is the campus? |

## 🏫 Knowledge Base Covers

- ✅ University overview & contacts
- ✅ 3 Colleges + 4 Departments
- ✅ 17 Courses with prerequisites
- ✅ 9 Instructors with office hours
- ✅ Study plans (CS, AI, Cybersecurity)
- ✅ Admission requirements & process
- ✅ Registration portal & deadlines
- ✅ Campus facilities

## ⚙️ Technical Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **AI**: Google Gemini 2.0 Flash API
- **Markdown**: marked.js
- **Fonts**: Cairo (Arabic) + Inter (English)
- **Storage**: localStorage (API key, no data leaves browser)

## 🎨 Brand Colors

| Color | Hex |
|-------|-----|
| Navy (Primary) | `#0A1F44` |
| Gold (Accent) | `#C8972B` |
| Blue (Secondary) | `#1A6BAB` |

---
*Aqaba University of Technology © 2025*
