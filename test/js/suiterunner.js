/**
Don't need to define Test class, since you should be including 
unittest.js before this file.
*/
//var Test = {}
Test.Suite = {};

/**
Handy logger object to insert last row inside any element.
*/
Test.Suite.Logger = Class.create();
Test.Suite.Logger.prototype = {
  initialize: function(element) {
    this.log = $(element);
  },
  debug: function(message) {
  	new Insertion.Bottom(this.log, "<p>" + message + "</p>");
  },
};

var logger = new Test.Suite.Logger(top.frames.log.document.getElementsByTagName("body")[0]);


/**
This is the test suite runner class. It should only be
created once on a page or for a frameset. 
*/
Test.Suite.Runner = Class.create();
Test.Suite.Runner.prototype = {
  initialize: function() {
    this.numTests = 0;
    this.numErrors = 0;
    this.success = true;
    this.abortedTests = new Array();
    this.isReadyFlag = false;
  },

  setTests: function(testUrls) {
    this.currentTest = 0;
    this.testUrls = testUrls;
    this.isReadyFlag = true;
  },
  
  isReady: function() {
  	return this.isReadyFlag;
  },

  runTests: function() {
    this.startTime = new Date().getTime();
	this.runNextTest();
  },
  
  runNextTest: function() {
    var test = this.testUrls[this.currentTest];
    if (!test) {
    	this.finishTests();
      	return;
    }

	window.top.frames["test"].location.href="tests/" + test + "?runFromSuite=1";	
	
	// give it 2/10 second to load
	setTimeout(this.findAndRunTest.bind(this), 200);
  },

  findAndRunTest: function() {
		if(window.top.frames["test"].testCase) {
			window.top.frames["test"].testCase.registerSuiteRunner(window.top.frames["suite"], "runner");
			window.top.frames["test"].testCase.runTests();
			return;
		}
	
		if(!this.count) {
			this.count = 0;
		}
		this.count++;
		
		// abort after 5 tries
		if(this.count > 5) {
			this.count = 0;
			logger.debug("aborting test cause it took too long to load");
			this.abortTest();
			return;
		}
		
		// give it 2/10 second to load
		setTimeout(this.findAndRunTest.bind(this), 200);
  },
	
  abortTest: function() {
  	this.abortedTests.push(this.getCurrentTest()); 
  	this.testComplete(1);
  },
  
  testComplete: function(numErrors, tests) {
  	var passed = (numErrors == 0);
  	this.success &= passed;
  	if(tests) {
  		this.numTests += tests.length;
  	}
  	this.numErrors += numErrors;
  	
	var testLink = "<li class=\""+ (passed ? "passed" : "failed") + "\">" +
		"<span onclick=\"toggleTests(this);\">+</span>" +
		"<a target=\"test\" href=\"" + 
		"tests/" + this.getCurrentTest() + "?noSuite=1" + "\">" + 
		this.getCurrentTest() + "</a>"
		+ this.getTestLinks(this.getCurrentTest(), tests)
		+"</li>";  	
	new Insertion.Bottom(top.frames["suite"].document.getElementById("testCaseList"), 
		testLink);
  	
  	// try and run next test
    this.currentTest++;
  	this.runNextTest();
  },
  
  getTestLinks: function(testCase, tests) {
	var html = "<ul class=\"testList\" style=\"display:none\">";
	for(var i = 0; i < tests.length; i++) {
		var test = tests[i];
		var passed = (test.failures == 0) && (test.errors == 0);
		html += "<li class=\""+ (passed ? "passed" : "failed") +"\">";
		html +=	"<a target=\"test\" href=\"" + 
		"tests/" + testCase + "?test=" + test.name + "\">" + 
		test.name + "</a>"
		html += "</li>";
	}  	
	html += "</ul>";
	return html;
  },
  
  getSuccess: function() {
  	return this.success;
  },
  
  getNumTests: function() {
  	return this.numTests;
  },
  
  getCurrentTest: function() {
  	return this.testUrls[this.currentTest];
  },
  
  finishTests: function() {
    this.endTime = new Date().getTime();
    var timeElapsed = (this.endTime - this.startTime) / 1000;

  	// tack on status at the bottom of the suite page
	new Insertion.Bottom(top.frames["suite"].document.getElementById("resultsList"), 
  		"<li class=\"passed\">" + (this.numTests - (this.numErrors - this.abortedTests.length)) 
  		+ " test(s) passed.</li>");
	new Insertion.Bottom(top.frames["suite"].document.getElementById("resultsList"), 
  		"<li class=\"failed\">" + this.numErrors+ " test(s) failed.</li>");
  		
	// check for missing tests
	if(this.numTests == 0) {
		this.success = false;
		
		new Insertion.Bottom(top.frames["suite"].document.getElementById("resultsList"), 
  			"<li class=\"failed\">no tests were found.</li>");
	}
	
	// check for aborted tests
	if(this.abortedTests.length > 0) {
		for(i=0; i<this.abortedTests.length; i++) {
			new Insertion.Bottom(top.frames["suite"].document.getElementById("resultsList"), 
  				"<li class=\"failed\">no tests found in " + this.abortedTests[i] + ".</li>");			
		}
	}

	// tack on timing info
	new Insertion.Bottom(top.frames["suite"].document.getElementById("resultsList"), 
  		"<li>Finished after " + timeElapsed + " seconds.</li>");

	// update the suite page background to reflect status
	var resultBodyClass = "passedBackground";
	if(!this.success) {
		resultBodyClass = "failedBackground";
	} 
	Element.addClassName(top.frames["suite"].document.getElementsByTagName("body")[0], resultBodyClass);

	// Inform the servlet of our status
    new Ajax.Request("/results", 
        { method: 'get', parameters: 'result=' + this.getSuccess(), asynchronous: false });
  }
}

/**
Extend the unittest.js Test.Unit.Runner class so that we
can plug it into the test suite runner.
*/
Object.extend(Test.Unit.Runner.prototype, {
	registerSuiteRunner: function(frame, javaScriptVar) {
		if(frame && frame[javaScriptVar] 
			&& !window.location.search.parseQuery()["noSuite"]) {
			this.suiteRunner = frame[javaScriptVar];
		}
		
		this.registerCalled = true;
	},
	
	postResults: function() {
		if(this.suiteRunner) {
			this.suiteRunner.testComplete(this.countErrors(), this.tests);
		}
	},
	
	countErrors: function() {
		var errors = 0;
	    for(var i=0;i<this.tests.length;i++) {
	      errors   +=   this.tests[i].failures;
    	  errors   +=   this.tests[i].errors;
    	}
    	return errors;
	},
});

// Hijack the existing initialize method so that we don't call runTests()
Test.Unit.Runner.prototype.initializeSuper = Test.Unit.Runner.prototype.initialize;

// Redefine runTests() to do nothing while in initialize()
Test.Unit.Runner.prototype.initialize = function(testcases) {
	// Check if the user only wants to run a single test
	var singleTestToRun = window.location.search.parseQuery()["test"];
	if(singleTestToRun) {
		for(var testcase in testcases) {
        	if(/^test/.test(testcase) && testcase != singleTestToRun) {
        		delete testcases[testcase];	
			}
		}
	}  

	// Short-circuit the runTests call if running in the suite
	if(window.location.search.parseQuery()["runFromSuite"]) {
		var oldRunTests = this.runTests;
		this.runTests = function() {};
		this.initializeSuper(testcases);
		this.runTests = oldRunTests;
	} else {
		this.initializeSuper(testcases);	
	}
}