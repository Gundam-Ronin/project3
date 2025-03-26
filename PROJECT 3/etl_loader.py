import pandas as pd
import psycopg2
from sqlalchemy import create_engine

# Connection string from Render PostgreSQL
DATABASE_URL = "postgresql://launches_db_user:GZpMv0pEPb5HUMWZEZyETL96vKacbkkS@dpg-cvhmk4btq21c73flhg1g-a/launches_db"

# Load the CSV
df = pd.read_csv("launch_data.csv")

# Clean + transform
df = df.rename(columns={
    'Company': 'company',
    'Location': 'location',
    'Date': 'launch_date',
    'Rocket': 'rocket',
    'Mission': 'mission',
    'RocketStatus': 'rocket_status',
    'MissionStatus': 'mission_status'
})

# Convert to datetime
df['launch_date'] = pd.to_datetime(df['launch_date'], errors='coerce')

# Create 'launch_year' column
df['launch_year'] = df['launch_date'].dt.year

# Add placeholders for expected columns in your DB
expected_columns = [
    'mission_name', 'success', 'failure_reason', 'price', 'source_id', 'agency'
]

for col in expected_columns:
    df[col] = None

# Fill mission_name with 'mission' if available
df['mission_name'] = df['mission']

# Map success/failure
df['success'] = df['mission_status'].map(lambda x: True if str(x).lower() == 'success' else (False if str(x).lower() == 'failure' else None))

# Final cleanup
columns_to_keep = [
    'mission_name', 'company', 'launch_date', 'launch_year', 'location',
    'mission', 'mission_status', 'price', 'rocket', 'rocket_status',
    'source_id', 'success', 'failure_reason', 'agency'
]

df = df[columns_to_keep]

# Connect and insert
engine = create_engine(DATABASE_URL)

# Replace this with your actual table name
table_name = 'launches'

with engine.connect() as conn:
    # Optional: clean table before inserting if you want fresh load
    # conn.execute(f"DELETE FROM {table_name}")
    
    df.to_sql(table_name, con=conn, if_exists='append', index=False)
    print(f"✅ Loaded {len(df)} records into '{table_name}'")
