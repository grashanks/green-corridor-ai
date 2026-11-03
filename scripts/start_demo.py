import sys
import os
import requests
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def trigger_demo():
    url = "http://127.0.0.1:8000/api/simulation/demo/start"
    print(f"Triggering Hackathon Demo via {url}...")
    try:
        resp = requests.post(url, timeout=5.0)
        if resp.status_code == 200:
            print("Demo started successfully!")
            print(resp.json())
        else:
            print(f"Failed with status {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"Could not reach backend at {url}. Ensure backend is running.")
        print(e)

if __name__ == "__main__":
    trigger_demo()
