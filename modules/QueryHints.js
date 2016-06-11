/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */
define(function (require, exports, module) {
    "use strict";

	var Strings = require('modules/Strings'),
		SqlRef = require('modules/SqlReferences').mysql;

	// Generic Know Commands
	var COMMANDS = ['ALTER', 'CREATE', 'DROP', 'RENAME', 'TRUNCATE', 'EXEC', 'EXECUTE', 'SELECT', 'MODIFY', 'SET', 'ADD ' ],
		COMMANDS_TARGET = ['COLUMN', 'DATABASE', 'SCHEMA', 'INDEX', 'FUNCTION', 'TABLE', 'VIEW', 'PROCEDURE', 'TRIGGER',  'FOREIGN KEY'],
		QUERY_WORDS = [
			'INSERT', 'DELETE', 'UPDATE', 'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'AND', 'OR', 'LIMIT', 'ASC', 'DESC', 'AS', 'DISTINCT', 'WITH', 'SET', 'TOP'
		],
		BEFORE_TABLES_WORDS = ['TABLE', 'FROM', 'UPDATE'],
		AFTER_TABLES_WORDS = ['WHERE', 'SET', 'ORDER BY', 'GROUP BY'],
		COL_TYPES = ['int', 'varchar', 'text', 'varbinary', 'char', 'date', 'datetime'],
		COL_WORDS = ['AUTO_INCREMENT', 'PRIMARY KEY', 'REFERENCES', 'NOT', 'NULL', 'DEFAULT', 'INDEX'],
		BEFORE_FUNCS_SYMBOLS = ['=', ',', '+', '-', '/', '*', '('],
		BEFORE_STOP_HINTS_WORDS = ['AS', 'ADD', 'CREATE [\[?a-zA-Z0-9_z-\]?]'],

	// Loaded data from database
		TABLES = [],
		FIELDS = {},
		REFERENCES = [],

	// Internal cache
		LAST_USED_TABLES = [];

    /**
     * @constructor
     * @description Define a number of regularion expressions to be used on check / get hints
     */
    function QueryHints() {
		this.insertHintOnTab = true;
		this.tableCommandDefinition = /(FROM|JOIN|UPDATE|TABLE|INSERT[\s\ ]INTO)+[\s\t\n\r ]+\[?`?([\-a-zA-Z0-9_\-]+)\`?\]?[\s\t ]*[AS|SET]?[\s\t ]*\[?`?([\$a-zA-Z][\-a-zA-Z0-9_\-]*)?\]?`?;?/gmi;

		this.beforeStopReg = new RegExp(BEFORE_STOP_HINTS_WORDS.join("|"), "gi");
		this.commandReg = new RegExp(COMMANDS.join("|"), "gi");
		this.beforeTableReg = new RegExp(BEFORE_TABLES_WORDS.join("|"), "gi");
		this.queryWordsReg = /INSERT|DELETE|UPDATE|FUNCTION|PROCEDURE|TRIGGER|INDEX/gi;
		this.beforeTableWords = /INSERT[\s ]INTO|DELETE|DELETE[\s ]FROM|UPDATE|SELECT|FROM|WHERE|ORDER BY|GROUP BY|AND|OR|LIMIT|ASC|DESC/gi;

		this.isInSelectReg = /[\n\r\s\t ;]?SELECT[\s\t\n\r \(\)\[\]\+\-\*\\\/`´\{\}a-zA-Z0-9_,\.]*(FROM)?/;
    }

	/**
	 * Set function that will be called when fields from a table are required
	 * @param   function func function(@string table_name) { // must call QueryHints.setTableFields(table_name, [field_name, field_name,...])}
	 */
	QueryHints.prototype.setLoadTableFieldFunc = function(func) {
		this.loadTableField = function(table) {
			if ( TABLES.indexOf(table) === -1) return false;
			if ( FIELDS[table] === undefined) FIELDS[table] = [];
			func.call(func, table);
		};
	};

	/**
	 * Set fields available on an table to hints
	 * @param string table  table name
	 * @param Array<string> fields array of field names
	 */
	QueryHints.prototype.setTableFields = function(table, fields) {
		FIELDS[table.toLowerCase()] = fields;
	};

	/**
	 * Set tables available to hints
	 * @param Array<string> tables array of table names
	 */
	QueryHints.prototype.setTables = function(tables) {
		TABLES = [];
		LAST_USED_TABLES = [];
		for(var i=0,il=(tables||[]).length, t;i<il;i++){
			t = tables[i];
			TABLES.push(t);
		}
	};

	/**
	 * Set reference available to hints
	 * @param Array<object> {name: 'Func Name', desc: 'Description'} refArray Array of objects defining 'name' and 'desc' for available reference to the selected engine
	 */
	QueryHints.prototype.setRefecende = function(refArray) {
		REFERENCES = refArray || [];
	};

    /**
     *
     * @param {Editor} editor
     * A non-null editor object for the active window.
     *
     * @param {String} implicitChar
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {Boolean}
     * Determines whether the current provider is able to provide hints for
     * the given editor context and, in case implicitChar is non- null,
     * whether it is appropriate to do so.
     */
    QueryHints.prototype.hasHints = function (editor, implicitChar) {
        this.editor = editor;
        var cursor = this.editor.getCursorPos(),
        	lineBeginning = {line:cursor.line,ch:0},
			totalText = this.editor.document.getText(),
        	textBeforeCursor = this.editor.document.getRange(lineBeginning, cursor);

		if (totalText !== false && totalText.match(this.tableCommandDefinition) || (textBeforeCursor !== false && textBeforeCursor !== "" && (
			textBeforeCursor.match(this.commandReg) ||
			textBeforeCursor.match(this.beforeStopReg) ||
			textBeforeCursor.match(this.queryWordsReg) ||
			textBeforeCursor.match(this.beforeTableWords)))) {
			return true;
		}

        return false;
    };

    /**
     * Returns a list of available known commands at the command
     *
     * @param {Editor} implicitChar
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {jQuery.Deferred|{
     *              hints: Array.<string|jQueryObject>,
     *              match: string,
     *              selectInitial: boolean,
     *              handleWideResults: boolean}}
     * Null if the provider wishes to end the hinting session. Otherwise, a
     * response object that provides:
     * 1. a sorted array hints that consists of strings
     * 2. a string match that is used by the manager to emphasize matching
     *    substrings when rendering the hint list
     * 3. a boolean that indicates whether the first result, if one exists,
     *    should be selected by default in the hint list window.
     * 4. handleWideResults, a boolean (or undefined) that indicates whether
     *    to allow result string to stretch width of display.
     */
    QueryHints.prototype.getHints = function (implicitChar) {
        var cursor = this.editor.getCursorPos(),
        	lineBeginning = {line:cursor.line,ch:0},
			textTillCursor = this.editor.document.getRange({line: 0, ch: 0}, cursor),
			lastEnd = textTillCursor.lastIndexOf(";"),
			curSqlBlock = lastEnd !== -1 ? textTillCursor.substr(lastEnd+1) : textTillCursor,
			textAfterCursor = this.editor.document.getRange(cursor),
        	textBeforeCursor = this.editor.document.getRange(lineBeginning, cursor),
			wordBeforeCursor,
        	hintList = [],
			selected = -1,
			regEx = this.	tableCommandDefinition,
			tables_used = [],
			usingTableCols = false,
			cmd,
			lastWord,
			doRef = true, doFields = true, doCommands = true, doTables = true, doQueryWords = true,
			doCommandsTargerts = true,
			c, i,
			j=0,jl=0,h;


		lastEnd = textAfterCursor.indexOf(";");
		textAfterCursor = lastEnd > 0 ? textAfterCursor.substr(0, lastEnd) : textAfterCursor;
		curSqlBlock += ' ' + textAfterCursor;

		wordBeforeCursor = textBeforeCursor.split(' ');
		if ( wordBeforeCursor.length > 1 ) {
			lastWord = wordBeforeCursor[wordBeforeCursor.length-2];
			wordBeforeCursor = wordBeforeCursor[wordBeforeCursor.length-1];
			wordBeforeCursor = wordBeforeCursor.replace(/[\[\]`]*/, "");
		}
		else {
			wordBeforeCursor = wordBeforeCursor[0];
			lastWord = false;
		}

		if ( this.beforeStopReg.exec(wordBeforeCursor.toUpperCase())) {
			return {hints: [] };
		}

		console.log("Last Word: " + lastWord + " ; wordBeforeCursor " + wordBeforeCursor);

		if ( doCommands && this.commandReg.exec(wordBeforeCursor) ) {
			doCommands = false;
			doCommandsTargerts = true;
			doFields = false;
			doRef = false;
			doQueryWords = false;
			doTables = false;
		}

		if ( doTables &&  this.beforeTableReg.exec(wordBeforeCursor)) {
			doTables = true;
			doRef =false;
			doFields = false;
			doCommands = false;
			doCommandsTargerts = false;
			doQueryWords = false;
		}

		if ( doCommands && this.isInSelectReg.exec(curSqlBlock) ) {
			doCommands = false;
		}

		if ( doFields ) {
			var result;
			while((result = regEx.exec(curSqlBlock)) !== null) {
			  cmd = {
				cmd: result[1],
				table: result[2],
				alias: result.length === 4 ? result[3] : (result.length === 5 ? result[4] : result[2])
				};
				if ( tables_used.indexOf ( cmd.table ) === -1 ) {
					tables_used.push(cmd);
					// Load Field from DB if isn't cached
					if (FIELDS[cmd.table.toLowerCase()] === undefined) {
						this.loadTableField(cmd.table);
					}
				}
			}
			for(var k=0,kl=tables_used.length,tm;k<kl;k++) {
				cmd = tables_used[k];

				// if using alias or table name
				if (wordBeforeCursor.indexOf(cmd.alias+".") === 0 || wordBeforeCursor.toLowerCase().indexOf(cmd.table.toLowerCase()+".") === 0) {
					if ($.isArray(FIELDS[cmd.table.toLowerCase()])) {
						var fs = FIELDS[cmd.table.toLowerCase()],
							tmp = wordBeforeCursor.indexOf('.') > 0 ?
									(wordBeforeCursor.indexOf('.') === wordBeforeCursor.length-1 ? '' :
										(wordBeforeCursor.split('.')[1])) : wordBeforeCursor;

						for(var fi=0,fl=fs.length,f;fi<fl;fi++){
							f = fs[fi];
							if ( tmp === '' || f.match(new RegExp(tmp, "gi"))) {
								hintList.push(f);
							}
						}
						doCommands = false;
						doCommandsTargerts = false;
						doTables = false;
						doRef = false;
						doQueryWords = false;
						break;
					}
				}
			}
		}

		if ( doCommandsTargerts ) {
			j=0;jl=COMMANDS_TARGET.length;
			while(j<jl) {
				if (COMMANDS_TARGET[j].indexOf(wordBeforeCursor.toUpperCase()) === 0) {
					hintList.push(COMMANDS_TARGET[j]);
					selected = j;
				}
				j++;
			}
		}
		if ( doCommands ) {
			j=0;jl=COMMANDS.length;
			while(j<jl) {
				//if (HINTS[j].match(new RegExp(wordBeforeCursor, "i"))) {
				if (COMMANDS[j].indexOf(wordBeforeCursor.toUpperCase()) === 0) {
					hintList.push(COMMANDS[j]);
					selected = j;
				}
				j++;
			}
		}

		if ( doQueryWords ) {
			j=0;jl=QUERY_WORDS.length;
			while(j<jl) {
				//if (HINTS[j].match(new RegExp(wordBeforeCursor, "i"))) {
				if (QUERY_WORDS[j].indexOf(wordBeforeCursor.toUpperCase()) === 0) {
					hintList.push(QUERY_WORDS[j]);
					selected = j;
				}
				j++;
			}
		}
		if ( doRef ) {
			j=0;jl=REFERENCES.length;
			while(j<jl) {
				//if (HINTS[j].match(new RegExp(wordBeforeCursor, "i"))) {
				if (REFERENCES[j].name.toUpperCase().indexOf(wordBeforeCursor.toUpperCase()) === 0) {
					hintList.push($('<li><label>'+REFERENCES[j].name+'</label><span>' + REFERENCES[j].desc + '</span></li>'));
					selected = j;
				}
				j++;
			}
		}

		if ( doTables ) {
			j=0;jl=TABLES.length;
			while(j<jl) {
				//if (HINTS[j].match(new RegExp(wordBeforeCursor, "i"))) {
				var tname = TABLES[j].toLowerCase();
				if (tname.indexOf(wordBeforeCursor.toLowerCase()) === 0) {
					hintList.push(TABLES[j]);
				}
				else if (hintList.length < 2 && tname !== undefined && FIELDS[tname] !== undefined && FIELDS[tname].length > 0) {
					for(var w=0,wl=FIELDS[tname].length, wf;w<wl;w++) {
						wf = FIELDS[tname][w];
						if (wordBeforeCursor === "" || wordBeforeCursor === "." || wf.toLowerCase().indexOf(wordBeforeCursor.toLowerCase()) === 0) {
							hintList.push(wf);
						}
					}
				}
				j++;
			}
		}

		if ( selected === -1 ) selected = 0;

        return {
            hints: hintList,
            match: hintList[selected],
            selectInitial: true,
            handleWideResults: false
        };
    };

    /**
     * Complete the word
     *
     * @param {String} hint
     * The hint to be inserted into the editor context.
     *
     * @return {Boolean}
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    QueryHints.prototype.insertHint = function (hint) {
        var cursor = this.editor.getCursorPos(),
        	lineBeginning = {line:cursor.line,ch:0},
        	textBeforeCursor = this.editor.document.getRange(lineBeginning, cursor),
        	indexOfTheSymbol = textBeforeCursor.search(/[a-zA-Z0-9_]+[/s/t \.]*$/),
        	replaceStart = {line:cursor.line,ch:indexOfTheSymbol};

        if(indexOfTheSymbol == -1)  return false;

		hint = typeof hint === 'string' ? hint : hint.children('label').text();

        this.editor.document.replaceRange(hint, replaceStart, cursor);

        console.log("hint: "+hint+" | lineBeginning: "+lineBeginning.line+', '+lineBeginning.ch+" | textBeforeCursor: "+textBeforeCursor+" | indexOfTheSymbol: "+indexOfTheSymbol+" | replaceStart: "+replaceStart.line+', '+replaceStart.ch);

        return false;
    };

	exports.QueryHints = QueryHints;

});
