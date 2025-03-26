from flask import Flask, jsonify, request
from flask_cors import CORS
from psycopg2 import pool
from contextlib import contextmanager
import os
from dotenv import load_dotenv
import pandas as pd

load_dotenv()

# Configuration
CSV_FILE_PATH = "space_missions.csv"
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://launches_db_user:GZpMv0pEPb5HUMWZEZyETL96vKacbkkS@dpg-cvhmk4btq21c73flhg1g-a.oregon-postgres.render.com:5432/launches_db")


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
    df = pd.read_csv(CSV_FILE_PATH, encoding="ISO-8859-1")
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
    df = df.rename(columns={"rocketstatus": "rocket_status", "missionstatus": "mission_status"})

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["time"] = pd.to_datetime(df["time"], format="%H:%M:%S", errors="coerce").dt.time
    df["launch_date"] = df["date"].dt.date
    df["launch_year"] = df["date"].dt.year
    df["price"] = (
        df["price"]
        .astype(str)
        .str.replace(",", "")
        .str.strip()
        .replace("None", pd.NA)
    )
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df["success"] = df["mission_status"].str.contains("Success", case=False, na=False)
    df["failure_reason"] = df["mission_status"].where(~df["success"], None)
    df["mission_name"] = df["mission"]
    df["agency"] = df["company"]
    df = df[df["date"].notna() & df["time"].notna()]

    with get_conn_cursor() as (conn, cur):
        for _, row in df.iterrows():
            try:
                cur.execute("""
                    INSERT INTO launches (
                        mission_name, launch_date, launch_year, success, failure_reason, agency,
                        company, location, date, time, rocket, mission,
                        rocket_status, price, mission_status, source_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (source_id) DO NOTHING;
                """, (
                    row.get("mission_name"), row.get("launch_date"), row.get("launch_year"),
                    row.get("success"), row.get("failure_reason"), row.get("agency"),
                    row.get("company"), row.get("location"), row.get("date"), row.get("time"),
                    row.get("rocket"), row.get("mission"), row.get("rocket_status"),
                    row.get("price"), row.get("mission_status"),
                    f"{row.get('company')}_{row.get('date')}"
                ))
            except Exception as e:
                print("❌ Insert error:", e)

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
