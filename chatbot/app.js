// ===================================================
// AUT Smart Chatbot - Master Controller
// Aqaba University of Technology
// ===================================================

function getApiKey() { 
  return localStorage.getItem('aut_gemini_key') || window.ENV_API_KEY || ''; 
}

// ── Master Knowledge Base ────────────────────────────
const kb = {
  university: {
    name: "جامعة العقبة للتكنولوجيا",
    president: "الأستاذ الدكتور محمد حسن الوشاح",
    president_bio: "أكاديمي بارز وخبير في الإدارة، يقود الجامعة برؤية تطويرية تهدف لتعزيز البحث العلمي والابتكار التكنولوجي.",
    desc: "أول جامعة خاصة في جنوب الأردن (العقبة)، تأسست عام 2015 لتكون مركزاً إقليمياً للتميز الأكاديمي.",
    founded: 2015,
    location: "جنوب العقبة، طريق الشاطئ الجنوبي، مقابل مستودعات شركة تطوير العقبة.",
    web: "https://www.aut.edu.jo/home",
    phones: ["+962 (0) 3 2092300", "+962 (0) 3 2092310"],
    email: "info@aut.edu.jo"
  },
  admission: {
    min_avg: "60% للثانوية العامة",
    docs: ["شهادة الثانوية العامة الأصلية المصدقة", "صورة عن هوية الأحوال المدنية أو جواز السفر", "صورة عن شهادة الميلاد", "صور شخصية (عدد 2)"],
    fees: "20 دينار أردني (رسوم طلب الالتحاق)",
    credit_hour: "تتراوح بين 35 إلى 45 دينار حسب التخصص"
  },
  faculties: [
    { name: "كلية تقنية المعلومات", programs: ["ذكاء اصطناعي", "أمن سيبراني", "هندسة برمجيات"] },
    { name: "كلية الصيدلة (ميخائيل الصايغ)", programs: ["بكالوريوس صيدلة", "ماجستير صيدلة"] },
    { name: "كلية الهندسة (منيب المصري)", programs: ["هندسة مدنية"] },
    { name: "كلية العلوم الإدارية والمالية", programs: ["إدارة أعمال", "محاسبة", "ذكاء أعمال"] },
    { name: "كلية الحقوق", programs: ["قانون"] },
    { name: "كلية العلوم الطبية المساندة", programs: ["علاج طبيعي", "تصوير طبي", "تكنولوجيا صيدلة"] }
  ],
  instructors: [
    { name: "أ.د. صالح العطيوي", title: "عميد كلية تقنية المعلومات", rank: 1, link: "" },
    { name: "أ.د. حسن الرشايدة", title: "عميد البحث العلمي / أستاذ مشارك", rank: 2, link: "https://www.aut.edu.jo/profile/167" },
    { name: "د. غيث رجب", title: "رئيس أقسام الحاسوب / أستاذ مساعد", rank: 3, link: "https://www.aut.edu.jo/profile/147" },
    { name: "أنس البدارين", title: "مدير القبول والتسجيل / أستاذ مشارك", rank: 4, link: "https://www.aut.edu.jo/profile/59" },
    { name: "مهند علي علوان", title: "رئيس قسم الشبكات / محاضر", rank: 5, link: "https://www.aut.edu.jo/profile/262" },
    { name: "د. صالح الخلايلة", title: "دكتوراه ذكاء اصطناعي / أستاذ مساعد", rank: 6, link: "https://www.aut.edu.jo/profile/323" },
    { name: "د. شاهد المبيضين", title: "أستاذ مساعد", rank: 7, link: "https://www.aut.edu.jo/profile/336" },
    { name: "آلاء الحراسيس", title: "محاضر", rank: 8, link: "https://www.aut.edu.jo/profile/37" },
    { name: "نورما بطاينة", title: "محاضر / مساعد مدير التسجيل", rank: 9, link: "https://www.aut.edu.jo/profile/279" },
    { name: "وائل المزايدة", title: "هيئة تدريسية", rank: 10, link: "https://www.aut.edu.jo/profile/390" },
    { name: "يحيى العمامي", title: "هيئة تدريسية", rank: 11, link: "https://www.aut.edu.jo/profile/391" }
  ],
  clubs: {
    it: { name: "نادي الـ IT والذكاء الاصطناعي", link: "https://chat.whatsapp.com/GDbCWIxa2YqGYpm3lhvh2l" }
  }
};

// ── Utility Functions ───────────────────────────────
function norm(t) { 
    if(!t) return "";
    return t.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[؟?.,!]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); 
}

