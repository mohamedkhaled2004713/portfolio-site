import cv2
import speech_recognition as sr
from gtts import gTTS
import os
import google.generativeai as genai
from ultralytics import YOLO
import threading
import time
from PIL import Image
import uuid
import pygame
import numpy as np
import subprocess
import sys
import pickle
import pytesseract          # ✅ [تعديل 5] OCR - قراءة النصوص
from dotenv import load_dotenv  # ✅ [تعديل 1] تحميل API Key من ملف .env
from datetime import datetime   # ✅ [تعديل 3] لمعرفة الوقت والتاريخ
import smtplib                  # ✅ وضع الطوارئ - الإيميل
from email.message import EmailMessage
import requests                 # ✅ وضع الطوارئ - الموقع الجغرافي

# ============================================================
# ✅ [تعديل 1] تحميل API Key بشكل آمن من ملف .env
# بدلاً من كتابة الـ Key مباشرة في الكود
# كيفية الاستخدام:
#   1. أنشئ ملف اسمه ".env" في نفس مجلد الكود
#   2. اكتب فيه: GEMINI_API_KEY=ضع_مفتاحك_هنا
#   3. البرنامج هيقرأه تلقائياً
# ============================================================
load_dotenv()
MY_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not MY_API_KEY:
    print("⚠️  تحذير: لم يتم العثور على GEMINI_API_KEY في ملف .env")
    print("    أنشئ ملف .env وضع فيه: GEMINI_API_KEY=مفتاحك")

# أرقام وإيميلات الطوارئ
EMERGENCY_EMAIL = "mohamedkhaled2004713@gmail.com"
SENDER_EMAIL = "mohamedkhaled2004713@gmail.com"  # يمكنك تغييره أو استخدام نفس الايميل
SENDER_APP_PASSWORD = "mepn qylb uumc sunt" # ✅ هام جداً: ضع هنا "كلمة مرور التطبيقات" الخاصة بإيميلك لكي يرسل بنجاح

# ============================================================
# Global flags and variables
# ============================================================``
process_request = False
running = True
is_processing = False
is_speaking = False

safety_mode_enabled = False
current_operating_mode = "detailed"  # "fast" or "detailed"

# ✅ [تعديل 2] وضع البطارية المنخفضة
low_battery_mode = False

yolo_model = None
last_warning_time = 0
warning_cooldown = 30.0
last_safety_mode_description_time = 0
safety_mode_description_interval = 30.0

# --- Face Recognition (OpenCV Only) ---
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
recognizer = cv2.face.LBPHFaceRecognizer_create()

faces_data_file = "faces_data.pkl"
face_names = {}
current_face_id = 0
save_face_request = False
face_to_save_name = ""
recent_faces = []
face_announce_cooldown = 10.0
last_face_announce_time = {}

# ✅ [تعديل 4] متغيرات تحسين التدريب على الوجوه
FACE_TRAINING_FRAMES = 25   # عدد الفريمات المطلوبة للتدريب
face_training_active = False
face_training_samples = []
face_training_ids = []
face_training_name = ""
face_training_frame_count = 0

if os.path.exists(faces_data_file):
    try:
        with open(faces_data_file, 'rb') as f:
            data = pickle.load(f)
            face_names = data.get('names', {})
            current_face_id = max(face_names.keys()) + 1 if face_names else 0
        if os.path.exists("trainer.yml"):
            recognizer.read("trainer.yml")
    except Exception as e:
        print(f"Error loading face data: {e}")


def save_face_data():
    try:
        with open(faces_data_file, 'wb') as f:
            pickle.dump({'names': face_names}, f)
    except Exception as e:
        print(f"Error saving face data: {e}")


