var app = require('../app-setup')(require('../setup').deploy())
  , port = Math.round(10000 + Math.random() * 40000)
  , request = require('request')
  , http = require('http')
  , render = require('render')
  , client
  , res

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
    callback(err,JSON.parse(data))
  })
}


//an UGLY way to get the reponse object

exports.__setup = function (test){
  console.log('setup test')

  app.get('/',function (req,_res){
    res = _res
    console.log('setup complete')

    test.done()
  })

  app.listen(port, function (){
    client = http.get({port: port})
  })

}

function partial(view,object, callback){
  res.partial(view,object,function (err,data){
    if(err)
      throw err
    callback()
  })
}

function view(view, object, callback){
  var clean = render.ct(object)
  console.log('check view')
  res.render(view,{self: object},function (err,data){
    if(err){
      console.log('***********************')
      console.log('ERROR RENDERING VIEW FOR OBJECT:')
      console.log(clean)
      console.log(err.stack)
      console.log('***********************')
      throw err
    }
    callback()
  })
}

exports['summary view'] = function (test){

  getSummary(function (err,data){
     if(err)
      throw err
      console.log(data)
      view('user', data,test.done)

  })
}

exports ['result view'] = function (test) {

  getAll(function (err,examples){

    function next () {
      var example = examples.shift()

      if(!example)
        return test.done()

      view('result', example, next)
    }
    next() 

  })
}


exports.__teardown = function (test){
  console.log('TEARDOWN')
  client.abort()
  app.close()
}