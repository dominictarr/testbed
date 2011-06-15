var Testbed = require('testbed')
  , it = require('it-is')
  , tmp = '/tmp'
  , testbed = new Testbed(tmp)
  , exec = require('child_process').exec
  , fs = require('fs')
  , join = require('path').join

exports.__setup = function (test){
  exec('rm -rf ' + tmp + '; mkdir ' + tmp, test.done)
}


exports ['integrate a repo that uses vows'] = function (test){

  var webservice = testbed.Repo('dominictarr','webservice.js')
    , events = ['clone', 'init', 'update', 'tested']
    , changes = 0

  webservice.on('change',function (event){
    changes ++
  })
  events.forEach(function (event){
    webservice.on(event,  
      function check(){
        if(~events.indexOf(event))
          it(event).equal(events.shift())
      })
  })

  webservice.integrate(function (err,report){
    it(changes >= 4).ok()
    it(events).property('length',0)
    console.log(report)
    it(webservice).has({
      type: 'repo',
      report: {status: it.typeof('string'), tests: []},
      output: {},
      package: {name: it.typeof('string'), version: it.typeof('string')}
    })

    //validate a report.
    console.log(webservice.report.tests[0].failures)

/*    it(report).has([{
      tests:it.property('length',it.ok())
    },{
      tests:it.property('length',it.ok())
    }])*/
    console.log('########################',webservice.report)
    test.done()
  })
}
