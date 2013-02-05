**Tested with Hogan.js 2.0.0 and 3.0.0**

# Overview

Beefcake.js is the tag team partner for [Hogan.js](http://twitter.github.com/hogan.js/) that adds capabilities similar to Handlebars.js while maintaining full compatibility with the Mustache specification and full backward compatability with Hogan.js.

Beefcake.js came about after discovering Hogan.js and I having noticed it implemented the entire Mustache specification and passed all tests. So I decided to take my work on Mustache++ and port it over to Hogan.js.

# Usage

Beefcake.js modifies the existing Hogan object in-place so the same API you're used to with Hogan is preserved. Beefcake.js only overrides and adds extensions to the existing Hogan object.

First thing's first, learn [Mustache](http://mustache.github.com/mustache.5.html). Mustache is a simple yet powerful logic-less templating syntax. Since Beefcake.js is a superset of Mustache all techniques and knowledage transfer to Beefcake.js one-to-one.

Next, learn the extensions. Beefcake.js provides several extensions to Hogan.js in a way that maintains 100% backward compatability with Hogan.js **and** the Mustache specification.

## Decendant Context and Root Context

You can prefix your property paths with `:` to move down one context.
  
*the template*

    {{#father.son}}
      {{#friend}}
        <p>{{:name}}'s friend is {{name}}</p>
      {{/friend}}
    {{/father.son}}

*the context*

    {
      father: {
        name: 'Raymond',
        son: {
          name: 'Eric',
          friend: {
            name: 'Alex'
          }
        }
      }
    }

*the output*

    <p>Eric's friend is Alex</p>


Having more than one `:` character will move that many contexts down the context stack.

*the template*

    {{#father}}
      {{#son}}
        {{#friend}}
          <p>{{:name}}'s friend is {{name}} and his father is {{::name}}</p>
        {{/friend}}
      {{/son}}
    {{/father}}

*the context*

    {
      father: {
        name: 'Raymond',
        son: {
          name: 'Eric',
          friend: {
            name: 'Alex'
          }
        }
      }
    }

*the output*

    <p>Eric's friend is Alex and his father is Raymond</p>

Prefixing your property path with `~` will move down to the root context.

*the template*

    {{#father}}
      {{#son}}
        {{#friend}}
          <p>{{:name}}'s friend is {{name}} and his father is {{~father.name}}</p>
        {{/friend}}
      {{/son}}
    {{/father}}

*the context*

    {
      father: {
        name: 'Raymond',
        son: {
          name: 'Eric',
          friend: {
            name: 'Alex'
          }
        }
      }
    }

*the output*

    <p>Eric's friend is Alex and his father is Raymond</p>



## Section Helpers

Similar to Handlebars.js block helpers, section helpers offer a way for you to add additional functionality to your Mustache templates.

### {{#with path}}

The `#with` helper will render its section text in the context of the specified path.

*the template*

    {{#with options}}
      The mode is {{mode}}.
    {{/with}}

*the context*

    {
      options: {
        mode: "prod"
      }
    }

*the output*

    The mode is prod.

Note that the `#with` section helper will not iterate over the items of an `Array` if its path specifies an `Array`.

*the template*

    {{#with numbers}}
      The result: {{.}}
    {{/with}}

*the context*

    {
      numbers: [1, 2, 3, 4, 5]
    }

*the output*

    The result: 1,2,3,4,5



### {{#each path}}

The `#each` helper will iterate over the items in an `Array` or the keys in an object and render its section text for each value similar to normal Mustache sections. Each value rendered will be pushed onto the context stack as usual.

For convenience, several `private` properties are available when rendering a value, namely `@index`, `@key` and `@value`. The `@index` and `@key` properties are set to the same value, that being the index or key currently being visited. The `@value` property is set to the value currently being rendered. The `@value` property can be used in place of `{{.}}` or to construct more explicit paths like `{{@value.someprop}}` instead of `{{someprop}}`.

*the template*

    {{#each numbers}}{{@index}}:{{.}},{{/each}}

*the context*

    {
      numbers: [1, 2, 3, 4, 5]
    }

*the output*

    0:1,1:2,2:3,3:4,4:5, 

Here's an example of iterating over the keys of an object.

*the template*

    {{#each options}}{{@key}}="{{@value}}"<br/>{{/each}}

*the context*

    {
      options: {
        mode: "debug",
        margins: "10px 15px 5px 5px"
      }
    }

*the output*

    mode="debug"<br/>margins="10px 15px 5px 5px"<br/>



### {{#if expression}}

The `#if` helper will render its section text only if its expression is truthy. An expression has the following restrictions:

- Cannot contain the following characters: `[]{}`
- Cannot contain assignment statements: `= += -= *= /= |= &= ++ --`
- Cannot contain function calls: `identifier()` or `identifier(arg, arg, ...)`

*the template*

    {{#if numbers.length}}
      <h1>Numbers</h1>
      {{#each numbers}}{{@value}}{{#if @index < numbers.length - 1}},{{/if}}{{/each}}
    {{/if}}

    {{#if numbers.length > 0}}
      <h2>Numbers</h2>
      {{#each numbers}}{{@value}}{{#if @index < numbers.length - 1}},{{/if}}{{/each}}
    {{/if}}

*the context*

    {
      numbers: [1, 2, 3, 4, 5]
    }

*the output*

    <h1>Numbers</h1>
    1,2,3,4,5

    <h2>Numbers</h2>
    1,2,3,4,5



### {{#unless expression}}

The `#unless` helper will render its section text only if its expression is falsy. An expression has the following restrictions:

- Cannot contain the following characters: `[]{}`
- Cannot contain assignment statements: `= += -= *= /= |= &= ++ --`
- Cannot contain function calls: `identifier()` or `identifier(args)`

*the template*

    {{#unless numbers.length === 0}}
      <h1>Numbers</h1>
      {{#each numbers}}{{@value}}{{#if @index < numbers.length - 1}},{{/if}}{{/each}} 
    {{/unless}}

    {{#unless numbers.length < 0}}
      <h2>Numbers</h2>
      {{#each numbers}}{{@value}}{{#if @index < numbers.length - 1}},{{/if}}{{/each}} 
    {{/unless}}

*the context*

    {
      numbers: [1, 2, 3, 4, 5]
    }

*the output*

    <h1>Numbers</h1>
    1,2,3,4,5

    <h2>Numbers</h2>
    1,2,3,4,5


# API

**NOTE: Beefcake.js will update the existing `Hogan` object in-place. This means the global `Hogan` variable will have the following extensions added to it.**


**Hogan.render()**

Will compile then render the specified template immediately.

    render(template, context, partials):string

    template - The template string to have rendered.
    context - The context to perform rendering with.
    partials - A hash of partials.

If `context` is an `Array` then it will be treated as the context stack.

**Hogan.registerHelper()**

Registers a section helper with the specified name.

    registerHelper(name, helper)

    name - The name of the helper.
    helper - The function to register as the helper.

Where `helper` is a function with the following signature:

    function (text, exprssion, ctx):string

    text - The section text.
    expression - The text that appears after the helper name in the Mustache token (i.e. `{{#helperName expression}}`).
    ctx - The context stack as an `Array`.

The `ctx` argument passed to a helper function is an `Array` with the following methods:

    lookup(path):any

    path - A '.' delimited path to a variable to have looked up.

Example:

    Hogan.registerHelper('with', function (text, path, ctx) {
      var parts, value, result;

      // If we didn't get a path then we just render
      // the section text as usual like the `with` does
      // not even exist (we could throw though).

      if (!path) return hogan.render(text, ctx);

      // Lookup the value of the path in the context stack.
      // If the value is null of undefined then return an empty
      // string. Otherwise we push the value onto the context
      // stack and compile a section text as a new template then
      // call its internal render function ri() so that we can
      // render with the current context stack.    

      result = '';
      value = ctx.lookup(path);

      if (value === undefined || value === null) {
        result = '';
      } else {
        ctx.push(Hogan.util.mixin(Hogan.util.create(value), {"@value": value}));
        result = Hogan.render(text, ctx);
        ctx.pop();
      }      

      return result;
    });

**Hogan.aliasHelper()**

Creates an alias for a helper, making the helper available under multiple names. The helper being aliased does not have to exist before aliasing.

    aliasHelper(name, alias)

**Hogan.getHelper()**

Retrieves a helper with the specified name.

    getHelper(name):function

**Hogan.util.isArray()**

Determines if an object is an `Array`.

    isArray(o):Boolean

**Hogan.util.override()**

Convenience function used to override a function.

    override(base, fn):function

    base - The base version of the function to override.
    fn - The new function.
    return - The new function.

Where `fn` is the new function with the following signature:

    function (base, ...)

    base - The base version of the function being overriden.
    ... - The arguments passed to the function when called.

Example:  

    var o = {
      message: function () {
        return 'hello';
      }
    };
    o.message = Hogan.util.override(o.message, function (base) {
      return base.call(this) + ' world!';
    });
    // hello world!
    o.message();

**Hogan.util.create()**

Creates a new object with the specified object as its prototype. This function accepts literal values such as numbers, booleans, and strings.

    create(o):Object

**Hogan.util.mixin()**

Adds the properties of each argument passed after the first argument to the first arguemnt.

    mixin(o, ...):any

    o - The object to receive the mixin operation.
    ... - The objects to have their properties copied.

**Hogan.util.trim()**

Trims the leading and trailing whitespace from a string.

    trim(s):string

**Hogan.util.escapeRegExp()**

Escapes the regular expression characters in a string.

    escapeRegExp(s):string