import os, json, requests
from google.cloud import firestore, pubsub_v1

def discover(event=None, context=None):
    db = firestore.Client()
    config = db.collection("rfp_sources").document("MyGovWatch").get().to_dict()
    api_key = os.environ["MYGOVWATCH_API_KEY"]
    params = {
        "api_key": api_key,
        "keyword": ",".join(config["keywords"])
    }
    response = requests.get(config["endpoint"], params=params)
    response.raise_for_status()
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(os.environ["GCP_PROJECT"], "discovered_rfps")
    for opp in response.json().get("rfps", []):
        if (opp.get("state") in config["filters"]["states"] and
            opp.get("value", 0) > config["filters"]["min_budget"]):
            data = {
                "source": "MyGovWatch",
                "title": opp["title"],
                "pdf_url": opp["pdf_url"],
                "deadline": opp["deadline"]
            }
            publisher.publish(topic_path, data=json.dumps(data).encode("utf-8"))
