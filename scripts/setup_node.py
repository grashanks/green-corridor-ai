import os
import urllib.request
import zipfile
import shutil

NODE_URL = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip"
TARGET_DIR = os.path.join(os.path.expanduser("~"), "nodejs_portable")
ZIP_FILE = "node_portable.zip"

def download_and_extract():
    if os.path.exists(os.path.join(TARGET_DIR, "node.exe")):
        print(f"Node.js already present at {TARGET_DIR}")
        return

    print(f"Downloading portable Node.js from {NODE_URL}...")
    urllib.request.urlretrieve(NODE_URL, ZIP_FILE)
    print("Download complete. Extracting...")

    with zipfile.ZipFile(ZIP_FILE, 'r') as zip_ref:
        zip_ref.extractall("temp_node")

    extracted_folder = os.path.join("temp_node", "node-v20.18.0-win-x64")
    if os.path.exists(TARGET_DIR):
        shutil.rmtree(TARGET_DIR)
    shutil.move(extracted_folder, TARGET_DIR)

    # Cleanup
    if os.path.exists("temp_node"):
        shutil.rmtree("temp_node", ignore_errors=True)
    if os.path.exists(ZIP_FILE):
        os.remove(ZIP_FILE)

    print(f"Node.js portable extracted successfully to: {TARGET_DIR}")

if __name__ == "__main__":
    download_and_extract()
