import os
import glob
import shutil

def organize_and_sync():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    templates_dir = os.path.join(base_dir, 'templates')
    static_dir = os.path.join(base_dir, 'static')
    www_dir = os.path.join(base_dir, 'www')
    www_static_dir = os.path.join(www_dir, 'static')

    os.makedirs(templates_dir, exist_ok=True)
    os.makedirs(static_dir, exist_ok=True)
    os.makedirs(www_dir, exist_ok=True)
    os.makedirs(www_static_dir, exist_ok=True)

    # 1. Copy any .html files in root into templates/
    for html_file in glob.glob(os.path.join(base_dir, '*.html')):
        fname = os.path.basename(html_file)
        dest = os.path.join(templates_dir, fname)
        shutil.copy2(html_file, dest)
        print(f"[OK] Placed {fname} -> templates/{fname}")

    # 2. Copy static files (admin.js, script.js, style.css, sitemap.xml) into static/
    for static_name in ['admin.js', 'script.js', 'style.css', 'sitemap.xml']:
        src = os.path.join(base_dir, static_name)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(static_dir, static_name))
            shutil.copy2(src, os.path.join(www_static_dir, static_name))
            print(f"[OK] Placed {static_name} -> static/ and www/static/")

    # 3. Sync templates/*.html into www/ with relative ./static/ paths for Capacitor Android
    for tpl_file in glob.glob(os.path.join(templates_dir, '*.html')):
        fname = os.path.basename(tpl_file)
        with open(tpl_file, 'r', encoding='utf-8') as f:
            content = f.read()
        mobile_content = content.replace('"/static/', '"./static/').replace("'/static/", "'./static/")
        with open(os.path.join(www_dir, fname), 'w', encoding='utf-8') as f:
            f.write(mobile_content)
        print(f"[OK] Synced {fname} -> www/{fname} (Capacitor mobile ready)")

    print("\n========================================================")
    print("All 20 updated files organized into templates/, static/, and www/!")
    print("Starting Velocity Valley Flask server at http://127.0.0.1:5000 ...")
    print("========================================================\n")

if __name__ == '__main__':
    organize_and_sync()
    from app import app
    app.run(debug=True)
