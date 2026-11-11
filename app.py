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
# ==============================================================================
ILMU_API_KEY = os.environ.get("ILMU_API_KEY", "(paste your key here)")

def get_ilmu_api_key():
    key_candidate = (ILMU_API_KEY or "").strip()
    if key_candidate and key_candidate != "(paste your key here)" and not key_candidate.startswith("("):
        return key_candidate
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
# ULTRA-COMPACT TOKEN-SAVING SYSTEM PROMPT (~110 TOKENS INSTEAD OF 1,700 TOKENS!)
# Fixed prefix is automatically cached by ILMU API at 90% discount, and only the
# student's active KSSM chapter summary is injected per request.
# ==============================================================================
CORE_SYSTEM_PREFIX = (
    "You are Prof. Vector, the KSSM Form 4 & 5 Physics AI Tutor inside Velocity Valley (by Gan Jun Heng, UTM). "
    "Rules: Use secondary school SPM algebra only (never calculus). "
    "Reply concisely (150-300 words) in the student's language using plain Unicode math (F = ma, m s⁻², Δθ, √, ×) and **bold** for key terms. "
    "Never output #, ##, ### headers, --- lines, or \\[ \\] / \\( \\) LaTeX brackets."
)

CHAPTER_COMPACT_NOTES = {
    "F4_B1": "Form 4 Bab 1 Pengukuran: Base/derived quantities, scalar/vector, Exp 1.1 Simple Pendulum (T = 2π√(l/g), T² vs l gradient = 4π²/g).",
    "F4_B2": "Form 4 Bab 2 Daya & Gerakan I: Linear motion (v=u+at, s=ut+½at², v²=u²+2as), Newton's Laws (F=ma), momentum, impulse, Exp 2.1 Photogate g = 2h/(t₂²-t₁²), Exp 2.2 Inertia hacksaw blade (T² ∝ m).",
    "F4_B3": "Form 4 Bab 3 Kegravitian: Newton's Gravitation F = Gm₁m₂/r², g = GM/r², centripetal F = mv²/r, Kepler's Laws (GMm/r² = mv²/r with v=2πr/T gives T₁²/T₂² = r₁³/r₂³), satellite v = √(GM/r), escape v = √(2GM/r).",
    "F4_B4": "Form 4 Bab 4 Haba: Thermal equilibrium, Exp 4.1/4.2 Specific Heat Capacity c = Pt/(mΔθ), Exp 4.3 Latent Heat l = Pt/Δm (control set m₂), Gas Laws: Exp 4.4 Boyle (P₁V₁=P₂V₂), Exp 4.5 Charles (V₁/T₁=V₂/T₂), Exp 4.6 Gay-Lussac (P₁/T₁=P₂/T₂, T in Kelvin).",
    "F4_B5": "Form 4 Bab 5 Gelombang: v = fλ, reflection, refraction, diffraction, interference (λ = ax/D), EM waves.",
    "F4_B6": "Form 4 Bab 6 Cahaya & Optik: Exp 6.1 Snell's Law (n = sin i / sin r ≈ 1.50), Exp 6.2 Apparent Depth (n = H/h ≈ 1.33), critical angle (n = 1/sin c), Exp 6.3 Convex Lens (1/f = 1/u + 1/v).",
    "F5_B1": "Form 5 Bab 1 Daya & Gerakan II: Resolution/equilibrium of forces, Exp 1.1 Hooke's Law (F = kx, extension x = l - l₀, E_p = ½Fx = ½kx²).",
    "F5_B2": "Form 5 Bab 2 Tekanan: Exp 2.1 Liquid Pressure vs Depth (P = hρg, U-tube D ∝ h), Exp 2.2 Liquid Pressure vs Density (Alcohol 790, Water 1000, Glycerine 1300 kg m⁻³, D ∝ ρ), Pascal's Principle, Exp 2.3 Archimedes' Principle (Buoyant force F_B = W_U - W_A = W_S displaced water weight), Bernoulli's Principle.",
    "F5_B3": "Form 5 Bab 3 Elektrik & Keelektromagnetan: Exp 3.1 Ohm's Law (Part A constantan wire V=IR straight line; Part B filament bulb V vs I curves up as temperature & R increase), E = V + Ir, Electromagnetism F = BIL, Faraday/Lenz Law, transformer.",
    "F5_B4": "Form 5 Bab 4-7 Elektronik, Nuklear & Kuantum: Diode rectification, transistor, radioactive half-life, E = mc², Einstein photoelectric hf = W + ½mv²_max."
}

def clean_ai_text(text):
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
    if s.count('**') % 2 == 1:
        s = s + '**'
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()

