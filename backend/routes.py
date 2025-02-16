from flask import Blueprint, request, jsonify
from analytics import CentraAnalytics

analytics_routes = Blueprint('analytics', __name__)
analytics = CentraAnalytics()

@analytics_routes.route('/analyze/stock', methods=['POST'])
def analyze_stock():
    try:
        data = request.json
        if not data or 'products' not in data:
            return jsonify({"error": "Ingen produktdata tillhandahållen"}), 400
        
        analysis = analytics.analyze_stock_levels(data['products'])
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@analytics_routes.route('/analyze/orders', methods=['POST'])
def analyze_orders():
    try:
        data = request.json
        if not data or 'orders' not in data:
            return jsonify({"error": "Ingen orderdata tillhandahållen"}), 400
        
        analysis = analytics.analyze_order_trends(data['orders'])
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": str(e)}), 500 