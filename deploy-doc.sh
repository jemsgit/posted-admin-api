#!/usr/bin/expect -f

stty -echo
send_user "Enter the password: " 
expect_user -re "(.*)\n"
stty echo
set pass $expect_out(1,string)

set SSH_OPTS "-i ~/.ssh/id_rsa -o StrictHostKeyChecking=no"
set HOST "root@104.131.43.62"
set DEPLOY_PATH "/home/jem/projects/poster-api/docker"

puts "Syncing project..."
spawn rsync -au --progress build/ -e "ssh $SSH_OPTS" "$HOST:$DEPLOY_PATH"
expect "passphrase"
send "$pass\r"
expect eof

puts "Deploying package.json..."
spawn rsync -au --progress package.json -e "ssh $SSH_OPTS" "$HOST:$DEPLOY_PATH"
expect "passphrase"
send "$pass\r"
expect eof

puts "Deploying yarn.lock..."
spawn rsync -au --progress yarn.lock -e "ssh $SSH_OPTS" "$HOST:$DEPLOY_PATH"
expect "passphrase"
send "$pass\r"
expect eof

puts "Deploying docker-compose.yml..."
spawn rsync -au --progress docker-compose.yml -e "ssh $SSH_OPTS" "$HOST:$DEPLOY_PATH"
expect "passphrase"
send "$pass\r"
expect eof

puts "Deploying Dockerfile..."
spawn rsync -au --progress Dockerfile.api -e "ssh $SSH_OPTS" "$HOST:$DEPLOY_PATH"
expect "passphrase"
send "$pass\r"
expect eof

puts "Deploying dockerignore..."
spawn rsync -au --progress .dockerignore -e "ssh $SSH_OPTS" "$HOST:$DEPLOY_PATH"
expect "passphrase"
send "$pass\r"
expect eof

puts "Restarting container..."
spawn ssh $SSH_OPTS $HOST
expect "passphrase"
send "$pass\r"
expect "# "   ;# waits for root prompt
send "cd $DEPLOY_PATH && docker-compose build --no-cache && docker-compose down && docker-compose up -d && docker image prune -a -f\r"
expect eof
interact