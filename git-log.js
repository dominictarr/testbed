var exec = require('child_process').exec

exec('git log', function (err,data){

data.split('\n')  
console.log(/commit().*\n/g.exec(data))
console.log(data.split(/^commit/mg).filter(function (e){return e}).map(function (e){
  var lines = e.split('\n').filter(function (e){return e})
  return {
      commit :lines.shift()
    , author : ( function (line) {
      var m = (/Author\: (.*) \<(.*)>/).exec(line)
      return {
        name: m[1]
      , email: m[2]
      }
    } ) (lines.shift())
    , date :(function (line){
      return new Date(/Date:\s+(.*)/(line)[1].trim())
    })(lines.shift())
    , message: lines.map(function (e){return e.trim()}).join('\n')
    }  
  }))

})