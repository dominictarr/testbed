#!/usr/bin/env node

var testbed = new (require('./testbed'))(process.cwd() + '/../workspace')//no not install inside cwd. 
                                                            //testbed's deps may interfere with a tests deps.
  , appSetup = require('./app-setup')
  , request = require('request')
  , render = require('render')
  , url = require('url')
  , db
  , config
  , handler = require('./handler')()
  , controllers 
 
  handler.error['500'] = '500'
  handler.error['404'] = '404'

  if(!module.parent) {
    config = require('./setup').deploy()
  } else {
    config = require('./setup').test()
  }

  var app = appSetup(config)

  if(!module.parent)
    app.listen(config.port);

  db = require('./initialize')(config.database, function (err, db){
    if(err){
      console.error("DATABASE SETUP ERROR")
      throw err
    }
    console.log("DATABASE '" + config.database + "' IS READY")
  })

  controllers = require('./controllers')(db,testbed.Repo,config) //dependency injection antipattern

/*
function save (repo) { //pull this out also.
  if(repo._id && !repo.saving){
    repo.saving = true

    db.get('' + repo._id, function (err, doc){

      var obj = {}
      for (var key in repo)
        obj[key] = repo[key]
      console.log(obj)
      obj._id = '' + repo._id
      obj._rev = doc && dov._rev
      obj.time = new Date()
      dbj.save(obj,
        function (err, data){
          repo._rev = data._rev
          repo.saving = null
          if(repo.changed){
            save(repo)
            repo.changed = null
          }
        })
    })
  } else {
    repo.changed = true
  }
}*/

app.post('/', handler(controllers.github, function (obj,res){
  res.send(obj,{'Content-Type': 'application/json'},200)
}))

/*
controller gets req and a callback, through which it passes it's data to renderer

this would at least make it possible to decouple the controller

how to handle errors?

first arg is error.
views for errors are defined once for the handler
*/

//app.get('/path', handleRoute(controller, renderer))

/*
app.get(path, handler(controller, 'view'))

controller gets request object, and a callback

function controller (req, callback){
  //do what you gotta do, then callback.
  if(err)
    callback(err)
  else
    callback(err,obj)
}

if it's an error handler calls error controller.

else, handler calls view.

res.render(view, obj, function (err,data){
  if (err) log object and view to a file for testing later.
  else
  res.send(data)
})

*/

app.get('/:username/:project/:commit', handler(controllers.result, 'result'))

app.get('/:username/:project', handler(controllers.summary.username_project, 'user'))

app.get('/:username', handler(controllers.summary.username,'user'))

app.get('/', handler(controllers.summary.home,'user'))
