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

  w.cli()
  w.info('TESTBED')
  w.info(new Date)

  if(!module.parent){
    config = require('./setup').deploy()
  } else {
    config = require('./setup').test()
  }

  var app = appSetup(config)

  if(!module.parent)
    app.listen(config.port);


  db = require('./initialize')(config.database,function (err,db){
    if(err){
      w.error("DATABASE SETUP ERROR")
      throw err
    }
    w.info("DATABASE '" + config.database + "' IS READY")
  })


function save (repo){ //pull this out also.
  if(repo._id && !repo.saving){
    repo.saving = true

    db.get('' + repo._id, function (err,doc){

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
        function (err,data){
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

app.post('/', function (req,res){

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
    console.log([repo.username,repo.project].join('/'),[].shift.call(arguments))
    while(arguments.length)
      console.log([].shift.call(arguments))
    console.log('--------------------------------')
    save(repo)
  })

  repo.integrate(function (err,data){
    //log
    if(err){
      return res.send({error: err, reason:  "could not connect to github or npm", data: data})
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

app.get('/:username/:project/:commit', function (req,res){
  db.get([req.params.username, req.params.project, req.params.commit].join(','),
  function (err,data){
    res.render('result',{self:data})
  })
})

function summary(opts,res){

  db.view('all/summary',opts, function (err,data){
    if(err) {
      console.error(err)
      res.statusCode = 500
      return res.send(err)
    }
    data.rows.sort(function (x,y){
      return x.value.time < y.value.time ? 1 : -1
    })
    res.render('user',{self:data})
  })

}

//replace this with a function that calls the decoupled controller with just
//params, query, 
//and that calls back
//with an the object ready for the view.

app.get('/:username/:project', function (req,res){

  var key = 

  console.log(key)
  
  var opts = {
    endkey: [req.params.username,req.params.project,'ZZZZZZZ'],
    startkey: [req.params.username,req.params.project,'_____'],
    reduce: false,
//    group: false
  }

  summary(opts,res)

})

app.get('/:username', function (req,res){
  
  var opts = {
    startkey: [req.params.username,'_______'],
    endkey: [req.params.username,'ZZZZZZZZZ'],
    group_level: 2,
    reduce: true
  }

  summary(opts,res)

})

app.get('/', function (req,res){
  
  var opts = {
    group_level: 2,
    reduce: true
  }

  summary(opts,res)
})
