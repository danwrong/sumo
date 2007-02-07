var HCard = Microformat.define('vcard', {
  one : ['fn', 'bday', 'tz', 'sort-string', 'uid', 'class', {
    'n' : {
      one : ['family-name', 'given-name', 'additional-name'],
      many : ['honorific-prefix', 'honorific-suffix']
    },
    'geo' : {
      one : ['latitude', 'longitude']
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