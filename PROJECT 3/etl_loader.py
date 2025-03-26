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
    df = df.dropna(subset=["Mission", "Date"])



    # Clear old rows
    cur.execute("""
    INSERT INTO launches (
        mission_name, launch_date, launch_year,
        agency, rocket, rocket_status,
        location, success, failure_reason
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
""", (
    row.get("Mission"),
    row.get("Date"),
    pd.to_datetime(row.get("Date")).year if pd.notnull(row.get("Date")) else None,
    row.get("Company"),
    row.get("Rocket"),
    row.get("RocketStatus"),
    row.get("Location"),
    1 if row.get("MissionStatus") == "Success" else 0,
    None if row.get("MissionStatus") == "Success" else row.get("MissionStatus")
))


    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    load_csv_to_postgres()
