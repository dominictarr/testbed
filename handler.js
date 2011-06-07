var it = require('it-is')

module.exports =
function Handler (){

    function handleError(err,res){
      var status = 
        'number' == typeof err ? err : (err.statusCode || 500)
      if(!handler.error[status])
        status = 500
      if('string' == typeof handler.error[status])
        return res.render(handler.error[status], err)
      handler.error[status](err,res)
    }

  function handler (controller, view){

    it(controller).function ()
    //it(view).typeof('string')

    return function (req,res){
      var render = function (err,obj){
        if(err) return handleError(err,res)

        if('string' == typeof view) {
          res.render(view, obj, function (err,data){
            if(err) return handleError(err)
            res.send(data)
          })
        } else {
          view(obj,res)
        }
      }
      controller(req,render)
    }
  }
  handler.error = {

  }
  return handler
}
