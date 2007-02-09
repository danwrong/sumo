/**
 This object is used to find files given a hidden frame, a file name pattern, 
 and a callback function to execute once all the files are found.
 */
Test.Suite.FileFinder = Class.create();
Test.Suite.FileFinder.prototype = {
  initialize: function(frame, fileNameContains, callback) {
  	this.frame = frame;
  	this.fileNameContains = fileNameContains;
  	this.dirList = new Array();
  	this.dirIndex = 0;
  	this.filesFound = new Array();
  	this.firstTime = true;
  	this.callback = callback;
  },
  getFilesFound: function() {
  	return this.filesFound;
  },
  scanDirectory: function(dir) {
	this.frame.location.href = dir;
	setTimeout((function() {this.processDirectory(dir)}).bind(this), 200);
  },
  processDirectory: function(dir) {
	var fileDoc = this.frame.document;
	logger.debug("processDirectory():" + dir);

	// delay until we find at least 1 link, since it should be the directory itself	
	if (fileDoc.links.length == 0) {
		logger.debug("waiting for dir to load...");
		setTimeout((function() {this.processDirectory(dir)}).bind(this), 200);
		return;
	}

	if (this.firstTime) {
		this.firstTime = false;
		this.startingDir = this.frame.location.href;
		logger.debug("starting dir: " + this.startingDir);
		this.startingDirLength = this.startingDir.length;
		logger.debug("starting dir length: " + this.startingDirLength);
	}
	
	for (i=0; i < fileDoc.links.length; i++) {
		var link = fileDoc.links[i];
		var href = link.href;

		// Hold onto directory names to recurse into		
		if (link.firstChild instanceof HTMLImageElement) {
			if(link.firstChild.alt.indexOf("Directory") >= 0) {
				logger.debug("alt: " + link.firstChild.alt);
				// DONT RECURSES
				//this.dirList.push(href);
				logger.debug("add dir: " + href);
			}
		}
		
		if (href.indexOf(this.fileNameContains) > 0) {
			var shortName = href.substring(this.startingDirLength);
			logger.debug("test: " + shortName);
			this.filesFound.push(shortName);
		}
	}
	
	if (this.dirIndex < this.dirList.length) {
		this.scanDirectory(this.dirList[this.dirIndex++]);
	} else {
		this.callback(this.filesFound);
	}
  },
};

/**
Here we actually create the Test.Suite.Runner object if
the user is not running in JUnit/Jetty. Otherwise, the servlet
generates the Test.Suite.Runner object along with the 
dynamic test case list.
*/

if(top.location.href.indexOf("file://") == 0) {
	var runner = new Test.Suite.Runner();
	var finder = new Test.Suite.FileFinder(top.frames.fileLoader, "Test.htm", 
		function(tests) {runner.setTests(tests);});
	finder.scanDirectory("tests/");
}