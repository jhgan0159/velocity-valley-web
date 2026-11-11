import os
import re
import json
import urllib.request
import urllib.error
from datetime import datetime
from flask import Flask, render_template, send_from_directory, request, jsonify

app = Flask(__name__)

# ==============================================================================
# ILMU AI CONFIGURATION (YTL AI Labs - OpenAI-Compatible Endpoint)
# 方式 A (本地直接填)：把下面的 "(paste your key here)" 换成你的 "sk-..." 密钥
# 方式 B (最省心，以后覆盖 app.py 也不会丢)：在项目文件夹新建 ilmu_key.txt 粘贴 sk-... 密钥
# 方式 C (Vercel 线上部署)：在 Vercel -> Settings -> Environment Variables 添加 ILMU_API_KEY
# ==============================================================================
ILMU_API_KEY = os.environ.get("ILMU_API_KEY", "(paste your key here)")

def get_ilmu_api_key():
    # 1. 优先读取环境变量或上面第 17 行填入的 ILMU_API_KEY
    key_candidate = (ILMU_API_KEY or "").strip()
    if key_candidate and key_candidate != "(paste your key here)" and not key_candidate.startswith("("):
        return key_candidate
    # 2. 其次读取本地 ilmu_key.txt 文件（如果存在）
    if os.path.exists("ilmu_key.txt"):
        try:
            file_key = open("ilmu_key.txt", "r", encoding="utf-8").read().strip()
            if file_key:
                return file_key
        except Exception:
            pass
    return ""

ILMU_BASE_URL = os.environ.get("ILMU_BASE_URL", "https://api.ilmu.ai/v1/chat/completions")
ILMU_MODEL = os.environ.get("ILMU_MODEL", "ilmu-mini-v3.3")

