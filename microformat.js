if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(func, scope) {
    scope = scope || this;
    for (var i = 0, l = this.length; i < l; i++)
      func.call(scope, this[i], i, this); 
  }
}

if (!Array.prototype.map) {
  Array.prototype.map = function(func, scope) {
    scope = scope || this;
    var list = [];
    for (var i = 0, l = this.length; i < l; i++)
        list.push(func.call(scope, this[i], i, this)); 
    return list;
  }
}

if (!Array.prototype.filter) {
  Array.prototype.filter = function(func, scope) {
    scope = scope || this;
    var list = [];
    for (var i = 0, l = this.length; i < l; i++)
        if (func.call(scope, this[i], i, this)) list.push(this[i]); 
    return list;
  }
}

['forEach', 'map', 'filter', 'slice', 'concat'].forEach(function(func) {
    if (!Array[func]) Array[func] = function(object) {
      return this.prototype[func].apply(object, Array.prototype.slice.call(arguments, 1));
    }
});

Microformat = {
  define : function(name, spec) {
    var mf = function(node, data) {
      this.parentElement = node;
      Microformat.extend(this, data);
    };
    
    mf.container = name;
    mf.format = spec;
    mf.handlers = {};
    mf.prototype = Microformat.Base;
    return Microformat.extend(mf, Microformat.SingletonMethods);
  },
  SingletonMethods : {
    discover : function(context) {
      return Microformat.$$(this.container, context).map(function(node) {
        return new this(node, this._parse(this.format, node));
      }, this);
    },
    addHandler : function(prop, callback) {
      this.handlers[prop] = callback;
    },
    _parse : function(format, node) {
      var data = {};
      Microformat.extend(data, this._parseOne(format, node));
      Microformat.extend(data, this._parseMany(format, node));
      return data;
    },
    _parseOne : function(format, context) {
      var ones = {}, node;
      format.one.forEach(function(item) {
        if (typeof item == 'string') {
          if (node = Microformat.$$(item, context)[0]) 
            ones[this._propFor(item)] = this._extractData(node, 'simple');
        } else {
            for (var cls in item) 
              if (node = Microformat.$$(cls, context)[0]) {
                ones[this._propFor(cls)] = this._extractData(node, item[cls]);
              }
        }
      }, this);
      return ones;
    },
    _parseMany : function(format, context) {
      var manies = {}, nodes;
      format.many.forEach(function(item) {
        if (typeof item == 'string') {
          nodes = Microformat.$$(item, context);
          if (nodes.length > 0) manies[this._propFor(item) + 'List'] = nodes.map(function(node) {
            return this._extractData(node, 'simple');
          }, this);
        } else {
          nodes = Microformat.$$(cls, context);
          for (var cls in item) {
            nodes = Microformat.$$(item[cls], context);
            if (nodes.length > 0) manies[this._propFor(cls + 'List')] = nodes.map(function(node) {
              return this._extractData(node, item[cls]);
            }, this);
          }
        }
      }, this);
      return manies;
    },
    _extractData : function(node, dataType) {
      switch (dataType) {
        case 'simple': return this._extractSimple(node);
        case 'url': return this._extractURL(node);
      }
      return this._parse(dataType, node);
    },
    _extractURL : function(node) {
      var href;
      switch (node.nodeName.toLowerCase()) {
        case 'img':    href = node.src;
                       break;
        case 'a':      href = node.href;
                       break;
        case 'object': href = node.data;
      }
      if (href) {
        if (href.indexOf('mailto:') == 1) 
          href = href.replace(/^mailto:/, '').replace(/\?.*$/, '');
        return href;
      }
      
      return this._coerce(this._getText(node));
    },
    _extractSimple : function(node) {
      switch (node.nodeName.toLowerCase()) {
        case 'abbr': return this._coerce(node.title);
        case 'img': return this._coerce(node.alt);
      }
      return this._coerce(this._getText(node));
    },
    _getText : function(node) {
      if (node.innerText) return node.innerText;
      return Array.map(node.childNodes, function(node) {
        if (node.nodeType == 3) return node.nodeValue;
        else return this._getText(node);
      }, this).join('');
    },
    _coerce : function(value) {
      var date, number;
      if (value == 'true') return true;
      if (value == 'false') return false;
      if (date = Date.parse(value.replace(/-/g, '/'))) return new Date(date);
      if (number = parseFloat(value)) return number;
      return String(value);
    },
    _propFor : function(name) {
      this.__propCache = this.__propCache || {};
      if (prop = this.__propCache[name]) return prop;
      return this.__propCache[name] = name.replace(/(-(.))/g, function() {
        // this isn't going to work on old safari without the fix....hmmm
        return arguments[2].toUpperCase();
      });
    },
    _handle : function(prop, item, data) {
      if (this.handlers[prop]) this.handlers[prop].call(this, item, data);
    }
  },
  $$ : function(className, context) {
    context = context || document;
    var nodeList;

    if (context == document || context.nodeType == 1) {
      if (typeof document.evaluate == 'function') {
        var xpath = document.evaluate(".//*[contains(concat(' ', @class, ' '), ' " + className + " ')]", 
                                      context, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        var els = [];
        for (var i = 0, l = xpath.snapshotLength; i < l; i++)
         els.push(xpath.snapshotItem(i));
        return els;
      } else nodeList = context.getElementsByTagName('*');
    } else nodeList = context;

    var re = new RegExp('(^|\\s)' + className + '(\\s|$)');
    return Array.filter(nodeList, function(node) {  return node.className.match(re) });
  },
  extend : function(dest, source) {
    for (var prop in source) dest[prop] = source[prop];
    return dest;
  },
  Base : {}
};
