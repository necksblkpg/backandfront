from flask import Flask, request, Response
import os
import requests
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()  # Ladda miljövariabler från .env

app = Flask(__name__)
CORS(app)  # Möjliggör anrop från din frontend

CENTRA_API_TOKEN = os.environ.get("CENTRA_API_TOKEN")
CENTRA_API_URL = "https://scottsberry.centra.com/graphql"

@app.route("/")
def index():
    return "Flask-proxy igång. Använd /api/graphql för GraphQL-anrop."

@app.route("/api/graphql", methods=["GET", "POST"])
def graphql_proxy():
    if not CENTRA_API_TOKEN:
        return Response("CENTRA_API_TOKEN saknas!", status=500)

    headers = {"Authorization": f"Bearer {CENTRA_API_TOKEN}"}
    try:
        if request.method == "GET":
            resp = requests.get(CENTRA_API_URL, headers=headers, params=request.args)
        else:
            if request.is_json:
                resp = requests.post(CENTRA_API_URL, headers=headers, json=request.get_json())
            else:
                resp = requests.post(CENTRA_API_URL, headers=headers, data=request.data)
    except Exception as e:
        return Response(f"Fel vid anrop mot Centra: {str(e)}", status=500)

    return Response(
        resp.content,
        status=resp.status_code,
        content_type=resp.headers.get('Content-Type')
    )

if __name__ == "__main__":
    app.run(port=5000, debug=True)
