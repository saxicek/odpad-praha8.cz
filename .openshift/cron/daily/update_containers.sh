#!/bin/bash
curl -v http://$OPENSHIFT_NODEJS_IP:$OPENSHIFT_NODEJS_PORT/container/update >> "OPENSHIFT_NODEJS_LOG_DIR"container_update_`date +%Y-%m`.log 2>&1
