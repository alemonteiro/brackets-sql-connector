/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */
/*!
 * SQL Connector & Browser 0.3.0
 *
 * @author Alê Monteiro
 * @license MIT
 * @home https://github.com/alemonteiro/brackets-sql-connector
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
		Strings = require('modules/Strings'),
		dataStorage = require('modules/DataStorageManager'),
		settingsDialog = require('modules/SettingsDialog'),
		ResultSets = require('modules/ResultSets'),
		Cmds = require('modules/SqlConnectorCommands'),
		
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
		$sqlConnectorIcon,
		
		// Get view menu.
		menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU),
		contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU),
		is_connected = false,
		is_extension_enabled = true,
		is_result_pane_enabled = false,
		is_browser_pane_enabled = false,
		
		// Get Node module domain
		_domainPath = ExtensionUtils.getModulePath(module, "node/SQLConnectorDomain"),
		_nodeDomain = new NodeDomain("BracketsSqlConnectorDomain", _domainPath),

		// Current Status vars
		_current_server_id,
		new_files_count = 0;

	// Define preferences.
	
	preferences.definePreference('enabled', 'boolean', true);
	preferences.definePreference('browserPanelEnabled', 'boolean', false);
	preferences.definePreference('resultPanelEnabled', 'boolean', false);

	// Load stylesheet.
	ExtensionUtils.loadStyleSheet(module, 'sql-connector.css');
	
	/**
	 * Get saved server list 
	 */
	function getSavedConfig() {
		var serverInfo = dataStorage.get('server_list');
		if ( serverInfo === undefined || serverInfo === false || serverInfo === null || serverInfo === "" ) {
			return {
                selected_id: false,
                server_ids: 0,
                servers: {}
			};
		}
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
		var cfg = getSavedConfig(),
			hasConn = false;
		if ( cfg && cfg !== null && cfg.servers ) {
			for(var s in cfg.servers ) {
				if ( cfg.servers[s].__connection_id > 0 ) {
					hasConn = true;
					break;
				}
			}
		}
		return hasConn;
	}
	
	/**
	* Inflated and append server connection to browser panel
	*/
	function showServerConnection(serverInfo) {
		var panelHTML = Mustache.render(connectedServerTemplate, {
			Strings: Strings,
			Server: serverInfo,
			Label: serverInfo.name
		}),
		$li = $('ul.connections > li[data-server-id="'+serverInfo.__id+'"]', $browserPanel);
		if ( $li.length > 0 ) {
			$li.remove();	
		}
		$('ul.connections', $browserPanel).append(panelHTML);
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
			$indicator
				.addClass('connected')
				.children('label')
				.data("sid", serverId)
				.html(getServerLabel(svr));
		}
	}
	
	/**
	* Check if there's another connection active to be selected as the editor connection
	*/
	function selectNextConnectedServer() {
		var cfg = getSavedConfig(),
			connId = false;
		for(var s in cfg.servers ) {
			if ( cfg.servers[s].__connection_id > 0 ) {
				connId = s;
				break;
			}
		}
		if ( connId ) setSelectedServer(connId);
	}
	
	/**
	* Check on node domain the active connections
	*/
	function checkActiveConnections() {
		var is_selected_connected = false,
			has_connected = false,
			last_connected_id,
			cfg = getSavedConfig();
		
		for(var sid in cfg.servers) cfg.servers[sid].__connection_id = 0;
		
		dataStorage.set('server_list', cfg);
		
		$('ul.connections', $browserPanel).empty();
		
		_nodeDomain.exec("list_connections").done(function(arr) {
			if ( arr.length === 0 ) {
				setSelectedServer(false);
			}
			else {
				cfg = getSavedConfig();
				has_connected= true;
				for(var i=0,il=arr.length, id;i<il;i++) {
					id = arr[i];
					if ( cfg.servers[id] !== undefined ) {
						cfg.servers[id].__connection_id = id;
						showServerConnection(cfg.servers[id]);
						last_connected_id = id;
						if ( cfg.selected_id == id) {
							is_selected_connected = true;
							_current_server_id = id;
							setSelectedServer(id);
						}
					}
				}
				dataStorage.set('server_list', cfg);
				if( !is_selected_connected && has_connected ) {
					setSelectedServer(last_connected_id);
				}
			}
		}).fail(function(err) {
			ResultSets.log('Get Active Connections', err);
		});
	}
	
	/**
	* TOGGLE Extension Active/Deactive
	*/
	function toggleExtension(enabled) {
		enabled = enabled === undefined ? !is_extension_enabled : enabled;
		preferences.set('enabled', enabled);
		is_extension_enabled = enabled;
	}
	
	/**
	* Resize Browser Panel
	*/
	function resizeBrowserPanel() {
		$browserPanel.height(($("#editor-holder").height() - 24) + 'px');
	}
	
	/**
	 * Set state of extension.
	 */
	// this is a menu item
	function toggleBrowserPanel(enabled) {
		enabled = enabled === undefined ? !is_browser_pane_enabled : enabled;
		enableBrowserPanel(enabled);
	}

	/**
	 * Initialize extension.
	 */
	function enableBrowserPanel(enabled) {
		if (enabled) {
			$browserPanel.show();
						
			// Set active class on icon.
			$sqlConnectorIcon.addClass('active');
			
			resizeBrowserPanel();
		} else {
			// Remove active class from icon.
			$sqlConnectorIcon.removeClass('active');
			$browserPanel.hide();
		}
		is_browser_pane_enabled = enabled;
		// Save enabled state.
		preferences.set('browserPanelEnabled', enabled);
		preferences.save();

		// Mark menu item as enabled/disabled.
		CommandManager.get(Cmds.TOGGLE_BROWSER_PANEL).setChecked(enabled);
	}
		
	
	/** 
	* List table fields
	*/
	function listFields(serverInfo, table, callback) {
		_nodeDomain.exec('list_fields', serverInfo.__id, serverInfo.database, table).done(function(response) {
			var fields = response[0], 
				rows = response[1];
				
			_nodeDomain.exec('list_foreign_keys', serverInfo.__id, table).done(function(response2)  {
				var fks = response2[1],
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
				ResultSets.log('List Fields Error', err);
				if ( callback ) callback.call(callback, err);
			});	
		}).fail(function(err, query) {
			ResultSets.log('List Fields Error', err, query);
			if ( callback ) callback.call(callback, err);
		});
	}
	
	/**
	* Parse <array>fields and fields<rows> to html of <li>
	*/
	function parseToLi(fields, rows, nameFieldIndex) {
		var html  = '', 
			f = fields[nameFieldIndex||0],
			fn = f.name||f.Field||f.Name||f.Column;
		for(var i=0,il=rows.length,r,n,fk;i<il;i++) {
			fk = false;
			r=rows[i];
			n = r[fn];

			html += '<li data-name="'+n+'" data-type="'+r.Type+'" data-definition="'+r.Definition+'" >' +
						'<label>'+n+'</label></li>';
		}
		return html;
	}
	
	/** 
	* List database views
	*/
	function listViews($li, serverInfo) {
		_nodeDomain.exec('list_views', serverInfo.__id, serverInfo.database).done(function(response){
			var fields = response[0],
				views = response[1],
				html = parseToLi(fields, views);
			
			$li.removeClass('loading');
			$("ul.brackets-sql-connector-list-views", $li)
				.html(html).parent()
				.addClass("loaded").removeClass("loading");
		})
		.fail(function(err) {
			ResultSets.log('Show Views Error', err);
			$li.removeClass('loading');
		});
	}
	
	/** 
	* List database functions
	*/
	function listFunctions($li, serverInfo) {
		_nodeDomain.exec('list_functions', serverInfo.__id, serverInfo.database).done(function(response){
			var fields = response[0],
				rows = response[1],
				html = parseToLi(fields, rows);
			
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
		_nodeDomain.exec('list_procedures', serverInfo.__id, serverInfo.database).done(function(response){
			var fields = response[0],
				rows = response[1],
				html = parseToLi(fields, rows);
			
			$li.removeClass('loading');
			$("ul.brackets-sql-connector-browser-list-procedures", $li)
				.html(html).parent()
				.addClass("loaded").removeClass("loading");
		})
		.fail(function(err) {
			ResultSets.log('Show Procedures Error', err);
			$li.removeClass('loading');
			settingsDialog.showMessage(Strings.QUERY_ERROR, err.code);
		});
	}
	
	/** 
	* List database tables
	*/
	function listTables($li, serverInfo) {
		_nodeDomain.exec('list_tables', serverInfo.__id, serverInfo.database).done(function(response){
			var fields = response[0], 
				rows = response[1],
				tables = (function() {
					var html  = '', f = fields[0];
					for(var i=0,il=rows.length,r,n;i<il;i++) {
						r=rows[i];
						n = r[f.name || f.Field];
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
			ResultSets.log('Show Tables Error', err);
			$li.removeClass('loading');
			settingsDialog.showMessage(Strings.QUERY_ERROR, err);
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
	function disconnect(serverInfo, callback, updateStatus, searchForNext) {
		var label = getServerLabel(serverInfo);
		ResultSets.log(Strings.DISCONNECTING, label);
		_nodeDomain.exec('disconnect', serverInfo.__id).done(function() {
			ResultSets.log(Strings.DISCONNECTED, label);
			
			if ( updateStatus !== false ) {
				updateServerStatus(serverInfo.__id, 0);
			}
			if ( serverInfo.__id == _current_server_id ) {
				if ( ! hasActiveConnection() ) {
					setSelectedServer(false);	
					$browserPanel.removeClass('connected');
					$indicator.removeClass('connected').children('label')
						.html(Strings.DISCONNECTED)
						.data("sid", false);
				}
				else if ( searchForNext !== false ) {
					selectNextConnectedServer();
				}
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
		$('ul.connections', $browserPanel).empty();
		var info = dataStorage.get('server_list');
		for(var sname in info.servers) {
			var s = info.servers[sname];
			if ( s.__connection_id > 0) {
				disconnect(s, false, false, false);
				s.__connection_id = 0;
			}
		}
		dataStorage.set('server_list', info);
		$browserPanel.removeClass("connected");
		$indicator.removeClass('connected');
		$("label", $indicator).html(Strings.DISCONNECTED).data("sid", false);
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
					
					showServerConnection(serverInfo);
					
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
			if (conId >= 0) {
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
			.exec('query', server.__id, sql)
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
		toggleResultPane(true);
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
					var sid = $("label", $indicator).data("sid");
					executeSQLCommand(getCurrentServer(sid), data, function(err, fields, rows) {
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
				executeSQLCommand(getCurrentServer($("label", $indicator).data("sid")), text, function(err, fields, rows) {
					ResultSets.add(fields, rows, text, err);
				});
			}
		}
	}
	
	/**
	 * Show/Hide the Query Result Pane (Logs and Result Sets)
	 */
	function toggleResultPane(show) {
		show = show !== undefined ? show : ! is_result_pane_enabled;
		if ( show ) {
			Resizer.show($queryPanel);
			
			$('div.brackets-sql-connector-result-tab-body', $queryPanel).height(($queryPanel.height()-30) + 'px');
			
			is_result_pane_enabled = true;
			resizeBrowserPanel();
		}
		else {
			Resizer.hide($queryPanel);
			is_result_pane_enabled = false;
			resizeBrowserPanel();
		}
	}
	
	/**
	 * Show the Result Pane (Logs and Result Sets)
	 */
	function openResultPane() { toggleResultPane(true); }
	
	/**
	 * Hide the  Result Pane (Logs and Result Sets)
	 */
	function closeResultPane() { toggleResultPane(false); }
	
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
	 * Show server pop up menu
	 */
	function showServerMenu($btn, onTop){
		
		var $ul = $("body").children("ul.brackets-sql-connector-servers-menu");
		if ( $ul.length > 0) {
			$ul.remove();
			return;
		}
		
		var _servers = getSavedConfig(),
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
			PANEL_ACTION: (is_result_pane_enabled ? Strings.CLOSE : Strings.OPEN),
			BROWSER_PANEL_ACTION: (is_browser_pane_enabled ? Strings.CLOSE : Strings.OPEN )
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
				CommandManager.execute(Cmds.DISCONNECT_ALL);
			}
			else if (action === "disconnect" ) {
				disconnect(getCurrentServer(id));
			}
			else if (action === "set-active") {
				setSelectedServer(id, false);
			}
			else if (action === "execute-file" ) {
				CommandManager.execute(Cmds.EXECUTE_CURRENT_FILE);
			}
			else if (action === "view-log" ) {
				CommandManager.execute(Cmds.VIEW_LOG);
			}
			else if (action === 'execute-selection') {
				CommandManager.execute(Cmds.EXECUTE_CURRENT);
			}
			else if (action === 'new-connection') {
				//CommandManager.execute(Cmds.CONNECTIONS);
				showSettings();
			}
			else if (action === 'toggle-result-panel') {
				CommandManager.execute(Cmds.TOGGLE_RESULT_PANEL);
			}
			else if (action === 'toggle-browser-panel') {
				CommandManager.execute(Cmds.TOGGLE_BROWSER_PANEL);
			}
			else if (action === "connect" && id > 0 ) {
				setSelectedServer(id, true);
			}
			
			$ul.remove(); 
		}).on('blur', function(evt) {
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
	* Show SQL Definition of an view/procedure/function
	*/
	function showDefinition (sid, folder, name, def, dontGet) {
		var info = getCurrentServer(sid);
		if ( dontGet !== true && (!def || def === undefined || def === 'undefined' || def === '') ) {
			_nodeDomain.exec('get_definition', sid, info.database, folder, name).done(function(response) {
				showDefinition(sid, folder, name, response[1][0].Definition, true);
			}).fail(function(err) {
				ResultSets.log('get_definition error', err);
			});
			return;
		}
		
		if ( typeof def === 'string' ) {
			new_files_count = new_files_count + 1;
			var doc = DocumentManager.getCurrentDocument();
			
			if ( !doc.isUntitled() ) {
				doc = DocumentManager.createUntitledDocument(new_files_count, ".sql");
			}
			doc.setText(def);
			if ( typeof  ProjectManager.setCurrentFile === 'function' ) {
				ProjectManager.setCurrentFile(doc.file.fullPath);
			}
			else if ( typeof DocumentManager.setCurrentDocument === 'function' ) {
				DocumentManager.setCurrentDocument(doc);
			}
		}
	}
	
	/**
	 * Add main listeners
	 */
	function registerListeners() {
		var $projectManager = $(ProjectManager);

		MainViewManager.on('currentFileChange ', function(e, newFile, newPaneId, oldFile, oldPaneId) {
			if ( newFile ) {
				fileChanged(newFile);
			}
		}); 
	
		$("#editor-holder").on("resize", function() {
			resizeBrowserPanel();
		});
	}
	
	/**
	*	Register extension commands.
	*/
	function registerCommands() {
		//CommandManager.register(Strings.EXTENSION_NAME, Cmds.ENABLE, toggleExtension);
		CommandManager.register(Strings.EXECUTE_CURRENT, Cmds.EXECUTE_CURRENT, executeCurrent);
		CommandManager.register(Strings.EXECUTE_CURRENT_FILE, Cmds.EXECUTE_CURRENT_FILE, executeFile);
		CommandManager.register(Strings.MANAGE_SERVERS, Cmds.CONNECTIONS, showSettings);
		CommandManager.register(Strings.TOGGLE_RESULT_PANEL, Cmds.TOGGLE_RESULT_PANEL, toggleResultPane);
		CommandManager.register(Strings.TOGGLE_BROWSER_PANEL, Cmds.TOGGLE_BROWSER_PANEL, toggleBrowserPanel);
		CommandManager.register(Strings.DISCONNECT_ALL, Cmds.DISCONNECT_ALL, disconnectAll);
		CommandManager.register(Strings.VIEW_LOG, Cmds.VIEW_LOG, viewLog);
		CommandManager.register(Strings.OPEN + ' ' + Strings.RESULT_PANEL, Cmds.OPEN_RESULT_PANE, openResultPane);
		
		menu.addMenuItem(Cmds.EXECUTE_CURRENT, 'Alt-Enter');
	}

	// Register panel and setup event listeners.
	AppInit.appReady(function () {
		
	 	$sqlConnectorIcon = $('<a href="#" title="' + Strings.EXTENSION_NAME + '" id="brackets-sql-connector-icon"></a>');
		
		// Browser Panel
		var browserPanel = Mustache.render(browserPanelTemplate, {
			Strings: Strings
		});
		$("#main-toolbar").before(browserPanel);
		
		$queryPanel = $(Mustache.render(queryPanelTemplate, {
			Strings: Strings
		}));
		
		var panel = WorkspaceManager.createBottomPanel('alemonteiro.bracketsSqlConnector.queryPanel', $queryPanel, 70);
		
		$indicator = $(Mustache.render(indicatorTemplate, {
			Strings: Strings
		}));				
		StatusBar.addIndicator('alemonteiro.bracketsSqlConnector.connIndicator', $indicator, true, 'brackets-sql-connector-status-indicator');
		$indicator.on('click', 'button', function(evt){
			var action = $(this).data("action");
			if ( action === "execute" ) {
				executeFile();	
			}
		})
		.on('click', 'label', function(evt) {
			showServerMenu($(this));
		});
		
		$queryPanel.on('panelResizeEnd', function() {
			resizeBrowserPanel();	
		})
		.on('click', 'a.tab-anchor', function(evt) {
			var target = $(this).data('target');
			$(this).parent().addClass("active").siblings().removeClass('active');
			$(target).addClass("active").siblings().removeClass('active');
		})
		.on('click', 'a.close-pane', function() {
			toggleResultPane(false);
		})
		.on('click', 'a.close-result-set', function() {
			$($(this).prev('a').data('target')).remove();
			$(this).parent().remove();
		});
		
		$browserPanel = $('#brackets-sql-connector-browser');
		// Close panel when close button is clicked.
		$browserPanel
			.on('click', '.close', function () {
				enableBrowserPanel(false);
			});

		// Setup listeners.
		registerListeners();
		
		// Setup commands.
		registerCommands();
		
		//checkActiveConnections
		checkActiveConnections();
		
		Resizer.makeResizable($queryPanel, "vert", "top");
		Resizer.makeResizable($browserPanel, "horz", "left");
		
		// Add listener for toolbar icon..
		$sqlConnectorIcon.click(function () {
			CommandManager.execute(Cmds.TOGGLE_BROWSER_PANEL);
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
		.on('click', 'li.brackets-sql-connector-browser-server > header', function(evt) {
			evt.stopPropagation();
			$(this).parent().toggleClass("closed");
		})
		// Handler for folder select
		.on('click', 'ul.brackets-sql-connector-browser-server-folders > li', function(evt) {
			evt.stopPropagation();
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
		})
		// Handle 
		.on('click', 'ul.brackets-sql-connector-browser-server-folders > li > ul > li', function(evt) {
			var folder = $(this).parent().parent().data('folder'),
				sid = $(this).parent().parent().parent().parent().data('server-id'),
				name = $(this).data("name"),
				def = $(this).data("definition");
			
			if ( folder !== 'tables' ) {
				evt.stopPropagation();	
				showDefinition(sid, folder, name,  def);
			}
		});

		// Enable extension if loaded last time.
		if (preferences.get('browserPanelEnabled')) {
			enableBrowserPanel(true);
		}
	});
});
