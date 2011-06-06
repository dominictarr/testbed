var request = require('request')
  , valid = require('./lib/validate') //this is used to check the stuff, so it should be a seperate repository.

function getAll (callback){

  request({uri: 'http://testbedjs.org:5985/testbed1/_all_docs?include_docs=true'}
  , function (err,res,data){
    callback(err,
      JSON.parse(data).rows
        .map(function (e){
          return e.doc
        })
        .filter(function (e){
          return e._id[0] !== '_'
        }))
  })
}

exports['test every document is valid'] = function (test){

  getAll(function (err,data){
    if(err)
      throw err
  
    var invalid = 
    data.filter(function (e){
      try {
        valid.result(e)
      } catch (err) {
        console.log('invalid_doc:', e._id )
        console.log('at_path:', err.path)
        return true
      }
    }).map(function (e){
      return e._id
    })
  
  if(invalid.length)
    throw new Error (
      'live site has :' + invalid.length +
      ' invalid docs:' + invalid.join('\n'))
  
  test.done()
  })

}