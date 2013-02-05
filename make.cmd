@ECHO off

IF "%1"=="test" GOTO TEST
GOTO BUILD

:BUILD
node_modules\.bin\uglifyjs beefcake.js -o beefcake.min.js
GOTO:eof

:TEST
node_modules\.bin\jasmine-node test/
GOTO:eof