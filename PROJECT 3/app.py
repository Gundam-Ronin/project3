from urllib.parse import uses_netloc
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from psycopg2 import pool
from contextlib import contextmanager
import os
import pandas as pd
from dotenv import load_dotenv
import itertools

load_dotenv()

# Database connection
uses_netloc.append("postgres")
DATABASE_URL = os.getenv("DATABASE_URL")

# Force SSL if not included
if DATABASE_URL and "sslmode" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"

# Flask setup
app = Flask(__name__)
CORS(app)

# Initialize pool later to prevent early connection in prod
db_pool = None

def init_db_pool():
    global db_pool
    if not db_pool:
        db_pool = pool.SimpleConnectionPool(1, 10, dsn=DATABASE_URL)

def get_db_connection():
    init_db_pool()
    return db_pool.getconn()

def release_db_connection(conn):
    db_pool.putconn(conn)

@contextmanager
def get_conn_cursor():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        yield conn, cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        release_db_connection(conn)

# Create table
def create_launches_table():
    with get_conn_cursor() as (_, cur):
        cur.execute("""
            CREATE TABLE IF NOT EXISTS launches (
                id SERIAL PRIMARY KEY,
                mission_name TEXT,
                launch_date DATE,
                launch_year INT,
                success BOOLEAN,
                failure_reason TEXT,
                agency TEXT,
                company TEXT,
                location TEXT,
                date DATE,
                time TIME,
                rocket TEXT,
                mission TEXT,
                rocket_status TEXT,
                price NUMERIC,
                mission_status TEXT,
                source_id TEXT UNIQUE
            );
        """)

# Load CSV (only in dev/local)
from pathlib import Path

def load_csv_to_postgres():
    print("📥 Loading CSV into PostgreSQL...")

    try:
        base_path = Path(__file__).parent
    except NameError:
        # 👇 This is the fix: get the parent of the current working directory
        base_path = Path().resolve().parent

    csv_path = base_path / "static" / "launch_data.csv"
    print(f"Loading from path: {csv_path}")

    df = pd.read_csv(csv_path)

    with get_conn_cursor() as (conn, cur):
        insert_query = """
            INSERT INTO launches (
                mission_name, launch_date, launch_year, success, failure_reason, agency,
                company, location, date, time, rocket, mission,
                rocket_status, price, mission_status, source_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (source_id) DO NOTHING;
        """
        values = [
            (
                row.get("mission_name"), row.get("launch_date"), row.get("launch_year"),
                row.get("success"), row.get("failure_reason"), row.get("agency"),
                row.get("company"), row.get("location"), row.get("date"), row.get("time"),
                row.get("rocket"), row.get("mission"), row.get("rocket_status"),
                row.get("price"), row.get("mission_status"), row.get("source_id")
            )
            for _, row in df.iterrows()
        ]

        cur.executemany(insert_query, values)

    print("✅ CSV data loaded into PostgreSQL.")



# API routes
@app.route("/")
def dashboard():
    return render_template("index.html")

@app.route("/api/launches")
def api_get_launches():
    with get_conn_cursor() as (_, cur):
        cur.execute("SELECT * FROM launches;")
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        return jsonify([dict(zip(columns, row)) for row in rows])

@app.route("/api/stats")
def api_get_stats():
    with get_conn_cursor() as (_, cur):
        cur.execute("""
            SELECT
                launch_year AS year,
                agency,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE success) AS success_count
            FROM launches
            WHERE launch_year IS NOT NULL
            GROUP BY year, agency
            ORDER BY year, agency;
        """)
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        return jsonify([dict(zip(columns, row)) for row in rows])

# Optional initialization
def initialize_app():
    create_launches_table()
    if os.environ.get("FLASK_ENV") != "production":
        load_csv_to_postgres()

# Entrypoint
if __name__ == "__main__":
    initialize_app()
    app.run(debug=True)
