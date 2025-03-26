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

# 🌐 Load DATABASE_URL with sslmode
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://launches_db_user:GZpMv0pEPb5HUMWZEZyETL96vKacbkkS@dpg-cvhmk4btq21c73flhg1g-a/launches_db?sslmode=require")

# 🧠 Global connection pool
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
        source_id TEXT UNIQUE
    );
    """
    with get_conn_cursor() as (_, cur):
        cur.execute(create_query)

def load_csv_to_postgres():
    print("📥 Loading CSV into PostgreSQL...")
    csv_path = Path("static/launch_data.csv")
    if not csv_path.exists():
        print(f"❌ CSV not found at {csv_path}")
        return

    df = pd.read_csv(csv_path)

    with get_conn_cursor() as (_, cur):
        insert_query = """
        INSERT INTO launches (
            mission_name, launch_date, launch_year, success,
            failure_reason, agency, source_id
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (source_id) DO NOTHING;
        """
        for _, row in df.iterrows():
            cur.execute(insert_query, (
                row['mission_name'],
                row['launch_date'],
                row['launch_year'],
                row['success'],
                row.get('failure_reason'),
                row['agency'],
                row['source_id']
            ))
    print("✅ Data loaded successfully.")

# 🚀 API ROUTES
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

# 🔁 INIT + RUN
def initialize_app():
    create_launches_table()
    if os.environ.get("FLASK_ENV") != "production":
        load_csv_to_postgres()

if __name__ == "__main__":
    initialize_app()
    app.run(debug=True)
