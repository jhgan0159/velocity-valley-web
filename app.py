from flask import Flask, render_template

app = Flask(__name__)

# Route for the Main Menu
@app.route('/')
def home():
    return render_template('index.html')

# NEW: Route for the Newton's Law Simulation
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

# The address for your Board Game
@app.route('/boardgame')
def play_game():
    return render_template('boardgame.html')

# The address for the Teacher's Admin page
@app.route('/teacher-admin')
def admin_panel():
    return render_template('admin.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/journey')
def journey():
    # 确保最上方有 from flask import render_template
    return render_template('journey.html')

@app.route('/tcadminwest')
def tcadminwest():
    # 以后你可以在这里加逻辑，比如只有 Pro User (老师) 才能访问这个页面
    return render_template('tcadminwest.html')

from flask import Flask, render_template, send_from_directory, request

# Tambah route ini supaya Google boleh baca sitemap
@app.route('/sitemap.xml')
def static_from_root():
    return send_from_directory(app.static_folder, request.path[1:])

if __name__ == '__main__':
    app.run(debug=True)