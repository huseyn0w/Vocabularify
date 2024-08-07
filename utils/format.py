import json
import sys

def process_json(file_path):
    # Read the JSON file
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    # Prepare formatted data
    formatted_data = '[\n'
    for entry in data:
        formatted_data += f'    {json.dumps(entry, ensure_ascii=False)},\n'
    formatted_data = formatted_data.rstrip(',\n') + '\n]'
    
    # Write the formatted data back to the same JSON file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(formatted_data)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <json_file>")
    else:
        file_path = sys.argv[1]
        process_json(file_path)
