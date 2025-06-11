
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install poppler-utils, which is a system dependency for pdf2image
# This is a critical step for the OCR functionality to work on Cloud Run
RUN apt-get update && apt-get install -y poppler-utils

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code into the container
COPY . .

# Set the command to run your application
# Cloud Run automatically sets the PORT environment variable. Uvicorn will use it.
# We expose port 8080 and run on host 0.0.0.0 as per Cloud Run requirements.
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
