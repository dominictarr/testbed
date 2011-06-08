#!/usr/bin/env node

var testbed = new (require('./testbed'))(process.cwd() + '/workspace')
  , appSetup = require('./app-setup')
  , request = require('request')
  , w = require('winston')
  , eyes = require('eyes')
  , render = require('render')
  , url = require('url')
  , db
  , config
  , handler = require('./handler')()
  , controllers = require('./controllers')

  handler.error['500'] = '500'
  handler.error['404'] = '404'

  w.cli()
  w.info('TESTBED')
  w.info(new Date)

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
      w.error("DATABASE SETUP ERROR")
      throw err
    }
    w.info("DATABASE '" + config.database + "' IS READY")
  })

function save (repo) { //pull this out also.
  if(repo._id && !repo.saving){
    repo.saving = true

    db.get('' + repo._id, function (err, doc){

      var obj = {}
      for (var key in repo)
        obj[key] = repo[key]
      console.log(obj)
      db.save({
        _id: '' + repo._id,
        _rev: doc && doc._rev,
        commit: repo.commit,
        installation: repo.installation,
        package: repo.package,
        post: repo.post,
        project: repo.project,
        report: repo.report,
        state: repo.state,
        time: new Date,
        type: repo.type,
        username: repo.username,
        },
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
}

app.post('/', function (req, res) {

  //pull all of this out into a repo controller.

  if(!req.body)
    return res.send ({error: "Expected payload: property"})
  try{
  var payload = JSON.parse(req.body.payload)
  } catch (err){
    w.error('could not parse POST JSON')
    w.statusCode = 400
    return res.send ({
      error: "was not valid JSON",
      was: req.body.payload,
      exception: err.stack})
  }
  w.info('loading new repo')
  eyes.inspect(payload)

  repo = testbed.Repo(
    payload.repository.owner.name,
    payload.repository.name, 
    config.basedir) // load that from config.

  repo.post = payload

  repo.on('change',function (event){
    //log
    console.log(event, repo._id)
    save(repo)
  })

  repo.integrate(function (err,data){
    //log
    if(err){
      return res.send({error: err, 
        reason:  "could not connect to github or npm", data: data})
    }
    res.send(data)
  })
})

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
