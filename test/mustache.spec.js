var fs = require('fs');
var path = require('path');
var glob = require('glob');
var Beefcake = require('../beefcake');

describe('Mustache specification', function () {
  var globOptions = {cwd: __dirname}
  var files = glob.sync('./mustache-spec/specs/*.json', globOptions);
  
  files.forEach(function (file) {
    var basename = path.basename(file);
    var text = fs.readFileSync(path.join(globOptions.cwd, file), 'utf8');
    var spec = JSON.parse(text);
    
    spec.tests.forEach(function (test) {      
      it(basename + ':' + test.name + ':' + test.desc, function () {
        if (test.data.lambda) {
          test.data.lambda = Function('return function(){return ' + test.data.lambda.js + ';}')(); 
        }        
        var result = Beefcake.compile(test.template).render(test.data, test.partials || {});
        expect(result).toBe(test.expected);
      });
    });    
  });
});