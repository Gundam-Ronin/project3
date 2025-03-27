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

# ✅ Don't initialize the pool yet — wait until the app is ready
db_pool = None

# ✅ Lazy-init the connection pool only when needed
def init_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = pool.SimpleConnectionPool(
            1, 10,
            dsn=DATABASE_URL,
            sslmode='require'
        )

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
    with get_conn_cursor() as (_, cur):
        cur.execute("SELECT company, launch_year, mission_status FROM launches;")
        columns = [desc[0] for desc in cur.description]
        data = [dict(zip(columns, row)) for row in cur.fetchall()]
    return jsonify(data)

# ✅ Manual data-loading endpoint (visit after deploy!)
@app.route("/load-data")
def load_data_manually():
    create_launches_table()
    load_csv_to_postgres()
    return "✅ Launch data loaded successfully!"

# Local dev init
def initialize_app():
    create_launches_table()
    load_csv_to_postgres()

if __name__ == "__main__":
    if os.getenv("FLASK_ENV") == "development":
        initialize_app()
    app.run(debug=True)
