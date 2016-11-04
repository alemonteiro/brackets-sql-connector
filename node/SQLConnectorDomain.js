/*jshint node: true*/
(function () {

	var http = require('http'),
        mysql = require("mysql"),
		mssql = require("mssql"),
        pg = require("pg"),
		Querys = {
			mssql : require("./MSSqlQuery.js"),
			mysql : require("./MySqlQuery.js"),
            postgresql : require("./PgSqlQuery.js"),
		},
		domainName = "BracketsSqlConnectorDomain",
		connections = {},
		lastConnId = 0,
		_domainManager,
		connCounter = 0,
		
		// Internal Functions
		clog = function(text, extra) {
			if (typeof console === 'object') {
				console.log('SQL Connector: ' + text + (
					typeof extra === 'object' ? (' => ' + JSON.stringify(extra)) :
					(typeof extra === 'string' ? (' => ' + extra) : '')
				));
			}
		},
		
        // Get connection by server id
		_getConn = function(id) {
			id = id || lastConnId;
			
			return connections[id];
		},
				
		// MySQL Commands
		mysqlQuery = function(connId, query, callback) {
			var conn = _getConn(connId);

			if ( ! conn ) callback('no connection found');

			//clog("Querying " + connId + " WITH " + query);

			conn.query(query, function (err, rows, fields) {
				if (err) {
					clog("Query Error: " + query, err);
					callback(err, query);
				}
				return callback(0, [fields, rows]);
			});
		},
        mysqlConnect = function(dbconfig, callback) {
			var connection = mysql.createPool({
				host: dbconfig.host,
				port: dbconfig.port,
				user: dbconfig.username,
				password: dbconfig.password,
				database: dbconfig.database,
				multipleStatements: true,
				debug: true,
				trace: true
			});
			connection.serverId = dbconfig.__id;
			connection.engine = dbconfig.engine;
			connection.database = dbconfig.database;
			connection.__query = mysqlQuery;
			if ( connection.isConnected === undefined ) {
				connection.isConnected = function() {
					return this.status === "conected";
				};
			}
			//clog("Connecting to " + connection.host);
			
			connection.getConnection(function (err, conn) {
				if (err) {
					clog("Connecting ERROR : " + err);
					callback('err connection ' + err);
				}
				else {
					connCounter = connCounter + 1;
                    conn.release();
					if ( connection.serverId !== undefined && connection.serverId !== "" ) {
						lastConnId = connection.serverId;
						connections[connection.serverId] = connection;
						callback(null, connection.serverId);
					}
					else {
						callback(null, connection.serverId);
					}
				}
			});	
		},
		mysqlDisconnect = function(connId, callback) {
			var connection = _getConn(connId);
			if (! connection ) {
				return callback(0, 0);
			}
			return connection.end(function (err) {
				delete connections[connId];
				if (err && callback) {
					callback(err);
					return;
				}
				
				if ( callback ) {
					return callback(0, 1);
				}
			});
		},

		// MS SQL Commands
        mssqlQuery = function(connId, sql, callback) {
			var conn = _getConn(connId),
				request = new mssql.Request(conn),
				fields,
				rows = [],
				errors = []; // or: var request = connection1.request();
			
			//clog("MS SQL Querying", sql);
			request.multiple = true;
			request.batch(sql, function(err, recordSets) {
				//if ( !err ) console.dir(recordSets);
				//else console.error(err);

				//clog('MS SQL Request Done', recordSets);
				if ( err ) {
					callback(err.code + " : " + err.message, sql);
					return;
				}
				for(var i=0,il=recordSets.length,rs, fields;i<il;i++) {
					rs = recordSets[i];
					fields = [];
					if ( rs.length > 0 ) {
						for(var p in rs[0]) {
							fields.push({Field: p});
						}
					}
					callback(0, [fields, rs]);
				}

			});

		},
		mssqlConnect = function(dbconfig, callback) {
			var config = {
				user: dbconfig.username,
				password: dbconfig.password,
				server: dbconfig.host, //.replace(/\/+/g, "/"),
				database: dbconfig.database,
				port: dbconfig.port,
				options: {
					trustedConnection: dbconfig.trustedConnection,
					instanceName: dbconfig.instanceName
				}
			};
			
			clog("MS SQL Connecting", config);
			var conn = mssql.connect(config, function(err) {
				if (err) {
					clog("MS SQL Conn Error", err);
					callback(err.code + " : " + err.message);
				}
				else {
					connCounter = connCounter + 1;
					conn.serverId = dbconfig.__id;
					conn.engine = dbconfig.engine;
					conn.database = dbconfig.database;
					conn.__query = mssqlQuery;
					
					if ( conn.isConnected === undefined ) {
						conn.isConnected = function() {
							return this.connected === true;
						};
					}
					//clog("MS SQL Connected!!");
					
					if ( conn.serverId !== null && conn.serverId !== undefined && conn.serverId !== "" ) {
						lastConnId = conn.serverId;
						connections[conn.serverId] = conn;
						callback(null, conn.serverId);
					}
					else {
						callback(null, connCounter);
					}
				}
			});
			
			mssql.on('error', function(err) {
				//clog("MS SQL Error", err);
				callback(err.code + " : " + err.message);
				//_domainManager.emitEvent(domainName, 'error', [err.message, err]);
			});
		},
		mssqlDisconnect = function(connId, callback) {
			var cnn = _getConn(connId);
			if ( cnn ) {
				cnn.close(function(err) {
					if (err &&  typeof callback === 'function') {
						callback(err.code +  ': ' + err.message);
					}
					else if ( typeof callback === 'function' ) {
						callback(err, 1);
					}
					delete connections[connId];
				});
			}
			else if ( typeof callback === 'function' ) {
				callback(null, 1);
			}
		},

        // PG SQL Commands
        pgQuery = function(connId, sql, callback) {
			var client = _getConn(connId);
			if ( ! client ) {
                callback('no connection found');
                return;
            }

            client.query(sql, function(err, result) {
            if(err) {
			     clog('PG Query Error', sql);
                console.error('error running query', err);
                callback(err);
            }
            else {
                callback(null, [result.fields, result.rows]);
            }
          });
        },
        pgConnect = function(dbconfig, callback) {
            var conString = "postgres://"+dbconfig.username+":"+dbconfig.password+"@"+dbconfig.host+":"+dbconfig.port+"/"+ dbconfig.database,
                client = new pg.Client(conString);

            client.connect(function(err) {
              if(err) {
                console.error('could not connect to postgres', err);
                callback(err);
              return;
              }

                client.serverId = dbconfig.__id;
                client.engine = dbconfig.engine;
                client.database = dbconfig.database;
                client.connString = conString;
                client.__query = pgQuery;
                connections[dbconfig.__id] = client;
                callback(null, dbconfig.__id);
            });
        },
        pgDisconnect = function(connId, callback) {
            var cnn = _getConn(connId);
			if ( cnn ) {
				cnn.end();
			}
			delete connections[connId];
			if ( callback ) {
				callback(null, 1);
			}
        },

		// Generic DB Commands
		cmdListActiveConnections = function() {
			var arr = [];
			for(var p in connections) {
				if ( connections[p] !== undefined && connections[p].isConnected() ) {
					arr.push(p);
				}
			}
			return arr;
		},
		cmdConnect = function (dbConfig, callback) {
            try {
                if ( dbConfig.engine === "mssql") {
                    mssqlConnect(dbConfig, callback);
                }
                else if (dbConfig.engine === "postgresql") {
                    pgConnect(dbConfig, callback);
                }
                else {
                    mysqlConnect(dbConfig, callback);
                }
            }
            catch(err) {
                clog("cmdConnect", err);
                callback(err);
            }

		},
		cmdDisconnect = function (connId, callback) {
            try {
                var cnn = _getConn(connId);
                if ( cnn.engine === "mssql") {
                    mssqlDisconnect(connId, callback);
                }
                else if (cnn.engine === "postgresql") {
                    pgDisconnect(connId, callback);
                }
                else {
                    mysqlDisconnect(connId, callback);
                }
            }
            catch(err) {
                clog("cmdDisconnect", err);
                callback(err);
            }
		},
		cmdDisconnectAll = function(callback) {
			var result = 0;
			try {
				for(var cid in connections) {
					var c = connections[c];
					if ( c !== undefined && c !== null ) {
						var e = c.engine;
						if (e === 'mssql') { mssqlDisconnect(c.serverId); }
						else if ( e === 'mysql') { mysqlDisconnect(c.serverId); }
						else if ( e === 'postgresql') { pgDisconnect(c.serverId); }
						result = 0;
					}
				}
			}
			catch(err) {
				clog("cmdDisconnectAll", err);
				result = err;
			}
			finally {
				return callback(result);
			}
		},
		cmdQuery = function (connId, query, callback) {
			
            try {
                if ( typeof connId === 'string' && typeof query === 'function' ) {
                    callback = query;
                    query = connId;
                    connId = undefined;
                }

                var connection = _getConn(connId);
                if ( ! connection ) return callback('no connection found');

                //clog(arguments.length + ": Querying to " + connection.threadId + " => " + query);

                connection.__query(connId, query, callback);
            }
            catch(err) {
                callback(err);
            }
		},
		
		// Browse DataBase Commands
		cmdListTables = function(connId, db, callback) {
            try {
                var cnn = _getConn(connId),
                    query = Querys[cnn.engine].showTables(db);

                cnn.__query(connId, query, callback);
            }
            catch(err) {
                clog("cmdDisconnect", err);
                cmdListTables(err);
            }
		},
		cmdListFields = function(connId, db, table, callback) {
			try{
                var cnn = _getConn(connId),
                    query = Querys[cnn.engine].showFields(db, table);

                cnn.__query(connId, query, callback);
            }
            catch(err) {
                clog("cmdListFields", err);
                cmdListTables(err);
            }
		},
		cmdListViews = function(connId, db, callback) {
			try {
                var cnn = _getConn(connId),
                    query = Querys[cnn.engine].showViews(db);

                cnn.__query(connId, query, callback);
            }
            catch(err) {
                clog("cmdListViews", err);
                cmdListTables(err);
            }
		},
		cmdListFunctions = function(connId, db, callback) {
            try {
                var cnn = _getConn(connId),
                    query = Querys[cnn.engine].showFunctions(db);

                cnn.__query(connId, query, callback);
            }
            catch(err) {
                clog("cmdListFunctions", err);
                cmdListTables(err);
            }
		},
		cmdListProcedures = function(connId, db, callback) {
            try {
                var cnn = _getConn(connId),
                    query = Querys[cnn.engine].showProcedures(db);

                cnn.__query(connId, query, callback);
            }
            catch(err) {
                clog("cmdListProcedures", err);
                cmdListTables(err);
            }
		},
		cmdListForeignKeys = function(connId, table, callback) {
			try{
                var cnn = _getConn(connId),
                    query = Querys[cnn.engine].showForeignKeys(cnn.database, table);

                cnn.__query(connId, query, callback);
            }
            catch(err) {
                clog("cmdListForeignKeys", err);
                cmdListTables(err);
            }
		},
		
		// Initialization
		init = function (domainManager) {
			_domainManager = domainManager;
			
			if (!domainManager.hasDomain()) {
				domainManager.registerDomain(domainName, {
					major: 0,
					minor: 2
				});
			}
			
			// Register Events
			domainManager.registerEvent(domainName, "error",
				[{
					name: "message",
					type: "string",
					description: "error message"
				},{
					name: "details",
					type: "object",
					description: "error details"
				}]);
			
			domainManager.registerCommand(domainName, "list_connections", 	cmdListActiveConnections, 		false, "List active connections");
			
			domainManager.registerCommand(domainName, "connect", 			cmdConnect, 		   true, "Connect to a database");
			domainManager.registerCommand(domainName, "disconnect", 		cmdDisconnect, 		  true, "Disconnect from the database");
			domainManager.registerCommand(domainName, "disconnect_all", 	cmdDisconnectAll, 	true, "Disconnect all connections");
			domainManager.registerCommand(domainName, "list_tables", 		cmdListTables, 		 true, "List database tables");
			domainManager.registerCommand(domainName, "list_fields", 		cmdListFields, 		 true, "List table fields");
			domainManager.registerCommand(domainName, "list_views", 		cmdListViews, 		   true, "List database views");
			domainManager.registerCommand(domainName, "list_functions", 	cmdListFunctions, 	 true, "List created function on the database");
			domainManager.registerCommand(domainName, "list_procedures", 	cmdListProcedures,     true, "List created procedures on the database");
			domainManager.registerCommand(domainName, "list_foreign_keys", 	cmdListForeignKeys,  true, "List foreign keys from a table");
			
			return domainManager.registerCommand(domainName, "query", cmdQuery, true, "Query the database");
		};

	exports.init = init;

}());
