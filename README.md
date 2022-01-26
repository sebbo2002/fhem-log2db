# fhem-log2db

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

This script looks for FHEM log entries in a specified folder, parses them and pushes the data into a remote database. I 
use this script to have the current data in a database without losing the ability to archive logs as files. This way I 
can view current data in tools like Grafana and still restore old files at any time without overflowing my database. 
This script can open zip and tar.gz archives to handle backups and archived logs quickly and easily as well.


## 📦 Installation

	npm i -g @sebbo2002/fhem-log2db

    cd $(fhemlog2db install-path)
    npx prisma generate
    DATABASE=mysql://root@localhost/fhem npx prisma migrate deploy


## ⚡️ Quick Start

    fhem-log2db sync
    fhem-log2db clean
    fhem-log2db cron [-v]


## 🙆🏼‍♂️ Copyright and license

Copyright (c) Sebastian Pekarek under the [MIT license](LICENSE).