# قاموس ترجمة لأسماء الكائنات الشائعة من YOLO إلى العربية
ARABIC_NAMES = {
    "person": "شخص", "bicycle": "دراجة", "car": "سيارة", "motorcycle": "دراجة نارية",
    "airplane": "طائرة", "bus": "حافلة", "train": "قطار", "truck": "شاحنة",
    "boat": "قارب", "traffic light": "إشارة مرور", "fire hydrant": "صنبور حريق",
    "stop sign": "لوحة قف", "parking meter": "عداد انتظار", "bench": "مقعد",
    "bird": "عصفور", "cat": "قطة", "dog": "كلب", "horse": "حصان", "sheep": "خروف",
    "cow": "بقرة", "elephant": "فيل", "bear": "دب", "zebra": "حمار وحشي",
    "giraffe": "زرافة", "backpack": "حقيبة ظهر", "umbrella": "مظلة",
    "handbag": "حقيبة يد", "tie": "ربطة عنق", "suitcase": "حقيبة سفر",
    "frisbee": "قرص طائر", "skis": "زلاجات", "snowboard": "لوح تزلج",
    "sports ball": "كرة رياضية", "kite": "طائرة ورقية", "baseball bat": "مضرب بيسبول",
    "baseball glove": "قفاز بيسبول", "skateboard": "لوح تزلج", "surfboard": "لوح ركوب أمواج",
    "tennis racket": "مضرب تنس", "bottle": "زجاجة", "wine glass": "كأس",
    "cup": "كوب", "fork": "شوكة", "knife": "سكين", "spoon": "ملعقة", "bowl": "وعاء",
    "banana": "موزة", "apple": "تفاحة", "sandwich": "ساندوتش", "orange": "برتقالة",
    "broccoli": "بروكلي", "carrot": "جزرة", "hot dog": "هوت دوج", "pizza": "بيتزا",
    "donut": "دونات", "cake": "كعكة", "chair": "كرسي", "couch": "أريكة",
    "potted plant": "نبتة", "bed": "سرير", "dining table": "طاولة طعام",
    "toilet": "مرحاض", "tv": "تلفاز", "laptop": "لابتوب", "mouse": "فأرة",
    "remote": "ريموت", "keyboard": "لوحة مفاتيح", "cell phone": "هاتف",
    "microwave": "ميكروويف", "oven": "فرن", "toaster": "محمصة", "sink": "حوض",
    "refrigerator": "ثلاجة", "book": "كتاب", "clock": "ساعة", "vase": "مزهرية",
    "scissors": "مقص", "teddy bear": "دب لعبة", "hair drier": "مجفف شعر",
    "toothbrush": "فرشاة أسنان"
}


# ============================================================
# --- Speech Functions ---
# ============================================================
speak_lock = threading.Lock()

