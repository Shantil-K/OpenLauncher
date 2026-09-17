#!/bin/sh
sed 's|applicationManager.launchDefaultApp(JSON.stringify({"category": "home"|applicationManager.launch("com.homebrew.openlauncher","{}");//applicationManager.launchDefaultApp(JSON.stringify({"category": "home"|g' /usr/lib/qml/KeyFilters/systemUi.js > /tmp/hackfilters.js 
mount --rbind /tmp/hackfilters.js /usr/lib/qml/KeyFilters/systemUi.js
restart sam
