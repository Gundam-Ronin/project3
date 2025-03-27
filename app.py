from flask import Flask, jsonify, render_template
from flask_cors import CORS
import psycopg2
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Local PostgreSQL connection config
DB_NAME = "space_db"
DB_USER = "postgres"
DB_PASSWORD = "your_password_here"
DB_HOST = "localhost"
DB_PORT = "5432"


def get_connection():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/launches")
def api_launches():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM launches")
        cols = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        data = [dict(zip(cols, row)) for row in rows]

        cursor.close()
        conn.close()

        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/filters")
def api_filters():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT DISTINCT agency FROM launches ORDER BY agency")
        agencies = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT launch_year FROM launches ORDER BY launch_year")
        years = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT success FROM launches")
        outcomes = [row[0] for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        return jsonify({
            "agencies": agencies,
            "years": years,
            "outcomes": outcomes
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
