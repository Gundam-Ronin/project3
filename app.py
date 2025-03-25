from flask import Flask, jsonify, render_template
from flask_cors import CORS
import os
import psycopg2
from contextlib import contextmanager

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

DATABASE_URL = os.getenv("DATABASE_URL")

@contextmanager
def get_conn_cursor():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    try:
        yield conn, cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/launches")
def get_launches():
    with get_conn_cursor() as (conn, cur):
        cur.execute("SELECT * FROM launches;")
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        return jsonify([dict(zip(columns, row)) for row in rows])

@app.route("/api/stats")
def get_stats():
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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
