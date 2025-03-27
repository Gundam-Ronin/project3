
from flask import Flask, jsonify, render_template
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

def get_db_connection():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    return conn

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/launches")
def get_launches():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM launches;")
        rows = cur.fetchall()
        colnames = [desc[0] for desc in cur.description]
        launches = [dict(zip(colnames, row)) for row in rows]
        cur.close()
        conn.close()
        return jsonify(launches)
    except Exception as e:
        print("❌ Error in /api/launches:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
