from flask import Flask, render_template, request, jsonify
from livereload import Server
import json
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')



@app.route('/saveUserData', methods=['POST'])
def save_user_data():
    try:
        new_entry = request.get_json()
        data_list = []

        # Load existing data if file exists
        if os.path.exists('userData.json'):
            with open('userData.json') as f:
                try:
                    data_list = json.load(f)
                    if not isinstance(data_list, list):
                        # Handle case where file is a dict instead of a list
                        data_list = [data_list]
                except json.JSONDecodeError:
                    data_list = []

        # Append new data
        data_list.append(new_entry)

        # Write back to file
        with open('userData.json', 'w') as f:
            json.dump(data_list, f, indent=2)

        return jsonify({"status": "success", "data": new_entry})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500




@app.route('/getUserData', methods=['GET'])
def get_user_data():
    try:
        with open('userData.json') as f:
            data = json.load(f)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({"status": "error", "message": "No user data found"}), 404




@app.route('/updateUserData', methods=['POST'])
def update_user_data():
    try:
        payload = request.get_json()
        index = payload.get('index')
        updated = payload.get('updated')

        with open('userData.json') as f:
            data = json.load(f)

        if not isinstance(data, list) or index < 0 or index >= len(data):
            return jsonify({'status': 'error', 'message': 'Invalid index'}), 400

        data[index] = updated

        with open('userData.json', 'w') as f:
            json.dump(data, f, indent=2)

        return jsonify({'status': 'success'})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500




if __name__ == '__main__':
    server = Server(app.wsgi_app)
    server.serve()