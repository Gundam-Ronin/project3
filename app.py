from flask import Flask, jsonify, render_template
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Set your local PostgreSQL config here
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "your_database_name",
    "user": "your_username",
    "password": "your_password"
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/launches")
def get_launch_data():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM launches;")
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        data = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
