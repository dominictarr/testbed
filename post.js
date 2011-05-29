
var request = require('request')

request.post({uri: 'http://localhost:1234', 
  json: {payload: JSON.stringify({
    repository: {
      name:process.argv[3], //'curry', 
      owner: {
        name: process.argv[2],//'dominictarr'
        } } })
        }
        
         },
  function (err,res,body){  
    console.log(body)
})