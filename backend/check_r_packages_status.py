"""
Check R Package Installation Status
"""
import sys

try:
    import rpy2.robjects as robjects
    from rpy2.robjects.packages import importr
    
    print("✅ rpy2 is installed and working!\n")
    print("=" * 50)
    print("R PACKAGE INSTALLATION STATUS")
    print("=" * 50)
    
    required_packages = [
        "jsonlite", "data.table", "forecast",
        "bsts", "rugarch", "vars",
        "prophet", "quantregForest",
        "isotree", "tsoutliers", "e1071",
        "lavaan", "psych",
        "mgcv", "quantreg", "lme4"
    ]
    
    installed = []
    missing = []
    
    for pkg in required_packages:
        try:
            importr(pkg, suppress_messages=True)
            installed.append(pkg)
            print(f"✓ {pkg}")
        except Exception:
            missing.append(pkg)
    
    print("\n" + "=" * 50)
    print(f"INSTALLED: {len(installed)}/{len(required_packages)} packages")
    print(f"PROGRESS: {len(installed)/len(required_packages)*100:.1f}%")
    print("=" * 50)
    
    if missing:
        print(f"\n❌ STILL INSTALLING ({len(missing)} packages):")
        for pkg in missing:
            print(f"   ✗ {pkg}")
    
    if len(installed) >= 10:
        print("\n🎉 Most packages ready! System is functional.")
    elif len(installed) >= 5:
        print("\n⏳ Installation in progress...")
    else:
        print("\n⏳ Installation just started...")
        
except ImportError:
    print("❌ rpy2 not installed or R not available")
    print("Run: pip install rpy2")
except Exception as e:
    print(f"❌ Error: {e}")
