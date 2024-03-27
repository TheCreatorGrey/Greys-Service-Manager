from flask import Flask, render_template, request, jsonify

app = Flask(__name__, static_folder='public')

@app.route('/api', methods=['POST'])
def api():
    data = request.json
    print('Received data:', data)
    return jsonify({'message': 'Data received successfully'})

if __name__ == '__main__':
    app.run(debug=True)