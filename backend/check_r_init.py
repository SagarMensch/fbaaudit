
print("DEBUG: Importing RAnalyticsService...")
try:
    from r_analytics_service import RAnalyticsService
    print("DEBUG: Instantiating...")
    service = RAnalyticsService()
    print(f"DEBUG: Service Created. R Available: {service.r_available}")
except Exception as e:
    print(f"DEBUG: Error: {e}")
