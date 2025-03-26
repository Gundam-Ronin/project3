from urllib.parse import urlparse, uses_netloc
from flask import Flask, jsonify, request
from flask_cors import CORS
from psycopg2 import pool
from contextlib import contextmanager
import os
from dotenv import load_dotenv
import pandas as pd

load_dotenv()

# Configuration
CSV_FILE_PATH = r"C:\Users\Antho\OneDrive\Desktop\PROJECT 3\static\launch_data.csv"
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://launches_db_user:GZpMv0pEPb5HUMWZEZyETL96vKacbkkS@dpg-cvhmk4btq21c73flhg1g-a.oregon-postgres.render.com:5432/launches_db")

uses_netloc.append("postgres")
DATABASE_URL = os.getenv("DATABASE_URL")



if "sslmode" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"


# Flask setup
app = Flask(__name__)
CORS(app)

# Database connection pool
db_pool = pool.SimpleConnectionPool(1, 10, DATABASE_URL)

def get_db_connection():
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

# Table creation
def create_launches_table():
    with get_conn_cursor() as (conn, cur):
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

# Load CSV into PostgreSQL
def load_csv_to_postgres():
    print("📥 Loading CSV into PostgreSQL...")
    df = pd.read_csv(r"C:\Users\Antho\OneDrive\Desktop\PROJECT 3\static\launch_data.csv")
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

    print("✅ CSV data loaded into Postgres.")


# Route definitions
@app.route("/")
def dashboard():
    return render_template("index.html")

@app.route("/api/launches")
def api_get_launches():
    with get_conn_cursor() as (conn, cur):
        cur.execute("SELECT * FROM launches;")
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        return jsonify([dict(zip(columns, row)) for row in rows])

@app.route("/api/stats")
def api_get_stats():
    with get_conn_cursor() as (conn, cur):
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

# Initialization function to use in Railway
def initialize_app():
    create_launches_table()
    load_csv_to_postgres()

# Local development entrypoint
if __name__ == "__main__":
    initialize_app()
    app.run(debug=True)
