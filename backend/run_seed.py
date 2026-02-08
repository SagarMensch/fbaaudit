"""Run the global data seeder with error handling"""
import sys
import traceback

try:
    from seed_global_data import seed_all
    seed_all()
except Exception as e:
    print("ERROR:", str(e))
    traceback.print_exc()
    sys.exit(1)
