var views = require('./lib/view-tester')
  , request = require('request')
  , http = require('http')
  , render = require('render')
  , client
  , res
  , it = require('it-is')

exports.__setup = views.setup
exports.__teardown = views.teardown


function getSummary (callback){

  request({uri: 'http://testbedjs.org:5985/testbed1/_design/all/_view/summary?reduce=false'}
    , function (err,res,data){

    console.log('retrive summary')

    callback(err,JSON.parse(data))
  })
}

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

exports.__setup = views.setup
exports.__teardown = views.teardown

exports['summary view'] = function (test){

  getSummary(function (err,data){
     if(err)
      throw err
      views.view('user', data,test.done)
      console.log('tested:', data.key)
  })
}

exports ['result view'] = function (test) {

  getAll(function (err,examples){

    function next (err) {
      if(err)
        throw err
      var example = examples.shift()

      if(!example)
        return test.done()

      views.view('result', example, next)
    
      console.log('tested:', example._id)
    }
    next() 

  })
}
