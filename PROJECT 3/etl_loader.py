import pandas as pd
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

def load_csv_to_postgres():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()

    # Read CSV
    df = pd.read_csv("launch_data.csv")

    # Rename CSV columns to match DB schema
    df.rename(columns={
        "Mission": "mission_name",
        "Date": "launch_date",
        "Company": "agency",
        "Rocket": "rocket",
        "RocketStatus": "rocket_status",
        "Location": "location",
        "MissionStatus": "mission_status"
    }, inplace=True)

    # Drop rows missing key fields
    df = df.dropna(subset=["mission_name", "launch_date"])

    # Clear old rows
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
            row.get("Mission"),
            row.get("Date"),
            pd.to_datetime(row.get("Date")).year if pd.notnull(row.get("Date")) else None,
            row.get("Company"),
            row.get("Rocket"),
            row.get("RocketStatus"),
            row.get("Location"),
            True if row.get("MissionStatus") == "Success" else False,
            None if row.get("MissionStatus") == "Success" else row.get("MissionStatus")
        ))


    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    load_csv_to_postgres()
