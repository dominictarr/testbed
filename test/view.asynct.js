var views = require('./lib/view-tester')
  , request = require('request')
  , http = require('http')
  , render = require('render')
  , it = require('it-is')

exports.__setup = views.setup
exports.__teardown = views.teardown


/*
partials are kind dumb.

I don't like it how they are magically given the name of the partial,

'this' would be more idiomatic.

and it's also very bad how partial behaves different whether it's 
rendering an array or a object. if you want it to render your array, 
you should explicitly call partials or allPartials. 

implicit is not as good as explicit.

*/

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
  views.partial('error',examples,test.done)
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
  views.view('user',example,test.done)

}

exports ['result view'] = function (test) {
  var fs = require ('fs')
  var examples = 
    JSON.parse(fs.readFileSync(__dirname + '/data/testbed-migrated.json'))

  function next () {
    var example = examples.shift()

    if(!example)
      return test.done()

    views.view('result', example, next)
  }
  next() 
}
