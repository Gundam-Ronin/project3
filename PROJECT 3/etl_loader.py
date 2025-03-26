import pandas as pd
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

def load_csv_to_postgres():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()

    df = pd.read_csv("launch_data.csv")


    # Optional: Drop incomplete rows
    df = df.dropna(subset=["mission_name", "launch_date"])

    # Clear old rows
    cur.execute("DELETE FROM launches")

    # Insert updated rows
    for _, row in df.iterrows():
        cur.execute("""
            INSERT INTO launches (
                mission_name, launch_date, launch_year,
                agency, rocket, rocket_status,
                location, success, failure_reason
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            row.get("mission_name"),
            row.get("launch_date"),
            int(row.get("launch_year")) if pd.notnull(row.get("launch_year")) else None,
            row.get("agency"),
            row.get("rocket"),
            row.get("rocket_status"),
            row.get("location"),
            row.get("success"),
            row.get("failure_reason")
        ))

    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    load_csv_to_postgres()
