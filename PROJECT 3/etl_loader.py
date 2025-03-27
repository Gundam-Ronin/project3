import pandas as pd
import psycopg2
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv()

def load_csv_to_postgres():
    print("📥 Loading CSV into PostgreSQL...")
    csv_path = Path("launch_data.csv")
    if not csv_path.exists():
        print(f"❌ CSV not found at {csv_path}")
        return

    df = pd.read_csv(csv_path)

    # 🛠️ Rename columns
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

    # Add any missing fields
    for col in ["company", "date", "time"]:
        if col not in df.columns:
            df[col] = None

    # Drop incomplete rows
    df.dropna(subset=["mission_name", "launch_date", "launch_year", "agency"], inplace=True)

    # 🔌 Connect to DB directly
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()

    insert_query = """
        INSERT INTO launches (
            mission_name, launch_date, launch_year, success,
            failure_reason, agency, payload_mass_kg, source_id,
            company, location, date, time, rocket, mission, rocket_status, price, mission_status
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
            row.get("agency"),  # same as company
            row.get("location"),
            row.get("launch_date"),
            row.get("Time"),  # only if present/correct case
            row.get("rocket"),
            row.get("mission_name"),
            row.get("rocket_status"),
            row.get("price"),
            row.get("mission_status")
        ))

    conn.commit()
    cur.close()
    conn.close()
    print("✅ Data loaded successfully.")

if __name__ == "__main__":
    load_csv_to_postgres()
