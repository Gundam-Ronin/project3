from flask import Flask, jsonify, render_template
from flask_cors import CORS
import pandas as pd
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
from dotenv import load_dotenv
from pathlib import Path
import os

# Load environment variables
load_dotenv()

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

# Initialize DB connection pool
DATABASE_URL = os.getenv("DATABASE_URL")
db_pool = None

def init_db_pool():
    global db_pool
    if db_pool is None:
        print("🔄 Initializing DB connection pool...")
        try:
            db_pool = pool.SimpleConnectionPool(1, 10, dsn=DATABASE_URL)
        except Exception as e:
            print(f"❌ DB connection failed: {e}")
            db_pool = None

def get_db_connection():
    if db_pool is None:
        init_db_pool()
    return db_pool.getconn() if db_pool else None

@contextmanager
def get_conn_cursor():
    conn = get_db_connection()
    if not conn:
        yield None, None
        return
    try:
        yield conn, conn.cursor()
    finally:
        conn.commit()
        conn.close()

@app.route("/")
def dashboard():
    return render_template("index.html")

@app.route("/api/launches")
def api_get_launches():
    with get_conn_cursor() as (conn, cur):
        if not conn:
            return jsonify({"error": "Database pool is not available"}), 500
        cur.execute("SELECT * FROM launches;")
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        data = [dict(zip(columns, row)) for row in rows]
        return jsonify(data)

@app.route("/load-data")
def load_data():
    csv_path = Path("launch_data.csv")
    if not csv_path.exists():
        return "CSV file not found.", 404

    df = pd.read_csv(csv_path)
    df = df[["Company", "Date", "MissionStatus"]].copy()
    df.columns = ["company", "date", "mission_status"]
    df["launch_year"] = pd.to_datetime(df["date"], errors="coerce").dt.year
    df.dropna(subset=["company", "launch_year", "mission_status"], inplace=True)

    with get_conn_cursor() as (conn, cur):
        if not conn:
            return "DB unavailable", 500
        cur.execute("""
            CREATE TABLE IF NOT EXISTS launches (
                id SERIAL PRIMARY KEY,
                company TEXT,
                launch_year INT,
                mission_status TEXT
            );
        """)
        for _, row in df.iterrows():
            cur.execute("""
                INSERT INTO launches (company, launch_year, mission_status)
                VALUES (%s, %s, %s)
                ON CONFLICT DO NOTHING;
            """, (row["company"], int(row["launch_year"]), row["mission_status"]))
    
    return "✅ Data loaded successfully!"

if __name__ == "__main__":
    app.run(debug=True)
