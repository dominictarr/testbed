
var Github = require('../controllers/github')
  , valid = require('./lib/validate')
  , Testbed = require('../testbed')
  , exec = require('child_process').exec
  , tmp = '/tmp/test-testbed'
  , it = require('it-is')
  , fs = require('fs')
  , render = require('render')
  , db
  , opts = {
      name: 'test-testbed',
      clobber: true,
      host: 'localhost',
      raw: true
    }

exports.__setup = function (test){

  exec('rm -rf ' + tmp + '; mkdir ' + tmp, function (){
    console.error("init database")
    console.log(opts)
    db = require('../initialize')(opts, function (err,db){
      if(err){
        console.error("DATABASE SETUP ERROR")
        throw err
      }
      test.done()
    })
  })

}

/*
Fark! I started writing this mock thing, 
then I started to suspect that this mocking thing is a bad idea.

i've had a bunch of interesting ideas about testing recently

  * reverse it-is ... 
    generate random example object from the it-is dsl.
  
    also, take the DSL syntax from it-is and apply it generally.
    
  * FSMs: generate control flow from a model which has testability built in.
    automaticially check the model for obvious problems, log states, 
    and maybe even all arguments to actions. (could persist the state of the fsm)
    AND build enable replay
    
      FSMs certainly have many possibilities.

  * FSMs define relation between the tests, test each action by declaring what transition 
    should occur and pointing it at a fixture.
    then from model you can tell if there is coverage for every transition.
    
    if you tracked the arguments going into events, or used contracts, 
    you could check that the fixtures actually all match up.

  instead of mocking, i'm a gonna actually install and test a repo.

*/

exports ['recieve post and create Repo'] = function (test){
/*
function MockRepo (){
    
    if(!(this instanceof MockRepo)) return new MockRepo()
    var events = [ [ ] ]
      , listener
    //expect a call to change.
    this.on = function (event,_listener){
      console.log('LISTENED REGISTERED',event,listener)
      it(event).equal('change')
      it(listener).equal(null)
      listener = _listener
    }
    this.integrate = function (callback){
      process.nexTick(function (){ callback(null, {ok: 'true'}) })
  }
}*/
var github = Github(db,new Testbed(tmp).Repo, {basedir: __dirname + '/tmp'})
  , post = {
    repository: {
      name: 'curry', 
      language: 'JavaScript',
      description: 'sdlfjasgnasgisdpf',
      url: 'http:/gfasgasdg',
      owner: {name: 'dominictarr', email:'d@d.com'}
    },
    commits: []
  }

  valid.github(post)

  github({body: {payload: JSON.stringify(post) } },function (err,obj){
    console.log(arguments)
    it(err).equal(null)
    it(obj).has({ok: it.ok()})  
    //and check if it's really in the database.
    test.done()
  })
}