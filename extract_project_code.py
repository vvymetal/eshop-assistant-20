import os
import json
import fnmatch
from pathlib import Path

def load_gitignore(project_path):
    gitignore_path = os.path.join(project_path, '.gitignore')
    ignore_patterns = []
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r') as f:
            ignore_patterns = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    return ignore_patterns

def should_ignore(path, ignore_patterns):
    path = Path(path)
    for pattern in ignore_patterns:
        if fnmatch.fnmatch(str(path), pattern) or any(fnmatch.fnmatch(str(parent), pattern) for parent in path.parents):
            return True
    return False

def should_include_file(file_path, ignore_patterns):
    # Seznam přípon souborů, které chceme zahrnout
    include_extensions = ['.py', '.js', '.jsx', '.html', '.css']
    # Seznam souborů, které chceme vždy zahrnout
    always_include = ['README.md', '.env.example']
    
    _, file_extension = os.path.splitext(file_path)
    file_name = os.path.basename(file_path)
    
    # Kontrola, zda soubor není ignorován pomocí .gitignore
    if should_ignore(file_path, ignore_patterns):
        return False

    return file_extension in include_extensions or file_name in always_include

def extract_project_structure(project_path):
    project_structure = {}
    ignore_patterns = load_gitignore(project_path)
    
    for root, dirs, files in os.walk(project_path):
        # Explicitně vynecháváme adresář venv
        if 'venv' in dirs:
            dirs.remove('venv')
        
        for file in files:
            file_path = os.path.join(root, file)
            if should_include_file(file_path, ignore_patterns):
                relative_path = os.path.relpath(file_path, project_path)
                with open(file_path, 'r', encoding='utf-8') as f:
                    try:
                        content = f.read()
                        project_structure[relative_path] = content
                    except UnicodeDecodeError:
                        print(f"Skipping binary file: {relative_path}")
    
    return project_structure

def save_project_structure(project_structure, output_file):
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(project_structure, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    project_path = "/Users/vladimirvymetal/python/eshop-assistant"  # Upravte cestu k vašemu projektu
    output_file = "project_structure.json"
    
    project_structure = extract_project_structure(project_path)
    save_project_structure(project_structure, output_file)
    
    print(f"Project structure and contents saved to {output_file}")