# Built-in Zero-Token KSSM Daily Question Bank (Costs 0 API Tokens!)
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
            },
            {
                "q": "In Experiment 2.2 (Mass & Inertia), why is the hacksaw blade displaced horizontally instead of vertically?",
                "options": ["To increase air resistance", "To eliminate the effect of gravitational pull on the oscillation", "To reduce the mass of the plasticine", "To shorten the blade length"],
                "correct": 1,
                "explanation": "Horizontal oscillation ensures that gravity acts perpendicular to the motion and does not affect the restoring force of the hacksaw blade."
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
                "q": "In Form 5 Experiment 1.1 (Hooke's Law), a spring of original length l₀ = 10.0 cm stretches to l = 14.0 cm when a force of 0.8 N is applied. What is the extension x of the spring?",
                "options": ["4.0 cm", "10.0 cm", "14.0 cm", "24.0 cm"],
                "correct": 0,
                "explanation": "Extension x = l - l₀ = 14.0 cm - 10.0 cm = 4.0 cm."
            }
        ]
    },
    "F5_B2": {
        "chapterTitle": "Form 5 • Bab 2: Tekanan (Pressure & Archimedes)",
        "questions": [
            {
                "q": "In Form 5 Experiment 2.3 (Archimedes' Principle), a slotted weight weighs W_U = 3.00 N in air and W_A = 2.40 N when fully submerged in water inside a Eureka can. What is the buoyant force F_B and the weight of water displaced W_S?",
                "options": ["0.60 N", "2.40 N", "3.00 N", "5.40 N"],
                "correct": 0,
                "explanation": "Buoyant force F_B = W_U - W_A = 3.00 N - 2.40 N = 0.60 N, which equals the weight of water displaced W_S = 0.60 N."
            }
        ]
    },
    "F5_B3": {
        "chapterTitle": "Form 5 • Bab 3: Elektrik & Keelektromagnetan",
        "questions": [
            {
                "q": "In Form 5 Experiment 3.1B (Non-Ohmic Conductor), why does the graph of V against I for a filament bulb curve upwards with an increasing gradient?",
                "options": ["Because the bulb length increases", "Because as current increases, filament temperature rises and resistance increases", "Because electromotive force increases", "Because resistance decreases with temperature"],
                "correct": 1,
                "explanation": "For a filament bulb, higher current I heats up the tungsten filament, increasing its resistance R (gradient of V vs I)."
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

def call_ilmu_llm(messages, temperature=0.4, max_tokens=2048):
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
        return None, f"HTTP {he.code}: {err_body[:180]}"
    except Exception as e:
        return None, str(e)

@app.route('/api/ilmu/daily-question', methods=['POST', 'OPTIONS'])
def api_daily_question():
    """Serves the Daily KSSM Physics Challenge from the built-in syllabus bank at ZERO (0) token cost!"""
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"})

    data = request.get_json(silent=True) or {}
    syllabus_code = data.get("syllabus", "F4_B2")
    chapter_entry = SYLLABUS_QUESTION_BANK.get(syllabus_code, SYLLABUS_QUESTION_BANK["F4_B2"])
    chapter_title = chapter_entry["chapterTitle"]

    questions_list = chapter_entry["questions"]
    day_seed = datetime.now().day + len(syllabus_code)
    chosen = questions_list[day_seed % len(questions_list)]
    return jsonify({
        "q": chosen["q"],
        "options": chosen["options"],
        "correct": chosen["correct"],
        "explanation": chosen["explanation"],
        "chapterTitle": chapter_title,
        "source": "KSSM Syllabus Engine (0 Tokens)"
    })

@app.route('/api/ilmu/ask-tutor', methods=['POST', 'OPTIONS'])
def api_ask_tutor():
    """Token-optimized AI Tutor endpoint: sends only the active chapter note (~120 input tokens instead of 1,737)."""
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"})

    data = request.get_json(silent=True) or {}
    user_question = (data.get("question") or "").strip()
    syllabus_code = data.get("syllabus", "F4_B2")
    recent_activities = data.get("recentActivities", [])
    chat_history = data.get("chatHistory", [])

    if not user_question:
        return jsonify({"answer": "Please type a physics question so Prof. Vector can help you!"})

    chapter_note = CHAPTER_COMPACT_NOTES.get(syllabus_code, CHAPTER_COMPACT_NOTES["F4_B2"])
    latest_lab = recent_activities[0].get("title", "None") if (isinstance(recent_activities, list) and len(recent_activities) > 0) else "None"

    messages = [
        {
            "role": "system",
            "content": f"{CORE_SYSTEM_PREFIX}\nStudent Chapter: {chapter_note}\nLatest Lab: {latest_lab}"
        }
    ]

    # Include at most the last 2 short messages (capped at 160 chars) so old essays don't waste input tokens
    if isinstance(chat_history, list):
        for msg in chat_history[-2:]:
            role = msg.get("role")
            text = (msg.get("text") or "").strip()
            if not text or text == user_question:
                continue
            short_text = text[:160] + ("..." if len(text) > 160 else "")
            if role == "user":
                messages.append({"role": "user", "content": short_text})
            elif role == "ai":
                messages.append({"role": "assistant", "content": short_text})

    messages.append({"role": "user", "content": user_question})

    ai_reply, err = call_ilmu_llm(messages, temperature=0.4, max_tokens=2048)

    if ai_reply:
        return jsonify({"answer": clean_ai_text(ai_reply), "source": "ILMU AI"})

    if err == "MISSING_API_KEY":
        return jsonify({
            "answer": (
                "⚠️ **尚未检测到你的 ILMU API Key！**\n\n"
                "请确认你的项目文件夹里有 `ilmu_key.txt`（或在 Vercel Environment Variables 已添加 `ILMU_API_KEY`）。"
            ),
            "source": "System Diagnostic"
        })

    return jsonify({
        "answer": f"⚠️ **连接 ILMU AI 时遇到网络或接口超时：**\n{err}\n\n请再点一次发送重试。",
        "source": "System Diagnostic"
    })

# ==============================================================================
# STANDARD PAGE ROUTES (FORM 4 & FORM 5 EXPERIMENTS)
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

@app.route('/form5experiment1')
def form5experiment1():
    return render_template('form5eksperimen1.html')

@app.route('/form5experiment2')
def form5experiment2():
    return render_template('form5eksperimen2.html')

@app.route('/form5experiment3')
def form5experiment3():
    return render_template('form5eksperimen3.html')

@app.route('/form5experiment4')
def form5experiment4():
    return render_template('form5eksperimen4.html')

@app.route('/form5experiment5')
def form5experiment5():
    return render_template('form5eksperimen5.html')

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
