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

if __name__ == '__main__':
    app.run(debug=True)