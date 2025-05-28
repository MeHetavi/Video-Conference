#!/bin/bash

# Variables
PROJECT_ID=$(gcloud config get-value project)
INSTANCE_NAME="mediasoup-sfu-server"
ZONE="asia-south1-b"
MACHINE_TYPE="e2-medium"

# Create the VM if it doesn't exist
if ! gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE &>/dev/null; then
  echo "Creating VM instance $INSTANCE_NAME..."
  gcloud compute instances create $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --tags=http-server,https-server,mediasoup-sfu \
    --image-family=debian-10 \
    --image-project=debian-cloud \
    --boot-disk-size=10GB
else
  echo "VM instance $INSTANCE_NAME already exists."
fi

# Create firewall rules if they don't exist
if ! gcloud compute firewall-rules describe allow-mediasoup-udp &>/dev/null; then
  echo "Creating firewall rule for UDP ports 10000-10100..."
  gcloud compute firewall-rules create allow-mediasoup-udp \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=udp:10000-10100 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=mediasoup-sfu
else
  echo "Firewall rule allow-mediasoup-udp already exists."
fi

if ! gcloud compute firewall-rules describe allow-mediasoup-tcp &>/dev/null; then
  echo "Creating firewall rule for TCP port 3016..."
  gcloud compute firewall-rules create allow-mediasoup-tcp \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:3016 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=mediasoup-sfu
else
  echo "Firewall rule allow-mediasoup-tcp already exists."
fi

# Get the external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
echo "External IP: $EXTERNAL_IP"

# Create a startup script
cat > startup-script.sh << EOF
#!/bin/bash
export EXTERNAL_IP=$EXTERNAL_IP
cd /opt/mediasoup-app
npm install
EXTERNAL_IP=$EXTERNAL_IP node src/app.js > app.log 2>&1
EOF

# Copy files to the VM
echo "Copying files to VM..."
gcloud compute scp --recurse --zone=$ZONE ./* $INSTANCE_NAME:/tmp/mediasoup-app/

# SSH into the VM to set up the application
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command "
  sudo apt-get update && 
  sudo apt-get install -y curl git nodejs npm && 
  sudo mkdir -p /opt/mediasoup-app && 
  sudo cp -r /tmp/mediasoup-app/* /opt/mediasoup-app/ && 
  sudo chmod +x /opt/mediasoup-app/startup-script.sh && 
  cd /opt/mediasoup-app && 
  sudo npm install && 
  echo 'EXTERNAL_IP=$EXTERNAL_IP' | sudo tee -a /etc/environment && 
  sudo nohup ./startup-script.sh > /opt/mediasoup-app/deploy.log 2>&1 &
"

echo "Deployment completed. Your application should be running at https://$EXTERNAL_IP:3016"
echo "Check logs with: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command 'sudo cat /opt/mediasoup-app/app.log'"