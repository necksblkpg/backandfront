from flask import Flask, request, Response
import os
import requests
from flask_cors import CORS
from dotenv import load_dotenv
import logging

# Sätt upp loggning
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()  # Ladda miljövariabler från .env

app = Flask(__name__)
CORS(app)  # Möjliggör anrop från din frontend

CENTRA_API_TOKEN = os.environ.get("CENTRA_API_TOKEN")
CENTRA_API_URL = "https://scottsberry.centra.com/graphql"

@app.route("/")
def index():
    return "Flask-proxy igång. Använd /api/graphql för GraphQL-anrop."

@app.route("/api/graphql", methods=['POST'])
def proxy_graphql():
    try:
        if not CENTRA_API_TOKEN:
            logger.error("CENTRA_API_TOKEN saknas")
            return {"error": "API token saknas"}, 401

        # Logga inkommande request
        data = request.json
        logger.debug(f"Inkommande GraphQL-query: {data}")

        # Sätt upp headers för Centra API
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {CENTRA_API_TOKEN}"
        }
        
        # Gör anropet till Centra
        response = requests.post(
            CENTRA_API_URL,
            json=data,
            headers=headers,
            timeout=30
        )

        # Logga svaret
        logger.debug(f"Centra API svarade med status: {response.status_code}")
        logger.debug(f"Centra API svar: {response.text[:200]}...")  # Logga första 200 tecken

        # Om vi får ett fel från Centra
        if not response.ok:
            logger.error(f"Centra API fel: {response.text}")
            return Response(
                response.text,
                status=response.status_code,
                content_type='application/json'
            )

        return Response(
            response.text,
            status=200,
            content_type='application/json'
        )
    except Exception as e:
        logger.exception("Ett fel uppstod vid hantering av GraphQL-anropet")
        return {"error": str(e)}, 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
