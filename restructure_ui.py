import os
import shutil

# Mapping of Files to New Categories
mapping = {
    "transactions": [
        "InvoiceIngestion.tsx",
        "InvoiceDetail.tsx",
        "ContractDetail.tsx",
        "VendorLogin.tsx",
        "SupplierLogin.tsx",
        "SupplierPortalView.tsx",
        "GuestBid.tsx"
    ],
    "worklists": [
        "Dashboard.tsx",
        "FinanceDashboard.tsx",
        "InvoiceWorkbench.tsx",
        "InvoiceReview.tsx",
        "EnhancedInvoiceReview.tsx",
        "ApproverQueue.tsx",
        "TicketInbox.tsx"
    ],
    "master_data": [
        "MasterDataHub.tsx",
        "MasterDataManagement.tsx",
        "PartnerNetwork.tsx",
        "RateCards.tsx",
        "SupplierDirectory.tsx",
        "ContractManager.tsx",
        "VendorOnboarding.tsx",
        "SupplierProfile.tsx",
        "UserProfile.tsx",
        "RBACSettings.tsx",
        "DocumentLibrary.tsx",
        "IntegrationHub.tsx",
        "IntegrationsShowcase.tsx"
    ],
    "analytics": [
        "ComprehensiveReports.tsx",
        "ExecutiveReport.tsx",
        "CarrierPerformance.tsx",
        "CostToServe.tsx",
        "EmissionsDashboard.tsx",
        "ShockRateBenchmark.tsx",
        "CapacityForecast.tsx",
        "AnomalyDetection.tsx",
        "AIIntelligenceHub.tsx",
        "IntelligenceHub.tsx",
        "VendorScorecard.tsx",
        "DocumentAnalysis.tsx"
    ]
}

base_dir = "pages"
if not os.path.exists(base_dir):
    print("Pages directory not found!")
    exit()

for category, files in mapping.items():
    target_dir = os.path.join(base_dir, category)
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
        print(f"Created {target_dir}")
    
    for file in files:
        src = os.path.join(base_dir, file)
        dst = os.path.join(target_dir, file)
        if os.path.exists(src):
            shutil.move(src, dst)
            print(f"Moved {file} to {category}")
        else:
            print(f"File {file} not found in {base_dir}")

print("UI Restructuring Complete.")
