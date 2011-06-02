#!/usr/bin/env node

var express = require('express') 
  , app = express.createServer()
  , testbed = new (require('./testbed'))(process.cwd() + '/workspace')
  , request = require('request')
  , w = require('winston')
  , eyes = require('eyes')
  , render = require('render')
  , url = require('url')
  , database = 'testbed'
  , db
  , config

  w.cli()
  w.info('TESTBED')
  w.info(new Date)

  if(!module.parent){
    config = require('./setup').deploy()
    app.listen(config.port);
  } else {
    config = require('./setup').test()
  }

  db = require('./initialize')({name: config.database},function (err,db){
    if(err){
      w.error("DATABASE SETUP ERROR")
      throw err
    }
    w.info("DATABASE '" + database + "' IS READY")
  })

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

function save (repo){
  if(repo._id && !repo.saving){
    repo.saving = true

    db.get('' + repo._id, function (err,doc){
      db.save({
        _id: '' + repo._id,
        _rev: doc && doc._rev,
        time: new Date,
        username: repo.username,
        project: repo.project,
        state: repo.state,
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

  if(!req.body)
    return res.send ({error: "Expected payload: property"})
  try{
  var payload = JSON.parse(req.body.payload)
  } catch (err){
    w.error('could not parse POST JSON')
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

  repo.state.post = payload

  repo.on('change',function (event){
    console.log([repo.username,repo.project].join('/'),[].shift.call(arguments))
    while(arguments.length)
      console.log([].shift.call(arguments))
    console.log('--------------------------------')
    save(repo)
  })

  repo.integrate(function (err,data){
    if(err){
      return res.send({error: err, reason:  "could not connect to github or npm", data: data})
    }
    res.send(data)
  })
})

app.get('/:username/:project/:commit', function (req,res){
  db.get([req.params.username, req.params.project, req.params.commit].join(','),
  function (err,data){
    res.render('result',data)
  })
})

/*app.get('/:username/:project', function (req,res){

  var path = url.parse(req.url).pathname

  var start = path.split('/').slice(1)
    , end = start.slice(0).concat('ZZZZZZZ')
    , opts = (path !== '/' ? {startkey:start,endkey:end} : {})

  db.view('all/ordered',opts, function (err,data){
    if(err) {return res.send(err)}
    data.__proto__ = Array.prototype //GOD DAMMIT! leave Array.prototype alone!
    console.log(render(data, {multiline: true}))
    if(data.rows.length) {
      data.rows = data.rows.reverse()
      res.render('index', data)
    } else
      res.render('empty',config)
  })
})*/

function summary(opts,res){

  db.view('all/summary',opts, function (err,data){

    if(err) return res.send(err)
    console.log(data)
    res.render('user',data)
  })

}

app.get('/:username/:project', function (req,res){

  var key = [req.params.username,req.params.project]

  console.log(key)
  
  var opts = {
    startkey: key,
    endkey: key,
    reduce: false,
//    group: false
  }

  summary(opts,res)

})

app.get('/:username', function (req,res){

  var key = 

  console.log(key)
  
  var opts = {
    startkey: [req.params.username,'_______'],
    endkey: [req.params.username,'ZZZZZZZZZ'],
    group: true,
    reduce: true
  }

  summary(opts,res)

})
