/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */

define( function( require, exports, module ) {
    'use strict';
	var prefix = 'alemonteiro.bracketsSqlConnector';
	
	module.exports = {
		ENABLE 				: prefix+'.enable',
		LIST_TABLES 		: 'alemonteiro.bracketsSqlConnector.listTables',
		EXECUTE_CURRENT 	: prefix+'.executeCurrent',
		EXECUTE_CURRENT_FILE :  prefix+'.executeCurrentFile',
		CONNECTIONS			:  prefix+'.manageConnections',
		TOGGLE_RESULT_PANEL 	:  prefix+'.toggleResultPane',
		TOGGLE_BROWSER_PANEL :  prefix+'.toggleBrowserPane',
		OPEN_RESULT_PANE 	:  prefix+'.openResultPane',
		DISCONNECT_ALL 		:  prefix+'.disconnectAll',
		VIEW_LOG 			:  prefix+'.viewLog',
        VIEW_MODIFICATIONS   : prefix+'.viewModifications',
        VIEW_MODIFICATIONS_SCRIPT : prefix+'.viewModificationsScript',
        CLEAR_MODIFICATIONS : prefix+'.clearModifications',
        CLEAR_LOG : prefix+'.clearLog'
	};
});
