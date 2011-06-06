var app = require('../app-setup')(require('../setup').deploy())
  , port = Math.round(10000 + Math.random() * 40000)
  , http = require('http')
  , render = require('render')
  , client
  , res

//an UGLY way to get the reponse object

exports.__setup = function (test){

  app.get('/',function (req,_res){
    res = _res

    test.done()
  })

  app.listen(port, function (){
    client = http.get({port: port})
  })

}


/*

partials are kind dumb.

I don't like it how they are magically given the name of the partial,

'this' would be more idiomatic.

and it's also very bad how partial behaves different whether it's 
rendering an array or a object. if you want it to render your array, 
you should explicitly call partials or allPartials. 

implicit is not as good as explicit.

*/

function partial(view,object, callback){
  res.partial(view,object,function (err,data){
    if(err)
      throw err
    callback()
  })
}

function view(view,object, callback){
  var clean = render.ct(object)//have to stringify first to avoid express monkeys.

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


exports ['error view'] = function (test){
  var examples = [
    1,
    false,
    new Error(),
    (function (){//stack overflow
        function overflow(){overflow()}
      try {
        overflow()
      } catch(err) {
        return err
      }
    })(),
    {error:'couch error', message: 'have no stack trace'}
  ]
  partial('error',examples,test.done)
}

exports ['summary view'] = function (test){

  var example = 
  { rows: 
    [ { key: ['username', 'project','32r98349f834598t93423ur']
      , value:{
          commit:"95f136ddccd643099585176028fba91339359efe"
        , status:"error"
        , time:"2011-06-06T09:59:33.899Z"
        , total:21
        , passes:19
        } 
      }
    ] 
  }
  view('user',example,test.done)

}

exports ['result view'] = function (test) {
  var fs = require ('fs')
  var examples = 
    JSON.parse(fs.readFileSync(__dirname + '/data/testbed-migrated.json'))

  function next () {
    var example = examples.shift()

    if(!example)
      return test.done()

    view('result', example, next)
  }
  next() 
}

exports.__teardown = function (test){
  console.log('TEARDOWN')
  client.abort()
  app.close()

}