def speak_arabic(text, priority=False):
    global is_speaking
    if is_speaking and not priority:
        return

    def run_speak():
        global is_speaking
        with speak_lock:
            try:
                is_speaking = True
                print(f"Assistant: {text}")
                tts = gTTS(text=text, lang="ar", slow=False)
                voice_file = f"v_{uuid.uuid4().hex[:6]}.mp3"
                tts.save(voice_file)

                played = False
                for player in ["mpg321", "mpg123", "play"]:
                    try:
                        subprocess.run([player, "-q", voice_file], check=True,
                                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        played = True
                        break
                    except:
                        continue

                if not played:
                    try:
                        if not pygame.mixer.get_init():
                            pygame.mixer.init()
                        pygame.mixer.music.load(voice_file)
                        pygame.mixer.music.play()
                        while pygame.mixer.music.get_busy():
                            time.sleep(0.1)
                        # تحسين الأداء ومنع الانهيار: عدم إغلاق mixer بشكل متكرر
                    except:
                        pass

                if os.path.exists(voice_file):
                    try:
                        os.remove(voice_file)
                    except:
                        pass
            except Exception as e:
                print(f"Error in speak_arabic: {e}")
            finally:
                time.sleep(0.3)
                is_speaking = False

    threading.Thread(target=run_speak, daemon=True).start()


# ============================================================
# ✅ [تعديل 3] معرفة الوقت والتاريخ
# الأوامر: "كم الساعة" / "ما الوقت" / "ما التاريخ" / "ما اليوم"
# ============================================================
def get_time_response():
    now = datetime.now()
    hour = now.hour
    minute = now.minute

    # تحويل للتوقيت 12 ساعة بالعربية
    period = "صباحاً" if hour < 12 else "مساءً"
    hour_12 = hour if hour <= 12 else hour - 12
    if hour_12 == 0:
        hour_12 = 12

    if minute == 0:
        time_str = f"الساعة {hour_12} {period} تماماً"
    elif minute == 30:
        time_str = f"الساعة {hour_12} والنصف {period}"
    elif minute == 15:
        time_str = f"الساعة {hour_12} والربع {period}"
    elif minute == 45:
        time_str = f"الساعة {hour_12 + 1} إلا ربع {period}"
    else:
        time_str = f"الساعة {hour_12} و{minute} دقيقة {period}"

    return time_str


def get_date_response():
    now = datetime.now()
    days_ar = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
    months_ar = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                 "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    day_name = days_ar[now.weekday()]
    month_name = months_ar[now.month - 1]
    return f"اليوم {day_name}، {now.day} {month_name} {now.year}"


# ============================================================
# ✅ وضع الطوارئ والاستغاثة (SOS)
# ============================================================
def send_sos_email():
    if not SENDER_APP_PASSWORD:
        return "المعذرة، لم تقم بإدخال كلمة مرور التطبيقات للإيميل داخل الكود! لا يمكن إرسال رسالة الطوارئ."
    
    try:
        # جلب الموقع الجغرافي التقريبي (بناءً على IP)
        try:
            res = requests.get('https://ipinfo.io/json', timeout=5).json()
            loc = res.get('loc', '')
            if loc:
                maps_link = f"https://www.google.com/maps?q={loc}"
            else:
                maps_link = "موقع غير متاح"
        except:
            maps_link = "تعذر تحديد الموقع"

        msg = EmailMessage()
        msg['Subject'] = '🚨 نداء استغاثة عاجل من النظارة الذكية!'
        msg['From'] = SENDER_EMAIL
        msg['To'] = EMERGENCY_EMAIL
        msg.set_content(f"تنبيه! مستخدم النظارة الذكية يطلب المساعدة الفورية.\n\nآخر موقع مسجل للمستخدم على الخريطة:\n{maps_link}")
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return "تم إرسال رسالة الاستغاثة وموقعك بنجاح لجهات الاتصال في الطوارئ."
    except smtplib.SMTPAuthenticationError:
        return "خطأ في تسجيل الدخول للإيميل، تأكد من كلمة مرور التطبيقات."
    except Exception as e:
        print(f"SOS Error: {e}")
        return "حدث خطأ أثناء محاولة إرسال رسالة الطوارئ."

# ============================================================
# ✅ التعرف على العملات (Currency Recognition)
# ============================================================
def recognize_currency(frame):
    if low_battery_mode:
        return "المعذرة، ميزة التعرف على العملات متوقفة لحفظ البطارية."
    try:
        genai.configure(api_key=MY_API_KEY)
        model = genai.GenerativeModel("gemini-flash-latest")
        pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        response = model.generate_content(
            ["أنت مساعد لشخص مكفوف. استخرج واقرأ قيمة العملة النقدية في هذه الصورة بدقة شديدة باللغة العربية بكلمتين أو ثلاث (مثل: خمسون جنيهاً مصرياً، أو عشرة ريالات). لا تضف أي مقدمات أو شروحات. إذا لم تجد عملة واضحة في الصورة، قل فقط: لا توجد عملة نقدية واضحة.", pil_img]
        )
        text = response.text.strip()
        if text and len(text) > 2:
            return f"{text}"
        else:
            return "لا توجد عملة نقدية واضحة."
    except Exception as e:
        print(f"Currency AI Error: {e}")
        return "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي للتعرف على العملة."


# ============================================================
# --- Gemini Integration ---
# ✅ [تعديل 2] وضع البطارية المنخفضة يوقف Gemini تلقائياً
# ============================================================
def get_gemini_response(pil_img):
    # لا تستخدم Gemini في الوضع السريع أو وضع البطارية المنخفضة
    if current_operating_mode == "fast":
        return ""
    if low_battery_mode:
        return ""  # ✅ توفير طاقة: إيقاف Gemini تلقائياً
    try:
        genai.configure(api_key=MY_API_KEY)
        model_name = "gemini-flash-latest"
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(
            ["صف هذا المشهد باختصار وبالعربية لمكفوف، ركز على الأشياء المهمة أمامه.", pil_img]
        )
        return response.text
    except Exception as e:
        print(f"Gemini Error: {e}")
        return ""


# ============================================================
# ✅ [تعديل 5] OCR - قراءة النصوص من الكاميرا
# الأوامر: "اقرأ" / "اقرأ النص" / "فيه نص" / "ماذا مكتوب"
# ============================================================
tesseract_paths = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
]
for path in tesseract_paths:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        break

