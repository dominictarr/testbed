var Testbed = require('../testbed')
  , it = require('it-is')
  , tmp = '/tmp/test-testbed'
  , testbed = new Testbed(tmp)
  , exec = require('child_process').exec
  , fs = require('fs')
  , join = require('path').join

exports.__setup = function (test){
  exec('rm -rf ' + tmp + '; mkdir ' + tmp, test.done)
}

exports ['can clone a project'] = function (test){

  var traverse = testbed.Repo('substack','js-traverse')
  traverse.clone(function (err,data){
    console.log(data)
    if(err) throw err

    fs.readFileSync(
      join(traverse.basedir,
        traverse.username,
        traverse.project,
        'package.json')
    )
 
    traverse.headCommit(function (err,commit){
      it(commit).typeof('string').equal(data)
      console.log('cloned commit:' + commit)
 
      console.log(data)
      test.done()
    
    })
  })
}

exports ['request nonsense'] = function (test){

  var nonsense = testbed.Repo('noone','dflaksjdsdf')
  nonsense.clone(function (err){
    it(err).ok()
    test.done()
  })
}
