from flask import Flask, jsonify, request, render_template
import pandas as pd
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, template_folder="templates", static_folder="static")

# PostgreSQL connection config (local setup)
DB_NAME = os.getenv("DB_NAME", "launches_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "your_password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

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
    company = request.args.get("company")
    status = request.args.get("status")

    query = "SELECT company, launch_year, mission_status FROM launches"
    filters = []
    params = []

    if company:
        filters.append("company = %s")
        params.append(company)
    if status:
        filters.append("mission_status = %s")
        params.append(status)

    if filters:
        query += " WHERE " + " AND ".join(filters)

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(query, params)
    results = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify(results)

@app.route("/load-data")
def load_data():
    csv_path = "launch_data.csv"
    if not os.path.exists(csv_path):
        return "CSV not found", 404

    df = pd.read_csv(csv_path)
    df = df[["Company", "Date", "MissionStatus"]].dropna()
    df["launch_year"] = pd.to_datetime(df["Date"], errors="coerce").dt.year
    df = df.dropna(subset=["launch_year"])

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS launches (
            id SERIAL PRIMARY KEY,
            company TEXT,
            launch_year INT,
            mission_status TEXT
        )
    """)

    for _, row in df.iterrows():
        cur.execute("""
            INSERT INTO launches (company, launch_year, mission_status)
            VALUES (%s, %s, %s)
        """, (row["Company"], int(row["launch_year"]), row["MissionStatus"]))

    conn.commit()
    cur.close()
    conn.close()

    return "✅ Launch data loaded into database!"

if __name__ == "__main__":
    app.run(debug=True)