os.environ["TESSDATA_PREFIX"] = os.path.abspath("tessdata")

def read_text_from_frame(frame):
    if low_battery_mode:
        return "المعذرة، ميزة قراءة النصوص متوقفة لحفظ البطارية. يمكنك قول 'إلغاء توفير الطاقة' لتشغيلها."
    try:
        genai.configure(api_key=MY_API_KEY)
        model = genai.GenerativeModel("gemini-flash-latest")
        pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        response = model.generate_content(
            ["أنت مساعد لشخص مكفوف. استخرج واقرأ النص الموجود في هذه الصورة بدقة شديدة وتجاهل أي شيء غير مفهوم. اكتب النص الواضح فقط، ولا تضف أي مقدمات. إذا لم يكن هناك نص واضح للقراءة في الصورة، قل: لا يوجد نص واضح أمامي.", pil_img]
        )
        text = response.text.strip()
        if text and len(text) > 2:
            return f"النص الذي أمامي هو: {text}"
        else:
            return "لم أجد نصاً واضحاً في الصورة."
    except Exception as e:
        print(f"Gemini OCR Error: {e}")
        return "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي لقراءة النص."


# ============================================================
# --- Voice Trigger Thread ---
# ============================================================
def voice_trigger_thread():
    global process_request, running, safety_mode_enabled, current_operating_mode, is_speaking
    global save_face_request, face_to_save_name, low_battery_mode

    r = sr.Recognizer()
    while running:
        if is_speaking:
            time.sleep(0.1)
            continue

        try:
            with sr.Microphone() as source:
                r.adjust_for_ambient_noise(source, duration=0.5)
                audio = r.listen(source, timeout=None, phrase_time_limit=5)

                if is_speaking:
                    continue

                command = r.recognize_google(audio, language="ar-EG")
                print(f"Recognized: {command}")

                # --- أمر إغلاق البرنامج ---
                if "اغلق البرنامج" in command:
                    speak_arabic("جاري إغلاق البرنامج. وداعاً.", priority=True)
                    time.sleep(2)
                    running = False
                    os._exit(0)

                # ============================================================
                # ✅ [تعديل 3] أوامر الوقت والتاريخ
                # ============================================================
                elif any(word in command for word in ["كم الساعة", "ما الوقت", "الساعة كام", "الوقت"]):
                    speak_arabic(get_time_response(), priority=True)

                elif any(word in command for word in ["ما التاريخ", "ما اليوم", "اليوم إيه", "التاريخ"]):
                    speak_arabic(get_date_response(), priority=True)

                # ============================================================
                # ✅ [تعديل 2] أوامر وضع البطارية المنخفضة
                # ============================================================
                elif any(word in command for word in ["اغلق", "أغلق", "إغلاق", "وقف", "إيقاف", "الغاء", "إلغاء", "عطل", "أوقف", "الغ", "إلغ"]) and any(word in command for word in ["بطاريه", "بطارية", "توفير", "عادي"]):
                    low_battery_mode = False
                    current_operating_mode = "detailed"
                    speak_arabic("تم الغاء وضع توفير الطاقه والتحويل للوضع التفصيلى.", priority=True)

                elif any(phrase in command for phrase in ["وضع البطاريه", "وضع البطارية", "توفير الطاقه", "توفير الطاقة", "بطاريه منخفضه", "بطارية منخفضة", "وفر الطاقه", "وفر الطاقة"]):
                    low_battery_mode = True
                    current_operating_mode = "fast"
                    speak_arabic("تم تفعيل وضع توفير الطاقة. سيتم إيقاف الوصف العميق للصور وقراءة النصوص لحفظ المتبقي من البطارية.", priority=True)

                # --- أوامر إيقاف الأوضاع ---
                else:
                    stop_safety_phrases = ["اوقف الامان", "اوقف الوضع الامن", "اوقف وضع الامان",
                                           "وقف وضع الامان", "وقف الامن", "اغلق الوضع الامن", "اغلق وضع الامان"]
                    if any(phrase in command for phrase in stop_safety_phrases):
                        safety_mode_enabled = False
                        speak_arabic("تم إيقاف وضع الأمان.", priority=True)

                    elif any(word in command for word in ["اغلق", "وقف", "إيقاف", "الغاء", "عطل"]):
                        if "الوضع التفصيلي" in command:
                            current_operating_mode = "fast"
                            speak_arabic("تم إغلاق الوضع التفصيلي، والتحويل للوضع السريع.", priority=True)
                        elif "الوضع السريع" in command:
                            current_operating_mode = "detailed"
                            speak_arabic("تم إغلاق الوضع السريع، والتحويل للوضع التفصيلي.", priority=True)

                    # --- أوامر تفعيل الأوضاع ---
                    elif any(phrase in command for phrase in ["وضع الامان", "الوضع الامن", "وضع الأمان", "الوضع الآمن"]):
                        safety_mode_enabled = True
                        speak_arabic("تم تفعيل وضع الأمان.", priority=True)

                    elif "الوضع السريع" in command:
                        current_operating_mode = "fast"
                        speak_arabic("تم تفعيل الوضع السريع.", priority=True)

                    elif "الوضع التفصيلي" in command:
                        low_battery_mode = False
                        current_operating_mode = "detailed"
                        speak_arabic("تم تفعيل الوضع التفصيلي وإلغاء تعليق توفير الطاقة لتتمكن من استخدام كل الميزات.", priority=True)

                    # --- أمر حفظ الوجه ---
                    elif any(phrase in command for phrase in [
                        "احفظلي هذا الشخص", "احفظلي هذا الوجه",
                        "احفظ هذا الشخص", "احفظ هذا الوجه",
                        "سجل هذا الشخص", "سجل هذا الوجه",
                        "حفظ هذا الشخص", "حفظ هذا الوجه"
                    ]):
                        name = "شخص غير معروف"
                        save_phrases = [
                            "احفظلي هذا الشخص باسم", "احفظلي هذا الوجه باسم",
                            "احفظ هذا الشخص باسم", "احفظ هذا الوجه باسم",
                            "احفظلي هذا الشخص بإسم", "احفظلي هذا الوجه بإسم",
                            "احفظ هذا الشخص بإسم", "احفظ هذا الوجه بإسم",
                            "احفظلي هذا الشخص اسمه", "احفظلي هذا الوجه اسمه",
                            "احفظ هذا الشخص اسمه", "احفظ هذا الوجه اسمه",
                            "سجل هذا الشخص باسم", "سجل هذا الوجه باسم",
                            "حفظ هذا الشخص باسم", "حفظ هذا الوجه باسم"
                        ]
                        found_phrase = False
                        for phrase in save_phrases:
                            if phrase in command:
                                name_start_index = command.find(phrase) + len(phrase)
                                extracted_name = command[name_start_index:].strip()
                                if extracted_name:
                                    name = extracted_name
                                found_phrase = True
                                break

                        if name == "شخص غير معروف":
                            face_to_save_name = f"شخص {current_face_id + 1}"
                        else:
                            face_to_save_name = name

                        # ✅ [تعديل 4] إشعار المستخدم بعدد الفريمات المطلوبة
                        speak_arabic(
                            f"جاري حفظ الوجه باسم {face_to_save_name}. يرجى النظر للكاميرا بثبات لمدة ثلاث ثوانٍ.",
                            priority=True
                        )
                        save_face_request = True

                    # ============================================================
                    # ✅ [تعديل 5] أمر قراءة النص (OCR)
                    # ملاحظة: Google Speech بيتعرف على "اقرا" بدون همزة أحياناً
                    # لذلك أضفنا كل الأشكال الممكنة
                    # ============================================================
                    elif any(word in command for word in [
                        "اقرأ", "اقرا", "اقرأ النص", "اقرا النص",
                        "فيه نص", "في نص", "ماذا مكتوب", "إيه المكتوب",
                        "ايه المكتوب", "مكتوب ايه", "مكتوب إيه", "اقرالي"
                    ]):
                        process_request = "ocr"

                    # ✅ أوامر التعرف على العملة
                    elif any(word in command for word in [
                        "عملة", "عمله", "نقود", "فلوس", "مصاري", "كم هذا", 
                        "هذه العملة", "هذه العمله", "كام دول", "كام دي", "ورقة بكام"
                    ]):
                        process_request = "currency"

                    # ✅ أوامر الطوارئ والاستغاثة
                    elif any(word in command for word in [
                        "طوارئ", "طوار", "حالة طوارئ", "حاله طوار", "انقذوني", "مساعدة", "مساعده",
                        "النجدة", "النجده", "الحقوني", "في خطر", "استغاثة", "استغاثه"
                    ]):
                        process_request = "sos"

                    # --- أمر وصف المشهد ---
                    elif any(word in command for word in ["صف", "وصف", "مشهد", "شف", "ماذا"]):
                        if not is_processing:
                            process_request = True

        except sr.UnknownValueError:
            continue
        except Exception as e:
            print(f"Voice Error: {e}")
            time.sleep(1)