function identify(text) {
  const t = norm(text);
  const matches = (keys) => keys.some(k => t.includes(norm(k)));

  if (matches(['معدل','احسب','gpa','درجاتي','علاماتي'])) return 'gpa';
  if (matches(['رئيس الجامعة','رئيس الجامعه','الوشاح','الرئيس','الريس'])) return 'president';
  if (matches(['نصيحه','نصيحة','خطة','تطوير'])) return 'academic_advice';
  if (matches(['قبول','تقديم','شروط','اوراق'])) return 'admission';
  if (matches(['كليه','كليات','تخصص','ايش بدرسو','ايش في'])) return 'faculties';
  if (matches(['نادي','it','واتساب'])) return 'clubs';
  if (matches(['موقع','عنوان','وين','مكان','اين'])) return 'location';
  if (matches(['دكتور','طاقم'])) return 'faculty';
  if (matches(['بوابة','portal'])) return 'registration';
  if (matches(['اهلا','سلام','مرحبا'])) return 'greeting';
  return 'gemini';
}

// ── Core Process ─────────────────────────────────────
async function processMessage(userInput) {
  const intent = identify(userInput);
  const t = norm(userInput);
  
  switch (intent) {
    case 'president':
      return `### 🏛️ رئاسة الجامعة\n\n**${kb.university.president}** هو رئيس جامعة العقبة للتكنولوجيا.\n\n${kb.university.president_bio}\n\n🎓 يقود الجامعة برؤية طموحة نحو التميز الأكاديمي والبحث العلمي.`;

    case 'gpa': 
      return `### 📊 حاسبة المعدل الذكية
<div class="gpa-card">
  <table class="gpa-table" style="width:100%">
    <thead><tr><th style="text-align:right">المادة</th><th>العلامة</th><th>الساعات</th><th></th></tr></thead>
    <tbody><tr class="gpa-row"><td><input type="text" class="gpa-input-styled" placeholder="المادة"></td><td><input type="number" class="gpa-input-styled grade" value="90"></td><td><input type="number" class="gpa-input-styled hours" value="3"></td><td></td></tr></tbody>
  </table>
  <div style="display:flex; gap:10px; margin-top:20px; justify-content:flex-end">
    <button class="btn-add" onclick="addGpaRow(this)">+ مادة</button><button class="btn-calc" onclick="calculateGPA(this)">احسب</button>
  </div>
  <div class="gpa-result" style="margin-top:15px; display:none"></div>
</div>`;

    case 'admission':
      return `### 📜 القبول والتسجيل\n- المعدل: ${kb.admission.min_avg}\n- الأوراق: ${kb.admission.docs.join('، ')}\n- الرسوم: ${kb.admission.fees}\n🌐 [التقديم الإلكتروني](${kb.university.web})`;

    case 'faculties':
      const ftext = kb.faculties.map(f => `#### 🎓 ${f.name}\n- **التخصصات:** ${f.programs.join('، ')}`).join('\n\n');
      return `### 🏫 كليات وبرامج الجامعة\n\n${ftext}`;

    case 'clubs':
      return `### 📱 نادي الـ IT\n🌐 **رابط الواتساب:** [انضم الآن](${kb.clubs.it.link})`;

    case 'location':
      return `### 📍 موقع الجامعة\n- **العنوان:** ${kb.university.location}\n- **الهاتف:** ${kb.university.phones.join(' / ')}\n🌐 [الموقع الإلكتروني](${kb.university.web})`;

    case 'faculty':
      const facultyHtml = kb.instructors.sort((a, b) => a.rank - b.rank).map(d => {
        const cleanName = d.name.replace(/^(أ\.د\.|د\.|أ\.)\s+/, '');
        const initial = cleanName[0] || '؟';
        const linkHtml = d.link ? `<a href="${d.link}" target="_blank" class="faculty-link-btn" title="عرض الملف الشخصي"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></a>` : '';
        return `<div class="faculty-card"><div class="faculty-avatar">${initial}</div><div class="faculty-info"><span class="faculty-name">${d.name}</span><span class="faculty-title">${d.title}</span></div>${linkHtml}</div>`;
      }).join('');
      return `<h3 class="faculty-header">👨‍🏫 طاقم التدريس</h3><div class="faculty-container">${facultyHtml}</div>`;

    case 'registration':
      return `### 🔑 بوابة الطالب\n🌐 [edugate.aut.edu.jo](https://edugate.aut.edu.jo/)`;

    case 'greeting': return "أهلاً بك! كيف يمكنني مساعدتك اليوم؟";

    default:
      const key = getApiKey();
      if (!key) return "أهلاً بك! يرجى سؤالي عن رئيس الجامعة، الكليات، أو القبول لمساعدتك.";
      const prompt = `أنت مساعد جامعة العقبة للتكنولوجيا. أجب بناءً على:\n${JSON.stringify(kb)}\nسؤال المستخدم: ${userInput}`;
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "أهلاً بك!";
      } catch (e) { return "أهلاً بك!"; }
  }
}

window.ChatBot = { processMessage };
