#!/usr/bin/expect -f

stty -echo
send_user "Enter the password: " 
expect_user -re "(.*)\n"
stty echo
set pass $expect_out(1,string)

spawn rsync -au --progress build/ -e "ssh -i ~/.ssh/key -o StrictHostKeyChecking=no" username@ip.address:/path/to/poster-api
expect "passphrase"
send "$pass\r"
expect eof

spawn rsync -au --progress package.json -e "ssh -i ~/.ssh/key -o StrictHostKeyChecking=no" username@ip.address:/path/to/poster-api
expect "passphrase"
send "$pass\r"
expect eof

spawn rsync -au --progress yarn.lock -e "ssh -i ~/.ssh/key -o StrictHostKeyChecking=no" username@ip.address:/path/to/poster-api
expect "passphrase"
send "$pass\r"
expect eof

spawn ssh -i ~/.ssh/key username@ip.address "cd /path/to/poster-api && yarn" 
expect "passphrase"
send "$pass\r"
expect eof

spawn ssh -i ~/.ssh/key username@ip.address "pm2 restart poster-api" 
expect "passphrase"
send "$pass\r"
sleep 5
interact