# ============================================================
# ✅ [تعديل 4] تحسين التدريب على الوجوه - 25 فريم بدل فريم واحد
# كيف يعمل:
#   - عند طلب الحفظ، يبدأ جمع 25 فريم من الوجه
#   - يعرض العداد على الشاشة
#   - بعد اكتمال الفريمات يدرب النموذج
# ============================================================
def collect_face_frame(frame):
    """يُستدعى من الـ main loop لجمع فريمات التدريب"""
    global face_training_active, face_training_samples, face_training_ids
    global face_training_name, face_training_frame_count
    global current_face_id, save_face_request

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(50, 50))

    if len(faces) > 0:
        (x, y, w, h) = faces[0]
        face_roi = gray[y:y + h, x:x + w]
        face_roi_resized = cv2.resize(face_roi, (100, 100))

        face_training_samples.append(face_roi_resized)
        face_training_ids.append(current_face_id)

        # أضف نسخة مقلوبة لتحسين الدقة
        face_training_samples.append(cv2.flip(face_roi_resized, 1))
        face_training_ids.append(current_face_id)

        face_training_frame_count += 1

        # عرض تقدم التدريب على الشاشة
        cv2.putText(frame, f"Training: {face_training_frame_count}/{FACE_TRAINING_FRAMES}",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

        if face_training_frame_count >= FACE_TRAINING_FRAMES:
            # اكتمل التدريب — احفظ النموذج
            try:
                if os.path.exists("trainer.yml"):
                    recognizer.update(face_training_samples, np.array(face_training_ids))
                else:
                    recognizer.train(face_training_samples, np.array(face_training_ids))
                recognizer.save("trainer.yml")

                face_names[current_face_id] = face_training_name
                save_face_data()
                current_face_id += 1

                speak_arabic(
                    f"تم حفظ الوجه بنجاح باسم {face_training_name} بدقة عالية.",
                    priority=True
                )
            except Exception as e:
                speak_arabic("حدث خطأ أثناء حفظ الوجه.", priority=True)
                print(f"Training error: {e}")
            finally:
                # إعادة تهيئة متغيرات التدريب
                face_training_active = False
                face_training_samples = []
                face_training_ids = []
                face_training_name = ""
                face_training_frame_count = 0
                save_face_request = False
    else:
        cv2.putText(frame, "No face detected!", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

    return frame


# ============================================================
# --- Scene Processing (Continuous & On-Demand) ---
# ============================================================
def process_frame_logic(frame, is_manual_request=False):
    global is_processing, last_warning_time, safety_mode_enabled
    global last_safety_mode_description_time, safety_mode_description_interval
    global last_face_announce_time

    # Face Recognition
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(50, 50))

    face_map = []
    if len(faces) > 0 and os.path.exists("trainer.yml"):
        for (x, y, w, h) in faces:
            face_roi = gray[y:y + h, x:x + w]
            try:
                id_, confidence = recognizer.predict(face_roi)
                if confidence < 80:
                    name = face_names.get(id_, "شخص غير معروف")
                    face_map.append((x, y, w, h, name, True))
                else:
                    face_map.append((x, y, w, h, "شخص غير معروف", False))
            except:
                face_map.append((x, y, w, h, "شخص غير معروف", False))
    else:
        for (x, y, w, h) in faces:
            face_map.append((x, y, w, h, "شخص غير معروف", False))

    # YOLO Object Detection
    results = yolo_model.predict(frame, conf=0.45, verbose=False)
    detected_objects = []
    warning_messages = []

    frame_height, frame_width, _ = frame.shape
    left_threshold = frame_width // 3
    right_threshold = 2 * frame_width // 3

    matched_faces = [False] * len(face_map)
    final_persons_description = []

    for r in results:
        for box in r.boxes:
            class_name_en = yolo_model.names[int(box.cls[0])]
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            box_center_x = (x1 + x2) // 2

            direction = "أمامك"
            if box_center_x < left_threshold:
                direction = "على يسارك"
            elif box_center_x > right_threshold:
                direction = "على يمينك"

            if class_name_en == "person":
                found_match = False
                matched_name = "شخص غير معروف"
                is_this_person_known = False
                
                for i, (fx, fy, fw, fh, fname, is_known) in enumerate(face_map):
                    if matched_faces[i]:
                        continue
                    face_center_x = fx + fw // 2
                    face_center_y = fy + fh // 2
                    # استخدام المركز لضمان التطابق بين يولو والوجه
                    if (x1 - 50 <= face_center_x <= x2 + 50) and (y1 - 50 <= face_center_y <= y2 + 50):
                        matched_faces[i] = True
                        found_match = True
                        matched_name = fname
                        is_this_person_known = is_known
                        break

                if found_match and is_this_person_known:
                    final_persons_description.append(f"{matched_name} {direction}")
                    person_display_name = matched_name
                else:
                    final_persons_description.append(f"شخص غير معروف {direction}")
                    person_display_name = "شخص ما"
                
                box_width = x2 - x1
                if safety_mode_enabled:
                    if box_width > frame_width * 0.5:
                        current_time = time.time()
                        if current_time - last_warning_time > warning_cooldown:
                            warning_messages.append(f"انتبه! {person_display_name} {direction}")
                            last_warning_time = current_time
                continue

            class_name_ar = ARABIC_NAMES.get(class_name_en, class_name_en)
            box_width = x2 - x1

            detected_objects.append(f"{class_name_ar} {direction}")

            if safety_mode_enabled:
                if box_width > frame_width * 0.5:
                    current_time = time.time()
                    if current_time - last_warning_time > warning_cooldown:
                        warning_messages.append(f"انتبه! {class_name_ar} {direction}")
                        last_warning_time = current_time

    # ✅ إصلاح: الوجوه اللي ما اتطابقتش مع YOLO
    # لو معروف: قول اسمه
    # لو مش معروف: تجاهله (YOLO بالفعل عد الجسم كـ "شخص")
    for i, (fx, fy, fw, fh, fname, is_known) in enumerate(face_map):
        if not matched_faces[i]:
            direction = "أمامك"
            if (fx + fw // 2) < left_threshold:
                direction = "على يسارك"
            elif (fx + fw // 2) > right_threshold:
                direction = "على يمينك"

            if is_known:
                # وجه معروف ما اتطابقش مع YOLO body — أضفه باسمه
                final_persons_description.append(f"{fname} {direction}")

    all_descriptions = final_persons_description + detected_objects

    if is_manual_request:
        is_processing = True
        try:
            obj_text = "رأيت: " + ", ".join(all_descriptions) + ". " if all_descriptions else ""
            final_description = obj_text

            # ✅ Gemini يُوقف تلقائياً في وضع البطارية المنخفضة
            if current_operating_mode == "detailed" and not low_battery_mode:
                pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                gemini_desc = get_gemini_response(pil_img)
                if gemini_desc:
                    final_description += gemini_desc

            if not final_description:
                final_description = "لا أرى شيئاً مهماً."

            speak_arabic(final_description, priority=True)
        finally:
            is_processing = False

    elif warning_messages:
        speak_arabic(" ".join(set(warning_messages)), priority=True)
        return  # لمنع تشغيل الصوت العام بعد التنبيهات وإحداث تداخل

# ============================================================
# --- Main Function ---
# ============================================================
def main():
    global process_request, running, yolo_model, is_processing
    global face_training_active, face_training_name, save_face_request, face_to_save_name

    try:
        yolo_model = YOLO("yolov8n.pt")
    except Exception as e:
        print(f"YOLO Load Error: {e}")
        return

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Camera Error")
        return

    threading.Thread(target=voice_trigger_thread, daemon=True).start()
    speak_arabic("النظام جاهز.")

    frame_count = 0
    while running:
        ret, frame = cap.read()
        if not ret:
            # ✅ محاولة إعادة الاتصال بالكاميرا بدل الإغلاق المباشر
            print("Camera disconnected. Retrying...")
            time.sleep(1)
            cap = cv2.VideoCapture(0)
            continue

        # ============================================================
        # ✅ [تعديل 4] تشغيل جمع فريمات التدريب لو طُلب
        # ============================================================
        if save_face_request:
            if not face_training_active:
                face_training_active = True
                face_training_name = face_to_save_name
                face_training_frame_count = 0
                face_training_samples.clear()
                face_training_ids.clear()
            frame = collect_face_frame(frame)

        cv2.imshow("Smart Glasses Feed", frame)

        # ============================================================
        # ✅ [تعديل 5] تنفيذ OCR لو طُلب
        # ============================================================
        if process_request == "ocr" and not is_processing:
            process_request = False
            is_processing = True

            def do_ocr(f):
                global is_processing
                result = read_text_from_frame(f)
                speak_arabic(result, priority=True)
                is_processing = False

            threading.Thread(target=do_ocr, args=(frame.copy(),), daemon=True).start()

        # ✅ تنفيذ التعرف على العملة
        elif process_request == "currency" and not is_processing:
            process_request = False
            is_processing = True

            def do_currency(f):
                global is_processing
                result = recognize_currency(f)
                speak_arabic(result, priority=True)
                is_processing = False

            threading.Thread(target=do_currency, args=(frame.copy(),), daemon=True).start()

        # ✅ تنفيذ نداء الاستغاثة
        elif process_request == "sos" and not is_processing:
            process_request = False
            is_processing = True

            def do_sos():
                global is_processing
                speak_arabic("جاري إرسال رسالة استغاثة وتحديد موقعك. يرجى الانتظار...", priority=True)
                result = send_sos_email()
                speak_arabic(result, priority=True)
                is_processing = False

            threading.Thread(target=do_sos, daemon=True).start()

        elif process_request and not is_processing:
            process_request = False
            threading.Thread(target=process_frame_logic, args=(frame.copy(), True), daemon=True).start()

        frame_count += 1
        if frame_count % 5 == 0 and not is_processing and not is_speaking and not save_face_request:
            threading.Thread(target=process_frame_logic, args=(frame.copy(), False), daemon=True).start()

        if cv2.waitKey(1) & 0xFF == ord("q"):
            running = False

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
