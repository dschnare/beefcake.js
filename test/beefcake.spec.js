var Hogan = require('../beefcake');

describe('Hogan', function () {
  describe('Descendant Context and Root Context', function () {
    it('should move down the context stack', function () {
      var view = {
        father: {
          name: 'Raymond',
          son: {
            name: 'Eric',
            friend: {
              name: 'Alex'
            }
          }
        }
      };

      var template = '{{#father.son}}{{#friend}}<p>{{:name}}\'s friend is {{name}}</p>{{/friend}}{{/father.son}}';
      var result = Hogan.render(template, view);
      expect(result).toBe('<p>Eric\'s friend is Alex</p>');

      template = '{{#father}}{{#son}}{{#friend}}<p>{{:name}}\'s friend is {{name}} and his father is {{::name}}</p>{{/friend}}{{/son}}{{/father}}';
      result = Hogan.render(template, view);
      expect(result).toBe('<p>Eric\'s friend is Alex and his father is Raymond</p>');
    }); 

    it('should move down to the root of the context stack', function () {
      var view = {
        father: {
          name: 'Raymond',
          son: {
            name: 'Eric',
            friend: {
              name: 'Alex'
            }
          }
        }
      };    

      var template = '{{#father}}{{#son}}{{#friend}}<p>{{:name}}\'s friend is {{name}} and his father is {{~father.name}}</p>{{/friend}}{{/son}}{{/father}}';
      var result = Hogan.render(template, view);
      expect(result).toBe('<p>Eric\'s friend is Alex and his father is Raymond</p>');
    });  
  });

  describe('#with', function () {
    it('should render section text with specified context', function () {
      var view = {
        options: {
          mode: "prod"
        }
      };

      var template = '{{#with options}}The mode is {{mode}}.{{/with}}';
      var result = Hogan.render(template, view);
      expect(result).toBe('The mode is prod.');
    });

    it('should not render an Array\'s items', function () {
      var view = {
        numbers: [1, 2, 3, 4, 5]
      };

      var template = '{{#with numbers}}The result: {{@value}}{{/with}}';
      var result = Hogan.render(template, view);
      expect(result).toBe('The result: 1,2,3,4,5');
    });
  });

  describe('#each', function () {
    it('should render each item in an Array', function () {
      var view = {
        numbers: [1, 2, 3, 4, 5]
      };

      var template = '{{#each numbers}}{{@index}}:{{.}},{{/each}}';
      var result = Hogan.render(template, view);
      expect(result).toBe('0:1,1:2,2:3,3:4,4:5,');

      template = '{{#each numbers}}{{@index}}:{{@value}},{{/each}}';
      result = Hogan.render(template, view);
      expect(result).toBe('0:1,1:2,2:3,3:4,4:5,');
    });

    it('should render each property in an object', function () {
      var view = {
        options: {
          mode: "debug",
          margins: "10px 15px 5px 5px"
        }
      };

      var template = '{{#each options}}{{@key}}="{{@value}}"<br/>{{/each}}';
      var result = Hogan.render(template, view);
      expect(result).toBe('mode="debug"<br/>margins="10px 15px 5px 5px"<br/>');    
    });
  });

  describe('#if', function () {
    it('should throw if expression is invalid', function () {
      expect(function () { 
        Hogan.render('{{#if 45[]}}{{/if}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#if 45{}}{{/if}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#if 45++}}{{/if}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#if 45--}}{{/if}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#if 45+=3}}{{/if}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#if a=b}}{{/if}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#if 45-=}}{{/if}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#if 45/=}}{{/if}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#if 45*=}}{{/if}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#if 45|=}}{{/if}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#if 45&=}}{{/if}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#if test()}}{{/if}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#if test  ( )}}{{/if}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#if test(1, 2, age)}}{{/if}}', {});
      }).toThrow();
    });

    it('should render seciton text if expression is truthy', function () {
      var view = {
        numbers: [1, 2, 3, 4, 5]
      };

      var template = '{{#if numbers.length}}<h1>Numbers</h1>\n{{#each numbers}}{{@value}}{{#if @index < numbers.length - 1}},{{/if}}{{/each}}{{/if}}\n\n{{#if numbers.length > 0}}<h2>Numbers</h2>\n{{#each numbers}}{{@value}}{{#if @index < numbers.length - 1}},{{/if}}{{/each}}{{/if}}';
      var result = Hogan.render(template, view);
      expect(result).toBe('<h1>Numbers</h1>\n1,2,3,4,5\n\n<h2>Numbers</h2>\n1,2,3,4,5');
    });
  });

  describe('#unless', function () {
    it('should throw unless expression is invalid', function () {
      expect(function () { 
        Hogan.render('{{#unless 45[]}}{{/unless}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#unless 45{}}{{/unless}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#unless 45++}}{{/unless}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#unless 45--}}{{/unless}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#unless 45+=3}}{{/unless}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#unless a=b}}{{/unless}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#unless 45-=}}{{/unless}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#unless 45/=}}{{/unless}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#unless 45*=}}{{/unless}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#unless 45|=}}{{/unless}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#unless 45&=}}{{/unless}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#unless test()}}{{/unless}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#unless test  ( )}}{{/unless}}', {});
      }).toThrow();

      expect(function () { 
        Hogan.render('{{#unless test(1, 2, age)}}{{/unless}}', {});
      }).toThrow();
    });

    it('should render seciton text if expression is falsy', function () {
      var view = {
        numbers: [1, 2, 3, 4, 5]
      };

      var template = '{{#unless numbers.length === 0}}<h1>Numbers</h1>\n{{#each numbers}}{{@value}}{{#if @index < numbers.length - 1}},{{/if}}{{/each}}{{/unless}}\n\n{{#unless numbers.length < 0}}<h2>Numbers</h2>\n{{#each numbers}}{{@value}}{{#if @index < numbers.length - 1}},{{/if}}{{/each}}{{/unless}}';
      var result = Hogan.render(template, view);
      expect(result).toBe('<h1>Numbers</h1>\n1,2,3,4,5\n\n<h2>Numbers</h2>\n1,2,3,4,5');
    });
  });
});