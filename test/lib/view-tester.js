var app = require('../../app-setup')(require('../../setup').deploy())
  , port = Math.round(10000 + Math.random() * 40000)
  , http = require('http')
  , render = require('render')
  , client
  , res


exports.setup = function (test){

  app.get('/',function (req,_res){
    res = _res

    test.done()
  })

  app.listen(port, function (){
    client = http.get({port: port})
  })

}
exports.partial = 
  function partial(view,object, callback){
    res.partial(view,object,callback)
  }

exports.view = 
  function view(view,object, callback){
    res.render(view,{self: object},callback)
  }

exports.teardown = function (test){
  console.log('TEARDOWN')
  client.abort()
  app.close()
}
