#!/bin/bash
NPM_BIN=`which npm`
echo "Running npm $1"
$NPM_BIN install
$NPM_BIN run $1
