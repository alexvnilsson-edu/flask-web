from flask import Flask, render_template
from apex_oracle import apex

app = Flask(__name__)
app.register_blueprint(apex)

@app.route('/')
def index():
    return 'Hello, world!'

@app.route('/weather')
def weather():
    return render_template('weather.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
    
