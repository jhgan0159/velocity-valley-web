import os
import glob
import shutil

ROUTES = {
    '"/newton"': '"newton.html"',
    "'/newton'": "'newton.html'",
    '"/pendulum"': '"pendulum_sim.html"',
    "'/pendulum'": "'pendulum_sim.html'",
    '"/tingkatan4experiment2"': '"Tingkatan4eksperimen2.html"',
    "'/tingkatan4experiment2'": "'Tingkatan4eksperimen2.html'",
    '"/form4experiment3"': '"form4eksperimen3.html"',
    "'/form4experiment3'": "'form4eksperimen3.html'",
    '"/form4experiment4"': '"form4eksperimen4.html"',
    "'/form4experiment4'": "'form4eksperimen4.html'",
    '"/form4experiment5"': '"form4eksperimen5.html"',
    "'/form4experiment5'": "'form4eksperimen5.html'",
    '"/form4experiment6"': '"form4eksperimen6.html"',
    "'/form4experiment6'": "'form4eksperimen6.html'",
    '"/form4experiment7"': '"form4eksperimen7.html"',
    "'/form4experiment7'": "'form4eksperimen7.html'",
    '"/form4experiment8"': '"form4eksperimen8.html"',
    "'/form4experiment8'": "'form4eksperimen8.html'",
    '"/form4experiment9"': '"form4eksperimen9.html"',
    "'/form4experiment9'": "'form4eksperimen9.html'",
    '"/form4experiment10"': '"form4eksperimen10.html"',
    "'/form4experiment10'": "'form4eksperimen10.html'",
    '"/form4experiment11"': '"form4eksperimen11.html"',
    "'/form4experiment11'": "'form4eksperimen11.html'",
    '"/form5experiment1"': '"form5eksperimen1.html"',
    "'/form5experiment1'": "'form5eksperimen1.html'",
    '"/form5experiment2"': '"form5eksperimen2.html"',
    "'/form5experiment2'": "'form5eksperimen2.html'",
    '"/form5experiment3"': '"form5eksperimen3.html"',
    "'/form5experiment3'": "'form5eksperimen3.html'",
    '"/form5experiment4"': '"form5eksperimen4.html"',
    "'/form5experiment4'": "'form5eksperimen4.html'",
    '"/form5experiment5"': '"form5eksperimen5.html"',
    "'/form5experiment5'": "'form5eksperimen5.html'",
    '"/dashboard"': '"dashboard.html"',
    "'/dashboard'": "'dashboard.html'",
    '"/boardgame"': '"boardgame.html"',
    "'/boardgame'": "'boardgame.html'",
    '"/journey"': '"journey.html"',
    "'/journey'": "'journey.html'",
    '"/teacher-admin"': '"admin.html"',
    "'/teacher-admin'": "'admin.html'",
    '"/tcadminwest"': '"tcadminwest.html"',
    "'/tcadminwest'": "'tcadminwest.html'",
    '"/login"': '"login.html"',
    "'/login'": "'login.html'",
    'href="/"': 'href="index.html"',
    "window.location.protocol === 'file:'": "true",
    "window.location.protocol==='file:'": "true"
}

os.makedirs('templates', exist_ok=True)
os.makedirs('www', exist_ok=True)
os.makedirs(os.path.join('static', 'images'), exist_ok=True)
os.makedirs(os.path.join('www', 'static', 'images'), exist_ok=True)

# 0. Automatically copy advertise.png (if placed in root) into static/images/ and www/static/images/
if os.path.exists('advertise.png'):
    shutil.copy2('advertise.png', os.path.join('static', 'images', 'advertise.png'))
    shutil.copy2('advertise.png', os.path.join('www', 'static', 'images', 'advertise.png'))
    print("[OK] Updated advertise.png -> static/images/ and www/static/images/")

# 1. Automatically copy any .html files placed in the project root into templates/
for root_html in glob.glob('*.html'):
    fname = os.path.basename(root_html)
    shutil.copy2(root_html, os.path.join('templates', fname))
    print(f"[OK] Copied {fname} -> templates/{fname}")

# 2. Convert templates/*.html into Android-ready www/*.html
for f in glob.glob('templates/*.html'):
    c = open(f, 'r', encoding='utf-8').read()
    c = c.replace('"/static/', '"./static/').replace("'/static/", "'./static/")
    for k, v in ROUTES.items():
        c = c.replace(k, v)
    open(os.path.join('www', os.path.basename(f)), 'w', encoding='utf-8').write(c)

print("All templates, images, and Android www/*.html links synced!")
