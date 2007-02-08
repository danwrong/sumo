var HCard = Microformat.define('vcard', {
  one : ['bday', 'tz', 'sort-string', 'uid', 'class', {
    'n' : {
      one : ['family-name', 'given-name', 'additional-name'],
      many : ['honorific-prefix', 'honorific-suffix']
    },
    'geo' : {
      one : ['latitude', 'longitude']
    },
    // inferred n from fn special case
    'fn' : function(node, data) {
      var fn = this._extractData(node, 'simple');
      if (m = fn.match(/^(\w+) (\w+)$/)) {
        data.n = data.n || {};
        data.n.givenName = data.n.givenName || m[1];
        data.n.familyName = data.n.familyName || m[2];
      }
      return fn;
    }
  }],
  many : ['label', 'sound', 'title', 'role', 'key', 'mailer', 'rev', 'nickname', 'category', 'note', { 
      'url' : 'url', 'logo' : 'url', 'photo' : 'url' 
    }, {
    'email' : {
      many : ['type', { 'value' : 'url' }]
    },
    'tel' : {
      many : ['type', 'value']
    },
    'adr' : {
      one : ['post-office-box', 'extended-address', 'street-address', 'locality', 'region',
             'postal-code', 'country-name', 'value'],
      many : ['type']
    },
    'org' : {
      one : ['organization-name', 'organization-unit']
    }
  }]
});

// Implied n processor
HCard.addHandler('fn', function(value, data) {
  // TODO
})