/*jshint node: true*/
/* globals brackets, define, Mustache */
(function () {

	var mysql = require("mysql"),
		domainName = "BracketsSqlConnectorDomain",
		connections = {},
		lastConnId = 0,
		
		// Internal Functions
		clog = function(text, extra) {
			if (typeof console === 'object') {
				console.log('SFTPUploadDomain: ' + text + (
					typeof extra === 'object' ? (' => ' + JSON.stringify(extra)) :
					(typeof extra === 'string' ? (' => ' + extra) : '')
				));
			}
		},
		
		_getConn = function(id) {
			id = id || lastConnId;
			
			return connections[id];
		},
		
		_query = function(connId, query, callback) {
			
			if ( typeof connId === 'string' ) {
				callback = query;
				query = connId;
				connId = undefined;
			}
			
			var connection = _getConn(connId);
			
			if ( ! connection ) return callback('no connection found');
			
			clog("Querying " + connId + " WITH " + query);
			
			return connection.query(query, function (err, rows, fields) {
				if (err) {
					clog("Query Error: ", err);
					callback(err);
				}
				return callback(0, [fields, rows]);
			});
		},
		
		// Generic Commands
		cmdConnect = function (dbConfig, callback) {
			var connection = mysql.createConnection({
				host: dbConfig.host,
				port: dbConfig.port,
				user: dbConfig.username,
				password: dbConfig.password,
				database: dbConfig.database,
				multipleStatements: true,
				debug: true,
				trace: true
			});
			connection.serverId = dbConfig.__id;
			clog("Connecting to " + connection.host);
			return connection.connect(function (err) {
				if (err) {
					clog("Connecting ERROR : " + err);
					callback('err connection ' + err);
				}
				lastConnId = connection.threadId;
				connections[connection.threadId] = connection;
				return callback(0, connection.threadId);
			});
		},
		cmdDisconnect = function (connId, callback) {
			var connection = _getConn(connId);
			if (! connection ) {
				return callback(0, 0);
			}
			return connection.end(function (err) {
				if (err) {
					callback(err);
				}
				delete connections[connId];
				
				return callback(0, 1);
			});
		},
		cmdQuery = function (connId, query, callback) {
			
			if ( typeof connId === 'string' && typeof query === 'function' ) {
				callback = query;
				query = connId;
				connId = undefined;
			}
			
			var connection = _getConn(connId);
			if ( ! connection ) return callback('no connection found');
			
			clog(arguments.length + ": Querying to " + connection.threadId + " => " + query);
						
			return connection.query(query, function (err, rows, fields) {
				//clog("Query Result:", fields);
				if (err) {
					callback(err);
				}
				
				return callback(0, [fields, rows]);
			});
		},
		
		// DataBase Commands
		cmdListFunctions = function(connId, database, callback) {
			
			var query = "SHOW FUNCTION STATUS WHERE Db = '"+database+"';";
			
			return _query(connId, query, callback);
		},
		cmdListProcedures = function(connId, callback) {
			
			var connection = _getConn(connId),
				query = "SHOW PROCEDURE STATUS WHERE Db = '"+connection.database+"';";
			
			return cmdQuery(connId, query, callback);
		},
		
		// Initialization
		init = function (domainManager) {

			if (!domainManager.hasDomain()) {
				domainManager.registerDomain(domainName, {
					major: 0,
					minor: 1
				});
			}
			domainManager.registerCommand(domainName, "connect", cmdConnect, true, "Connect to a database");
			domainManager.registerCommand(domainName, "disconnect", cmdDisconnect, true, "Disconnect from the database");
			
			domainManager.registerCommand(domainName, "list_functions", cmdListFunctions, true, "List created function on the database");
			domainManager.registerCommand(domainName, "list_procedures", cmdListProcedures, true, "List created procedures on the database");
			
			return domainManager.registerCommand(domainName, "query", cmdQuery, true, "Query the database");
		};

	exports.init = init;

}());