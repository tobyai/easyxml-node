require("inflector"); // modifies global string object

var et = require('elementtree');
var ElementTree = et.ElementTree;
var element = et.Element;
var subElement = et.SubElement;

/**
 * This function merges two objects. Pretty simple stuff.
 */
function merge(obj1, obj2) {
    var obj3 = {};
    for (var attr1 in obj1) {
        obj3[attr1] = obj1[attr1];
    }
    for (var attr2 in obj2) {
        obj3[attr2] = obj2[attr2];
    }
    return obj3;
}

/**
 * This function pads a number so that it is two digits
 */
function zeroPadTen(val) {
    if (val < 10) {
        return "0" + val;
    }
    return val;
}

/**
 * This is our main EasyXml object which gets exported as a module
 */
var EasyXml = function() {
    var self = this;

    /**
     * Default configuration object
     */
    self.config = {
        singularizeChildren: true,
        underscoreAttributes: true,
        underscoreChar: '_',
        rootElement: 'response',
        dateFormat: 'ISO', // ISO = ISO8601, SQL = MySQL Timestamp, JS = (new Date).toString()
        manifest: false,
        indent: 4
    };

    /**
     * Public
     * Merges in the provided config object with the defaults
     */
    self.configure = function(config) {
        // should be merge, otherwise we lose defaults
        self.config = merge(self.config, config);
        console.log("incoming settings:",config );
        console.log("settings:",self.config );
    };

    /**
     * Public
     * Takes an object and returns an XML string
     */
    self.render = function(object, rootElementOverride) {
        console.log("Root:", self.config.rootElement);
        var root = rootElementOverride || self.config.rootElement;
        console.log("parsing object:", object);
        
        if(root){
            var xml = element(root);
            parseChildElement(xml, object);
        }
        else{
            var keys=Object.keys(object);
            var key=keys[0]
            var xml = element(key);
            if (object[key] instanceof Array){
                for(var i in object[key]){
                    var item=object[key][i]
                    console.log("parse list item:", item);
                    parseChildElement(xml,item);
                }
            }
            else{
                console.log("parse hole:", object[key]);
                parseChildElement(xml,object[key]);
            }

        }
        var tree = new ElementTree(xml);
        return tree.write({
            xml_declaration: self.config.manifest,
            indent: self.config.indent
        });
    };

    /**
     * Recursive, Private
     * Takes an object and attaches it to the XML doc
     */
    function parseChildElement(parentXmlNode, parentObjectNode) {
        for (var key in parentObjectNode) {
            if (parentObjectNode.hasOwnProperty(key)) {
                var child = parentObjectNode[key];
                var el = null;

                if (!self.config.singularizeChildren && typeof parentXmlNode === 'object' && typeof child === 'object') {
                    el = subElement(parentXmlNode, key);
                    for (var key in child) {
                        if (typeof child[key] === 'object') {
                            console.log("0", key)
                            parseChildElement(el, child[key]);
                        } else {
                            console.log("1", key)
                            var newel = subElement(el, key);
                            newel.text = child[key].toString();
                        }
                    }
                    // parseChildElement(, child);
                } else if (self.config.underscoreAttributes && key.charAt(0) === self.config.underscoreChar) {
                    // Attribute
                    if (typeof child === 'string' || typeof child === 'number') {
                        if(key === self.config.underscoreChar)
                          parentXmlNode.text=child;
                        else
                          parentXmlNode.set(key.substring(1), child);
                    } else {
                        throw new Error(key + "contained non_string_attribute");
                    }
                } else if (child === null) {
                    // Null data, send an empty tag
                    console.log("2")
                    el = subElement(parentXmlNode, key);
                } else if (typeof child === 'object' && child.constructor && child.constructor.name && child.constructor.name === 'Date') {
                    // Date
                    console.log("3")
                    el = subElement(parentXmlNode, key);
                    if (self.config.dateFormat === 'ISO') {
                        // ISO: YYYY-MM-DDTHH:MM:SS.mmmZ
                        el.text = child.toISOString();
                    } else if (self.config.dateFormat === 'SQL') {
                        // SQL: YYYY-MM-DD HH:MM:SS
                        var yyyy    = child.getFullYear();
                        var mm      = zeroPadTen(child.getMonth() + 1);
                        var dd      = zeroPadTen(child.getDate());
                        var hh      = zeroPadTen(child.getHours());
                        var min     = zeroPadTen(child.getMinutes());
                        var ss      = zeroPadTen(child.getSeconds());

                        el.text = yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + min + ':' + ss;
                    } else if (self.config.dateFormat === 'JS') {
                        // JavaScript date format
                        el.text = child.toString();
                    } else {
                        throw new Error(key + "contained unknown_date_format");
                    }
                } else if (typeof child === 'object' && child.constructor && child.constructor.name && child.constructor.name === 'Array') {
                    // Array
                    console.log("4")
                    el = subElement(parentXmlNode, key);
                    var subElementName = key.singular();
                    for (var key2 in child) {
                        // Check type of child element
                        if (child.hasOwnProperty(key2) && typeof child[key2] === 'object') {
                            var el2 = subElement(el, subElementName);
                            console.log("5")
                            parseChildElement(el2, child[key2]);
                        } else {
                            // Just add element directly without parsing
                            var el2 = subElement(el, subElementName);
                            el2.text = child[key2].toString();
                        }
                    }
                } else if (typeof child === 'object') {
                    // Object, go deeper
                    console.log("6")
                    el = subElement(parentXmlNode, key);
                    parseChildElement(el, child);
                } else if (typeof child === 'number') {
                    // It's a number
                    el = subElement(parentXmlNode, key);
                    el.text = child.toString();
                } else if (typeof child === 'string') {
                    // It's a string
                    el = subElement(parentXmlNode, key);
                    el.text = child;
                } else if (typeof child === 'boolean') {
                    // It's a true or a false
                    el = subElement(parentXmlNode, key);
                    el.text = child.toString();
                } else if (typeof child === 'undefined') {
                    // It's undefined
                    el = subElement(parentXmlNode, key);
                } else {
                    throw new Error(key + " contained unknown_data_type: " + typeof child);
                }
            }
        }
    }
};

module.exports = new EasyXml();
