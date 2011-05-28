var exec = require('child_process').exec
  , join = require('path').join
  , fs = require('fs')
  , find = require('wildfile').find
  , metatest = require('meta-test')
  , EventEmitter = require('events').EventEmitter
////winston.info('usuage: node pull username project')

function Repo(username,project,basedir){
  if(!(this instanceof Repo)) return new Repo(username,project)
  
  this.username = username
  this.project = project
  this.basedir = basedir
  this.state = {init: false, update: false, tested: false}
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
      exec(
        ['git', 'status'].join (' '), 
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
      exec(
        ['git', 'log'].join (' '), 
        {cwd: this.dir()},
        function (err,data){
          if(err) throw err//FIXME
          var m = /commit (.*)/(data.split('\n').shift())
          if(m){
            self.state.commit = m[1]
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
      exec(
        ['git', 'pull'].join (' '), 
        {cwd: this.dir()}, 
        function (err,data){
          self.setState(false,false,false)
          if(err){
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
          if(err){
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
        self[(err ? 'clone' : 'pull')](callback)//if this fails 
      })
    },

    init: function ( callback){
    var self = this
    fs.readFile(self.path('basedir', 'username', 'project','package.json'),
      'utf-8', 
      function (err,json){
        //if(err) throw err//FIXME
        var package = eval('(' + json + ')')
        //winston.info((package.name + '@' + package.version).bold)

        exec([
          'mkdir', 'node_modules'].join(' '), 
          {cwd: join(self.basedir,self.username)}, 
          function (err){
          if(err)
            console.log(err)
        //    if(err) throw err //file probably exist
            exec([
              'ln -s', 
              self.dir(),
              join(self.basedir, self.username, 'node_modules', package.name)
              ].join(' '),
              function (err){
                self.setState(true,false,false)
                self.change('init',err)
                callback(err)
              })//*/
          })
        })
    },

    update: function (callback){
      var self = this
      console.log('NPM UPDATE')
      exec('npm update', 
        {cwd: join(this.basedir,this.username,this.project)}, 
        function (err,data){
          self.setState(null,true,false)
          self.change('update',err,data)
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
          self.state.results = []
          function next (test){
            metatest.run({adapter: 'expresso', filename: test },
              function (err,report){
                self.report = report
                self.state.results.push(report)
                self.change('test',err,report)
                reports.push(report)
                if(err)
                  return callback(err)
                //callback(err,report)
                if(tests.length)
                  next(tests.shift())
                else{
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

if(!module.parent){

  function shift (){
    return process.argv.shift()
  }

  var node = shift()
    , thisJs = shift()
    , username = shift()
    , project = shift();

  var repo = new Testbed(process.cwd()).Repo(username,project)

  repo.cloneOrPull(function (err){
    repo.update(function (){
      repo.init(console.log)
    })
  })
}
//*/