# ==============================================================================
# COMPLETE KSSM PHYSICS KNOWLEDGE BASE (INJECTED INTO ILMU AI SYSTEM PROMPT)
# ==============================================================================
VELOCITY_VALLEY_SYSTEM_PROMPT = """You are Prof. Vector, the friendly and knowledgeable AI Physics Tutor inside "Velocity Valley", an interactive Malaysian KSSM Form 4 & Form 5 Physics Simulation and Educational Game platform created by Gan Jun Heng (Universiti Teknologi Malaysia - UTM).

1. ABOUT THE VELOCITY VALLEY PLATFORM:
- Mini Simulations:
  • Mini Newton's Second Law (F = ma): Interactive block with Force (-50 N to 50 N) and Mass (1 kg to 20 kg) sliders.
- Form 4 KSSM Compulsory Virtual Labs (11 Experiments):
  • Exp 1.1: Simple Pendulum (T = 2π√(l/g), plotting T² vs l graph, gradient m = 4π²/g)
  • Exp 2.1: Gravitational Acceleration g using dual photogates (g = 2h / (t₂² - t₁²))
  • Exp 2.2: Mass & Inertia using horizontally oscillating hacksaw blade and plasticine (T² ∝ m)
  • Exp 4.1 & 4.2: Specific Heat Capacity of water, oil, Al, steel, Cu (c = Pt / (mΔθ))
  • Exp 4.3: Specific Latent Heat of Fusion of Ice (Part A with control set: l_f = Pt / (m₁ - m₂)) & Vaporization of Water (Part B: l_v = Pt / Δm)
  • Exp 4.4: Boyle's Law (P₁V₁ = P₂V₂, syringe & Bourdon gauge, P ∝ 1/V)
  • Exp 4.5: Charles's Law (V₁/T₁ = V₂/T₂, capillary tube & sulfuric acid plug, absolute zero -273 °C)
  • Exp 4.6: Gay-Lussac's / Pressure Law (P₁/T₁ = P₂/T₂, constant volume flask)
  • Exp 6.1: Snell's Law Glass Block (n = sin i / sin r ≈ 1.50)
  • Exp 6.2: Real & Apparent Depth of Water via non-parallax pin method (n = H / h ≈ 1.33)
  • Exp 6.3: Convex Lens Formula (1/f = 1/u + 1/v, f = 10.0 cm)
- Educational Games:
  • Physics Monopoly: Ultimate Edition (C1-C4 Bloom's taxonomy board game)
  • Journey to the West: Physics Quiz RPG (Wukong, Tang Seng, Bajie, Sha Wujing)

2. MALAYSIAN KSSM FORM 4 & FORM 5 SYLLABUS HIGHLIGHTS & EXAM HOTSPOTS:
- Form 4 Bab 1 (Pengukuran / Measurement): Kuantiti Asas vs Terbitan, Skalar vs Vektor, التفسير Graf (kecerunan, pintasan-y, ekstrapolasi).
- Form 4 Bab 2 (Daya dan Gerakan I / Force & Motion I): Gerakan Linear (v = u + at, s = ut + ½at², v² = u² + 2as), Graf Gerakan, Inersia (Hukum Pertama Newton), Hukum Kedua Newton (F = ma, kadar perubahan momentum), Impuls (Ft = mv - mu) & Daya Impuls, Keabadian Momentum.
- Form 4 Bab 3 (Kegravitian / Gravitation):
  • 3.1 Hukum Kegravitian Semesta Newton (Newton's Universal Law of Gravitation): F = G m₁ m₂ / r², Pecutan graviti g = GM / r², Daya memusat (Centripetal force) F = mv² / r.
  • 3.2 Hukum Kepler (Kepler's Laws I, II, III): T₁² / T₂² = r₁³ / r₂³ (derivasi dari GMm/r² = mv²/r dan v = 2πr/T).
  • 3.3 Satelit Buatan Manusia (Man-made Satellites): Laju linear satelit v = √(GM / r), Halaju lepas (Escape velocity) v = √(2GM / r), Satelit Geopegun (Geostationary: T = 24 jam, arah sama putaran Bumi, berada di atas khatulistiwa) vs Bukan Geopegun.
- Form 4 Bab 4 (Haba / Heat): Keseimbangan Terma, Muatan Haba Tentu (Q = mcΔθ), Haba Pendam Tentu (Q = ml), Hukum-hukum Gas (Boyle, Charles, Tekanan, suhu mutlak T dalam Kelvin = θ °C + 273).
- Form 4 Bab 5 (Gelombang / Waves): Pantulan, Pembiasan, Pembelauan, Interferens (λ = ax / D), Gelombang Elektromagnet.
- Form 4 Bab 6 (Cahaya dan Optik / Light & Optics): Pembiasan (n = sin i / sin r = H / h = c / v), Sudut Genting & Pantulan Dalam Penuh (n = 1 / sin c), Formula Kanta Nipis (1/f = 1/u + 1/v).
- Form 5 Bab 1–7: Daya & Gerakan II (Leraian daya, keseimbangan daya, Hukum Hooke F = kx, Tekanan cecair P = hρg, Prinsip Pascal, Prinsip Archimedes, Prinsip Bernoulli), Elektrik (V = IR, E = V + Ir), Keelektromagnetan (F = BIL, Hukum Faraday & Lenz, Transformer), Elektronik (Diod, Transistor), Fizik Nuklear (Separuh hayat, E = mc²), Fizik Kuantum (Teori Fotoelektrik Einstein hf = W + ½mv²_max).

3. STRICT CHAT FORMATTING & TEACHING RULES:
- Directly and thoroughly answer the exact question(s) the student asked! If the student asks for Chinese + Bahasa Melayu translation or asks to analyze the hardest part of a chapter, fulfill every part of their request clearly.
- Format your reply for a mobile Messenger chat window: use clean paragraphs and simple bullet points ("•").
- NEVER output raw LaTeX delimiters like \\[ ... \\], \\( ... \\), or $$ ... $$. Write all math/formulas using clean readable Unicode characters (e.g., F = G m₁ m₂ / r², g = GM / r², v = √(GM / r), T₁² / T₂² = r₁³ / r₂³, m s⁻², Δθ, ×, ÷).
- NEVER output Markdown heading hashes (#, ##, ###, ####) or horizontal divider lines (---). Use **bold** only for key physics terms, titles, or formulas.
"""

