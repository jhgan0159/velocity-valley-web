import os, glob

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

os.makedirs('www', exist_ok=True)
for f in glob.glob('templates/*.html'):
    c = open(f, 'r', encoding='utf-8').read()
    c = c.replace('"/static/', '"./static/').replace("'/static/", "'./static/")
    for k, v in ROUTES.items():
        c = c.replace(k, v)
    open(os.path.join('www', os.path.basename(f)), 'w', encoding='utf-8').write(c)
print("Successfully converted all www/*.html links for Android!")
