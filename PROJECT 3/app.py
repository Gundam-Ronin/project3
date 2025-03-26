from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from psycopg2 import pool
from contextlib import contextmanager
from dotenv import load_dotenv
import pandas as pd
import os
from urllib.parse import uses_netloc

# Load environment variables
load_dotenv()

# Ensure psycopg2 recognizes 'postgres' scheme
uses_netloc.append("postgres")

# Load and fix DATABASE_URL with SSL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://launches_db_user:GZpMv0pEPb5HUMWZEZyETL96vKacbkkS@dpg-cvhmk4btq21c73flhg1g-a.oregon-postgres.render.com:5432/launches_db"
)
if "sslmode" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"

# Initialize DB connection pool
db_pool = pool.SimpleConnectionPool(1, 10, dsn=DATABASE_URL)

# Flask setup
app = Flask(__name__)
CORS(app)

# Helper functions for DB access
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

# Create table if not exists
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

import os

def load_csv_to_postgres():
    print("📥 Loading CSV into PostgreSQL...")

    # Relative path that works on deployment
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'launch_data.csv')
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

    print("✅ CSV data loaded into Postgres.")


# API routes
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

# Initialize for local dev
def initialize_app():
    create_launches_table()
    load_csv_to_postgres()

# Entry point
if __name__ == "__main__":
    initialize_app()
    app.run(debug=True)
