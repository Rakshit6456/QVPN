import time
import psutil
import uuid
from supabase import create_client, Client

SUPABASE_URL = "https://nxmflvwdzwfmzixipdbh.supabase.co"
SUPABASE_KEY = "YOUR_SUPABASE_KEY_HERE"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🚀 Starting Secure VPN Live Telemetry...")

while True:
    try:
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory().percent
        disk = psutil.disk_usage('/').percent

        data = {
            "id": str(uuid.uuid4()),
            "client_identifier": "Admin-PC-01",
            "cpu_usage": cpu,
            "ram_usage": ram,
            "disk_usage": disk
        }

        response = supabase.table("system_metrics").insert(data).execute()
        
        print(f"✅ Data Sent -> CPU: {cpu}% | RAM: {ram}% | Disk: {disk}%")
        
        time.sleep(3)

    except Exception as e:
        print(f"❌ Error : {e}")
        time.sleep(5)