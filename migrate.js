var request = require('request')
var cradle = require('cradle')

/*
uh, so this will probably become a better migration tool soon enough, but not at 2 am.

*/

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

if (process.argv.length > 2) {
  var db = new cradle.Connection({
    host: 'testbedjs.org', 
    port: 5985,
    auth: { username: 'testbed', password: '********'}
    }).database('testbed1')

  db.create(function (err){  
    console.log('created database')
    db.save(migrated,function (err){
      if(err) throw err
    })
  })

} else {
  console.log(JSON.stringify(migrated))

}

})