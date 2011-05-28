var Testbed = require('testbed')
  , it = require('it-is')
  , tmp = __dirname + '/tmp'
  , testbed = new Testbed(tmp)
  , exec = require('child_process').exec
  , fs = require('fs')
  , join = require('path').join

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
        console.log(report)
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
        it(event).equal(events.shift())
      })
  })

  curry.integrate(function (err,report){
    it(changes >= 4).ok()
    it(events).property('length',0)
    console.log(report)
    test.done()
  })
}
