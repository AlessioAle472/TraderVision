import json
import os

log_path = ".system_generated/logs/macro_final_verification_v2_1774116217872.json" # Wait, name might be different
# Let's find the latest log
logs = sorted([f for f in os.listdir("/Users/alessioerbeia/.gemini/antigravity/brain/c69ba514-e5cd-412d-acc4-ee012a90683b/browser") if f.endswith(".json")])
if logs:
    with open(f"/Users/alessioerbeia/.gemini/antigravity/brain/c69ba514-e5cd-412d-acc4-ee012a90683b/browser/{logs[-1]}", "r") as f:
        data = json.load(f)
        for entry in data.get("log_entries", []):
            print(f"[{entry.get('timestamp')}] {entry.get('message')}")
