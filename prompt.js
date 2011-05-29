

/*
the following copyright notice applys only to the contents of this file. 

Copyright 2009, 2010, 2011 Isaac Z. Schlueter.
All rights reserved.

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.


"Node.js" and "node" trademark Joyent, Inc. npm is not officially
part of the Node.js project, and is neither owned by nor
officially affiliated with Joyent, Inc.

Packages published in the npm registry are not part of npm
itself, and are the sole property of their respective
maintainers.

"npm Logo" created by Mathias Pettersson and Brian Hammond,
used with permission.

*/

module.exports = prompt

var log = console.log
  , buffer = ""
  , stdio = process.binding("stdio")

function prompt (p, def, silent, cb) {
  if (!cb) cb = silent, silent = false
  if (!cb) cb = def, def = undefined
  if (def) p += "("+(silent ? "<hidden>" : def)+") "
  var r = (silent ? silentRead : read).bind(null, def, cb)
  if (!process.stdout.write(p)) process.stdout.on("drain", function D () {
    process.stdout.removeListener("drain", D)
    r()
  })
  else r()
}

function read (def, cb) {
  var stdin = process.openStdin()
    , val = ""
  stdin.resume()
  stdin.setEncoding("utf8")
  stdin.on("error", cb)
  stdin.on("data", function D (chunk) {
    val += buffer + chunk
    buffer = ""
    val = val.replace(/\r/g, '')
    if (val.indexOf("\n") !== -1) {
      if (val !== "\n") val = val.replace(/^\n+/, "")
      buffer = val.substr(val.indexOf("\n"))
      val = val.substr(0, val.indexOf("\n"))
      stdin.pause()
      stdin.removeListener("data", D)
      stdin.removeListener("error", cb)
      val = val.trim() || def
      cb(null, val)
    }
  })
}

function silentRead (def, cb) {
  var stdin = process.openStdin()
    , val = ""
  stdio.setRawMode(true)
  stdin.resume()
  stdin.on("error", cb)
  stdin.on("data", function D (c) {
    c = "" + c
    switch (c) {
      case "\n": case "\r": case "\r\n": case "\u0004":
        stdio.setRawMode(false)
        stdin.removeListener("data", D)
        stdin.removeListener("error", cb)
        val = val.trim() || def
        process.stdout.write("\n")
        process.stdout.flush()
        stdin.pause()
        return cb(null, val)
      case "\u0003": case "\0":
        return cb("cancelled")
        break
      default:
        val += buffer + c
        buffer = ""
        break
    }
  })
}