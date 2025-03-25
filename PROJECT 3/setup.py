import pandas as pd
import psycopg2
import os
from contextlib import contextmanager

DATABASE_URL = os.getenv("DATABASE_URL")
CSV_FILE = "space_missions.csv"

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

def create_table():
    with get_conn_cursor() as (conn, cur):
        cur.execute("""
            CREATE TABLE IF NOT EXISTS launches (
                id SERIAL PRIMARY KEY,
                mission_name TEXT,
                launch_date DATE,
                launch_year INT,
                success BOOLEAN,
                failure_reason TEXT,
                agency TEXT,
                company TEXT,
                location TEXT,
                date DATE,
                time TIME,
                rocket TEXT,
                mission TEXT,
                rocket_status TEXT,
                price NUMERIC,
                mission_status TEXT,
                source_id TEXT UNIQUE
            );
        """)

def load_data():
    df = pd.read_csv(CSV_FILE, encoding="ISO-8859-1")
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
    df = df.rename(columns={"rocketstatus": "rocket_status", "missionstatus": "mission_status"})
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["time"] = pd.to_datetime(df["time"], errors="coerce").dt.time
    df["launch_date"] = df["date"].dt.date
    df["launch_year"] = df["date"].dt.year
    df["success"] = df["mission_status"].str.contains("Success", case=False, na=False)
    df["failure_reason"] = df["mission_status"].where(~df["success"], None)
    df["mission_name"] = df["mission"]
    df["agency"] = df["company"]
    df = df[df["date"].notna() & df["time"].notna()]

    with get_conn_cursor() as (conn, cur):
        for _, row in df.iterrows():
            try:
                cur.execute("""
                    INSERT INTO launches (
                        mission_name, launch_date, launch_year, success, failure_reason, agency,
                        company, location, date, time, rocket, mission,
                        rocket_status, price, mission_status, source_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (source_id) DO NOTHING;
                """, (
                    row.get("mission_name"), row.get("launch_date"), row.get("launch_year"),
                    row.get("success"), row.get("failure_reason"), row.get("agency"),
                    row.get("company"), row.get("location"), row.get("date"), row.get("time"),
                    row.get("rocket"), row.get("mission"), row.get("rocket_status"),
                    float(str(row.get("price")).replace(",", "")) if pd.notnull(row.get("price")) else None,
                    row.get("mission_status"), f"{row.get('company')}_{row.get('date')}"
                ))
            except Exception as e:
                print("Insert error:", e)

if __name__ == "__main__":
    create_table()
    load_data()
