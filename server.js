#!/usr/bin/env node

var express = require('express') 
  , app = express.createServer()
  , testbed = new (require('./testbed'))(process.cwd() + '/workspace')
  , request = require('request')
  , w = require('winston')
  , fs = require('fs')
  , eyes = require('eyes')
  , render = require('render')
  , url = require('url')
  , database = 'testbed'
  , db
  , config
  , package = JSON.parse(fs.readFileSync(__dirname + '/package.json'))

  w.cli()
  w.info('TESTBED')
  w.info(new Date)

  if(!module.parent){
    config = require('./setup').deploy()
    app.listen(config.port);
  } else {
    config = require('./setup').test()
  }

  db = require('./initialize')(config.database,function (err,db){
    if(err){
      w.error("DATABASE SETUP ERROR")
      throw err
    }
    w.info("DATABASE '" + database + "' IS READY")
  })

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    package: package, 
    status: 'success', //sets the tab icon
    basedir: config.basedir
    });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

function save (repo){
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

  repo.post = payload

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

function summary(opts,res){

  db.view('all/summary',opts, function (err,data){

    data.rows.sort(function (x,y){
      return x.value.time < y.value.time ? 1 : -1
    })
    if(err) return res.send(err)
    res.render('user',data)
  })

}

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
