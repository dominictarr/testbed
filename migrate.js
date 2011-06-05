var request = require('request')
var cradle = require('cradle')

//cradle.new

request({uri: 'http://testbedjs.org:5985/testbed/_all_docs?include_docs=true'}
, function (err,res,data){

  var data = JSON.parse(data)
  var migrated = 
  data.rows.filter(function(e){
    return e.id[0] != '_'
  }).map(function (e){
    var value = e.doc
    var tests = value.state ? value.state.tests : []
    if (value.state) {
      value.commit = value.state.commit
      value.package = value.state.package
      value.post = value.state.post
      delete value.state.tests
      delete value.state.package
      delete value.state.post
    }
    value.type = 'repo'
    value.report = {
      status: 
        ( tests && tests.length 
        ? tests.reduce (function (x, y) {
            return x.status < y.status ? x : y 
          }).status
        : 'install-error' ),
      failures: [],
      tests: tests
    }
    value.installation = []

    return value
  })

  console.log(JSON.stringify(migrated))
})