from flask import Flask, jsonify, render_template
from flask_cors import CORS
import pandas as pd
import psycopg2
from psycopg2 import pool
import os
from dotenv import load_dotenv
from pathlib import Path
from contextlib import contextmanager

load_dotenv()

app = Flask(__name__)
CORS(app)

# Load database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://launches_db_user:GZpMv0pEPb5HUMWZEZyETL96vKacbkkS@dpg-cvhmk4btq21c73flhg1g-a.oregon-postgres.render.com/launches_db")

# Connection pool
db_pool = None

def init_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = pool.SimpleConnectionPool(1, 10, dsn=DATABASE_URL)

def get_db_connection():
    if db_pool is None:
        init_db_pool()
    return db_pool.getconn()

@contextmanager
def get_conn_cursor():
    conn = get_db_connection()
    try:
        yield conn, conn.cursor()
    finally:
        conn.commit()
        conn.close()

def create_launches_table():
    create_query = """
    CREATE TABLE IF NOT EXISTS launches (
        id SERIAL PRIMARY KEY,
        mission_name TEXT,
        launch_date TEXT,
        launch_year INT,
        success BOOLEAN,
        failure_reason TEXT,
        agency TEXT,
        payload_mass_kg FLOAT,
        source_id TEXT UNIQUE,
        company TEXT,
        location TEXT,
        date DATE,
        time TIME,
        rocket TEXT,
        mission TEXT,
        rocket_status TEXT,
        price TEXT,
        mission_status TEXT
    );
    """
    with get_conn_cursor() as (_, cur):
        cur.execute(create_query)

def load_csv_to_postgres():
    print("📥 Loading CSV into PostgreSQL...")
    csv_path = Path("launch_data.csv")  # or static/launch_data.csv depending on where your file is
    if not csv_path.exists():
        print(f"❌ CSV not found at {csv_path}")
        return

    df = pd.read_csv(csv_path)

    # Rename columns to match DB
    df.rename(columns={
        "Mission": "mission_name",
        "Date": "launch_date",
        "Company": "agency",
        "Rocket": "rocket",
        "RocketStatus": "rocket_status",
        "Location": "location",
        "MissionStatus": "mission_status",
        "Price": "price"
    }, inplace=True)

    # Derive additional fields
    df["launch_year"] = pd.to_datetime(df["launch_date"], errors="coerce").dt.year
    df["success"] = df["mission_status"].str.lower().str.contains("success", na=False)
    df["failure_reason"] = df["mission_status"].where(~df["success"], None)
    df["payload_mass_kg"] = 1000  # placeholder
    df["source_id"] = df["mission_name"].fillna("Unknown") + "_" + df["launch_date"].fillna("")

    # Fix Time column to ensure compatibility with SQL time type
    if "Time" in df.columns:
        df["Time"] = pd.to_datetime(df["Time"], errors="coerce").dt.time
    else:
        df["Time"] = None

    # Fill optional fields if not in CSV
    for col in ["company", "date"]:
        if col not in df.columns:
            df[col] = None

    # Drop bad rows
    df.dropna(subset=["mission_name", "launch_date", "launch_year", "agency"], inplace=True)

    with get_conn_cursor() as (_, cur):
        insert_query = """
        INSERT INTO launches (
            mission_name, launch_date, launch_year, success,
            failure_reason, agency, payload_mass_kg, source_id,
            company, location, date, time, rocket, mission,
            rocket_status, price, mission_status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (source_id) DO NOTHING;
        """
        for _, row in df.iterrows():
            cur.execute(insert_query, (
                row.get("mission_name"),
                row.get("launch_date"),
                int(row.get("launch_year")),
                row.get("success"),
                row.get("failure_reason"),
                row.get("agency"),
                row.get("payload_mass_kg", 0),
                row.get("source_id"),
                row.get("agency"),
                row.get("location"),
                row.get("launch_date"),
                row.get("Time"),  # Now safely cast as SQL-compatible time object
                row.get("rocket"),
                row.get("mission_name"),
                row.get("rocket_status"),
                row.get("price"),
                row.get("mission_status")
            ))

    print("✅ Data loaded successfully.")

    
@app.route("/")
def dashboard():
    return render_template("index.html")

@app.route("/api/launches")
def api_get_launches():
    with get_conn_cursor() as (_, cur):
        cur.execute("SELECT * FROM launches;")
        columns = [desc[0] for desc in cur.description]
        data = [dict(zip(columns, row)) for row in cur.fetchall()]
    return jsonify(data)

def initialize_app():
    create_launches_table()
    load_csv_to_postgres()

if __name__ == "__main__":
    initialize_app()
    app.run(debug=True)
