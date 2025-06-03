# setup_rfp_sources.py
from google.cloud import firestore

def main():
    db = firestore.Client()
    sources = [
        {
            "id": "SAM.gov",
            "data": {
                "name": "SAM.gov",
                "type": "API",
                "priority": 1,
                "endpoint": "https://api.sam.gov/opportunities/v2/search",
                "keywords": ["IT Services", "ERP"],
                "filters": {"min_budget": 50000, "states": ["CA", "TX"]}
            }
        },
        {
            "id": "RFPMart",
            "data": {
                "name": "RFPMart",
                "type": "Scraper",
                "priority": 2,
                "endpoint": "https://www.rfpmart.com/usa-rfps",
                "keywords": ["IT Services", "ERP"],
                "filters": {"min_budget": 50000, "states": ["CA", "TX"]}
            }
        },
        {
            "id": "MyGovWatch",
            "data": {
                "name": "MyGovWatch",
                "type": "API",
                "priority": 3,
                "endpoint": "https://api.mygovwatch.com/rfps",
                "keywords": ["IT Services", "ERP"],
                "filters": {"min_budget": 50000, "states": ["CA", "TX"]}
            }
        }
    ]
    for src in sources:
        db.collection("rfp_sources").document(src["id"]).set(src["data"])
    print("rfp_sources collection initialized.")

if __name__ == "__main__":
    main()