def clean_ai_text(text):
    """Strips raw LaTeX delimiters, Markdown heading hashes, and horizontal rules so students see clean text."""
    if not text:
        return ""
    s = str(text)
    s = re.sub(r'(?m)^\s*[-*_]{3,}\s*$', '', s)
    s = re.sub(r'(?m)^\s*#{1,6}\s*', '', s)
    s = s.replace(r'\[', '').replace(r'\]', '').replace(r'\(', '').replace(r'\)', '').replace('$$', '')
    s = re.sub(r'\\text\{([^}]*)\}', r'\1', s)
    s = re.sub(r'\\frac\{([^}]*)\}\{([^}]*)\}', r'(\1 / \2)', s)
    s = re.sub(r'\\sqrt\{([^}]*)\}', r'√(\1)', s)
    latex_map = {
        r'\times': '×',
        r'\div': '÷',
        r'\propto': '∝',
        r'\approx': '≈',
        r'\neq': '≠',
        r'\leq': '≤',
        r'\geq': '≥',
        r'\pm': '±',
        r'\Delta': 'Δ',
        r'\theta': 'θ',
        r'\pi': 'π',
        r'\lambda': 'λ',
        r'\rho': 'ρ',
        r'\alpha': 'α',
        r'\beta': 'β',
        r'\mu': 'μ',
        r'\Omega': 'Ω',
        r'\circ': '°',
        '^{-1}': '⁻¹',
        '^{-2}': '⁻²',
        '^{-3}': '⁻³',
        '^2': '²',
        '^3': '³',
        '_0': '₀',
        '_1': '₁',
        '_2': '₂',
        '_3': '₃'
    }
    for k, v in latex_map.items():
        s = s.replace(k, v)
    s = re.sub(r'\$([^$\n]+)\$', r'\1', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()

# Built-in KSSM Chapter-Specific Question Bank (For Daily Challenge instant fallback)
SYLLABUS_QUESTION_BANK = {
    "F4_B1": {
        "chapterTitle": "Form 4 • Bab 1: Pengukuran (Measurement)",
        "questions": [
            {
                "q": "In Experiment 1.1 (Simple Pendulum), a student plots a graph of T² against length l. What does the gradient (kecerunan) of the graph represent?",
                "options": ["g / (4π²)", "4π² / g", "2π / √g", "√(l / g)"],
                "correct": 1,
                "explanation": "From T = 2π√(l/g), squaring both sides gives T² = (4π²/g) l. Comparing with y = mx, the gradient m = 4π² / g."
            },
            {
                "q": "Antara kuantiti fizik berikut, yang manakah merupakan kuantiti asas (base quantity) dalam Sistem Antarabangsa (SI)?",
                "options": ["Daya (Force)", "Pecutan (Acceleration)", "Arus elektrik (Electric current)", "Momentum"],
                "correct": 2,
                "explanation": "Tujuh kuantiti asas SI ialah panjang, jisim, masa, suhu termodinamik, arus elektrik, keamatan berluminositi, dan kuantiti jirim."
            }
        ]
    },
    "F4_B2": {
        "chapterTitle": "Form 4 • Bab 2: Daya dan Gerakan I (Force & Motion I)",
        "questions": [
            {
                "q": "In Experiment 2.1 (Photogate Free Fall), a steel ball passes Photogate 1 at t₁ = 0.20 s and Photogate 2 at t₂ = 0.40 s with separation h = 0.59 m. Using g = 2h / (t₂² - t₁²), what is the value of g?",
                "options": ["4.92 m s⁻²", "9.83 m s⁻²", "14.75 m s⁻²", "19.67 m s⁻²"],
                "correct": 1,
                "explanation": "Using g = 2(0.59) / (0.40² - 0.20²) = 1.18 / (0.16 - 0.04) = 1.18 / 0.12 = 9.83 m s⁻²."
            }
        ]
    },
    "F4_B3": {
        "chapterTitle": "Form 4 • Bab 3: Kegravitian (Gravitation)",
        "questions": [
            {
                "q": "According to Newton's Universal Law of Gravitation, if the distance r between two masses is doubled (2r), how does the gravitational force F change?",
                "options": ["Decreases to 1/4 F", "Decreases to 1/2 F", "Increases to 2 F", "Increases to 4 F"],
                "correct": 0,
                "explanation": "From F = GMm / r², gravitational force is inversely proportional to r². Doubling r reduces F by a factor of 2² = 4 (1/4 F)."
            }
        ]
    },
    "F4_B4": {
        "chapterTitle": "Form 4 • Bab 4: Haba (Heat)",
        "questions": [
            {
                "q": "In Experiment 4.3 Part A (Latent Heat of Fusion of Ice), why is a Control Set (Set Kawalan tanpa pemanas) used alongside the Experimental Set?",
                "options": ["To measure the specific heat capacity of water", "To determine the mass of ice melted due to heat absorbed from the surroundings", "To cool down the immersion heater", "To keep atmospheric pressure constant"],
                "correct": 1,
                "explanation": "The control set measures mass m₂ melted by surrounding heat so that the mass melted purely by the heater is Δm = m₁ - m₂, giving l_f = Pt / (m₁ - m₂)."
            }
        ]
    },
    "F4_B5": {
        "chapterTitle": "Form 4 • Bab 5: Gelombang (Waves)",
        "questions": [
            {
                "q": "When water waves propagate from a deep region to a shallow region, how do the speed (v) and wavelength (λ) change while frequency (f) remains constant?",
                "options": ["Both v and λ increase", "Both v and λ decrease", "v increases while λ decreases", "v decreases while λ increases"],
                "correct": 1,
                "explanation": "In a shallower region, wave speed v decreases. Since v = fλ and frequency f is unchanged, wavelength λ also decreases."
            }
        ]
    },
    "F4_B6": {
        "chapterTitle": "Form 4 • Bab 6: Cahaya dan Optik (Light & Optics)",
        "questions": [
            {
                "q": "In Experiment 6.2 (Non-Parallax Pin Method), a beaker contains water of real depth H = 8.0 cm (n = 1.33). What is the apparent depth h of the image pin?",
                "options": ["4.5 cm", "6.0 cm", "8.0 cm", "10.6 cm"],
                "correct": 1,
                "explanation": "Using n = H / h → h = H / n = 8.0 cm / 1.33 ≈ 6.0 cm."
            }
        ]
    },
    "F5_B1": {
        "chapterTitle": "Form 5 • Bab 1: Daya dan Gerakan II (Force & Motion II)",
        "questions": [
            {
                "q": "According to Hooke's Law (F = kx), a spring extends by 4.0 cm when a force of 8.0 N is applied. What is the elastic potential energy (E_p = ½Fx) stored in the spring?",
                "options": ["0.16 J", "0.32 J", "16.0 J", "32.0 J"],
                "correct": 0,
                "explanation": "Convert x = 4.0 cm = 0.04 m. Elastic potential energy E_p = ½ F x = 0.5 × 8.0 N × 0.04 m = 0.16 J."
            }
        ]
    },
    "F5_B2": {
        "chapterTitle": "Form 5 • Bab 2: Elektrik (Electricity)",
        "questions": [
            {
                "q": "In Form 5 Experiment 2.2 (Ohm's Law & Resistivity), how does the resistance R of a constantan wire change if its length l is doubled while cross-sectional area A stays constant?",
                "options": ["Halves", "Remains the same", "Doubles", "Quadruples"],
                "correct": 2,
                "explanation": "From R = ρl / A, resistance R is directly proportional to length l. Doubling l doubles the resistance R."
            }
        ]
    },
    "F5_B3": {
        "chapterTitle": "Form 5 • Bab 3: Keelektromagnetan (Electromagnetism)",
        "questions": [
            {
                "q": "A straight conductor of length L = 0.20 m carries a current I = 3.0 A perpendicular to a uniform magnetic field B = 0.50 T. What is the magnetic force F = BIL on the wire?",
                "options": ["0.15 N", "0.30 N", "0.75 N", "3.00 N"],
                "correct": 1,
                "explanation": "Using F = B I L = 0.50 T × 3.0 A × 0.20 m = 0.30 N."
            }
        ]
    },
    "F5_B4": {
        "chapterTitle": "Form 5 • Bab 4–7: Elektronik, Nuklear & Fizik Kuantum",
        "questions": [
            {
                "q": "According to Einstein's Photoelectric Equation (hf = W + ½mv²_max), what happens if the frequency f of incident light is less than the threshold frequency f₀?",
                "options": ["Photoelectrons are emitted with low speed", "No photoelectrons are emitted regardless of light intensity", "Photoelectrons are emitted after a time delay", "Work function W becomes zero"],
                "correct": 1,
                "explanation": "Photoelectric emission only occurs if individual photon energy hf exceeds the work function W (f ≥ f₀)."
            }
        ]
    }
}

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

def call_ilmu_llm(messages, temperature=0.4, max_tokens=4096):
    """Calls YTL AI Labs ILMU API with 60s timeout for detailed multilingual explanations.
    Returns (content, error_message)."""
    api_key = get_ilmu_api_key()
    if not api_key:
        return None, "MISSING_API_KEY"

    payload = json.dumps({
        "model": ILMU_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }).encode("utf-8")

    req = urllib.request.Request(
        ILMU_BASE_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "VelocityValley-KSSM-Tutor/1.0"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            return resp_data["choices"][0]["message"]["content"], None
    except urllib.error.HTTPError as he:
        err_body = ""
        try:
            err_body = he.read().decode("utf-8")
        except Exception:
            pass
        print(f"[ILMU API HTTP Error {he.code}]: {err_body}")
        return None, f"HTTP {he.code}: {err_body[:180]}"
    except Exception as e:
        print(f"[ILMU API Connection Error]: {e}")
        return None, str(e)

@app.route('/api/ilmu/daily-question', methods=['POST', 'OPTIONS'])
def api_daily_question():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"})

    data = request.get_json(silent=True) or {}
    syllabus_code = data.get("syllabus", "F4_B2")
    recent_activities = data.get("recentActivities", [])

    chapter_entry = SYLLABUS_QUESTION_BANK.get(syllabus_code, SYLLABUS_QUESTION_BANK["F4_B2"])
    chapter_title = chapter_entry["chapterTitle"]
    recent_summary = ", ".join([a.get("title", "") for a in recent_activities[:3]]) if recent_activities else "None yet"

    prompt = f"""Generate ONE multiple-choice KSSM Physics question strictly for a Malaysian secondary school student currently at "{chapter_title}".
Recent simulations the student did in Velocity Valley: {recent_summary}.
Do NOT use LaTeX delimiters like \\[ \\] or \\( \\). Use plain Unicode math (e.g., m s⁻², T², π, √).
Return ONLY valid JSON in this exact format (no markdown fences):
{{
  "q": "Question text in clear English/BM",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "explanation": "Step-by-step formula & concept explanation"
}}"""

    ai_raw, _ = call_ilmu_llm([
        {"role": "system", "content": VELOCITY_VALLEY_SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ], temperature=0.5, max_tokens=4096)

    if ai_raw:
        try:
            cleaned = ai_raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            parsed = json.loads(cleaned)
            if "q" in parsed and "options" in parsed and len(parsed["options"]) == 4:
                parsed["q"] = clean_ai_text(parsed["q"])
                parsed["options"] = [clean_ai_text(opt) for opt in parsed["options"]]
                parsed["explanation"] = clean_ai_text(parsed.get("explanation", ""))
                parsed["chapterTitle"] = chapter_title
                parsed["source"] = "ILMU AI"
                return jsonify(parsed)
        except Exception as e:
            print("JSON parse fallback:", e)

    questions_list = chapter_entry["questions"]
    day_seed = datetime.now().day + len(syllabus_code)
    chosen = questions_list[day_seed % len(questions_list)]
    return jsonify({
        "q": chosen["q"],
        "options": chosen["options"],
        "correct": chosen["correct"],
        "explanation": chosen["explanation"],
        "chapterTitle": chapter_title,
        "source": "KSSM Syllabus Engine"
    })

@app.route('/api/ilmu/ask-tutor', methods=['POST', 'OPTIONS'])
def api_ask_tutor():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"})

    data = request.get_json(silent=True) or {}
    user_question = (data.get("question") or "").strip()
    syllabus_code = data.get("syllabus", "F4_B2")
    recent_activities = data.get("recentActivities", [])
    chat_history = data.get("chatHistory", [])

    chapter_entry = SYLLABUS_QUESTION_BANK.get(syllabus_code, SYLLABUS_QUESTION_BANK["F4_B2"])
    chapter_title = chapter_entry["chapterTitle"]
    recent_titles = [a.get("title", "") for a in recent_activities[:5] if a.get("title")]
    recent_str = " -> ".join(recent_titles) if recent_titles else "No simulation visited yet"

    if not user_question:
        return jsonify({"answer": "Please type a physics question so Prof. Vector can help you!"})

    # Build multi-turn messages array so ILMU AI remembers conversation context
    messages = [
        {
            "role": "system",
            "content": (
                VELOCITY_VALLEY_SYSTEM_PROMPT
                + f"\n\nCURRENT STUDENT CONTEXT:\n"
                + f"- Current KSSM Chapter: {chapter_title} (Code: {syllabus_code})\n"
                + f"- Recent Velocity Valley Labs Visited: {recent_str}\n"
            )
        }
    ]

    # Include up to last 6 turns of prior conversation for natural follow-up memory
    if isinstance(chat_history, list):
        for msg in chat_history[-6:]:
            role = msg.get("role")
            text = (msg.get("text") or "").strip()
            if not text or text == user_question:
                continue
            if role == "user":
                messages.append({"role": "user", "content": text})
            elif role == "ai":
                messages.append({"role": "assistant", "content": text})

    messages.append({
        "role": "user",
        "content": (
            f"{user_question}\n\n"
            f"(Reminder: Directly answer every part of the student's question above. "
            f"Do NOT use #, ##, ### headers, --- lines, or \\[ \\] / \\( \\) LaTeX brackets. "
            f"Use clean plain Unicode formulas like F = G m₁ m₂ / r² and **bold** for key terms.)"
        )
    })

    ai_reply, err = call_ilmu_llm(messages, temperature=0.4, max_tokens=4096)

    if ai_reply:
        return jsonify({"answer": clean_ai_text(ai_reply), "source": "ILMU AI"})

    # No fake pre-written answers! Show exact diagnostic reason if API key is missing or call failed
    if err == "MISSING_API_KEY":
        return jsonify({
            "answer": (
                "⚠️ **尚未检测到你的 ILMU API Key！**\n\n"
                "因为你刚刚覆盖了新的 `app.py`，请打开 `app.py` 在第 17 行填入你的 `sk-...` 密钥：\n"
                "**ILMU_API_KEY = \"sk-你的密钥\"**\n\n"
                "（或者在项目文件夹里新建一个 `ilmu_key.txt` 把密钥粘进去保存，以后换 `app.py` 也不会再被覆盖！）填好后重启 `python app.py` 即可。"
            ),
            "source": "System Diagnostic"
        })

    return jsonify({
        "answer": (
            f"⚠️ **连接 ILMU AI 时遇到网络或接口超时：**\n{err}\n\n"
            f"请再点一次发送重试，或检查你的 `ILMU_API_KEY` 状态。"
        ),
        "source": "System Diagnostic"
    })

# ==============================================================================
# STANDARD PAGE ROUTES (Supports both Flask routes and .html filenames)
# ==============================================================================
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/<path:filename>.html')
def serve_html_file(filename):
    return render_template(f'{filename}.html')

@app.route('/newton')
def newton():
    return render_template('newton.html')

@app.route('/pendulum')
def pendulum():
    return render_template('pendulum_sim.html')

@app.route('/tingkatan4experiment2')
def tingkatan4experiment2():
    return render_template('Tingkatan4eksperimen2.html')

@app.route('/form4experiment3')
def form4experiment3():
    return render_template('form4eksperimen3.html')

@app.route('/form4experiment4')
def form4experiment4():
    return render_template('form4eksperimen4.html')

@app.route('/form4experiment5')
def form4experiment5():
    return render_template('form4eksperimen5.html')

@app.route('/form4experiment6')
def form4experiment6():
    return render_template('form4eksperimen6.html')

@app.route('/form4experiment7')
def form4experiment7():
    return render_template('form4eksperimen7.html')

@app.route('/form4experiment8')
def form4experiment8():
    return render_template('form4eksperimen8.html')

@app.route('/form4experiment9')
def form4experiment9():
    return render_template('form4eksperimen9.html')

@app.route('/form4experiment10')
def form4experiment10():
    return render_template('form4eksperimen10.html')

@app.route('/form4experiment11')
def form4experiment11():
    return render_template('form4eksperimen11.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/boardgame')
def play_game():
    return render_template('boardgame.html')

@app.route('/teacher-admin')
def admin_panel():
    return render_template('admin.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/journey')
def journey():
    return render_template('journey.html')

@app.route('/tcadminwest')
def tcadminwest():
    return render_template('tcadminwest.html')

@app.route('/sitemap.xml')
def static_from_root():
    return send_from_directory(app.static_folder, request.path[1:])

if __name__ == '__main__':
    app.run(debug=True)
