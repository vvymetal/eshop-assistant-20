import os
import json
import fnmatch
from pathlib import Path

def load_gitignore(project_path):
    gitignore_path = os.path.join(project_path, '.gitignore')
    ignore_patterns = []
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    # Převedeme vzor na absolutní cestu, pokud nezačíná *
                    if not line.startswith('*'):
                        line = os.path.join(project_path, line)
                    ignore_patterns.append(line)
    return ignore_patterns

def should_ignore(path, ignore_patterns):
    path = Path(path)
    for pattern in ignore_patterns:
        if pattern.endswith('/'):
            # Pokud vzor končí '/', porovnáváme s adresářem
            if path.is_dir() and (fnmatch.fnmatch(str(path) + '/', pattern) or any(fnmatch.fnmatch(str(parent) + '/', pattern) for parent in path.parents)):
                return True
        else:
            # Jinak porovnáváme s celou cestou
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
    
    if 'node_modules' in file_path.split(os.path.sep):
        return False

    # Kontrola, zda soubor není ignorován pomocí .gitignore
    if should_ignore(file_path, ignore_patterns):
        return False

    return file_extension in include_extensions or file_name in always_include

def is_frontend_file(file_path):
    """
    Určuje, zda je soubor součástí frontendu.
    """
    frontend_paths = ['chat-widget-package', 'src']
    return any(path in file_path for path in frontend_paths)

def extract_project_structure(project_path):
    frontend_structure = {}
    backend_structure = {}
    ignore_patterns = load_gitignore(project_path)
    
    for root, dirs, files in os.walk(project_path):
        if 'venv' in dirs:
            dirs.remove('venv')
        
        for file in files:
            file_path = os.path.join(root, file)
            if should_include_file(file_path, ignore_patterns):
                relative_path = os.path.relpath(file_path, project_path)
                with open(file_path, 'r', encoding='utf-8') as f:
                    try:
                        content = f.read()
                        if is_frontend_file(relative_path):
                            frontend_structure[relative_path] = content
                        else:
                            backend_structure[relative_path] = content
                    except UnicodeDecodeError:
                        print(f"Skipping binary file: {relative_path}")
    
    return frontend_structure, backend_structure

def save_project_structure(structure, output_file):
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(structure, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    project_path = "/Users/vladimirvymetal/python/eshop-assistant"  # Upravte cestu k vašemu projektu
    frontend_output_file = "frontend.json"
    backend_output_file = "backend.json"
    
    frontend_structure, backend_structure = extract_project_structure(project_path)
    
    save_project_structure(frontend_structure, frontend_output_file)
    save_project_structure(backend_structure, backend_output_file)
    
    print(f"Frontend structure saved to {frontend_output_file}")
    print(f"Backend structure saved to {backend_output_file}")