/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */

define( function( require, exports, module ) {
    'use strict';
	var prefix = 'alemonteiro.bracketsSqlConnector';

	module.exports = {
		mysql: {

			TYPES: {
				INT : 'INTEGER',
				SMALLINT: 'SMALLINT',
				BIGINT: 'INTEGER',
				DECIMAL: 'DECIMAL',
				NUMERIC: 'NUMERIC',
				FLOAT: 'FLOAT',
				REAL: 'REAL',

				DATE: 'DATE',
				DATETIME: 'DATETIME',
				TIMESTAMP: 'TIMESTAMP',
				TIME: 'TIME',
				YEAR: 'YEAR',

				CHAR: 'CHAR',
				VARCHAR: 'VARCHAR',
				BINARY: 'BINARY',
				VARBINARY: 'VARBINARY',

				BLOB: 'BLOB',
				TEXT: 'TEXT',
				ENUM: 'ENUM',
				JSON: 'JSON'
			},

			escapeName: function(name) {
				return '`' + name + '`';
			}
		},
		mssql: {
			TYPES: {
				INT : 'INT',
				SMALLINT: 'SMALLINT',
				BIGINT: 'BIGINT',
				DECIMAL: 'DECIMAL',
				NUMERIC: 'NUMERIC',
				FLOAT: 'FLOAT',
				REAL: 'REAL',

				DATE: 'DATE',
				DATETIME: 'DATETIME',
				TIMESTAMP: 'TIMESTAMP',
				TIME: 'TIME',
				YEAR: 'YEAR'
			},

			escapeName: function(name) {
				return '[' + name + ']';
			}
		}
	};
});
