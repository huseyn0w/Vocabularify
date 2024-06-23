import locale

def process_words(input_file_path, output_file_path):
    # Set locale to German
    locale.setlocale(locale.LC_COLLATE, 'de_DE.UTF-8')
    
    # Read words from the file
    with open(input_file_path, 'r', encoding='utf-8') as file:
        words = file.read().splitlines()
    
    # Remove duplicates and sort the list
    unique_sorted_words = sorted(set(words), key=locale.strxfrm)
    
    # Write the unique and sorted words back to a new file
    with open(output_file_path, 'w', encoding='utf-8') as output_file:
        for word in unique_sorted_words:
            output_file.write(f"{word}\n")
    
    print(f"Processed words have been saved to {output_file_path}")

# Example usage:
process_words('vocabulary.txt', 'processed_words.txt')
