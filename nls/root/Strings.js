/*jshint node: true*/
/* globals define*/
define( {
	// EXTENSION.
	EXTENSION_NAME: "SQL Connector",
	INSTALLING: "Installing...",
    	
	// EXECUTE OPTIONS
	EXECUTE: "Execute",
	EXECUTE_CURRENT_FILE: "Execute Current File",
	EXECUTE_CURRENT_SELECTION: "Execute Current Selection",
	EXECUTE_CURRENT: "Excure Current Selection or Current Document Open",
	SET_EDITOR_CONNECTION: "Set Editor Connection",
	
	NEW_QUERY: "Write Query",
	
	// CONNECTION / DISCONNECTION
	
	CONNECTION: 'Connection',
	CONNECTIONS: 'Connections',
	CONNECT: 'Connect',
	CONNECT_TO: 'Connect To',
	CONNECTING: 'Connecting',
	DISCONNECT: 'Disconnect',
	DISCONNECT_FROM: 'Disconnect From',
	DISCONNECT_CURRENT: 'Disconnect Current',
	DISCONNECT_ALL: 'Disconnect All',
	DISCONNECTING: 'Disconnecting',
	DISCONNECTED: 'Disconnected',
	NOT_CONNECTED: 'Not Connected',
	CONNECTED: 'Connected',
	CONNECTION_ERROR: 'Connection Error',
	NEW_CONNECTION: 'Create New Connection',
	TEST_CONNECTION: "Test Connection",
	
	// GENERAL.
	YES:    "Yes",
	NO:     "No",
	OK:     "Ok",
	SAVE:   "Save",
	MENU: "Menu",
	ADD:   "Adicionar",
	CANCEL: "Cancel",
	UPLOAD: "Upload",
	SKIP:   "Skip",
	CLEAR: "Clear",
	SERVER: "Server",
	OPEN: "Open",
	CLOSE: "Close",
	AT: "At",
	ON: "On",
	OFF: "Off",
    REFRESH: "Refresh",
	MANAGE_SERVERS: "Manage Servers",
	ENGINE: "Engine",
	VIEW_LOG: "View Log",
    VIEW_MODIFICATIONS: "View Modifications",
    VIEW_MODIFICATIONS_SCRIPT: "View Full Script",
    CLEAR_MODIFICATIONS: "Clear Modifications",
    EXPORT: "Export",
    IMPORT: "Import",
    SHOW: "Show",
    CREATE: "Create",
    ALTER: "Alter",
    DROP: "Drop",
    MODIFY: "Modify",
	ACTION: "Action",
	SELECT: "Select",

    CLEAR_MODIFICATIONS_CONFIRMATION: "Are you sure you want to clear {{modifications}}?", // {{modifications}} will holder either the length of modifications being cleared or the query when removing one
    CLEAR_LOG: "Clear Log",
	LOG: "Log",
	LOGS: "Logs",
    MODIFICATIONS: "Modifications",
	DATE: "Date",
    PROJECT: "Project",
    FILE: "File",
    FILE_ORIGIN: "File Origin",
    SQL_COMMAND: "SQL Command",
	
	CLOSE_THIS: "Close this",
	CLOSE_ALL: "Close all",
	CLOSE_ALL_EXCEPT_THIS: "Close all except this",

	DATABASE: "Database",
	DATABASES: "Database",
	TABLE: "Table",
	TABLES: "Tables",
	FIELD: "Field",
	FIELDS: "Fields",
	VIEWS: "Views",
	VIEW: "View",
	ROWS: "Rows",
	ROW: "Row",
	PROCEDURES: "Stored Procedures",
	PROCEDURE: "Stored Procedured",
	FUNCTIONS: "Functions",
	FUNCTION: "Function",
	
	NO_CONNECTIONS: "No connections",
	NO_TABLES: "No tables here",
	NO_FIELDS: "No Fields here",
	NO_VIEWS: "No views here",
	NO_PROCEDURES: "There are no procedures created",
	NO_FUNCTIONS: "No function on this database",
	NO_LOG: "No log to show",
    NO_MODIFICATIONS: "No modifications made",

	// EXECUTIONS && QUERYS
	QUERY: "Query",
	QUERY_ERROR: 'Query Error',
	QUERY_COMPLETED: 'Query Completed',
	
	EXECUTING: "Executing...",
	CONFIRM_EXECUTION_TITLE: "Execution Confirmation",
	CONFIRM_EXECUTION_TEXT: "Are you sure you want to run this query?",
	"FINISHED": "Finished",
	"QUERY_AFFECTED_ROWS" : "Affected Rows",
	"QUERY_CHANGED_ROWS" : "Changed Rows",
	"QUERY_INSERTED_ID" : "Inserted ID",
	"ERROR": "Error",
	"PARSE_ERROR": "Parse Error",
	FINISHED_ON : "Finished on",

	// RESULT PANES
	RESULT: "Result",
	RESULT_SET: "Result Set",
	RESULT_SETS: "Result Sets",
	RESULT_PANEL: "Result Panel",
	CLEAR_RESULT_SETS: "Clear Result Sets",

	TOGGLE_RESULT_PANEL: "Toggle Result Panel",
	TOGGLE_BROWSER_PANEL: "Toggle Browser Panel",
	
	BROWSER_PANEL: "Browser Panel",
	
	// TOOLBAR.
	SERVER_SETUP: "Server Setup",
	LIST_TABLES: "List Tables",
	LIST_FIELDS: "List Fields",
	LIST_ROWS: "List Rows",
	
	// SETTINGS DIALOG.
    EXTENSION_SETTINGS: "Extension Settings",
    AUTO_RECONNECT_ON_START: "Auto reconnect last connection on brackets start",
	SETTINGS_DIALOG_TITLE:        "SQL Connector - Connection Settings",
	SETTINGS_DIALOG_ENGINE: 	  "Engine",
	SETTINGS_DIALOG_HOST: 		  "Host",
	SETTINGS_DIALOG_PORT: 		  "Port",
	SETTINGS_DIALOG_USERNAME: 	  "User Name",
	SETTINGS_DIALOG_PASSWORD: 	  "Password",
	SETTINGS_DIALOG_NAME:  "Name",
	SETTINGS_DIALOG_DATABASE:  "DataBase",
	SETTINGS_DIALOG_SERVERS:  "Servers",
	SETTINGS_DIALOG_NEW_SERVER:  "New Server",
	SETTINGS_DIALOG_SAVE_TO_APLLY: "Click save to aplly changes",
	SETTINGS_DIALOG_SAVED: "Server Settings Saved",
	SETTINGS_CONFIRM_MODIFICATIONS: "Confirm execution of modification scripts",
	SETTINGS_SAVE_MODIFICATIONS: "Save modification scripts",
	SETTINGS_SAVE_TRUSTED_CONNECTION: "Trusted Connection",
	SETTINGS_DIALOG_INSTANCE_NAME: "Instance Name",

	// NO SERVER SETUP DIALOG
	NO_SERVER_SETUP: "SQL Connector - No Connections Created",
	
	// Autenthication
	TEST_CONNECTION_STARTING: 'Starting authentication...',
	TEST_CONNECTION_SUCCESS: 'Authentication successfull',
	TEST_CONNECTION_FAILED: 'Authentication failed',
    
    // Log Viewer
	LOG_VIEWER_TITLE: 'Log Viewer',
	LOG_VIEWER_EMPTY: 'No log to show.',
	
	CLICK_TO_OPEN_MENU: 'Click to open options menu',
	CLICK_TO_MANAGE_SERVERS: 'Click to manage server settings',
	CLICK_TO_EXECUTE_CURRENT: 'Click to execute current selection or document',

	// DataBase Compare

	DB_COMPARE_TITLE: 'DataBase Compare',
	DB_COMPARE_LEFT_SERVER: 'Left Side Server',
	DB_COMPARE_RIGHT_SERVER: 'Right Side Server',
	DB_COMPARE: 'Compare',
	COMPARE: 'Compare',
	COMPARING: 'Comparing',

	TABLE_DOESNT_EXIST_ON_SERVER: "This table doesn't exist on this server"

});
