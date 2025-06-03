import os, json, requests
from google.cloud import firestore, pubsub_v1

def discover(event=None, context=None):
    db = firestore.Client()
    sam_config = db.collection("rfp_sources").document("SAM.gov").get().to_dict()
    api_key = os.environ["SAM_API_KEY"]  # Set via Secret Manager or env var
    params = {
        "api_key": api_key,
        "keyword": ",".join(sam_config["keywords"])
    }
    response = requests.get(sam_config["endpoint"], params=params)
    response.raise_for_status()
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(os.environ["GCP_PROJECT"], "discovered_rfps")
    for opp in response.json().get("opportunitiesData", []):
        if (opp.get("state") in sam_config["filters"]["states"] and
            opp.get("value", 0) > sam_config["filters"]["min_budget"]):
            data = {
                "source": "SAM.gov",
                "title": opp["title"],
                "pdf_url": opp["attachments"][0]["url"] if opp.get("attachments") else None,
                "deadline": opp["responseDeadLine"]
            }
            publisher.publish(topic_path, data=json.dumps(data).encode("utf-8"))
