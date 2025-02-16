from typing import Dict, List, Any
from datetime import datetime, timedelta
import pandas as pd
from collections import defaultdict

class CentraAnalytics:
    def __init__(self):
        self.cache = {}
        self.cache_duration = timedelta(minutes=5)

    def analyze_stock_levels(self, products_data: List[Dict]) -> Dict[str, Any]:
        """Analyserar lagernivåer och ger insikter"""
        stock_insights = {
            "low_stock_items": [],
            "out_of_stock_items": [],
            "stock_distribution": defaultdict(int),
            "total_items": 0,
            "total_value": 0.0
        }

        for product in products_data:
            for variant in product.get("variants", []):
                stock = variant.get("stock", 0)
                price = float(variant.get("price", 0))
                
                stock_insights["total_items"] += stock
                stock_insights["total_value"] += stock * price

                if stock == 0:
                    stock_insights["out_of_stock_items"].append({
                        "product_name": product["name"],
                        "variant_name": variant["name"],
                        "sku": variant["sku"]
                    })
                elif stock < 5:
                    stock_insights["low_stock_items"].append({
                        "product_name": product["name"],
                        "variant_name": variant["name"],
                        "sku": variant["sku"],
                        "stock": stock
                    })

                # Kategorisera lagernivåer
                if stock == 0:
                    stock_insights["stock_distribution"]["out_of_stock"] += 1
                elif stock < 5:
                    stock_insights["stock_distribution"]["low_stock"] += 1
                elif stock < 20:
                    stock_insights["stock_distribution"]["medium_stock"] += 1
                else:
                    stock_insights["stock_distribution"]["high_stock"] += 1

        return stock_insights

    def analyze_order_trends(self, orders_data: List[Dict]) -> Dict[str, Any]:
        """Analyserar ordertrender över tid"""
        df = pd.DataFrame(orders_data)
        df['created'] = pd.to_datetime(df['created'])
        df['date'] = df['created'].dt.date

        # Daglig försäljningsanalys
        daily_sales = df.groupby('date').agg({
            'id': 'count',  # Antal ordrar
            'items': lambda x: sum(len(i) for i in x)  # Antal produkter
        }).reset_index()

        # Beräkna trender
        trends = {
            "daily_order_count": daily_sales['id'].to_dict(),
            "average_orders_per_day": daily_sales['id'].mean(),
            "total_orders": len(orders_data),
            "popular_products": self._get_popular_products(orders_data),
            "customer_metrics": self._analyze_customer_behavior(orders_data)
        }

        return trends

    def _get_popular_products(self, orders_data: List[Dict]) -> List[Dict]:
        """Identifierar populära produkter baserat på orderdata"""
        product_counts = defaultdict(int)
        product_revenue = defaultdict(float)

        for order in orders_data:
            for item in order.get("items", []):
                product_name = item.get("productName")
                quantity = item.get("quantity", 0)
                price = float(item.get("price", 0))

                product_counts[product_name] += quantity
                product_revenue[product_name] += quantity * price

        # Skapa sorterad lista av populära produkter
        popular_products = [
            {
                "name": product,
                "total_quantity": count,
                "total_revenue": product_revenue[product]
            }
            for product, count in product_counts.items()
        ]

        return sorted(popular_products, key=lambda x: x["total_quantity"], reverse=True)[:10]

    def _analyze_customer_behavior(self, orders_data: List[Dict]) -> Dict[str, Any]:
        """Analyserar kundbeteende från orderdata"""
        customer_orders = defaultdict(list)
        
        for order in orders_data:
            customer = order.get("customer", {})
            customer_id = customer.get("id")
            if customer_id:
                customer_orders[customer_id].append(order)

        metrics = {
            "total_customers": len(customer_orders),
            "average_order_value": self._calculate_average_order_value(orders_data),
            "repeat_customer_rate": self._calculate_repeat_customer_rate(customer_orders),
            "customer_segments": self._segment_customers(customer_orders)
        }

        return metrics

    def _calculate_average_order_value(self, orders_data: List[Dict]) -> float:
        """Beräknar genomsnittligt ordervärde"""
        if not orders_data:
            return 0.0

        total_value = sum(
            sum(float(item.get("price", 0)) * item.get("quantity", 0)
                for item in order.get("items", []))
            for order in orders_data
        )

        return total_value / len(orders_data)

    def _calculate_repeat_customer_rate(self, customer_orders: Dict[str, List]) -> float:
        """Beräknar andelen återkommande kunder"""
        if not customer_orders:
            return 0.0

        repeat_customers = sum(1 for orders in customer_orders.values() if len(orders) > 1)
        return repeat_customers / len(customer_orders)

    def _segment_customers(self, customer_orders: Dict[str, List]) -> Dict[str, int]:
        """Segmenterar kunder baserat på orderfrekvens"""
        segments = {
            "one_time": 0,
            "occasional": 0,
            "regular": 0,
            "frequent": 0
        }

        for orders in customer_orders.values():
            order_count = len(orders)
            if order_count == 1:
                segments["one_time"] += 1
            elif order_count <= 3:
                segments["occasional"] += 1
            elif order_count <= 6:
                segments["regular"] += 1
            else:
                segments["frequent"] += 1

        return segments 