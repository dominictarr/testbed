var Testbed = require('testbed')
  , it = require('it-is').style('colour')
  , tmp = __dirname + '/tmp'
  , testbed = new Testbed(tmp)
  , exec = require('child_process').exec
  , fs = require('fs')
  , join = require('path').join
  , render = require('render')

exports.__setup = function (test){
  exec('rm -rf ' + tmp + '; mkdir ' + tmp, test.done)
}


exports ['can clone or pull a project'] = function (test){

  var curry = testbed.Repo('substack','curry')
  curry.cloneOrPull(function (err,data){
    console.log(data)

    if(err) throw err

    fs.statSync(
      join(curry.basedir,
        curry.username,
        curry.project,
        'package.json'))
 
    console.log('init:', curry)

    it(curry).has({state:{init: false, update: false}})

    curry.init(function (){

    it(curry).has({state:{init: true, update: false}})

      fs.statSync(
        join(curry.basedir,
          curry.username,
          'node_modules',
          'curry',
          'package.json')
      )

      console.log(data)
      test.done()
    })
  })
}

//*/

/*
  a better API is to just have one function: go
  
  which then does everything necessary, and generates events as they occur.

*/

exports ['test a repo'] = function (test){
  var curry = testbed.Repo('substack','curry')
  curry.init(function (){
    curry.update(function (){
      curry.test(function (err,report){
 
        console.log("***************")
        console.log(report)
        console.log("***************")
        test.done()
      })
    })
  })
}

exports ['integrate a repo'] = function (test){

  var curry = testbed.Repo('dominictarr','curry')
    , events = ['clone', 'init', 'update', 'tested']
    , changes = 0

  curry.on('change',function (event){
    changes ++
  })
  events.forEach(function (event){
    curry.on(event,  
      function check(){
        if(~events.indexOf(event))
          it(event).equal(events.shift())
      })
  })

  curry.integrate(function (err,report){
    it(changes >= 4).ok()
    it(events).property('length',0)
    console.log(report)
    it(curry).has({
      type: 'repo',
      report: {status: it.typeof('string'), tests: []},
      output: {},
      package: {name: it.typeof('string'), version: it.typeof('string')}
    })
    render.cf.log(curry.output)
/*    it(report).has([{
      tests:it.property('length',it.ok())
    },{
      tests:it.property('length',it.ok())
    }])*/
    console.log(report)
    test.done()
  })
}


/*
//TODO: an module with an install error. might hade to use a install script to do this.

exports ['handle errors property'] = function (test){

 var broke = testbed.Repo('dominictarr','broken-test-example')
    , events = ['clone', 'init', 'install-error']
    , changes = 0

  broke.on('change',function (event){
    changes ++
  })
  events.forEach(function (event){
    broke.on(event,  
      function check(){
        if(~events.indexOf(event))
          it(event).equal(events.shift())
      })
  })

  broke.integrate(function (err,report){
    it(changes >= 3).ok()
    it(events).property('length',0)
    console.log(report)

    it(err).ok()

    test.done()
  })
}*/