import os
import shutil

FILES_TO_SYNC = [
    "index.html",
    "dashboard.html",
    "newton.html",
    "pendulum_sim.html",
    "Tingkatan4eksperimen2.html",
    "form4eksperimen3.html",
    "form4eksperimen4.html",
    "form4eksperimen5.html",
    "form4eksperimen6.html",
    "form4eksperimen7.html",
    "form4eksperimen8.html",
    "form4eksperimen9.html",
    "form4eksperimen10.html",
    "form4eksperimen11.html",
    "form5eksperimen1.html",
    "form5eksperimen2.html",
    "form5eksperimen3.html",
    "form5eksperimen4.html",
    "form5eksperimen5.html",
    "form5eksperimen6.html",
    "form5eksperimen7.html",
    "form5eksperimen8.html",
    "form5eksperimen9.html",
    "form5eksperimen10.html",
]

TARGET_DIRS = ["templates", "www"]

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    for d in TARGET_DIRS:
        os.makedirs(os.path.join(base_dir, d), exist_ok=True)

    synced = 0
    for fname in FILES_TO_SYNC:
        src = os.path.join(base_dir, fname)
        if os.path.exists(src):
            for d in TARGET_DIRS:
                dst = os.path.join(base_dir, d, fname)
                shutil.copy2(src, dst)
            synced += 1
            print(f"[OK] Synced {fname} -> templates/ and www/")
        else:
            print(f"[SKIP] {fname} not found in root directory")

    print(f"\nDone! Synced {synced} files into templates/ and www/.")

if __name__ == "__main__":
    main()
