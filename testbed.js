var exec = require('child_process').exec
  , join = require('path').join
  , fs = require('fs')
  , find = require('wildfile').find
  , metatest = require('meta-test')
  , EventEmitter = require('events').EventEmitter

////winston.info('usuage: node pull username project')

/*
instead make this just a git wrapper which calls `git` and parses git log.
then, the test & npm stuff is a decorator on that.

then, express this with a hash of methods supported features

{log: function (err,data,callback)}
when wrap those function with something that calls git [key] [args]

pretty fancy. maybe too fancy.

hmm. this would wrap npm as well.

it's just npm and git atm, so it's all program command args style

there seems to be enough consistancy here to abstract, 

the question is:

  would this code get any better with a clever abstraction?

*/

function Repo(username,project,basedir){
  if(!(this instanceof Repo)) return new Repo(username,project)
  
  this.username = username
  this.project = project
  this.basedir = basedir
  this.state = {init: false, update: false, tested: false}
  this.type = 'repo'
  this.installation = []
  this.report = {
    status: 'notinstalled',
    failures: [],
    tests: []
  }
}

Repo.prototype = new EventEmitter()

var also = {
    path: function (){
      var path = []
      while(arguments.length){
        var key = [].shift.call(arguments)
        if('string' === typeof this[key])
          path.push(this[key])
        else 
          path.push(key)
      }
      return join.apply(null,path)
    },
    dir: function (){
      return this.path('basedir','username','project')
    },

    gitRepo: function (){
      return 'git://github.com/' + this.username + '/' + this.project + '.git'
    },

    status: function  (callback){
      exec('git status', 
        {cwd: this.path('basedir','username','project')}, 
        callback
      )
    },

    //pull

    setState: function (init,update,tested){
      if('boolean' === typeof init)
        this.state.init = init
      if('boolean' === typeof update)
        this.state.update= update
      if('boolean' === typeof tested)
        this.state.tested = tested
    },

    headCommit: function (callback){
      var self = this
      exec('git log', 
        {cwd: this.dir()},
        function (err,data){
          if(err) throw err//FIXME
          var m = /commit (.*)/(data.split('\n').shift())
          if(m){
            self.commit = m[1]
            self._id = [self.username,self.project,m[1]]
            self.change('id',self._id)
          }
          callback(err,m && m[1])
        })
    },
    change: function (){
      var args = ['change']
      while(arguments.length)
        args.push([].shift.call(arguments))
      this.emit.apply(this, args)
      this.emit.apply(this, args.slice(1))
    },
    pull: function (callback){
      //winston.info('pull ' + (self.username +'/'+ self.project).green)
      var self = this
      exec('git pull', 
        {cwd: this.dir()}, 
        function (err,data){
          self.setState(false,false,false)
          if(err){//TODO save git error.
            self.change('disconnected',err,data)
            callback.apply(self,arguments)
            return
           } 
          self.headCommit(function (err,commit){
            self.change('pull',err,commit)
            callback.apply(self,arguments)
          })
        }
      )
    },

    clone: function ( callback){
      var self = this
      exec(
        ['git', 'clone', 
          self.gitRepo(), 
          [self.username,self.project].join('/')
        ].join (' '), 
        {cwd: self.basedir}, 
        function (err,data){
          self.setState(false,false,false)
          if(err){//TODO save git error
            self.change('disconnected',err,data)
            callback.apply(self,arguments)
            return
          }
          self.headCommit(function (err,commit){
            self.change('clone',err,commit)
            callback.apply(self,arguments)
          })
        }
      )
    },

    cloneOrPull: function (callback){
      var self = this
      self.status(function (err,data){
        self[(err ? 'clone' : 'pull')](callback)
      })
    },

    init: function (callback) {
    var self = this, package, dev
    fs.readFile(self.path('basedir', 'username', 'project','package.json'),
      'utf-8', 
      function (err, json) {
        //TODO: if there is no package.json call this as invalid.
        if(err) {
          self.report.status = 'install-error'
          self.report.failures.push(err)
          //there was an error reading package json.
          self.change('install-error',err)
          return callback(err)
        }

        try {
          package = eval('(' + json + ')')
          dev = package.devDependencies || {}
        } catch (err) {
          self.report.status = 'install-error'
          err.message = 'trying to parse package.json:' + err.message
          self.report.failures.push(err)
          //there was an error reading package json.
          self.change('install-error',err)
          return callback(err)
        }

        self.package = package

          var devDependencies = Object.keys(dev).map(function (e){
            return e +'@' + JSON.stringify(dev[e])
          }).filter(function (e){//we don't need test frameworks.
            return !!!/expresso|vows|nodeunit|meta-test/(e)
          })
          console.log("devDependencies",devDependencies)
        if(devDependencies.length)
          exec('npm install ' + devDependencies.join(' '),{cwd: self.dir()}, next)
        else next()
        function next(err,data){
        if(err) {
          self.report.status = 'install-error'
          self.report.failures.push(err)
          //there was an error reading package json.
          self.change('install-error',err)
          return callback(err,data)
        }

        exec([
          'mkdir', 'node_modules'].join(' '), 
          {cwd: join(self.basedir,self.username)}, 
          function (err){
          if(err) console.log(err)
          exec([
            'ln -s', 
            self.dir(),
            join(self.basedir, self.username, 'node_modules', package.name)
            ].join(' '),
            function (err){//err will happen if it's already there, so ignore it.
              self.setState(true,false,false)
              self.change('init',err)
              callback(err)
            })
          })
        }
      })
    },

    update: function (callback){
      var self = this
      console.log('NPM UPDATE')
      exec('npm update', 
        {cwd: join(this.basedir,this.username,this.project)}, 
        function (err,data){
          //TODO: save npm install data.
          self.setState(null,true,false)
          if(err) {
            self.report.status = 'install-error'
            self.report.failures.push(err)
            self.installation.push(data)
            self.change('install-error',err,data)
          } else {
            self.change('update',data)
          }
          callback(err,data)
        })
    },
    test: function (){
      var callback = [].pop.call(arguments)
        , adapter = [].shift.call(arguments)
        , self = this
        , reports = []
      find('/',
        self.path('basedir',
          'username',
          'project',
          'test','*.js'),
        function (err,tests){
          self.report.tests = []
          function next (test){
            metatest.run({filename: test },
              function (err,report){
                self.change('test',err,report)
                self.report.tests.push(report)
                if(err)
                  return callback(err)
                //callback(err,report)
                if(tests.length)
                  next(tests.shift())
                else{
                  self.report.status = 
                    self.report.tests.reduce(function(x,y){
                      return x.status < y.status ? x : y
                    }).status
                  self.state.tested = true
                  self.change('tested',reports)
                  callback(err,reports)
                }
              })
          }
          next(tests.shift())
        })
    },
    
    integrate: function (callback){
    
      var self = this
      
      self.cloneOrPull(function (err,data){
        if(err)
          return callback(err,data)
        self.init(function (){
          self.update(function (err,data){
            if(err)
              return callback(err,data)
            self.test(function (err,report){
              callback(err,report)
            })
          })
        })
      })
    }
}

for(var i in also){
  Repo.prototype[i] = also[i]
}

function Testbed (basedir){
  if(!(this instanceof Testbed)) return new Testbed(basedir)
  this.basedir = 
  this.Repo = function (username,project){
    return new Repo(username,project,basedir)
  }
}

module.exports = Testbed
