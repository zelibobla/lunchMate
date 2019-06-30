find . | egrep "\.(js)$" | zip -@ botServer && aws lambda update-function-code --function-name botServer --zip-file fileb://botServer.zip
