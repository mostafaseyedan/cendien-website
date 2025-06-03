# rfp_mart_agent.py
import os, json, requests
from google.cloud import firestore, pubsub_v1
from bs4 import BeautifulSoup

def discover(event=None, context=None):
    db = firestore.Client()
    config = db.collection("rfp_sources").document("RFPMart").get().to_dict()
    response = requests.get(config["endpoint"])
    soup = BeautifulSoup(response.text, "html.parser")
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(os.environ["GCP_PROJECT"], "discovered_rfps")
    # Example: parse RFPs from the page (update selectors as needed)
    for rfp in soup.select(".rfp-listing"):
        title = rfp.select_one(".rfp-title").text
        state = rfp.select_one(".rfp-state").text
        value = int(rfp.select_one(".rfp-value").text.replace("$", "").replace(",", ""))
        pdf_url = rfp.select_one("a.pdf-link")["href"]
        deadline = rfp.select_one(".rfp-deadline").text
        if state in config["filters"]["states"] and value > config["filters"]["min_budget"]:
            data = {
                "source": "RFPMart",
                "title": title,
                "pdf_url": pdf_url,
                "deadline": deadline
            }
            publisher.publish(topic_path, data=json.dumps(data).encode("utf-8"))