import json
import requests

def fetch_api_data():
    response = requests.get('http://example.com/api-spec')
    return response.json()

def main():
    api_data = fetch_api_data()
    with open('api_data.json', 'w') as f:
        json.dump(api_data, f)

if __name__ == "__main__":
    main()
