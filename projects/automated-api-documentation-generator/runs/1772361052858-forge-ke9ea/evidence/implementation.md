 To implement the workflow for extracting a shareable runnable template under templates/NNN-slug/, we need to follow a series of steps that involve copying, de-branding, and removing secrets from the source project. Here's how you can structure this process in Python, ensuring that all necessary files are handled correctly:

```python
import os
import shutil
import json

# Define the workflow functions
def initialize_run_dir(source_repo_root, target_repo_root, run_id):
    run_dir = os.path.join(target_repo_root, 'runs', 'template-extractor', 'active', run_id)
    if not os.path.exists(run_dir):
        os.makedirs(run_dir)
    return run_dir

def decide_slug_and_NNN(target_repo_root):
    template_dir = os.path.join(target_repo_root, 'templates')
    if not os.path.exists(template_dir):
        os.makedirs(template_dir)
    existing_templates = [f for f in os.listdir(template_dir) if f.startswith('NNN-')]
    next_NNN = len(existing_templates) + 1
    slug = 'example'  # Placeholder, should be extracted from source or provided by user
    return f'{next_NNN:03d}-{slug}', next_NNN

def copy_source_repo(source_repo_root, target_repo_root, run_id):
    run_dir = initialize_run_dir(source_repo_root, target_repo_root, run_id)
    shutil.copytree(source_repo_root, os.path.join(target_repo_root, 'templates', run_id))
    return run_dir

def debrand_and_remove_secrets(run_dir):
    for root, dirs, files in os.walk(run_dir):
        for file in files:
            if file.endswith('.env') or file.endswith('.env.*'):
                remove_secrets_from_file(os.path.join(root, file))
            elif file == 'config.json':
                replace_branding_in_file(os.path.join(root, file))

def remove_secrets_from_file(file_path):
    with open(file_path, 'r') as file:
        content = file.read()
    new_content = remove_secrets(content)
    with open(file_path, 'w') as file:
        file.write(new_content)

def replace_branding_in_file(file_path):
    with open(file_path, 'r') as file:
        content = file.read()
    new_content = replace_branding(content)
    with open(file_path, 'w') as file:
        file.write(new_content)

def remove_secrets(content):
    # Placeholder for actual secret removal logic
    return content  # Replace this with the actual implementation

def replace_branding(content):
    # Placeholder for actual branding replacement logic
    return content  # Replace this with the actual implementation

def generate_template_baseline(run_dir, required_integrations):
    # Implement the baseline generation using Ship Faster stages
    pass  # This is a placeholder for the actual implementation

# Main function to execute the workflow
def main():
    source_repo_root = 'path/to/source/repo'
    target_repo_root = 'path/to/target/repo'
    run_id = 'unique-run-id'
    
    # Copy the source repository to a new directory
    run_dir = copy_source_repo(source_repo_root, target_repo_root, run_id)
    
    # Debrand and remove secrets from the copied repository
    debrand_and_remove_secrets(run_dir)
    
    # Generate the template baseline with required integrations
    generate_template_baseline(run_dir, ['DB', 'billing'])
    
    # Prepare the final output structure (placeholder for actual implementation)
    prepare_final_output(run_dir)

if __name__ == "__main__":
    main()
```

This Python script provides a basic framework to implement the template extraction workflow. You will need to fill in the details for secret removal, branding replacement, and integrating with Ship Faster stages for generating a baseline. The placeholder functions (`remove_secrets`, `replace_branding`) should be implemented according to your specific requirements.