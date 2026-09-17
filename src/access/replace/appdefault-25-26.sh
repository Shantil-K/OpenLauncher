#!/bin/sh
luna-send -n 1 -f 'luna://com.webos.service.applicationmanager/setDefaultApp' '{"category": "home","appId":"com.homebrew.openlauncher"}'
