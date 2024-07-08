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

def remove_duplicates(file_name):
    with open(file_name, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # Remove duplicates while maintaining order
    seen = set()
    unique_data = []
    for entry in data:
        entry_tuple = tuple(entry.items())
        if entry_tuple not in seen:
            seen.add(entry_tuple)
            unique_data.append(entry)
    
    with open(file_name, 'w', encoding='utf-8') as f:
        json.dump(unique_data, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <file_name>")
        sys.exit(1)

    file_name = sys.argv[1]
    remove_duplicates(file_name)
    process_json(file_name)
