/*
 *  Copyright 2013 Darren Schnare
 *  Licensed under the MIT License, (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://opensource.org/licenses/MIT
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
(function (global) {
  var factory, util;

  /// Module Factory ///

  factory = function (hogan) {
    var helpers, ctxStack;

    if (!hogan) throw new Error('Hogan does not exist.');
    hogan.util = util;
    helpers = {};
    ctxStack = [];

    /// Overriding ///   

    // We override these methods so that the return values of lambdas used in
    // an interpolation token will be interpolated recursively. This is so that
    // we meet the entire Mustache spec.
     
    // Version 2.0.0
    if (typeof hogan.Template.prototype.lv === 'function') {
      hogan.Template.prototype.lv = util.override(hogan.Template.prototype.lv, function (base, val, ctx, partials) {
        var result = base.call(this, val, ctx, partials);
        return hogan.compile(result).ri(ctx, partials);
      });  
    // Version 3.0.0
    } else if (typeof hogan.Template.prototype.mv === 'function') {
      hogan.Template.prototype.mv = util.override(hogan.Template.prototype.mv, function (base, val, ctx, partials) {
        var result = base.call(this, val, ctx, partials);      
        return hogan.compile(result).ri(ctx, partials);
      });
    }  

    // :numbers = move down the stack one level
    // ::numbers = move down the stack two levels
    // !numbers = move to the bottom of the stack
    hogan.Template.prototype.f = util.override(hogan.Template.prototype.f, function (base, key, ctx, partials, returnFound) {      
      var v;

      ctx = ctx.slice();

      if (key.charAt(0) === '~') {
        key = key.substr(1);        
        v = base.call(this, key, [ctx[0]], partials, returnFound);
      } else if (key.charAt(0) === ':') {     
        while (key.charAt(0) === ':') {          
          key = key.substr(1); 
          if (ctx.length > 1) {
            ctx.pop();
          }
        }        
        v = base.call(this, key, ctx, partials, returnFound);
      } else {
        v = base.call(this, key, ctx, partials, returnFound);
      }

      return v;
    });

    // Override Writer.prototype.compile so we can transform the template before hogan
    // has a chance to compile it. We transform all sections of the form from:
    //
    // {{#name arguments}}body{{/name}}
    // to
    // {{#name}}arguments;body{{/name}}
    //
    // We do this transformation so that the section helper API can read the arugments from the section text.
    //
    // Then we override the render function so that we add the helpers to the context.
    hogan.compile = util.override(hogan.compile, function (base, template, options) {
      var re, t0, t1, t, result;

      options = options || {};
      tags = (options.delimiters || '{{ }}').split(' ');
      t = util.escapeRegExp(tags[1].charAt(0));
      t0 = util.escapeRegExp(tags[0]);
      t1 = util.escapeRegExp(tags[1]);
      // {{#valueHead valueTail}}
      re = '(' + t0 + '\\s*(?:#|^))\\s*([_$\\-0-9a-z\\.]+)((?:\\s+[^' + t + ']+)+)(' + t1 + ')';
      re = new RegExp(re, 'gi');

      template = template.replace(re, function ($0, head, valueHead, valueTail, tail, index) {        
        return head + valueHead + tail + util.trim(valueTail) + ';'
      });
      
      return base.call(this, template, options);
    });  

    hogan.Template.prototype.ri = util.override(hogan.Template.prototype.ri, function (base, c, p, i) {
      var result, self;

      self = this;
      ctxStack.push(c);
      c[0] = util.mixin(util.create(c[0]), helpers);
      c.lookup = function (path) {
        if (~path.indexOf('.')) {
          return self.d(path, this, p);
        } else {
          return self.f(path, this, p);
        }
      };
      result = base.call(this, c, p, i);
      ctxStack.pop();

      return result;
    });
  
    /// Extension ///

    hogan.render = function (text, c, p, options) {      
      var tpl;

      options = options || {};
      options.asString = false;
      tpl = this.compile(text, options);

      if (util.isArray(c)) {
        return tpl.ri(c, p);
      }

      return tpl.render(c, p);
    };  

    hogan.getHelper = function (name) {
      return helpers[name];
    };

    hogan.registerHelper = function (name, helper) {
      helpers[name] = function () {
        return function (text) {
          var match, cmd, result, ctx;

          result = '';
          match = /^(.+?);/.exec(text);
          ctx = ctxStack[ctxStack.length - 1];
        
          if (match) {
            cmd = util.trim(match[1]);
            text = util.trim(text.substr(match[0].length));
            result = helper.call(this, text, cmd, ctx);
          } else {
            result = helper.call(this, text, null, ctx);
          }               

          if (result === null || result === undefined) result = '';

          return result;
        };
      };
    };
    
    hogan.aliasHelper = function (name, alias) {
      helpers[name] = function () {
        return helpers[alias];
      };
    };  

    /// Builtin Helpers ///

    // Example: {{#with options}}
    hogan.registerHelper('with', function (text, path, ctx) {
      var parts, value, result;

      if (!path) return hogan.render(text, ctx);

      result = '';
      value = ctx.lookup(path);

      if (value === undefined || value === null) {
        result = '';
      } else {
        ctx.push(util.mixin(util.create(value), {"@value": value}));
        result = hogan.render(text, ctx);
        ctx.pop();
      }      

      return result;
    });

    // Example: {{#each options}}
    // Example: {{#each people}}
    hogan.registerHelper('each', function (text, path, ctx) {
      var parts, value, result;

      if (!path) return hogan.render(text, ctx);

      result = '';      
      value = ctx.lookup(path);
      ctx.push(value);

      if (value === undefined || value === null) {
        result = '';
      } else if (util.isArray(value)) {
        (function () {
          var i, len, v;      

          for (i = 0, len = value.length; i < len; i += 1) {
            v = value[i];
            if (v === undefined || v === null) continue;
            ctx.push(util.mixin(util.create(v), {'@index': i, '@key': i, '@value': v}));
            result += hogan.render(text, ctx);
            ctx.pop();
          }
        }());
      } else {
        (function () {
          var k, v;

          for (k in value) {
            v = value[k];
            if (v === undefined || v === null) continue;
            ctx.push(util.mixin(util.create(v), {'@index': k, '@key': k, '@value': v}));
            result += hogan.render(text, ctx);
            ctx.pop();
          }
        }());
      }    

      ctx.pop();

      return result;
    });

    // Example: {{#if members.length > 0}}
    hogan.registerHelper('if', function (text, expression, ctx) {
      var view;

      if (!expression) return hogan.render(text, ctx);

      view = this;      
      if (/\w+\s*\(.*\)/.test(expression)) throw new Error('Conditional expressions cannot contain function calls.');
      if (/\[|\]/.test(expression)) throw new Error('Conditional expressions cannot contain square brackets.');
      if (/\{|\}/.test(expression)) throw new Error('Conditional expressions cannot contain curly braces.');
      if (/\b=\b|\+\+|\-\-|\+=|\-=|\*=|\/=|\|=|&=/.test(expression)) throw new Error('Conditional expressions cannot contain assignment expressions.');
      expression = expression.replace(/[@_$a-z][_$a-z0-9]*(?:\.[_$a-z][_$a-z0-9]*)*/ig, function ($0) {
        return 'lookup("' + $0 + '")';
      });      

      try {
        with (ctx) { condition = eval(expression); }
      } catch (error) {   
        condition = false;
      }
      
      if (condition) {
        return hogan.render(text, ctx);
      }
    });

    // Example: {{#unless members.length === 0}}
    hogan.registerHelper('unless', function (text, expression, ctx) {
      var view;

      if (!expression) return hogan.render(text, ctx);

      view = this;      
      if (/\w+\s*\(.*\)/.test(expression)) throw new Error('Conditional expressions cannot contain function calls.');
      if (/\[|\]/.test(expression)) throw new Error('Conditional expressions cannot contain square brackets.');
      if (/\{|\}/.test(expression)) throw new Error('Conditional expressions cannot contain curly braces.');
      if (/\b=\b|\+\+|\-\-|\+=|\-=|\*=|\/=|\|=|&=/.test(expression)) throw new Error('Conditional expressions cannot contain assignment expressions.');
      expression = expression.replace(/[@_$a-z][_$a-z0-9]*(?:\.[_$a-z][_$a-z0-9]*)*/ig, function ($0) {
        return 'lookup("' + $0 + '")';
      });

      try {
        with (ctx) { condition = eval(expression); }
      } catch (error) {        
        condition = false;
      }

      if (!condition) {
        return hogan.render(text, ctx);
      }
    });

    return hogan;
  };

  /// Utility Functions ///

  util = (function () {
    return {
      isArray: function (o) {
        return Object.prototype.toString.call(o) === '[object Array]';
      },
      override: function (base, fn) {        
        return function () {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(base);
          return fn.apply(this, args);
        };
      },
      create: function (o) {
        var F = function () {};        

        if (o === undefined || o === null) o = {};    

        // o is a literal. 
        if (/string|number|boolean/.test(typeof o)) {
          o = (function (v) {
            return {
              toString: function () { return v + ''; },
              valueOf: function () { return v; }
            };
          }(o));
        }        
        
        F.prototype = o;
        o = new F();
        o.constructor = F;

        return o;
      },
      mixin: function (o) {
        var i, len, args, arg, k;

        args = ([]).slice.call(arguments, 1);
        for (i = 0, len = args.length; i < len; i += 1) {
          arg = args[i];

          if (arg === 'constructor') continue;

          for (k in arg) {
            if (arg.hasOwnProperty(k)) {
              o[k] = arg[k];
            }
          }
        }

        return o;
      },
      trim: function (s) {
        if (typeof s.trime === 'function') return s.trim();
        return s.replace(/^\s+|\s$/g, '');
      },
      escapeRegExp: function (s) {
        return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      }
    };
  }());

  /// Export ///

  (function () {
    var o;

    if (typeof define === 'function' && define.amd && typeof define.amd === 'object') {
      define(['hogan.js'], factory);
    } else if (typeof exports !== 'undefined' && exports !== null) {
      o = factory(require('hogan.js'));
      if (typeof module !== 'undefined' && module !== null && module.exports) {
        module.exports = o;
      }
      exports.Hogan = o;
    } else {
      global.Hogan = factory(global.Hogan);
    }
  }());

}(this));