import os
import glob
import shutil
import webbrowser
from threading import Timer

def build_standalone_project():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    templates_dir = os.path.join(base_dir, 'templates')
    static_dir = os.path.join(base_dir, 'static')
    static_images_dir = os.path.join(static_dir, 'images')
    www_dir = os.path.join(base_dir, 'www')
    www_static_dir = os.path.join(www_dir, 'static')
    www_images_dir = os.path.join(www_static_dir, 'images')

    os.makedirs(templates_dir, exist_ok=True)
    os.makedirs(static_dir, exist_ok=True)
    os.makedirs(static_images_dir, exist_ok=True)
    os.makedirs(www_dir, exist_ok=True)
    os.makedirs(www_static_dir, exist_ok=True)
    os.makedirs(www_images_dir, exist_ok=True)

    # 1. Auto-detect images/ and audio/ from your old velocity-valley-web folder if placed nearby
    parent_dir = os.path.dirname(base_dir)
    candidate_old_dirs = [
        os.path.join(parent_dir, 'velocity-valley-web', 'static'),
        os.path.join(os.path.expanduser('~'), 'Desktop', 'velocity-valley-web', 'static'),
        os.path.join(os.path.expanduser('~'), 'OneDrive', 'Desktop', 'velocity-valley-web', 'static'),
        os.path.join(os.path.expanduser('~'), 'Documents', 'velocity-valley-web', 'static'),
        os.path.join(os.path.expanduser('~'), 'Downloads', 'velocity-valley-web', 'static')
    ]
    for old_static in candidate_old_dirs:
        if os.path.exists(old_static):
            for media_sub in ['images', 'audio']:
                src_media = os.path.join(old_static, media_sub)
                dst_media = os.path.join(static_dir, media_sub)
                if os.path.exists(src_media):
                    os.makedirs(dst_media, exist_ok=True)
                    for item in os.listdir(src_media):
                        s_item = os.path.join(src_media, item)
                        d_item = os.path.join(dst_media, item)
                        if os.path.isfile(s_item) and not os.path.exists(d_item):
                            shutil.copy2(s_item, d_item)
                    print(f"[OK] Synced {media_sub}/ from {old_static}")

    # 2. Copy all new AI images (.jpg / .png) in root into static/images/ and www/static/images/
    for ext in ['*.jpg', '*.png']:
        for img_file in glob.glob(os.path.join(base_dir, ext)):
            img_name = os.path.basename(img_file)
            shutil.copy2(img_file, os.path.join(static_images_dir, img_name))
            shutil.copy2(img_file, os.path.join(www_images_dir, img_name))
            # If bgimageindex_v2.jpg is present, also set it as bgimageindex.png so main menu uses it
            if img_name == 'bgimageindex_v2.jpg':
                shutil.copy2(img_file, os.path.join(static_images_dir, 'bgimageindex.png'))
                shutil.copy2(img_file, os.path.join(www_images_dir, 'bgimageindex.png'))
            print(f"[OK] Installed AI image: static/images/{img_name}")

    # 3. Organize all .html files in root into templates/
    for html_file in glob.glob(os.path.join(base_dir, '*.html')):
        fname = os.path.basename(html_file)
        shutil.copy2(html_file, os.path.join(templates_dir, fname))
        print(f"[OK] Template ready: templates/{fname}")

    # 4. Organize static JS/CSS/XML into static/ and www/static/
    for static_name in ['admin.js', 'script.js', 'style.css', 'sitemap.xml']:
        src = os.path.join(base_dir, static_name)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(static_dir, static_name))
            shutil.copy2(src, os.path.join(www_static_dir, static_name))
            print(f"[OK] Static file ready: static/{static_name}")

    # 5. Generate Capacitor mobile www/ files
    for tpl_file in glob.glob(os.path.join(templates_dir, '*.html')):
        fname = os.path.basename(tpl_file)
        with open(tpl_file, 'r', encoding='utf-8') as f:
            content = f.read()
        mobile_content = content.replace('"/static/', '"./static/').replace("'/static/", "'./static/")
        with open(os.path.join(www_dir, fname), 'w', encoding='utf-8') as f:
            f.write(mobile_content)

    print("\n========================================================")
    print("Velocity Valley v3 Ready! Opening http://127.0.0.1:5000 ...")
    print("========================================================\n")

if __name__ == '__main__':
    build_standalone_project()
    Timer(1.2, lambda: webbrowser.open('http://127.0.0.1:5000')).start()
    from app import app
    app.run(debug=True, use_reloader=False)
