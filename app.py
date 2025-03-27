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

app = Flask(__name__, template_folder="Anthony_Launches/templates", static_folder="Anthony_Launches/static")
CORS(app)

DATABASE_URL = os.getenv("DATABASE_URL")
db_pool = None

# 🔒 Set this to 'require' if Render DB needs SSL
USE_SSL = True

def init_db_pool():
    global db_pool
    print("🔄 Initializing DB connection pool...")
    try:
        db_pool_args = {"dsn": DATABASE_URL}
        if USE_SSL:
            db_pool_args.update({
                "sslmode": "require"
            })

        db_pool = pool.SimpleConnectionPool(1, 10, **db_pool_args)
        print("✅ DB pool initialized.")
    except Exception as e:
        print(f"❌ DB connection failed: {e}")
        db_pool = None

def get_db_connection():
    global db_pool
    if db_pool is None:
        init_db_pool()
    return db_pool.getconn() if db_pool else None

@contextmanager
def get_conn_cursor():
    conn = get_db_connection()
    if conn is None:
        raise Exception("Database pool is not available")
    try:
        yield conn, conn.cursor()
    finally:
        conn.commit()
        conn.close()

def create_launches_table():
    create_query = """
    CREATE TABLE IF NOT EXISTS launches (
        id SERIAL PRIMARY KEY,
        company TEXT,
        launch_year INT,
        mission_status TEXT
    );
    """
    with get_conn_cursor() as (_, cur):
        cur.execute(create_query)

def load_csv_to_postgres():
    print("📥 Loading CSV into PostgreSQL...")
    csv_path = Path("launch_data.csv")
    if not csv_path.exists():
        print(f"❌ CSV not found at {csv_path}")
        return

    df = pd.read_csv(csv_path)
    df = df[["Company", "Date", "MissionStatus"]].copy()
    df.rename(columns={"Company": "company", "MissionStatus": "mission_status"}, inplace=True)
    df["launch_year"] = pd.to_datetime(df["Date"], errors="coerce").dt.year
    df.dropna(subset=["company", "launch_year", "mission_status"], inplace=True)

    with get_conn_cursor() as (_, cur):
        insert_query = """
        INSERT INTO launches (company, launch_year, mission_status)
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING;
        """
        for _, row in df.iterrows():
            cur.execute(insert_query, (
                row["company"],
                int(row["launch_year"]),
                row["mission_status"]
            ))

    print("✅ Data loaded successfully.")

@app.route("/")
def dashboard():
    return render_template("index.html")

@app.route("/api/launches")
def api_get_launches():
    try:
        with get_conn_cursor() as (_, cur):
            cur.execute("SELECT company, launch_year, mission_status FROM launches;")
            columns = [desc[0] for desc in cur.description]
            data = [dict(zip(columns, row)) for row in cur.fetchall()]
        return jsonify(data)
    except Exception as e:
        print(f"❌ /api/launches failed: {e}")
        return jsonify({"error": "Failed to fetch launches"}), 500

@app.route("/load-data")
def load_data_manually():
    try:
        create_launches_table()
        load_csv_to_postgres()
        return "✅ Launch data loaded successfully!"
    except Exception as e:
        print(f"❌ Failed to load data: {e}")
        return f"❌ Error loading data: {e}", 500

def initialize_app():
    create_launches_table()
    load_csv_to_postgres()

if __name__ == "__main__":
    if os.getenv("FLASK_ENV") == "development":
        initialize_app()
    app.run(debug=True)
