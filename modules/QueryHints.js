/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */
define(function (require, exports, module) {
    "use strict";

	var Strings = require('modules/Strings'),
		SqlRef = require('modules/SqlReferences').mysql;

    var lastLine,
        lastFileName,
        cachedMatches,
        cachedWordList,
        tokenDefinition,
        currentTokenDefinition;

	var COMMANDS = ['ALTER', 'CREATE', 'DROP', 'RENAME', 'TRUNCATE' ],
		COMMANDS_TARGET = ['TABLE', 'VIEW', 'FUNCTION', 'PROCEDURE', 'TRIGGER', 'INDEX'],
		QUERY_WORDS = [
			'INSERT', 'DELETE', 'UPDATE', 'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'AND', 'OR', 'LIMIT', 'ASC', 'DESC',
			'DISTINCT', 'WITH',
		],
		BEFORE_TABLES = ['TABLE', 'FROM', 'UPDATE', 'DELETE'],
		BEFORE_FUNCS_SYMBOLS = ['=', ',', '+', '-', '/', '*'];

    /**
     * @constructor
     */
    function QueryHints() {
		this.serverCache = [];
        this.lastLine = 0;
        this.lastFileName = "";
        this.cachedMatches = [];
        this.cachedWordList = [];
        this.tokenDefinition = /[\$a-zA-Z][\-a-zA-Z0-9_]*[a-zA-Z0-9_]+/g;
        this.currentTokenDefinition = /[\$a-zA-Z][\-a-zA-Z0-9_]+$/g;

		this.commandReg = new RegExp(COMMANDS.join("|"), "i");
		this.queryWordsReg = new RegExp(QUERY_WORDS.join("|"), "i");
		this.beforeTableWords = new RegExp(BEFORE_TABLES.join("|"), "i");
		/* Wrong exp crashing - need much more work
		this.beforeFuncSymbos = new RegExp((function() {
			var s = '';
			for (var i in BEFORE_FUNCS_SYMBOLS) {
				s += '\\' + BEFORE_FUNCS_SYMBOLS[i] + '\\';
			}
			return s;
		})());
		*/
    }

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
        	textBeforeCursor = this.editor.document.getRange(lineBeginning, cursor);

		if (textBeforeCursor === false || textBeforeCursor === "" ||
			textBeforeCursor.match(this.commandReg) ||
			textBeforeCursor.match(this.beforeTableWords)) {
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
        	textBeforeCursor = this.editor.document.getRange(lineBeginning, cursor),
        	hintList = [];

		textBeforeCursor = textBeforeCursor.replace(/[ \s]/gi, '');
        var symbolBeforeCursorArray = textBeforeCursor.match(this.currentTokenDefinition),
			c, i;

		console.log("TextBefore:" + textBeforeCursor);
		console.log("symbolBefore:" + symbolBeforeCursorArray);

		if (textBeforeCursor === false || textBeforeCursor === "") {
			for(i in COMMANDS){
				c = COMMANDS[i];
				if(c.indexOf(symbolBeforeCursorArray) > -1){
					hintList.push(c);
				}
			}
		}
		else if ( textBeforeCursor.match(this.commandReg) ) {
			for(i in COMMANDS_TARGET){
				c = COMMANDS_TARGET[i];
				if(c.indexOf(symbolBeforeCursorArray) > -1){
					hintList.push(c);
				}
			}
		}
		/*
		else if ( textBeforeCursor.match(this.beforeFuncSymbos)) {
			for(var j in SqlRef){
				c = SqlRef[j];
				if(c.name.indexOf(symbolBeforeCursorArray) > -1){
					hintList.push(c.name);
				}
			}
		}
		*/
		else {
			for(i in COMMANDS){
				c = COMMANDS[i];
				if(c.indexOf(symbolBeforeCursorArray) > -1){
					hintList.push(c);
				}
			}
		}

        return {
            hints: hintList,
            match: hintList[0],
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
        	indexOfTheSymbol = textBeforeCursor.search(this.currentTokenDefinition),
        	replaceStart = {line:cursor.line,ch:indexOfTheSymbol};

        if(indexOfTheSymbol == -1) return false;

        this.editor.document.replaceRange(hint, replaceStart, cursor);

        console.log("hint: "+hint+" | lineBeginning: "+lineBeginning.line+', '+lineBeginning.ch+" | textBeforeCursor: "+textBeforeCursor+" | indexOfTheSymbol: "+indexOfTheSymbol+" | replaceStart: "+replaceStart.line+', '+replaceStart.ch);

        return false;
    };

	exports.QueryHints = QueryHints;

});
