import json
from http.server import BaseHTTPRequestHandler
import numpy as np

# Lightweight standalone Vercel Python Serverless handler
class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data.decode('utf-8'))
            gases = body.get('gases', {
                'H2': 15.0, 'CH4': 12.0, 'C2H6': 8.0, 
                'C2H4': 10.0, 'C2H2': 0.1, 'CO': 150.0, 'CO2': 850.0
            })
            
            # 1. IEEE C57.104
            limits = {'H2': 100, 'CH4': 120, 'C2H6': 65, 'C2H4': 50, 'C2H2': 1, 'CO': 350, 'CO2': 2500}
            breaches = [g for g, limit in limits.items() if gases.get(g, 0) > limit]
            ieee_condition = "Condition 3 (Critical)" if 'C2H2' in breaches or len(breaches) >= 2 else ("Condition 2 (Caution)" if breaches else "Condition 1 (Normal)")
            
            # 2. TDCG
            tdcg = sum(gases.get(g, 0) for g in ['H2', 'CH4', 'C2H6', 'C2H4', 'C2H2', 'CO'])
            
            # 3. Duval Triangle 1
            total = gases.get('CH4', 0) + gases.get('C2H4', 0) + gases.get('C2H2', 0)
            if total > 0:
                pct_ch4 = (gases.get('CH4', 0) / total) * 100
                pct_c2h4 = (gases.get('C2H4', 0) / total) * 100
                pct_c2h2 = (gases.get('C2H2', 0) / total) * 100
            else:
                pct_ch4, pct_c2h4, pct_c2h2 = 33.3, 33.3, 33.3
                
            if pct_ch4 >= 98:
                duval_zone = "PD: Partial Discharge"
            elif pct_c2h2 >= 29 or (pct_c2h2 >= 13 and pct_c2h4 >= 23):
                duval_zone = "D2: High-Energy Discharge"
            elif (pct_c2h2 >= 13 and pct_c2h4 < 23) or (pct_c2h2 >= 4 and pct_c2h4 < 20):
                duval_zone = "D1: Low-Energy Discharge"
            elif pct_c2h4 >= 50:
                duval_zone = "T3: Thermal Fault (>700C)"
            elif 20 <= pct_c2h4 < 50 and pct_c2h2 < 4:
                duval_zone = "T2: Thermal Fault (300-700C)"
            elif pct_c2h4 < 20 and pct_c2h2 < 4:
                duval_zone = "T1: Thermal Fault (<300C)"
            else:
                duval_zone = "DT: Mix"
                
            response = {
                "status": "success",
                "ieee_condition": ieee_condition,
                "breaches": breaches,
                "tdcg_ppm": round(tdcg, 1),
                "duval_coordinates": {
                    "pct_ch4": round(pct_ch4, 2),
                    "pct_c2h4": round(pct_c2h4, 2),
                    "pct_c2h2": round(pct_c2h2, 2),
                    "zone": duval_zone
                },
                "cellulose_ratio": round(gases.get('CO2', 850) / max(0.1, gases.get('CO', 150)), 2)
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
