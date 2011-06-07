var it = require('it-is')
  , Handler = require('../handler')

exports ['pass call controller and then render'] = function (test){
  var handler = Handler()

  var action = 
    handler(function (req,render){
      console.log('called controller')
      render(null,{hello: 'asdf'})
    }, 'example')

  it(action).function()

  var mockRes = {
    render: function (view, obj, cb) {
      console.log('called render')
      it(view).equal('example')
      it(obj).deepEqual({hello: 'asdf'})
      cb(null,'<h1> hello asdf </h1>')
    },
    send: function (content){
      console.log('called send')
      it(content).equal('<h1> hello asdf </h1>')
      test.done()
    }
  }

  action({},mockRes)
}

exports ['view can be function'] = function (test) {
  console.log('view can be function')
  var handler = Handler()

  var action = 
    handler(function (req, render) {
      console.log('called controller')
      render(null,{ hello: 'CRAZY' })
    }, function (obj, res) {
      res.send(JSON.stringify(obj))
    })

  it(action).function()

  var mockRes = {
    send: function (content) {
      console.log('called send')
      it(content).equal(JSON.stringify({ hello: 'CRAZY' }))
      test.done()
    }
  }

  action({}, mockRes)

}

exports ['can set error handler'] = function (test) {
  console.log('can set error handler')
  var handler = Handler()

  handler.error[500] = function (err,res){
    res.send(JSON.stringify(err))
  }

  var action = 
    handler(function (req, render) {
      console.log('called controller')
      render({ error: 'NO GOOD' })
    }, 'wont-get-called')

  it(action).function()

  var mockRes = {
    send: function (content) {
      console.log('called send')
      it(content).equal(JSON.stringify({ error: 'NO GOOD' }))
      test.done()
    }
  }

  action({}, mockRes)

}

//*/

exports ['set error handler to a view name'] = function (test) {
  console.log('can set error handler')
  var handler = Handler()

  handler.error[500] = '500'
  var action = 
    handler(function (req, ready) {
      console.log('called controller')
      ready({ error: 'NO GOOD' })
    }, 'wont-get-called')

  it(action).function()

  var mockRes = {
    render: function (view, obj, cb) {
      console.log('called render', view, obj)

      it(view).equal('500')
      it(obj).deepEqual({ error: 'NO GOOD' })
      it(cb).equal(null)
      test.done()
    }
  }

  action({}, mockRes)

}

