"""
DEPRECATED: All data now comes from PostgreSQL database
NO HARDCODED DATA - Use database queries instead
"""

# Legacy exports for backward compatibility - will be removed
# All existing imports should use database queries via services/db_service.py

MOCK_INVOICES = []  # DEPRECATED: Use /api/invoices endpoint
MOCK_RATES = []     # DEPRECATED: Use /api/rate-cards endpoint
SPEND_DATA = []     # DEPRECATED: Use /api/analytics/spend endpoint
KPIS = []           # DEPRECATED: Use /api/analytics/kpis endpoint
