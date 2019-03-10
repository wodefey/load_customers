#!/bin/bash
mongorestore --port 7854 -u sysadmin -p pVr5AQn8 --authenticationDatabase 'admin' --db production --archive=production.gzip --gzip