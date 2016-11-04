/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */
define(function (require, exports, module) {
	'use strict';

	var FileSystem = brackets.getModule( 'filesystem/FileSystem' ),
		Mustache = brackets.getModule("thirdparty/mustache/mustache");

	var fixLastComma = function(text) {
		return text.replace(/(,)([ \t\n\r\s]*(\)|\]|FROM|GROUP|ORDER|HAVING))/gi, '$2');
	},

    /**
     * Simple SQL Formatting
     * @param   {string}   str SQL Query to format
     * @returns {string} Formatted SQL Query
     */
    formatSQL = function(str) {

        if ( str.indexOf("\n\t") > -1 ) {
           return str;
        }

		var steps = [
            {
                // End of Command: Two breaks after
                search: /;/gi,
                replace: "$&\n\n"
            },
			{
				// "Main" Words: Break before and after with one indent after
				search: /(select |from |where |order |group |having |limit )/gi,
				replace: "\n$&\n\t"
			},
			{
				// JOINS: Break before and after with two indent before
				search: /(inner join |right join |left join |outter join )/gi,
				replace: "\n\t\t$&"
			},
			{
				// ON: Break before and tree indent before
				search: /( on)/gi,
				replace: "\n\t\t\t$&"
			},
			{
				// ',' not inside (): Break after with one indent after
				search: /,(?![^\(]*\))/gi,
				replace: "$&\n\t"
			},
			{
				// AND: Break Before with one indent before
				search: /( and)/gi,
				replace: "\n\t$&"
			}
		];

		for(var i=0,il=steps.length,s;i<il;i++) {
			s = steps[i];
			str = str.replace(s.search, s.replace);
		}

        return str;
    };

	function SQLTemplates(engine) {
		this.loaded_templates = {};
		this.engine = engine;
		this.path = 'templates/' + engine + '/';
		this.templates = [];
	}

	SQLTemplates.prototype.listAllTemplates = function() {
		var _this = this;
		FileSystem.getFileForPath(require.toUrl(this.path), function(err, dir) {
			if ( err ) return;
			dir.getContents(function(err, files, stats, errors) {
				for(var i=0,il=files.length, f;i<il;i++) {
					_this.templates.push(
						f.fullPath.substring(f.fullPath.lastIndexOf('/'), f.fullPath.indexOf('.') > 0 ? f.fullPath.lastIndexOf('.')-1 : f.fullPath.length)
					);
				}
			});
		});
	};

	SQLTemplates.prototype.loadTemplate = function(name, extension, callback) {
		if ( typeof extension === 'function' ) {
			callback = extension;
			extension = 'sql';
		}
		var _this = this,
			path = require.toUrl(this.path + name + "." + (extension || 'sql')),
		 	file = FileSystem.getFileForPath(path);
		return file.read(function(err, data, stat) {
			if ( err ) {
				callback(err);
				return;
			}
			_this.loaded_templates[name] = data;
			callback(err, data, stat);
		});
	};

	SQLTemplates.prototype.getTemplate = function(name, extension, callback) {
		if ( typeof extension === 'function' ) {
			callback = extension;
			extension = 'sql';
		}
		if ( typeof this.loaded_templates[name] !== 'string' ) {
			return this.loadTemplate(name, extension, callback);
		}
		else {
		 	return callback(false, this.loaded_templates[name]);
		}
	};

	SQLTemplates.prototype.parse = function(name, data, callback) {
		var _this = this;
		return this.getTemplate(name, function(err, template) {
			if ( err ) {
				callback(err);
				return;
			}
			try {
				var sql = Mustache.render(template, data);
				sql = fixLastComma(sql);
				callback(err, name, sql);
			}
			catch(err) {
				callback(err.message);
			}
		});
	};

	SQLTemplates.prototype.getTemplatesNames = function(type) {
		return this.templates.filter(function(el, i) {
			return el.indexOf(type+'-') === 0;
		});
	};

	// 'static' methods and properties
	var loaded_engines = {},
	getEngine = function(engine) {
		if ( loaded_engines[engine] === undefined ) {
			loaded_engines[engine] = new SQLTemplates(engine);
			loaded_engines[engine].listAllTemplates();
		}
		return loaded_engines[engine];
	};

	exports.getEngine = getEngine;
	exports.format = formatSQL;
});
