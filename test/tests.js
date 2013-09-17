/*jshint strict:false*/
/*global __dirname describe it require*/

var assert  = require("chai").assert,
    fs      = require("fs"),
    path    = require("path"),

    easyXML = require("../index.js");

describe("Node EasyXML", function () {
  var should = {
        "names"  : "should parse a JSON object into XML",
        "names1" : "should parse a JSON object with attrs into XML",
        "names2" : "should parse a JSON object with attrs and text node into XML",
        "singularizeChildren" : "should parse a JSON object without singularizeChildren to XML",
        "singularizeChildren2" : "should parse a JSON object without singularizeChildren to XML (with object)",
        "no_wrapper" : "Should parse a JSON without adding a wrapper",
        "no_wrapper2" : "Should parse a JSON without adding a wrapper"
      };

  Object.keys(should)
    .forEach(function(name){
      it(should[name], function (done) {
        var options={}
        if (name === 'singularizeChildren' || name === 'singularizeChildren2') {
          options.singularizeChildren= false ;
        } 

        if (name === 'no_wrapper'){//} || name === "no_wrapper2") {
          options.rootElement = null
        } 
          
        easyXML.configure(options);

        var file = __dirname + "/fixtures/" + name;

        fs.readFile(file + ".xml", "UTF-8", function (err, data) {
          if (err) {
            throw err;
          }

          var json = require(file + ".json");

          var resp=easyXML.render(json)
          assert.equal(resp, data, "EasyXML should create the correct XML from a JSON data structure.");
          assert.strictEqual(easyXML.render(json), data, "EasyXML should create the correct XML from a JSON data structure.");

          done();
        });
      });
    });
});
