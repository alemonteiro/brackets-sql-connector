/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */
/*!
 * Brackets Todo 0.5.3
 * Display all todo comments in current document or project.
 *
 * @author Mikael Jorhult
 * @license http://mikaeljorhult.mit-license.org MIT
 */
define(function (require, exports, module) {
	'use strict';

	// Get dependencies.
	var Async = brackets.getModule('utils/Async'),
		Menus = brackets.getModule('command/Menus'),
		CommandManager = brackets.getModule('command/CommandManager'),
		Commands = brackets.getModule('command/Commands'),
		PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
		ProjectManager = brackets.getModule('project/ProjectManager'),
		WorkspaceManager = brackets.getModule('view/WorkspaceManager'),
		MainViewManager = brackets.getModule('view/MainViewManager'),
		PanelManager = brackets.getModule('view/PanelManager'),
		EditorManager = brackets.getModule('editor/EditorManager'),
		DocumentManager = brackets.getModule('document/DocumentManager'),
		Resizer = brackets.getModule('utils/Resizer'),
		AppInit = brackets.getModule('utils/AppInit'),
		FileUtils = brackets.getModule('file/FileUtils'),
		FileSystem = brackets.getModule('filesystem/FileSystem'),
		ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
		NodeDomain = brackets.getModule("utils/NodeDomain"),
		StatusBar = brackets.getModule('widgets/StatusBar'),
		
		// Extension basics.
		COMMAND_ID = 'alemonteiro.bracketsSqlConnector.enable',
		COMMAND_ID_LIST_TABLES = 'alemonteiro.bracketsSqlConnector.listTables',
		COMMAND_ID_EXECUTE_CURRENT = 'alemonteiro.bracketsSqlConnector.executeCurrent',
		COMMAND_ID_EXECUTE_CURRENT_FILE = 'alemonteiro.bracketsSqlConnector.executeCurrentFile',
		COMMAND_ID_CONNECTIONS = 'alemonteiro.bracketsSqlConnector.manageConnections',
		COMMAND_ID_TOGGLE_RESULT_PANE = 'alemonteiro.bracketsSqlConnector.toggleResultPane',
		COMMAND_ID_DISCONNECT_ALL = 'alemonteiro.bracketsSqlConnector.disconnectAll',
		COMMAND_ID_VIEW_LOG = 'alemonteiro.bracketsSqlConnector.viewLog',
		
		Strings = require('modules/Strings'),
		dataStorage = require('modules/DataStorageManager'),
		settingsDialog = require('modules/SettingsDialog'),

		// Preferences.
		preferences = PreferencesManager.getExtensionPrefs('alemonteiro.bracketsSqlConnector'),

		// Mustache templates.
		browserPanelTemplate = require('text!html/browser-panel.html'),
		queryPanelTemplate = require('text!html/result-pane.html'),
		queryResultSetTemplate = require('text!html/result-set.html'),
		connectedServerTemplate = require('text!html/connceted-server.html'),
		serverMenuTemplate = require('text!html/server-menu.html'),
		indicatorTemplate = require('text!html/indicator.html'),
		
		// Setup extension.
		serverInfo, 
		$browserPanel,
		$queryPanel,
		$indicator,
		projectUrl,
		$sqlConnectorIcon = $('<a href="#" title="' + Strings.EXTENSION_NAME + '" id="brackets-sql-connector-icon"></a>'),
		
		// Get view menu.
		menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU),
		contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU),
		is_connected = false,
		is_result_pane_enabled = false,
		
		// Get Node module domain
		_domainPath = ExtensionUtils.getModulePath(module, "node/SQLConnectorDomain"),
		_nodeDomain = new NodeDomain("BracketsSqlConnectorDomain", _domainPath),
		
		_current_server_id,
		
		// Result Sets Utils
		ResultSets =((function() {
			
			var ids = 0,
				prefix = "brackets-sql-connector-result-set-",
				
				add_achor = function(id) {
					var li = '<li class="active">' +
									'<a href="#" class="tab-anchor" data-target="#'+prefix + id +'">' + Strings.RESULT_SET + ' '  + id +'</a>' +
									'<a href="#" class="close close-result-set">&times;</a>' +
							'</li>';
					
					
					$("#brackets-sql-connector-log-pane-anchor").removeClass("active").siblings().removeClass('active');
					$("#brackets-sql-connector-log-pane-anchor").after($(li).addClass('active'));
				},
				
				add_log = function(title, extra) {
					var dt = new Date(),
						str = typeof extra === 'string' ? extra :
								(typeof extra=== 'object' ? JSON.stringify(extra) : ''),
						log = '<li>'+
								'<span class="data">' + dt.toLocaleTimeString() + '</span>' +
								'<label>' + title + '</label>' +
								'<span class="extra">' + str + '</span>' +
							'</li>';
					
					$("#brackets-sql-connector-log-pane > ul").prepend(log);
				},
				
				add_result = function(fields, rows, query, error) {
					
					if ( error ) {
						add_log('Error', error);
						return;
					}
					
					if ( fields === null && typeof rows === 'object' ) {
						add_log(Strings.QUERY_COMPLETED + ": " + rows.message);
						CommandManager.execute(COMMAND_ID_VIEW_LOG);
						return;
					}
					
					ids = ids + 1;
					var cid = ids,
						$pane = $(Mustache.render(queryResultSetTemplate, {
							Strings: Strings,
							Id: cid
						})),
						$tbl = $('table', $pane),
						i=0,il=fields.length,f,
						j=0,jl=rows.length,r,
						html = '';

						for(;i<il;i++) {
							f = fields[i];
							html += '<th>' + (f.name||f.Field) + '</th>';
						}
						$("thead", $tbl).html('<tr>'+html+'</tr>');
						html = '';

						for(;j<jl;j++) {
							html += '<tr>';
							r = rows[j];
							for(i = 0;i<il;i++) {
								f = fields[i];
								html += '<td>' + r[(f.name||f.Field)] + '</td>';
							}
							html += '</tr>';
						}
						$("tbody", $tbl).html(html);
					
						add_log(Strings.QUERY_COMPLETED + ' ' + fields.length + ' fields, ' + rows.length + ' rows');
						add_achor(cid);
						$("#brackets-sql-connector-log-pane").removeClass("active").siblings().removeClass('active');
						$("#brackets-sql-connector-log-pane").after($pane.addClass('active'));
					
					toogleQueryResultPane(true);
				};
			
			return {
				add: add_result,
				log: add_log
			};
			
		})());

	// Define preferences.
	preferences.definePreference('enabled', 'boolean', false);


	// Load stylesheet.
	ExtensionUtils.loadStyleSheet(module, 'sql-connector.css');
	
	/**
	 * Get saved server list 
	 */
	function getServerList() {
		var serverInfo = dataStorage.get('server_list');
		
		return serverInfo;
	}
	
	/**
	* Returns server name // ({username}@{host}/database)
	*/
	function getServerLabel(srv) {
		return srv ? srv.name : '';
		//srv.username + "@" + srv.host + "/" + srv.database : Strings.NOT_CONNECTED;
	}
	/**
	 * Get saved serverInfo 
	 */
	function getCurrentServer(serverId) {
		var serverInfo = dataStorage.get('server_list');
		if ( ! serverInfo || serverInfo === undefined || serverInfo === "" )
			return false;
		
		if ( typeof serverInfo === 'object' && serverInfo.hasOwnProperty('servers')) {
			return serverInfo.servers[serverId || _current_server_id || serverInfo.selected_id];
		}
		
		return false;
	}

	/**
	* Check if any connections are active
	*/
	function hasActiveConnection() {
		var cfg = getServerList(),
			hasConn = false;
		for(var s in cfg.servers ) {
			if ( cfg.servers[s].__connection_id > 0 ) {
				hasConn = true;
				break;
			}
		}
		return hasConn;
	}
	
	/**
	* Save server status on preferences
	*/
	function updateServerStatus(serverId, connId) {
		var serverInfo = dataStorage.get('server_list');
		if ( ! serverInfo || serverInfo === undefined || serverInfo === "" )
			return false;
		
		if ( typeof serverInfo === 'object' && serverInfo.hasOwnProperty('servers')) {
			serverInfo.servers[serverId].__connection_id = connId;
			
			dataStorage.set('server_list', serverInfo);
			return serverInfo.servers[serverId];
		}
		
		return false;
	}
	
	/**
	* Set current selected server
	*/
	function setSelectedServer(serverId, openCoonection) {
		var serverInfo = dataStorage.get('server_list');
		if ( serverId === false || serverId === undefined ) {
			_current_server_id = undefined;
			serverInfo.selected_id = 0;
			dataStorage.set('server_list', serverInfo);	
			return;
		}
		_current_server_id = serverId;
		serverInfo.selected_id = serverId;
		dataStorage.set('server_list', serverInfo);
		var svr = serverInfo.servers[serverId];
		if ( openCoonection === true ) {
			connect(svr);
		}
		else if (svr !== null && svr !== undefined && svr.__connection_id > 0 ) {
			is_connected = true;
			$browserPanel.addClass('connected');
			$indicator.addClass('connected').children('label').html(getServerLabel(svr));
		}
	}
		
	/**
	 * Set state of extension.
	 */
	// this is a menu item
	function togglePanel() {
		var enabled = preferences.get('enabled');

		enablePanel(!enabled);
	}

	/**
	 * Initialize extension.
	 */
	function enablePanel(enabled) {
		if (enabled) {
			$browserPanel.show();
						
			// Set active class on icon.
			$sqlConnectorIcon.addClass('active');
			
			resizeBrowser();
		} else {
			// Remove active class from icon.
			$sqlConnectorIcon.removeClass('active');
			$browserPanel.hide();
		}

		// Save enabled state.
		preferences.set('enabled', enabled);
		preferences.save();

		// Mark menu item as enabled/disabled.
		CommandManager.get(COMMAND_ID).setChecked(enabled);
	}
		
	/**
	* Resize Browser Panel
	*/
	function resizeBrowser() {
		$browserPanel.height(($("#editor-holder").height() - 24) + 'px');
	}
	
	/** 
	* List table fields
	*/
	function listFields(serverInfo, table, callback) {
		_nodeDomain.exec('query', 'SHOW Columns FROM ' + table + ";").done(function(response) {
			var fields = response[0], 
				rows = response[1],
				fk_query = 'SELECT  ' +
  'TABLE_NAME as `Table`, COLUMN_NAME as Field, CONSTRAINT_NAME as `Name`, REFERENCED_TABLE_NAME as `ReferencedTable`,REFERENCED_COLUMN_NAME as `ReferencedField` ' +
'FROM ' +
  'INFORMATION_SCHEMA.KEY_COLUMN_USAGE ' +
"WHERE TABLE_SCHEMA = '"+serverInfo.database+"' AND TABLE_NAME = '"+table+"' AND REFERENCED_TABLE_NAME IS NOT NULL; ";
			
			_nodeDomain.exec('query', fk_query).done(function(response)  {
				var fks = response[1],
				html = (function() {
					var html  = '';
					for(var i=0,il=rows.length,r,n,fk,pk;i<il;i++) {
						fk = false;
						r=rows[i];
						pk = r.Key === 'PRI';
						for(var j=0,jl=fks.length;j<jl;j++) {
							if ( fks[j].Field == r.Field ) {
								fk = fks[j];
								break;
							}
						}
						
						html += '<li data-name="'+r.Field+'" data-type="'+r.Type+'" class="closed' + (fk !== false ? ' fk': '') + (pk?' pk':'') + '">' +
									'<label>'+r.Field+'<span class="data-type">' + r.Type + '<span></label></li>';
					}
					return html;
				}());
				
				callback.call(callback, fields, rows, html);
			 }).fail(function(err) {
				
			});
			
		});
	}
	
	/** 
	* List database views
	*/
	function listViews($li, serverInfo) {
		var query = "SHOW FULL TABLES IN "+serverInfo.database+" WHERE TABLE_TYPE LIKE 'VIEW';";
		_nodeDomain.exec('query', serverInfo.__connection_id, query).done(function(response){
			var fields = response[0],
				views = response[1],
				html = (function() {
					var html  = '';
					for(var i=0,il=views.length,r,n,fk;i<il;i++) {
						fk = false;
						r=views[i];
						n = r[fields[0].name];
						
						html += '<li data-name="'+n+'" data-type="'+r.Type+'" >' +
									'<label>'+n+'</label></li>';
					}
					return html;
				}());
			
			$li.removeClass('loading');
			$("ul.brackets-sql-connector-list-views", $li)
				.html(html).parent()
				.addClass("loaded").removeClass("loading");
		})
		.fail(function(err) {
			$li.removeClass('loading');
			settingsDialog.showMessage(Strings.QUERY_ERROR, err.code, query);
		});
	}
	
	/** 
	* List database functions
	*/
	function listFunctions($li, serverInfo) {
		_nodeDomain.exec('list_functions', serverInfo.__connection_id, serverInfo.database).done(function(response){
			var fields = response[0],
				views = response[1],
				html = (function() {
					var html  = '';
					for(var i=0,il=views.length,r,n,fk;i<il;i++) {
						fk = false;
						r=views[i];
						n = r[fields[0].name];
						
						html += '<li data-name="'+n+'" data-type="'+r.Type+'" >' +
									'<label>'+n+'</label></li>';
					}
					return html;
				}());
			
			$li.removeClass('loading');
			$("ul.brackets-sql-connector-list-functions", $li)
				.html(html).parent()
				.addClass("loaded").removeClass("loading");
		})
		.fail(function(err) {
			$li.removeClass('loading');
			settingsDialog.showMessage(Strings.QUERY_ERROR, err.code);
		});
	}
	
	/** 
	* List database procedures
	*/
	function listProcedures($li, serverInfo) {
		_nodeDomain.exec('list_procedures', serverInfo.__connection_id).done(function(response){
			var fields = response[0],
				views = response[1],
				html = (function() {
					var html  = '';
					for(var i=0,il=views.length,r,n,fk;i<il;i++) {
						fk = false;
						r=views[i];
						n = r[fields[0].name];
						
						html += '<li data-name="'+n+'" data-type="'+r.Type+'" >' +
									'<label>'+n+'</label></li>';
					}
					return html;
				}());
			
			$li.removeClass('loading');
			$("ul.brackets-sql-connector-browser-list-procedures", $li)
				.html(html).parent()
				.addClass("loaded").removeClass("loading");
		})
		.fail(function(err) {
			$li.removeClass('loading');
			settingsDialog.showMessage(Strings.QUERY_ERROR, err.code, 'list_procedures');
		});
	}
	
	/** 
	* List database tables
	*/
	function listTables($li, serverInfo) {
		_nodeDomain.exec('query', serverInfo.__connection_id, 'SHOW TABLES;').done(function(response){
			var fields = response[0], 
				rows = response[1],
				tables = (function() {
					var html  = '';
					for(var i=0,il=rows.length,r,n;i<il;i++) {
						r=rows[i];
						n = r[fields[0].name];
						html += '<li data-name="'+n+'" class="closed"><label>'+n+'</label></li>';
					}
					return html;
				}());
			$li.removeClass('loading').addClass('loaded');
			
			$("ul.brackets-sql-connector-list-tables", $li).html(tables)
			.off('click', 'li')
			.on('click', 'li', function(evt) {
				evt.stopPropagation();
				var $li = $(this),
					table = $(this).data("name"),
					open = $(this).hasClass("open");
				
				if ( ! open ) {
					$li.addClass("open").removeClass("closed");
					if ( $li.hasClass("loaded")) {
						$li.children("ul").show();	
					}
					else {
						$li.addClass('loading');
						listFields(serverInfo, table, function(fields, rows, html) {
							$li.find('ul').remove();
							$li.append('<ul class="brackets-sql-connetor-browser-list-fields">' + html + '</ul>')
								.removeClass("loading")
								.addClass("loaded");
						});
					}
				}
				else {
					$li.addClass("closed").removeClass("open");
					$li.children("ul").hide();
				}
			});
		})
		.fail(function(err) {
			$li.removeClass('loading');
			settingsDialog.showMessage(Strings.QUERY_ERROR, err, 'SHOW TABLES;');
		});
	}
	
	/** 
	* List database tables
	*/
	function showView(serverInfo, table, callback) {
		var query = 'SELECT TABLE_NAME AS `Name`, VIEW_DEFINITION AS `ViewDefinition`, CHARACTER_SET_CLIENT as `charSet`, COLLATION_CONNECTION as `collation` ' +
					'FROM INFORMATION_SCHEMA.VIEWS ' +
    					"WHERE TABLE_SCHEMA = '"+serverInfo.database+"' " +
						" AND TABLE_NAME = '"+table+"'; ";
		
		_nodeDomain.exec('query',  query).done(function(response){
			var view = response[1][0];
			callback.call(callback, view);
		});
	}
	
	/**
	* Disconnect from server
	*/					
	function disconnect(serverInfo, callback, updateStatus) {
		var label = getServerLabel(serverInfo);
		ResultSets.log(Strings.DISCONNECTING, label);
		_nodeDomain.exec('disconnect', serverInfo.__connection_id).done(function() {
			ResultSets.log(Strings.DISCONNECTED, label);
			$browserPanel.removeClass('connected');
			$indicator.removeClass('connected').children('label').html(Strings.DISCONNECTED);
			is_connected = false;
			if ( updateStatus !== false ) {
				updateServerStatus(serverInfo.__id, 0);
			}
			if ( serverInfo.__id != _current_server_id ) {
				setSelectedServer(false);
			}
			$('ul.connections > li[data-server-id="'+serverInfo.__id+'"]', $browserPanel).remove();
			if ( typeof callback === 'function' ) {
				callback.call(callback, true);
			}
		}).fail(function(err) {
			ResultSets.log(Strings.ERROR, err);
			if ( updateStatus !== false ) {
				updateServerStatus(serverInfo.__id, 0);
			}
			if ( callback ) callback.call(callback, err);
		});
	}
	
	/**
	* Disconnect from all server
	*/
	function disconnectAll() {
		var info = dataStorage.get('server_list');
		for(var sname in info.servers) {
			var s = info.servers[sname];
			if ( s.__connection_id > 0) {
				disconnect(s, false, false);
				s.__connection_id = 0;
			}
		}
		dataStorage.set('server_list', info);
	}
	
	/**
	* Connect to a server (Disconnect if already has a connection to the same server id)
	*/
	function connect(serverInfo, checkStatus) {
		
		if ( checkStatus !== false && serverInfo.__connection_id > 0) {
			disconnect(serverInfo, function() {
				connect(serverInfo, false);
			}, false);
		}
		else {
			var label = getServerLabel(serverInfo),
				sid = serverInfo.__id;
			ResultSets.log(Strings.CONNECTING, label);
			_nodeDomain.exec('connect', serverInfo).done(function(conId) {
				if (conId > 0) {
					ResultSets.log(Strings.CONNECTED, label);
					updateServerStatus(serverInfo.__id, conId);
					var panelHTML = Mustache.render(connectedServerTemplate, {
						Strings: Strings,
						Server: serverInfo,
						Label: label
					}),
					$li = $('ul.connections > li[data-server-id="'+sid+'"]', $browserPanel);
					if ( !$li || $li.length < 1 ) {
						$('ul.connections', $browserPanel).append(panelHTML);
					}
					else {
						$li.replace(panelHTML);	
					}
					setSelectedServer(serverInfo.__id);
				} else {
					$browserPanel.removeClass('connected');
					is_connected = false;
				}
			}).fail(function(err) {
				is_connected = false;
				ResultSets.log(Strings.CONNECTION_ERROR, err);
				settingsDialog.showDialog(Strings.CONNECTION_ERROR, label, err.code);
			});
		}
	}
	
	/**
	* Test Connection (Connect & Disconnect)
	*/
	function testConnection(serverInfo) {
		settingsDialog.updateStatus(Strings.TEST_CONNECTION_STARTING);
		_nodeDomain.exec('connect', serverInfo).done(function(conId) {
			if (conId > 0) {
				settingsDialog.updateStatus(Strings.TEST_CONNECTION_SUCCESS);
				_nodeDomain.exec('disconnect');
			} else {
				settingsDialog.updateStatus(Strings.TEST_CONNECTION_FAILED + '<span class="conn-error">' + conId + '</span>');
			}
		})
		.fail(function (err) {
			settingsDialog.updateStatus(Strings.TEST_CONNECTION_FAILED + '<span class="conn-error">' + err + '</span>');
		});
	}
		
	/**
	* Check if the file can be executed (if it's is .sql)
	*/
	function canExecFile(file) {
		return file && file !== undefined && file !== null && file.fullPath.match(/\.sql/);
	}
	
	/**
	* Check if the new current file is an SQL
	*/
	function fileChanged(file) {
		if ( canExecFile(file) ) {
			if ( ! $indicator.addClass('has-sql') ) $indicator.addClass('has-sql');
		}
		else {
			$indicator.removeClass('has-sql');
		}
	}
	
	/**
	* Execute SQL Command
	*/
	function executeSQLCommand(server, sql, callback, skipConfirmation) {
		
		if (server.confirmModifications !== false && skipConfirmation !== true && 
		   sql.match(/insert|update|delete|modify|alter|change/gi)) {
			settingsDialog.showConfirmation(Strings.CONFIRM_EXECUTION_TITLE, Strings.CONFIRM_EXECUTION_TEXT, sql, function() {
				executeSQLCommand(server, sql, callback, true);
			});
			return;
		}
		
		ResultSets.log(Strings.EXECUTING, sql);
		_nodeDomain
			.exec('query', server.__connection_id, sql)
			.done(function(response) {			
			
			ResultSets.log(Strings.FINISHED, sql);
			
			if ( typeof callback === 'function' ) {
				if ( $.isArray(response[0][0]) ) {
					for(var i=0,il=response[0].length;i<il;i++) {
						callback(false, response[0][i], response[1][i]);
					}
				}
				else {
					callback(false, response[0], response[1]);
				}
			}
		}).fail(function(err){
			ResultSets.log(Strings.QUERY_ERROR, err);
			$('label', $indicator).html(Strings.QUERY_ERROR);
			callback(err);
		});
	}
		
	/**
	* View Log
	*/
	function viewLog() {
		$("#brackets-sql-connector-log-pane").addClass("active").siblings().removeClass("active");
		$("#brackets-sql-connector-log-pane-anchor").addClass("active").siblings().removeClass("active");
		toogleQueryResultPane(true);
	}
	
	/**
	Executes given file or current viewed file
	*/
	function executeFile(file) {
		file = file || MainViewManager.getCurrentlyViewedFile();
		if ( canExecFile(file) && ! $indicator.hasClass("executing")) {
			$indicator.addClass("executing");
			$('label', $indicator).html(Strings.EXECUTING);
				file.read(function(err, data, status) {
					executeSQLCommand(getCurrentServer(), data, function(err, fields, rows) {
						ResultSets.add(fields, rows, data, err);
						$indicator.removeClass("executing");
						$('label', $indicator).html(Strings.FINISHED + '('+rows.length+' rows)');
					}).fail(function(err){
						$(this).prev('label').html(err);
						$('label', $indicator).html(Strings.ERROR);
					});
				});
		}
	}
	
	/**
	If there's selected text on current editor
	*/
	function hasTextSelection() {
		var editor = EditorManager.getActiveEditor();
		return editor && editor.hasSelection();
	}
	
	/**
	* Check if the current document has an sql language
	*/ 
	function isDocumentSQL(doc) {
		doc = doc || DocumentManager.getCurrentDocument();
		return doc && doc.language && doc.language.getName().match(/sql/gi);
	}
	
	/**
	* Execute current selected text or current viewed file (if no text is selected) 
	*/
	function executeCurrent() {
		var editor = EditorManager.getActiveEditor(),
			text;
		if ( editor !== null ) {
			if ( hasTextSelection() ) {
				text = editor.getSelectedText();
			}
			else {
				var doc = DocumentManager.getCurrentDocument();
				if ( isDocumentSQL(doc) ) {
					text = doc.getText();
				}
			}
			if ( ! text || text === '' ) {
				executeFile();
			}
			else {
				executeSQLCommand(getCurrentServer(), text, function(err, fields, rows) {
					ResultSets.add(fields, rows, text, err);
				});
			}
		}
	}
	
	/**
	 * Show/Hide the Query Result Pane (Logs and Result Sets)
	 */
	function toogleQueryResultPane(show) {
		show = show !== undefined ? show : ! is_result_pane_enabled;
		if ( show ) {
			Resizer.show($queryPanel);
			
			$('div.brackets-sql-connector-result-tab-body', $queryPanel).height(($queryPanel.height()-30) + 'px');
			
			is_result_pane_enabled = true;
			resizeBrowser();
		}
		else {
			Resizer.hide($queryPanel);
			is_result_pane_enabled = false;
			resizeBrowser();
		}
	}
	
	/**
	 * Show server pop up menu
	 */
	function showServerMenu($btn, onTop){
		
		var $ul = $("body").children("ul.brackets-sql-connector-servers-menu");
		if ( $ul.length > 0) {
			$ul.remove();
			return;
		}
		
		var _servers = getServerList(),
			htmlConnected = '',
			htmlNotConnected = '',
			htmlSetCurrent = '',
			has_servers = false,
			css = '';
			//html = '<li data-action="none" data-id="0"><label>'+Strings.CONNECT_TO+'</label></li>';
		
		if ( _servers ) {
			for(var sn in _servers.servers) {
				var s = _servers.servers[sn],
					l = getServerLabel(s),
					isconn = s.__connection_id > 0,
					li = '';
				if ( l ) {
					li += '<li data-action="'+(isconn ? "disconnect" : "connect")+'" data-id="'+sn+'" class="'+ (isconn ? 'connected' : '') +'">' +
								'<a href="#">'+l+'</a></li>';
					if ( isconn ) {
						htmlConnected += li;
						if ( parseInt(s.__id) != parseInt(_current_server_id) ) {
							htmlSetCurrent += '<li data-action="set-active" data-id="'+sn+'" class="'+ (isconn ? 'connected' : '') +'">' +
								'<a href="#">'+l+'</a></li>';
						}
					}
					else {
						htmlNotConnected += li; 
					}
					has_servers = true;
				}
			}
		}
				
		if ( has_servers ) { css += ' has-servers'; }
		else { css += ' no-servers'; }
		
		if ( hasActiveConnection() ) { css += ' has-connections'; }
		else { css += ' no-connections'; }
		
		if ( hasTextSelection() ) { css += ' has-text-selection'; }
		else { css += ' no-text-selection'; }
		
		if ( isDocumentSQL() ) { css += ' has-sql-file'; }
		else { css += ' no-sql-file'; }
		
		if ( htmlSetCurrent === '') css += ' no-other-server';
		
		$ul = $(Mustache.render(serverMenuTemplate, {
			Strings: Strings,
			//CONNECTIONS: html,
			MENU_STATUS: css,
			PANEL_ACTION: (is_result_pane_enabled ? Strings.CLOSE : Strings.OPEN)
		}))
		.appendTo("body");
		
		$('li.connect-to', $ul).after(htmlNotConnected);
		$('li.disconnect-from', $ul).after(htmlConnected);
		$('li.set-current-connection', $ul).after(htmlSetCurrent);
		
		$ul.on('click', 'a', function(evt) {
			evt.stopPropagation();
			var $li = $(this).parent(),
				action = $li.data("action"),
				id = $li.data("id");
			
			if ( action === "disconnect-all") {
				CommandManager.execute(COMMAND_ID_DISCONNECT_ALL);
			}
			else if (action === "disconnect" ) {
				disconnect(getCurrentServer(id));
			}
			else if (action === "set-active") {
				setSelectedServer(id, false);
			}
			else if (action === "execute-file" ) {
				CommandManager.execute(COMMAND_ID_EXECUTE_CURRENT_FILE);
			}
			else if (action === 'execute-selection') {
				CommandManager.execute(COMMAND_ID_EXECUTE_CURRENT);
			}
			else if (action === 'new-connection') {
				//CommandManager.execute(COMMAND_ID_CONNECTIONS);
				showSettings();
			}
			else if (action === 'toggle-result-panel') {
				CommandManager.execute(COMMAND_ID_TOGGLE_RESULT_PANE);
			}
			else if (action === "connect" && id > 0 ) {
				setSelectedServer(id, true);
			}
			
			$ul.remove(); 
		});
		
		var off = $btn.offset();
		if ( onTop !== false ) {
			$ul.css({
				left: (off.left - ($ul.width()/2) + ($btn.width()/2) ) + 'px',
				top: 'auto',
				right: 'auto',
				bottom: ($("body").height() - off.top + 5) + 'px'
			});
		}
		else {
			$ul.css({
				left: (off.left - ($ul.width()/2) + ($btn.width()/2) ) + 'px',
				top: (off.top + 20) + 'px',
				right: 'auto',
				bottom: 'auto'
			});
		}
	}
	
	/**
	 * Show settings dialog
	 */
	function showSettings() {
		settingsDialog.showDialog({
			testConnection: testConnection,
			serverSelected: function(server) { }
		});
	}
	
	/**
	 * Listen for save or refresh and look for todos when needed.
	 */
	function registerListeners() {
		var $projectManager = $(ProjectManager);

		MainViewManager.on('currentFileChange ', function(e, newFile, newPaneId, oldFile, oldPaneId) {
			if ( newFile ) {
				fileChanged(newFile);
			}
		}); 
	
		$("#editor-holder").on("resize", function() {
			resizeBrowser();
		});
	}
	
	/**
	*	Register extension commands.
	*/
	function registerCommands() {
		CommandManager.register(Strings.EXTENSION_NAME, COMMAND_ID, togglePanel);
		CommandManager.register(Strings.EXECUTE_CURRENT, COMMAND_ID_EXECUTE_CURRENT, executeCurrent);
		CommandManager.register(Strings.EXECUTE_CURRENT_FILE, COMMAND_ID_EXECUTE_CURRENT_FILE, executeFile);
		CommandManager.register(Strings.MANAGE_SERVERS, COMMAND_ID_CONNECTIONS, showSettings);
		CommandManager.register(Strings.TOGGLE_RESULT_PANEL, COMMAND_ID_TOGGLE_RESULT_PANE, toogleQueryResultPane);
		CommandManager.register(Strings.DISCONNECT_ALL, COMMAND_ID_DISCONNECT_ALL, disconnectAll);
		CommandManager.register(Strings.VIEW_LOG, COMMAND_ID_VIEW_LOG, viewLog);
		
		menu.addMenuItem(COMMAND_ID_EXECUTE_CURRENT, 'Alt-Enter');
	}

	// Register panel and setup event listeners.
	AppInit.appReady(function () {
		var panelHTML = Mustache.render(browserPanelTemplate, {
			Strings: Strings
		});
		
		// Create and cache todo panel.
		
		$("#main-toolbar").before(panelHTML);
		
		$queryPanel = $(Mustache.render(queryPanelTemplate, {
			Strings: Strings
		}));
		
		var panel = WorkspaceManager.createBottomPanel('alemonteiro.bracketsSqlConnector.queryPanel', $queryPanel, 70);
		
		$indicator = $(Mustache.render(indicatorTemplate, {
			Strings: Strings
		}));
		
		StatusBar.addIndicator('alemonteiro.bracketsSqlConnector.connIndicator', $indicator, true, 'brackets-sql-connector-status-indicator');
		
		$queryPanel.on('panelResizeEnd', function() {
			resizeBrowser();	
		})
		.on('click', 'a.tab-anchor', function(evt) {
			var target = $(this).data('target');
			$(this).parent().addClass("active").siblings().removeClass('active');
			$(target).addClass("active").siblings().removeClass('active');
		})
		.on('click', 'a.close-pane', function() {
			toogleQueryResultPane(false);
		})
		.on('click', 'a.close-result-set', function() {
			$($(this).prev('a').data('target')).remove();
			$(this).parent().remove();
		});
		
		$indicator.on('click', 'button', function(evt){
			var action = $(this).data("action");
			if ( action === "execute" ) {
				executeFile();	
			}
		})
		.on('click', 'label', function(evt) {
			showServerMenu($(this));
		});
		
		//WorkspaceManager.createBottomPanel('alemonteiro.bracketsSqlConnector.panel', $(panelHTML), 100);
		$browserPanel = $('#brackets-sql-connector-browser');

		// Close panel when close button is clicked.
		$browserPanel
			.on('click', '.close', function () {
				enablePanel(false);
			});

		// Setup listeners.
		registerListeners();
		
		// Setup commands.
		registerCommands();
		
		Resizer.makeResizable($queryPanel, "vert", "top");
		Resizer.makeResizable($browserPanel, "horz", "left");
		
		// Add listener for toolbar icon..
		$sqlConnectorIcon.click(function () {
			CommandManager.execute(COMMAND_ID);
		}).appendTo('#main-toolbar .buttons');
		
		// Browser Header Button Bar
		$browserPanel.on('click', 'div.header > button', function () {
			
			var $btn = $(this),
				action = $(this).data('action');
			
			if (action === "setup") {
				showSettings();
			}
			else if (action === "connect") {
				showServerMenu($btn, false);
			}
		})
		// Handler for folder select
		.on('click', 'ul.brackets-sql-connector-browser-server-folders > li', function(evt) {
			var $li = $(this),
				folder = $(this).data('folder'),
				need_loaded = !($(this).hasClass('loaded') || $(this).hasClass('loading'));
			
			if ( !need_loaded ) {
				if ( $li.hasClass("open") ) {
					$li.removeClass("open").addClass("closed");
				}
				else {
					$li.addClass("open").removeClass("closed");
				}
			}
			else{
				$li.addClass("loading");
				$li.addClass("open");
				var sid = $li.parent().parent().data('server-id');
				var sinfo = getCurrentServer(sid);
				if ( folder === 'views' ) {
					listViews($li, sinfo);
				}
				else if (folder === 'tables' ) {
					listTables($li, sinfo);
				}
				else if (folder === 'procedures') {
					listProcedures($li, sinfo);
				}
				else if (folder === 'functions') {
					listFunctions($li, sinfo);
				}
			}
		});

		// Enable extension if loaded last time.
		if (preferences.get('enabled')) {
			enablePanel(true);
		}
	});
});
