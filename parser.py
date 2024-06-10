import json
import os

def clean_line(line):
    return ' - '.join(part.strip() for part in line.split('-'))

def parse_vocabulary(file_path):
    vocabulary = []

    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            # Skip empty lines and separators
            if not line.strip() or '=' in line:
                continue

            # Clean the line to remove extra spaces
            cleaned_line = clean_line(line)
            
            # Split the line into Russian and German parts
            try:
                w_1, w_2 = cleaned_line.split(' - ')
                # Strip extra whitespace
                word_1 = w_1.strip()
                word_2 = w_2.strip()
                
                # Create the dictionary and append to the list
                vocabulary.append({"word_1": word_1, "word_2": word_2})
            except ValueError:
                # Skip lines that do not have exactly one delimiter
                continue
    
    return vocabulary

def save_to_json(data, output_file):
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=4)

# File paths
input_file_path = 'vocabulary.txt'
output_file_path = 'vocabulary.json'

# Parse the file and save to JSON
vocabulary_data = parse_vocabulary(input_file_path)
save_to_json(vocabulary_data, output_file_path)

print(f"Vocabulary has been parsed and saved to {output_file_path}")
