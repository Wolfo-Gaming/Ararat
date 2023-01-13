#!/bin/bash
export NVM_DIR=$HOME/.nvm;
source $NVM_DIR/nvm.sh;

node loadCaddy.js
npm run start; cd ./api && node app.js